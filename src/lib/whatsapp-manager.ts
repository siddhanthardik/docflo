import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { resolveGoogleReviewLink } from '@/services/review-dispatcher.service';
import { PlatformWhatsAppConciergeService } from '@/services/platform-whatsapp-concierge.service';
import { formatDoctorDisplayName, type MediaAttachment } from '@/services/ai-agents.service';
import { logSystemError } from '@/lib/logger';
import {
  createClinicAppointmentDateTimes,
  getClinicDayBounds,
  parseSessionOrTimeToHourMinute,
  resolveClinicTimezone,
  formatInClinicTime,
  formatInClinicDate,
  getClinicDateOnlyString,
  extractAgreedTimeFromHistory
} from '@/lib/timezone';
import { formatAppointmentConfirmationCard } from '@/lib/whatsapp-formatter';
import { resolveExactClinicLocation } from '@/lib/maps-helper';
import { formatPatientSalutation } from '@/lib/salutation';
import { VaccinationService } from '@/services/vaccination.service';
import { sanitizePersonName, isBotTemplateEcho } from '@/lib/utils';

// Obfuscate directory resolution from Next.js Turbopack / Webpack static file tracer
function getAuthBaseDir(): string {
  const parts = ["auth", "info"];
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), parts.join("_"));
}

function getDoctorSessionDir(doctorId: string): string {
  return path.resolve(/*turbopackIgnore: true*/ getAuthBaseDir(), doctorId);
}

class WhatsAppManager {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map(); // doctorId -> QR string
  private connectingDoctors: Set<string> = new Set(); // Guard against duplicate connect attempts
  private activeConnections: Set<string> = new Set(); // Tracks fully opened connections
  private reconnectAttempts: Map<string, number> = new Map(); // Tracks retry backoff per doctor/superadmin
  private lastConnectAttempt: Map<string, number> = new Map(); // doctorId -> timestamp of last connection attempt
  private connectionOpenAt: Map<string, number> = new Map(); // doctorId -> timestamp when connection opened (for warm-up)
  private lastMessageSentAt: Map<string, number> = new Map(); // doctorId -> timestamp of last outbound message (for pacing)
  private lastDisconnectNotificationAt: Map<string, number> = new Map(); // doctorId -> timestamp when disconnect notification was dispatched
  private lastDisconnectEmailAt: Map<string, number> = new Map(); // doctorId -> timestamp when disconnect email was dispatched (2h rate limit)
  private watchdogTimer: NodeJS.Timeout | null = null;
  // Holds doctor-delegated tasks (patientPhone -> task)
  private delegatedDoctorTasks: Map<string, {
    id: string;
    doctorId: string;
    doctorPhone: string;
    patientName: string;
    patientPhone: string;
    actionType: string;
    instruction: string;
    targetTime?: string;
    status: 'IN_PROGRESS' | 'WAITING_FOR_PATIENT' | 'COMPLETED' | 'FAILED' | 'REQUIRES_DOCTOR_DECISION';
    createdAt: number;
  }> = new Map();

  // Holds mid-flight booking or schedule disruption intents (doctorPhone -> intent)
  private pendingIntents: Map<string, 
    | {
        type: 'AWAITING_PHONE';
        patientName: string;
        dateStr: string;
        timeStr: string;
        candidates?: Array<{ id: string; firstName: string; lastName: string; phone: string; lastVisit?: Date | null }>;
      }
    | {
        type: 'AWAITING_SELECTION';
        patientName: string;
        dateStr: string;
        timeStr: string;
        candidates: Array<{ id: string; firstName: string; lastName: string; phone: string; lastVisit?: Date | null }>;
      }
    | {
        type: 'AWAITING_SCHEDULE_CONFIRMATION';
        action: 'DELAY' | 'CANCEL' | 'PAUSE';
        delayMinutes?: number;
        impactedAptIds: string[];
      }
  > = new Map();

  private processedMessageIds: Map<string, number> = new Map(); // msgId -> timestamp (5m TTL)

  // Platform-wide doctor/clinic numbers cache to prevent cross-clinic bot-to-bot loops
  private platformDoctorPhonesCache: Set<string> = new Set(); // "doctorId:last10"
  private lastPlatformPhonesFetch: number = 0;

  // Rate-limiting and debounce per patient phone: `${doctorId}:${patientPhone}`
  private aiReplyHistory: Map<string, number[]> = new Map(); // key -> timestamps[]
  private lastAiReplyTime: Map<string, number> = new Map(); // key -> timestamp

  // Checks if a phone number belongs to ANY clinic, doctor, or staff registered on Gyrex
  async isPlatformClinicPhone(rawPhone: string, currentDoctorId: string): Promise<boolean> {
    if (!rawPhone) return false;
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return false;
    const last10 = cleanDigits.slice(-10);

    const now = Date.now();
    if (now - this.lastPlatformPhonesFetch > 2 * 60 * 1000 || this.platformDoctorPhonesCache.size === 0) {
      try {
        const doctors = await prisma.doctor.findMany({
          where: { phone: { not: null } },
          select: { id: true, phone: true }
        });
        const practitioners = await prisma.practitioner.findMany({
          where: { phone: { not: null } },
          select: { doctorId: true, phone: true }
        });
        const staff = await prisma.staffMember.findMany({
          where: { phone: { not: null } },
          select: { doctorId: true, phone: true }
        });

        this.platformDoctorPhonesCache.clear();
        for (const d of doctors) {
          if (d.phone) {
            const digits = d.phone.replace(/\D/g, '');
            if (digits.length >= 10) {
              this.platformDoctorPhonesCache.add(`${d.id}:${digits.slice(-10)}`);
            }
          }
        }
        for (const p of practitioners) {
          if (p.phone) {
            const digits = p.phone.replace(/\D/g, '');
            if (digits.length >= 10) {
              this.platformDoctorPhonesCache.add(`${p.doctorId}:${digits.slice(-10)}`);
            }
          }
        }
        for (const s of staff) {
          if (s.phone) {
            const digits = s.phone.replace(/\D/g, '');
            if (digits.length >= 10) {
              this.platformDoctorPhonesCache.add(`${s.doctorId}:${digits.slice(-10)}`);
            }
          }
        }

        for (const [docId, sock] of this.sockets.entries()) {
          const userPhone = sock?.user?.id?.split(':')[0]?.replace(/\D/g, '');
          if (userPhone && userPhone.length >= 10) {
            this.platformDoctorPhonesCache.add(`${docId}:${userPhone.slice(-10)}`);
          }
        }

        this.lastPlatformPhonesFetch = now;
      } catch (err) {
        console.warn('[WhatsAppManager] Failed to refresh platform doctor phones cache:', err);
      }
    }

    for (const entry of this.platformDoctorPhonesCache) {
      const [docId, phoneLast10] = entry.split(':');
      if (phoneLast10 === last10 && docId !== currentDoctorId) {
        return true;
      }
    }

    return false;
  }

  // Rate limiter & cooldown check: minimum 4s debounce and max 3 replies in 60s per sender
  private checkAiRateLimit(doctorId: string, patientPhone: string): { allowed: boolean; reason?: string } {
    const key = `${doctorId}:${patientPhone.slice(-10)}`;
    const now = Date.now();

    // 1. Debounce: minimum 4 seconds between AI replies to same phone
    const lastReply = this.lastAiReplyTime.get(key) || 0;
    if (now - lastReply < 4000) {
      return { allowed: false, reason: `Cooldown active (${Math.ceil((4000 - (now - lastReply)) / 1000)}s)` };
    }

    // 2. Velocity limit: max 3 AI replies in 60 seconds
    const timestamps = (this.aiReplyHistory.get(key) || []).filter(t => now - t < 60000);
    if (timestamps.length >= 3) {
      return { allowed: false, reason: `Max 3 AI replies per minute exceeded (${timestamps.length}/3)` };
    }

    return { allowed: true };
  }

  // Record an AI reply for rate limiting
  private recordAiReply(doctorId: string, patientPhone: string) {
    const key = `${doctorId}:${patientPhone.slice(-10)}`;
    const now = Date.now();
    this.lastAiReplyTime.set(key, now);
    const timestamps = (this.aiReplyHistory.get(key) || []).filter(t => now - t < 60000);
    timestamps.push(now);
    this.aiReplyHistory.set(key, timestamps);
  }

  private isDuplicateMessage(msgId?: string | null): boolean {
    if (!msgId) return false;
    const now = Date.now();
    if (this.processedMessageIds.size > 2000) {
      for (const [id, timestamp] of this.processedMessageIds.entries()) {
        if (now - timestamp > 5 * 60 * 1000) {
          this.processedMessageIds.delete(id);
        }
      }
    }
    if (this.processedMessageIds.has(msgId)) {
      return true;
    }
    this.processedMessageIds.set(msgId, now);
    return false;
  }

  constructor() {
    // Ensure auth folder exists
    const authDir = getAuthBaseDir();
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
  }

  // Safely wipes session directory and resets memory states for a clean slate
  clearSession(doctorId: string) {
    console.log(`[WhatsAppManager] Purging session state for doctor: ${doctorId}`);
    const existingSock = this.sockets.get(doctorId);
    if (existingSock) {
      try {
        existingSock.ev.removeAllListeners('connection.update');
        existingSock.ws.close();
      } catch (e) {
        // Ignore socket close errors
      }
      this.sockets.delete(doctorId);
    }

    this.qrCodes.delete(doctorId);
    this.connectingDoctors.delete(doctorId);
    this.activeConnections.delete(doctorId);
    this.reconnectAttempts.delete(doctorId);
    this.lastConnectAttempt.delete(doctorId);
    this.connectionOpenAt.delete(doctorId);
    this.lastMessageSentAt.delete(doctorId);

    const sessionDir = getDoctorSessionDir(doctorId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`[WhatsAppManager] Failed to delete session dir for ${doctorId}:`, err);
      }
    }
  }

  // Dispatches an immediate high-priority in-app alert and notifies the clinic that WhatsApp is disconnected
  async notifyDoctorDisconnected(doctorId: string, reason: string = "Connection closed") {
    if (doctorId === 'PLATFORM_SUPERADMIN') return;

    // Rate-limit notifications to once every 30 minutes to prevent noise
    const lastNotif = this.lastDisconnectNotificationAt.get(doctorId) || 0;
    if (Date.now() - lastNotif < 1800000) {
      return;
    }
    this.lastDisconnectNotificationAt.set(doctorId, Date.now());

    console.warn(`[WhatsAppManager] Dispatching disconnect alert for doctor ${doctorId}: ${reason}`);

    try {
      // 1. Create In-App Notification
      await prisma.notification.create({
        data: {
          doctorId,
          title: "WhatsApp Disconnected ⚠️",
          message: "Your clinic's WhatsApp Business connection is offline. Patient AI auto-replies, reminders, and notifications are paused. Tap to reconnect now.",
          type: "ERROR",
          actionUrl: "/settings/whatsapp",
        }
      });

      // 2. Fetch Doctor Profile to send Urgent Email Alert
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { name: true, clinicName: true, email: true, phone: true }
      });

      // 3. Dispatch Email Alert (throttled to max 1 email per 2 hours to avoid inbox flood)
      if (doctor?.email) {
        const lastEmail = this.lastDisconnectEmailAt.get(doctorId) || 0;
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        if (Date.now() - lastEmail >= TWO_HOURS_MS) {
          this.lastDisconnectEmailAt.set(doctorId, Date.now());
          const { sendWhatsAppDisconnectedEmail } = await import('@/lib/email');
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
          sendWhatsAppDisconnectedEmail({
            doctorEmail: doctor.email,
            doctorName: doctor.name,
            clinicName: doctor.clinicName,
            reason,
            reconnectUrl: `${baseUrl}/settings/whatsapp`
          }).then(res => {
            if (res.success) {
              console.log(`[WhatsAppManager] 📧 Dispatched WhatsApp disconnect alert email to ${doctor.email} for ${doctor.clinicName || doctor.name}`);
            } else {
              console.warn(`[WhatsAppManager] ⚠️ Disconnect email failed for ${doctor.email}:`, res.error);
            }
          }).catch(emailErr => {
            console.error(`[WhatsAppManager] Error sending disconnect email to ${doctor.email}:`, emailErr);
          });
        } else {
          console.log(`[WhatsAppManager] Disconnect email for ${doctor.email} throttled (already sent within 2h).`);
        }
      }
    } catch (e) {
      console.error(`[WhatsAppManager] Failed to dispatch disconnect notification for ${doctorId}:`, e);
    }
  }

  // Resolves a LID to a phone number using Baileys reverse mapping files
  async resolveLidToPhone(doctorId: string, lid: string): Promise<string> {
    try {
      const sessionDir = getDoctorSessionDir(doctorId);
      const reverseMappingPath = path.join(sessionDir, `lid-mapping-${lid}_reverse.json`);
      if (fs.existsSync(reverseMappingPath)) {
        const rawPhone = JSON.parse(fs.readFileSync(reverseMappingPath, 'utf8'));
        return rawPhone.replace('@s.whatsapp.net', '');
      }
    } catch (e) {
      console.error(`[WhatsAppManager] Failed to parse lid mapping for ${lid}:`, e);
    }
    return lid;
  }

  // Normalizes phone numbers to standard format (E.164 without +)
  normalizePhone(phone: string): string {
    if (!phone) return "";
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    return cleanPhone;
  }

  // Robust comparison comparing the core 10-digit number
  isPhoneMatch(phoneA?: string | null, phoneB?: string | null): boolean {
    if (!phoneA || !phoneB) return false;
    const digitsA = phoneA.replace(/\D/g, '');
    const digitsB = phoneB.replace(/\D/g, '');
    const last10A = digitsA.length >= 10 ? digitsA.slice(-10) : digitsA;
    const last10B = digitsB.length >= 10 ? digitsB.slice(-10) : digitsB;
    return !!last10A && !!last10B && last10A === last10B;
  }

  // Sends an outbound WhatsApp message to a patient, ensures conversation exists in CRM, and saves ChatMessage record
  async sendOutboundPatientMessage(
    sock: any,
    doctorId: string,
    rawPhone: string,
    text: string,
    patientId?: string | null,
    patientName?: string | null
  ): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(rawPhone);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        console.error(`[WhatsAppManager] Cannot send message: invalid patient phone "${rawPhone}"`);
        return false;
      }

      // 1. Anti-Ban Guard: Enforce 10s quiet warm-up period after connection opens
      if (this.isWarmingUp(doctorId)) {
        console.log(`[WhatsAppManager] Device for ${doctorId} is in 10s post-connect warm-up. Pausing outbound message briefly.`);
        await new Promise(res => setTimeout(res, 4000));
      }

      // 2. Anti-Ban Guard: Human jitter and pacing (minimum 3s between messages per doctor)
      const now = Date.now();
      const lastSent = this.lastMessageSentAt.get(doctorId) || 0;
      if (now - lastSent < 3000) {
        const jitter = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s jitter
        await new Promise(res => setTimeout(res, jitter));
      }
      this.lastMessageSentAt.set(doctorId, Date.now());

      const patientJid = `${normalizedPhone}@s.whatsapp.net`;
      const sent = await sock.sendMessage(patientJid, { text });
      console.log(`[WhatsAppManager] 📤 Outbound WhatsApp sent to ${patientJid}`);

      let sentDate = new Date();
      if (sent && (sent as any).messageTimestamp) {
        const ts = Number((sent as any).messageTimestamp);
        if (ts > 0) sentDate = new Date(ts * 1000);
      }

      // Ensure Conversation exists and is tracked in CRM inbox (deduplicate by 10-digit suffix)
      const last10 = normalizedPhone.slice(-10);
      let conversation = await prisma.conversation.findFirst({
        where: {
          doctorId,
          OR: [
            { patientPhone: normalizedPhone },
            { patientPhone: last10 },
            { patientPhone: { endsWith: last10 } }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            doctorId,
            patientPhone: normalizedPhone,
            patientName: patientName || `Patient +${normalizedPhone}`,
            patientId: patientId || null,
            status: "OPEN",
            lastMessageAt: sentDate,
            createdAt: sentDate,
          }
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: sentDate,
            status: "OPEN",
            ...(patientName ? { patientName } : {}),
            ...(patientId ? { patientId } : {})
          }
        });
      }

      // Record outbound chat message in CRM with exact WhatsApp timestamp
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "OUTGOING",
          messageType: "text",
          content: text,
          senderName: "AI Assistant",
          createdAt: sentDate,
        }
      });

      this.recordAiReply(doctorId, normalizedPhone);

      return true;
    } catch (err) {
      console.error(`[WhatsAppManager] Error sending outbound patient message to ${rawPhone}:`, err);
      return false;
    }
  }

  // Connects or reconnects a doctor's WhatsApp session
  async connect(doctorId: string, options: { force?: boolean } = {}) {
    // 1. Guard against in-flight connection attempts
    if (this.connectingDoctors.has(doctorId)) {
      console.log(`[WhatsAppManager] Connection already in progress for ${doctorId}, skipping duplicate request.`);
      return;
    }

    // 2. Guard: If already connected and not forced, do not reconnect
    if (!options.force && this.isConnected(doctorId)) {
      console.log(`[WhatsAppManager] Doctor ${doctorId} is already connected, skipping connect request.`);
      return;
    }

    // 3. Rate-limit connect calls: Cooldown of 30 seconds between fresh connection requests (unless forced)
    const now = Date.now();
    const lastAttempt = this.lastConnectAttempt.get(doctorId) || 0;
    if (!options.force && now - lastAttempt < 30000) {
      const waitRemaining = Math.ceil((30000 - (now - lastAttempt)) / 1000);
      console.log(`[WhatsAppManager] Connection rate-limit active for ${doctorId}. Must wait ${waitRemaining}s before next attempt.`);
      return;
    }

    this.lastConnectAttempt.set(doctorId, now);
    this.connectingDoctors.add(doctorId);
    console.log(`[WhatsAppManager] Starting connection for session: ${doctorId}`);
    
    try {
      // Clean up any pre-existing dangling socket safely
      const existingSock = this.sockets.get(doctorId);
      if (existingSock) {
        try {
          existingSock.ev.removeAllListeners('connection.update');
          existingSock.ws.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        this.sockets.delete(doctorId);
      }

      const sessionDir = getDoctorSessionDir(doctorId);
      
      // If creds file is missing or corrupted, wipe directory completely to force clean QR generation
      const credsPath = path.join(sessionDir, 'creds.json');
      if (fs.existsSync(sessionDir) && !fs.existsSync(credsPath)) {
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (e) {
          // Ignore
        }
      }

      let authState;
      try {
        authState = await useMultiFileAuthState(sessionDir);
      } catch (e) {
        console.error(`[WhatsAppManager] Corrupted auth state for ${doctorId}, purging session and retrying...`, e);
        this.clearSession(doctorId);
        authState = await useMultiFileAuthState(sessionDir);
      }
      const { state, saveCreds } = authState;

      let version = [2, 3000, 1015901307];
      try {
        const vInfo = await fetchLatestBaileysVersion();
        if (vInfo && Array.isArray(vInfo.version)) {
          version = vInfo.version;
        }
      } catch (vErr) {
        console.warn(`[WhatsAppManager] Failed to fetch latest WA version, using stable fallback:`, vErr);
      }

      // Baileys configuration with realistic browser fingerprint and anti-ban safeguards
      const sock = makeWASocket({
        version: version as any,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys),
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: false,
        browser: Browsers.appropriate('Chrome'),
        markOnlineOnConnect: false, // Do not instantly broadcast presence on connect (anti-bot safeguard)
        syncFullHistory: false,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 3000,
      });

      sock.ev.on('creds.update', async () => {
        try {
          await saveCreds();
        } catch (e) {
          console.error(`[WhatsAppManager] Error saving creds for ${doctorId}:`, e);
        }
      });

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`[WhatsAppManager] New QR generated for session ${doctorId}`);
          this.qrCodes.set(doctorId, qr);
        }

        if (connection === 'close') {
          this.sockets.delete(doctorId);
          this.connectingDoctors.delete(doctorId);
          this.activeConnections.delete(doctorId);
          this.connectionOpenAt.delete(doctorId);

          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isSuperAdmin = doctorId === 'PLATFORM_SUPERADMIN';
          const isRegistered = Boolean(state.creds?.registered || state.creds?.me);

          // 1. Check if disconnection was due to QR pairing timeout (unscanned QR code)
          const isQrTimeout =
            statusCode === DisconnectReason.timedOut ||
            statusCode === 408 ||
            Boolean((lastDisconnect?.error as Error)?.message?.includes('QR refs attempts ended'));

          // If session was never paired/registered, DO NOT auto-reconnect on QR timeout!
          if (!isRegistered) {
            console.log(`[WhatsAppManager] QR pairing session closed for ${doctorId} (code ${statusCode}, qrTimeout: ${isQrTimeout}). Halting auto-reconnect until user requests fresh QR.`);
            this.qrCodes.delete(doctorId);
            this.reconnectAttempts.delete(doctorId);
            return;
          }

          // 2. For registered accounts that dropped connection:
          // Strict Rule: NEVER purge session files on disk unless it is an unambiguous 401 loggedOut
          const isExplicitLoggedOut = statusCode === DisconnectReason.loggedOut; // 401
          const shouldReconnect = !isExplicitLoggedOut;
          
          console.log(`[WhatsAppManager] Connection closed for verified session ${doctorId}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect} (isSuperAdmin: ${isSuperAdmin})`);
          
          if (shouldReconnect) {
            const currentAttempts = (this.reconnectAttempts.get(doctorId) || 0) + 1;

            // Strict Anti-Ban Guard: After 2 rapid retries, alert doctor and release the connecting lock
            // so UI can show a fresh QR code instead of hanging indefinitely on "Auto-Connecting"
            const MAX_RAPID_RETRIES = 2;
            if (currentAttempts > MAX_RAPID_RETRIES) {
              console.warn(`[WhatsAppManager] Rapid retry cap reached for ${doctorId}. Marking as disconnected & alerting doctor.`);
              this.reconnectAttempts.delete(doctorId);
              this.connectingDoctors.delete(doctorId);
              this.notifyDoctorDisconnected(doctorId, `Failed to reconnect after ${MAX_RAPID_RETRIES} attempts`);
              return;
            }

            this.reconnectAttempts.set(doctorId, currentAttempts);

            // Humane Anti-Ban Backoff: Attempt 1: 10s | Attempt 2: 25s
            const backoffSchedule = [10000, 25000];
            const delay = backoffSchedule[currentAttempts - 1] || 25000;

            console.log(`[WhatsAppManager] Scheduling humane auto-reconnect for ${doctorId} (attempt #${currentAttempts}/${MAX_RAPID_RETRIES}) in ${Math.round(delay / 1000)}s...`);
            
            setTimeout(() => {
              this.connect(doctorId, { force: true }).catch(e => {
                console.error(`[WhatsAppManager] Auto-reconnect failed for ${doctorId}:`, e);
                this.notifyDoctorDisconnected(doctorId, "Auto-reconnect failed");
              });
            }, delay);
          } else {
            // Only purge if user explicitly removed the device from phone WhatsApp Linked Devices
            console.log(`[WhatsAppManager] User explicitly unlinked device from WhatsApp app on phone for ${doctorId} (code ${statusCode}). Purging session on disk.`);
            this.clearSession(doctorId);
            
            logSystemError(new Error(`WhatsApp user explicitly logged out (code ${statusCode}) for doctor ${doctorId}`), {
              path: 'whatsapp-manager:connection',
              method: 'WA_TERMINAL_AUTH_FAILURE',
              metadata: { doctorId, statusCode }
            });

            this.notifyDoctorDisconnected(doctorId, "Device removed from WhatsApp on phone");
          }
        } else if (connection === 'open') {
          console.log(`[WhatsAppManager] Connection OPEN and verified for session ${doctorId}`);
          this.sockets.set(doctorId, sock);
          this.qrCodes.delete(doctorId);
          this.connectingDoctors.delete(doctorId);
          this.activeConnections.add(doctorId);
          this.reconnectAttempts.delete(doctorId);
          this.connectionOpenAt.set(doctorId, Date.now()); // Start 10s warm-up timer

          // Auto-resolve any previous WhatsApp Disconnected alerts now that connection is active
          prisma.notification.updateMany({
            where: {
              doctorId,
              title: { contains: "WhatsApp Disconnected" },
              isRead: false
            },
            data: { isRead: true }
          }).catch(e => console.error(`[WhatsAppManager] Failed to clear disconnect notifications for ${doctorId}:`, e));
        }
      });

      sock.ev.on('messages.upsert', async (m) => {
      console.log(`[WhatsAppManager] Raw upsert type: ${m.type}, messages count: ${m.messages.length}`);
      
      // Ignore outgoing messages or updates
      if (m.type !== 'notify') return;
      
      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const msgId = msg.key.id;
        if (this.isDuplicateMessage(msgId)) {
          console.log(`[WhatsAppManager] ⚠️ Duplicate message ${msgId} skipped`);
          continue;
        }

        const remoteJid = msg.key.remoteJid;
        let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Extract true message delivery timestamp from WhatsApp (never use arbitrary server time)
        let messageDate: Date;
        if (msg.messageTimestamp) {
          const ts = typeof msg.messageTimestamp === "number"
            ? msg.messageTimestamp
            : Number(msg.messageTimestamp);
          messageDate = ts > 0 ? new Date(ts * 1000) : new Date();
        } else {
          messageDate = new Date();
        }

        // Diagnostic Document or Image Media Ingestion (Multimodal OCR & Receptionist Triage)
        const docMsg = msg.message.documentMessage || msg.message.documentWithCaptionMessage?.message?.documentMessage;
        const imgMsg = msg.message.imageMessage;
        let mediaAttachment: MediaAttachment | undefined = undefined;

        if (docMsg || imgMsg) {
          const isDoc = Boolean(docMsg);
          const rawCaption = isDoc ? docMsg?.caption : imgMsg?.caption;
          const fileName = docMsg?.fileName || (isDoc ? "medical_report.pdf" : "medical_image.jpg");
          const mime = (isDoc ? docMsg?.mimetype : imgMsg?.mimetype) || (isDoc ? "application/pdf" : "image/jpeg");
          const cleanMime = mime.split(";")[0].trim();

          // Set textMessage so message processing is not skipped
          if (rawCaption && rawCaption.trim()) {
            textMessage = rawCaption.trim();
          } else if (!textMessage) {
            textMessage = isDoc
              ? `[Patient shared diagnostic document: ${fileName}]`
              : `[Patient shared a medical image/photo]`;
          }

          // Ingest media buffer (up to 15MB) for Multimodal OCR
          try {
            const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
            const mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
            if (mediaBuffer && mediaBuffer.length > 0 && mediaBuffer.length <= 15 * 1024 * 1024) {
              mediaAttachment = {
                mimeType: cleanMime,
                base64Data: mediaBuffer.toString("base64"),
                fileName,
                type: isDoc ? "DOCUMENT" : "IMAGE"
              };
              console.log(`[WhatsAppManager] 📎 Ingested media attachment (${mediaAttachment.type}): ${fileName} (${mediaBuffer.length} bytes, ${cleanMime})`);
            }
          } catch (mediaErr) {
            console.warn(`[WhatsAppManager] Failed to download media attachment for ${remoteJid}:`, mediaErr);
          }
        }

        // Voice Note Transcription (Audio Message Fallback via OpenAI Whisper)
        if (!textMessage && msg.message.audioMessage && process.env.OPENAI_API_KEY) {
          try {
            const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
            const audioBuffer = await downloadMediaMessage(msg, "buffer", {});
            if (audioBuffer && audioBuffer.length > 0) {
              const OpenAI = (await import("openai")).default;
              const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
              const { toFile } = await import("openai");
              const file = await toFile(audioBuffer, "voice_note.ogg", { type: "audio/ogg" });
              const transcription = await openai.audio.transcriptions.create({
                file,
                model: "whisper-1",
              });
              if (transcription.text) {
                textMessage = transcription.text.trim();
                console.log(`[WhatsAppManager] 🎙️ Transcribed incoming voice note from ${remoteJid}: "${textMessage}"`);
              }
            }
          } catch (audioErr) {
            console.warn(`[WhatsAppManager] Voice note transcription failed:`, audioErr);
          }
        }

        if (remoteJid && textMessage && !remoteJid.includes('@g.us') && !remoteJid.includes('status@broadcast')) {
          let rawPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
          
          if (remoteJid.includes('@lid')) {
            rawPhone = await this.resolveLidToPhone(doctorId, rawPhone);
          }
          
          const patientPhone = this.normalizePhone(rawPhone);
          console.log(`[WhatsAppManager] Message from ${patientPhone} (raw: ${remoteJid}) to doctor ${doctorId}: ${textMessage}`);

          // --- Spam Filter ---
          const spamKeywords = ["balde vs gavi", "keep playing", "ow.ly", "youtu.be", "bit.ly", "t.me", "earn money", "crypto", "bitcoin", "casino"];
          const textLowerForSpam = textMessage.toLowerCase();
          const isSpam = spamKeywords.some(keyword => textLowerForSpam.includes(keyword));
          
          if (isSpam) {
            console.log(`[WhatsAppManager] Blocked incoming spam message from ${patientPhone}`);
            continue; // Skip processing this message entirely
          }

          // --- Shield 2: Bot Template Echo Filter ---
          if (isBotTemplateEcho(textMessage)) {
            console.log(`[WhatsAppManager] 🛡️ Ignored incoming bot template echo from ${patientPhone}: "${textMessage.slice(0, 60)}..."`);
            continue; // Skip processing this message entirely
          }

          // --- Special Routing: Super Admin Platform WhatsApp Bot (Audits, Sales, Support) ---
          if (doctorId === 'PLATFORM_SUPERADMIN') {
            console.log(`[WhatsAppManager] Routing message from ${patientPhone} to PlatformWhatsAppConciergeService`);
            try {
              await PlatformWhatsAppConciergeService.handleIncomingMessage(patientPhone, textMessage, doctorId);
            } catch (conciergeErr: any) {
              console.error(`[WhatsAppManager] PlatformWhatsAppConciergeService error:`, conciergeErr);
              logSystemError(conciergeErr, {
                path: 'whatsapp-manager:concierge',
                method: 'WA_CONCIERGE_ERROR',
                metadata: { patientPhone, textMessage }
              });
            }
            continue;
          }

          // --- Process the incoming message via AI Agents ---
          try {
            // 1. Fetch Doctor and Practitioners to detect Staff
            const doctorInfo = await prisma.doctor.findUnique({
              where: { id: doctorId },
              select: { 
                enableAIAutoResponder: true,
                timezone: true,
                phone: true,
                name: true,
                clinicName: true,
                specialty: true,
                address: true,
                city: true,
                googleReviewLink: true,
                createdAt: true,
                subscriptionStatus: true,
                subscriptionExpiry: true,
                opdStatus: true,
                opdDelayMinutes: true,
                opdStatusNote: true,
                opdStatusUpdatedAt: true,
                maxDailyAiBookings: true,
                maxMorningAiBookings: true,
                maxEveningAiBookings: true,
                aiSlotPacing: true,
                workingHoursStart: true,
                workingHoursEnd: true,
                package: {
                  include: {
                    packageFeatures: {
                      include: { feature: true }
                    }
                  }
                }
              }
            });

            // Fetch connected GMB profile for clinic address (most recently synced)
            const gbpAccount = await prisma.gbpAccount.findFirst({
              where: { doctorId },
              orderBy: { lastSyncAt: 'desc' },
              select: { insightsData: true }
            });
            const gbpInsights = (gbpAccount?.insightsData && typeof gbpAccount.insightsData === 'object')
              ? gbpAccount.insightsData as Record<string, any>
              : null;

            const resolvedClinicLocation = resolveExactClinicLocation(doctorInfo, gbpAccount);
            const clinicAddress = resolvedClinicLocation.address;
            const clinicMapsUri = resolvedClinicLocation.mapsUrl;

            // Auto-heal doctor record if GMB has verified address and doctor table is contradictory or missing address
            if (gbpInsights?.formattedAddress && (doctorInfo?.address !== gbpInsights.formattedAddress || (doctorInfo?.city && !gbpInsights.formattedAddress.toLowerCase().includes(doctorInfo.city.toLowerCase())))) {
              prisma.doctor.update({
                where: { id: doctorId },
                data: {
                  address: gbpInsights.formattedAddress,
                  city: gbpInsights.formattedAddress.split(",").slice(-3, -2)[0]?.trim() || undefined,
                }
              }).catch(() => {});
            }

            const clinicWebsite = await prisma.clinicWebsite.findUnique({
              where: { doctorId },
              select: { subdomain: true, customDomain: true, siteTitle: true }
            });
            const websiteUrl = clinicWebsite?.customDomain
              ? `https://${clinicWebsite.customDomain}`
              : (clinicWebsite?.subdomain ? `https://${clinicWebsite.subdomain}.gyrex.in` : null);

            const practitioners = await prisma.practitioner.findMany({
              where: { doctorId, isActive: true },
              select: {
                id: true,
                phone: true,
                name: true,
                specialty: true,
                qualification: true,
                consultationFee: true,
                workingDays: true,
                workingHoursStart: true,
                workingHoursEnd: true,
                isOwner: true,
              },
              orderBy: { displayOrder: "asc" }
            });

            const staffMembers = await prisma.staffMember.findMany({
              where: { doctorId, isActive: true },
              select: { id: true, name: true, phone: true, role: true }
            });

            const matchedPractitioner = practitioners.find(p => p.phone && this.isPhoneMatch(p.phone, patientPhone));
            const matchedStaff = staffMembers.find(s => s.phone && this.isPhoneMatch(s.phone, patientPhone));
            const isOwnerMatch = doctorInfo?.phone && this.isPhoneMatch(doctorInfo.phone, patientPhone);

            const isStaff = !!matchedPractitioner || !!matchedStaff || !!isOwnerMatch;
            const staffName = matchedPractitioner?.name || matchedStaff?.name || doctorInfo?.name || "Doctor";

            if (isStaff) {
              console.log(`[WhatsAppManager] 🩺 Recognized DOCTOR/STAFF: "${staffName}" (${patientPhone}). Routing to Staff Assistant AI.`);
            } else {
              console.log(`[WhatsAppManager] 👤 Recognized PATIENT: ${patientPhone}. Routing to Patient Receptionist AI.`);
            }

            let patient = null;
            if (!isStaff) {
              // Find patient with resilient 10-digit matching across formats (+91, 91, 10-digit)
              const cleanPtDigits = patientPhone.replace(/\D/g, '');
              const last10Digits = cleanPtDigits.length >= 10 ? cleanPtDigits.slice(-10) : cleanPtDigits;
              patient = await prisma.patient.findFirst({
                where: {
                  doctorId,
                  OR: [
                    { phone: patientPhone },
                    { phone: `+${patientPhone}` },
                    ...(last10Digits.length >= 10 ? [{ phone: { endsWith: last10Digits } }] : [])
                  ]
                },
              });

              // If no patient exists, auto-create as a Patient or with WhatsApp pushName
              const pushNameRaw = sanitizePersonName(msg.pushName || "");
              const hasValidPushName = pushNameRaw && pushNameRaw.toLowerCase() !== "patient" && !pushNameRaw.startsWith("+") && !/whatsapp/i.test(pushNameRaw);

              if (!patient) {
                const parts = hasValidPushName ? pushNameRaw.split(" ") : ["Patient", ""];
                const defaultPractitioner = practitioners.find(p => p.isOwner) || practitioners[0];
                const cleanFirst = sanitizePersonName(parts[0]) || "Patient";
                const cleanLast = sanitizePersonName(parts.slice(1).join(" ")) || "";
                patient = await prisma.patient.create({
                  data: {
                    doctorId,
                    firstName: cleanFirst,
                    lastName: cleanLast,
                    phone: patientPhone,
                    patientType: "ACTIVE",
                    primaryPractitionerId: defaultPractitioner?.id || null,
                    tags: ["WhatsApp"]
                  }
                });
                console.log(`[WhatsAppManager] Auto-created new CRM patient for ${patientPhone}: ${patient.firstName} ${patient.lastName}`);
              } else {
                // Self-heal: Clean up emojis or legacy artifacts from existing patient records
                const cleanFirst = sanitizePersonName(patient.firstName || "");
                let cleanLast = sanitizePersonName(patient.lastName || "");
                if (cleanLast.startsWith("+")) cleanLast = "";

                if ((cleanFirst && cleanFirst !== patient.firstName) || cleanLast !== (patient.lastName || "")) {
                  patient = await prisma.patient.update({
                    where: { id: patient.id },
                    data: {
                      firstName: cleanFirst || "Patient",
                      lastName: cleanLast
                    }
                  });
                  console.log(`[WhatsAppManager] 🧼 Sanitized emojis from existing patient name: ${patient.firstName} ${patient.lastName}`);
                }
              }

              if (patient && patient.isBlocked) {
                console.log(`[WhatsAppManager] Ignored message from BLOCKED patient ${patientPhone}`);
                continue; // Skip processing
              }
            }

            const rawPatientName = isStaff ? (staffName ? `${staffName} (Doctor/Staff)` : "Clinic Staff/Doctor") : `${patient!.firstName} ${patient!.lastName}`.trim();
            const patientName = sanitizePersonName(rawPatientName) || "Patient";

            // Find or create Conversation (deduplicate by 10-digit suffix)
            const last10Incoming = patientPhone.slice(-10);
            let conversation = await prisma.conversation.findFirst({
              where: {
                doctorId,
                OR: [
                  { patientPhone },
                  { patientPhone: last10Incoming },
                  { patientPhone: { endsWith: last10Incoming } }
                ]
              }
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  doctorId,
                  patientPhone,
                  patientName,
                  patientId: isStaff ? null : patient!.id,
                  status: "OPEN",
                  lastMessageAt: messageDate,
                  createdAt: messageDate,
                }
              });
            } else {
              const updatedData: any = {
                lastMessageAt: messageDate, 
                unreadCount: { increment: 1 }, 
                status: "OPEN",
              };
              if (patient && patient.firstName !== "Patient" && (!conversation.patientName || conversation.patientName === "Patient" || conversation.patientName.includes("+"))) {
                updatedData.patientName = `${patient.firstName} ${patient.lastName}`.trim();
              }
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: updatedData
              });
            }

            // Determine message type for CRM display
            const chatMessageType = mediaAttachment
              ? (mediaAttachment.type === "DOCUMENT" ? "document" : "image")
              : (msg.message.audioMessage ? "audio" : "text");

            // Create ChatMessage with exact WhatsApp message timestamp
            await prisma.chatMessage.create({
              data: {
                conversationId: conversation.id,
                direction: "INCOMING",
                messageType: chatMessageType,
                content: textMessage,
                senderName: patientName,
                createdAt: messageDate,
              }
            });

            // Check if this is a reply to the review survey or a recent completed appointment
            let pendingAppointment = null;
            if (!isStaff && patient) {
              pendingAppointment = await prisma.appointment.findFirst({
                where: {
                  doctorId,
                  patientId: patient.id,
                  reviewStatus: "SURVEY_SENT"
                },
                orderBy: { createdAt: "desc" }
              });

              if (!pendingAppointment) {
                pendingAppointment = await prisma.appointment.findFirst({
                  where: {
                    doctorId,
                    patientId: patient.id,
                    status: "COMPLETED",
                    reviewStatus: { in: ["NOT_SENT", "SURVEY_SENT"] }
                  },
                  orderBy: { createdAt: "desc" }
                });
              }
            }

            // Check recent outgoing chat message to see if a review survey was sent
            // ── Check if incoming message is a booking request ────────────────
            const textLower = textMessage.trim().toLowerCase();
            const isBookingRequest = /appointment|book|visit|schedule|consult|slot|timing|fee|doctor|vaccine|vaccination/i.test(textLower);

            // Check if the last outgoing message was sent by AI Assistant
            const lastOutgoingMsg = await prisma.chatMessage.findFirst({
              where: { conversationId: conversation.id, direction: "OUTGOING" },
              orderBy: { createdAt: "desc" }
            });

            const isLastMsgFromAI = lastOutgoingMsg?.senderName === "AI Assistant";
            const lastMsgContent = lastOutgoingMsg?.content?.toLowerCase() || "";

            // Context-Aware Intent Detection
            const isSurveyContext = !isLastMsgFromAI && (lastMsgContent.includes("happy with your care") || lastMsgContent.includes("rate your experience") || lastMsgContent.includes("reply *yes*") || lastMsgContent.includes("opt out"));
            const isConfirmationContext = !isLastMsgFromAI && (lastMsgContent.includes("reminder") || lastMsgContent.includes("appointment tomorrow"));

            const isYes = /^(yes|y|yeah|yep|sure|absolutely|of course|great|good|ok|okay|thx|thanks|1|👍|😊|🌟|❤️)$/i.test(textLower) || 
              textLower === "yes" || textLower === "yeah" || textLower === "sure" || textLower === "ok" || textLower === "okay";
            const isNo = /^(no|n|nope|nah|never|bad|2)$/i.test(textLower) || textLower === "no" || textLower === "bad" || textLower === "poor";

            if (isSurveyContext && isYes) {
              const doctorData = await prisma.doctor.findUnique({ 
                where: { id: doctorId }, 
                select: { clinicName: true, reviewGoogleInvitationMessage: true, enableGoogleReviewAutoDispatch: true }
              });

              if (doctorData?.enableGoogleReviewAutoDispatch !== false) {
                try {
                  const reviewLink = await resolveGoogleReviewLink(doctorId);
                  
                  const displayName = (patient?.firstName && patient.firstName !== "Lead" && patient.firstName !== "Patient") ? ` ${patient.firstName}` : "";
                  const defaultReply = `Hello${displayName},\n\nThank you so much for your positive feedback! We are delighted to hear that you were happy with your care at ${doctorData?.clinicName || "our clinic"}.\n\nIf you have 60 seconds, it would mean the world to our team if you could share your experience on Google:\n\n${reviewLink}\n\nWishing you the very best of health!`;
                  
                  const replyText = doctorData?.reviewGoogleInvitationMessage 
                    ? doctorData.reviewGoogleInvitationMessage.replace("{link}", `\n\n${reviewLink}\n\n`).replace("{firstName}", patient?.firstName || "")
                    : defaultReply;
                  
                  await sock.sendMessage(remoteJid, { text: replyText });
                  await prisma.chatMessage.create({
                    data: { conversationId: conversation.id, direction: "OUTGOING", messageType: "text", content: replyText, senderName: "Clinic", createdAt: messageDate }
                  });
                  await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { lastMessageAt: messageDate }
                  });

                  if (pendingAppointment) {
                    await prisma.appointment.update({
                      where: { id: pendingAppointment.id },
                      data: { reviewStatus: "LINK_SENT" }
                    });
                  }
                } catch (e: any) {
                  console.warn(`[WhatsAppManager] Skipped auto-dispatching Google Review link: ${e.message}`);
                }
              }

              return; // Don't pass to AI agent
            } else if (isSurveyContext && isNo) {
                const replyText = `We are so sorry to hear that we didn't meet your expectations. We take patient feedback very seriously.\n\nCould you please share a bit more about what went wrong? Our management team will review your feedback immediately so we can make things right.`;
                await sock.sendMessage(remoteJid, { text: replyText });
                await prisma.chatMessage.create({
                  data: { conversationId: conversation.id, direction: "OUTGOING", messageType: "text", content: replyText, senderName: "Clinic", createdAt: messageDate }
                });
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: messageDate }
                });
                
                // Alert Clinic Owner via an internal note
                await prisma.chatMessage.create({
                  data: { conversationId: conversation.id, direction: "INTERNAL_NOTE", messageType: "text", content: "🚨 ALERT: Patient expressed dissatisfaction with their recent consultation.", senderName: "System", createdAt: messageDate }
                });

                if (pendingAppointment) {
                  await prisma.appointment.update({
                    where: { id: pendingAppointment.id },
                    data: { reviewStatus: "NEGATIVE_RESPONSE" }
                  });
                }

                return; // Don't pass to AI agent
              }

            // Check if patient is confirming an appointment
            const textLowerConfirm = textMessage.trim().toLowerCase();
            const isConfirming = isConfirmationContext && (isYes || textLowerConfirm.includes("confirm"));

            if (isConfirming && patient) {
              // Find nearest upcoming unconfirmed appointment
              const upcomingAppointment = await prisma.appointment.findFirst({
                where: {
                  doctorId,
                  patientId: patient.id,
                  date: { gte: new Date() },
                },
                orderBy: { date: 'asc' }
              });

              if (upcomingAppointment) {
                // We ensure it is set to CONFIRMED (in case it was changed)
                await prisma.appointment.update({
                  where: { id: upcomingAppointment.id },
                  data: { status: "CONFIRMED" }
                });

                const replyText = `Wonderful! Your appointment is fully confirmed. We're looking forward to seeing you soon. Drive safely! 🚗`;
                await sock.sendMessage(remoteJid, { text: replyText });
                
                await prisma.chatMessage.create({
                  data: {
                    conversationId: conversation.id,
                    direction: "OUTGOING",
                    messageType: "text",
                    content: replyText,
                    senderName: "Clinic",
                    createdAt: messageDate,
                  }
                });

                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: messageDate }
                });

                return; // Don't pass to AI agent
              }
            }

            // ── Check if patient is replying to a Delegated Doctor Task ────────
            if (!isStaff) {
              const activeDelegatedTask = this.delegatedDoctorTasks.get(patientPhone.slice(-10));
              if (activeDelegatedTask && activeDelegatedTask.doctorId === doctorId) {
                const cleanPtName = activeDelegatedTask.patientName;
                const docPhone = activeDelegatedTask.doctorPhone.replace(/\D/g, '');
                
                const isPositiveResponse = /yes|haan|theek|fine|sure|confirm|agreed|ok|okay|aunga|ayenge|aa sakti/i.test(textMessage);
                const hasTimeShift = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)|(kal|parso|evening|morning|shift|badal|nahi|cannot|cancel)/i.test(textMessage);

                if (isPositiveResponse && !hasTimeShift) {
                  activeDelegatedTask.status = 'COMPLETED';
                  this.delegatedDoctorTasks.delete(patientPhone.slice(-10));
                  
                  // Notify Doctor on WhatsApp
                  const docAlert = `🔔 *Task Completed, Doctor*\n\n👤 Patient: *${cleanPtName}* (${patientPhone})\n💬 Response: "${textMessage.trim()}"\n✅ Action: Patient confirmed the requested instruction (${activeDelegatedTask.instruction}).`;
                  await this.sendOutboundPatientMessage(sock, doctorId, docPhone, docAlert).catch(() => {});
                  console.log(`[WhatsAppManager] 🔔 Delegated task completed for patient ${patientPhone}. Doctor alerted.`);
                } else if (hasTimeShift) {
                  activeDelegatedTask.status = 'REQUIRES_DOCTOR_DECISION';
                  
                  // Notify Doctor for decision
                  const docAlert = `⚠️ *Patient Update (Requires Doctor Decision)*\n\n👤 Patient: *${cleanPtName}* (${patientPhone})\n💬 Response: "${textMessage.trim()}"\n\nDoctor, how would you like me to proceed with ${cleanPtName}?`;
                  await this.sendOutboundPatientMessage(sock, doctorId, docPhone, docAlert).catch(() => {});
                  console.log(`[WhatsAppManager] ⚠️ Delegated task requires doctor decision for patient ${patientPhone}. Doctor alerted.`);
                }
              }
            }

            const agentConfig = await prisma.aIAgentConfig.findUnique({
              where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } }
            });

            // ── 14-Day Free Trial & Package Subscription Access Control ────────
            const now = new Date();
            const pkgName = (doctorInfo?.package?.name || "").toUpperCase();
            const hasExplicitExpiry = Boolean(doctorInfo?.subscriptionExpiry);
            const isExpiryInFuture = doctorInfo?.subscriptionExpiry ? new Date(doctorInfo.subscriptionExpiry) > now : false;

            // 1. Paid Package Upgrade: Active if doctor has an assigned paid plan (Starter, Growth, Premium, Enterprise)
            // and status is not CANCELED, and expiry (if explicitly set) has not passed.
            const hasPaidPackage = Boolean(
              doctorInfo?.package && 
              !pkgName.includes("FREE") && 
              doctorInfo?.subscriptionStatus !== "CANCELED" &&
              (!hasExplicitExpiry || isExpiryInFuture)
            );

            // 2. Free 14-Day Trial: Active if doctor signed up within the last 14 days OR has an active trial expiry
            const isWithin14DaysOfSignup = doctorInfo?.createdAt 
              ? (now.getTime() - new Date(doctorInfo.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000)
              : false;

            const isTrialActive = isWithin14DaysOfSignup || (hasExplicitExpiry && isExpiryInFuture);

            const hasAiReceptionistAccess = hasPaidPackage || isTrialActive;

            if (!hasAiReceptionistAccess) {
              console.log(`[WhatsAppManager] 14-day trial expired for doctor ${doctorId}. AI Receptionist is paused until package upgrade.`);
              
              // Create a dashboard notification for the doctor (rate-limited to 1 per 24h)
              prisma.notification.findFirst({
                where: {
                  doctorId,
                  title: { contains: "14-Day Free Trial Ended" },
                  createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
              }).then(recentNotif => {
                if (!recentNotif) {
                  prisma.notification.create({
                    data: {
                      doctorId,
                      title: "14-Day Free Trial Ended ⏳",
                      message: "Your 14-day free trial has ended. Please upgrade your package to reactivate 24/7 AI Receptionist auto-replies & automated patient bookings.",
                      type: "WARNING",
                      actionUrl: "/settings/subscription"
                    }
                  }).catch(() => {});
                }
              }).catch(() => {});

              return; // Skip auto-responder execution
            }

            // AI Receptionist is enabled by default during 14-day trial and on active paid packages
            const isAutoResponderEnabled = doctorInfo?.enableAIAutoResponder !== false && (agentConfig ? agentConfig.enabled : true);

            if (isAutoResponderEnabled) {
              // ── Shield 1: Cross-Clinic Bot-to-Bot Loop Prevention ────────────
              const isOtherPlatformClinic = await this.isPlatformClinicPhone(patientPhone, doctorId);
              if (isOtherPlatformClinic) {
                console.log(`[WhatsAppManager] 🛑 Cross-clinic bot loop blocked: ${patientPhone} belongs to another doctor/clinic on Gyrex. Bypassing AI auto-responder.`);
                return;
              }

              // ── Shield 5: Self-Message / Note-to-Self Prevention ─────────────
              const isOwnClinicPhone = isOwnerMatch || (sock.user?.id && this.isPhoneMatch(sock.user.id.split(':')[0], patientPhone));
              if (isOwnClinicPhone) {
                const lowerCmd = textMessage.toLowerCase();
                const isDoctorCommand = /(?:running\s+)?\d+\s*(?:mins?|minutes?|hr|hour)\s+late|cancel\s+(?:all\s+)?(?:today'?s?|evening|morning)?\s*(?:opd|appointments?)|(?:pause|stop|block)\s+(?:new\s+)?(?:booking|patient|opd)|resume\s+(?:normal\s+)?opd/i.test(lowerCmd);
                if (!isDoctorCommand) {
                  console.log(`[WhatsAppManager] 👤 Self-message from clinic owner phone (${patientPhone}) without doctor command. Bypassing AI auto-responder.`);
                  return;
                }
              }

              // ── Shield 3: Sliding-Window Rate Limiter & Debounce Cooldown ────
              const rateCheck = this.checkAiRateLimit(doctorId, patientPhone);
              if (!rateCheck.allowed) {
                console.log(`[WhatsAppManager] ⏳ AI Rate limit / cooldown triggered for ${patientPhone}: ${rateCheck.reason}. Skipping AI auto-reply.`);
                return;
              }

              const { AIAgentsService } = await import('@/services/ai-agents.service');
              
              const recentMessages = await prisma.chatMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: "desc" },
                take: 12,
              });

              // ── Shield 4: Consecutive AI Turn Circuit Breaker ─────────────────
              if (!isStaff) {
                const recentOutgoing = recentMessages.filter(m => m.direction === "OUTGOING");
                let consecutiveAiCount = 0;
                for (const m of recentOutgoing) {
                  if (m.senderName === "AI Assistant" || m.senderName === "Clinic") {
                    consecutiveAiCount++;
                  } else {
                    break;
                  }
                }

                const isExplicitBookingIntent = /appointment|book|schedule|consult|slot|timing|fee|cancel|reschedule/i.test(textMessage);
                if (consecutiveAiCount >= 6 && !isExplicitBookingIntent) {
                  console.log(`[WhatsAppManager] 🛑 Circuit Breaker tripped: ${consecutiveAiCount} consecutive AI messages for ${patientPhone}. Halting automated replies.`);
                  if (consecutiveAiCount === 6) {
                    const safetyHandoff = `Thank you! I have shared your inquiry with our clinic front desk team. A staff member will respond to you shortly. 🙏`;
                    await sock.sendMessage(remoteJid, { text: safetyHandoff });
                    await prisma.chatMessage.create({
                      data: {
                        conversationId: conversation.id,
                        direction: "OUTGOING",
                        messageType: "text",
                        content: safetyHandoff,
                        senderName: "AI Assistant",
                        createdAt: messageDate,
                      }
                    });
                    await prisma.conversation.update({
                      where: { id: conversation.id },
                      data: { lastMessageAt: messageDate }
                    });
                    this.recordAiReply(doctorId, patientPhone);
                  }
                  return;
                }
              }

              const conversationHistoryStrings: string[] = recentMessages
                .slice()
                .reverse()
                .map(rm => `${rm.direction === "INCOMING" ? (isStaff ? "Staff" : "Patient") : (isStaff ? "Assistant" : "Clinic")}: ${rm.content}`);

              const effectiveConfig = (agentConfig?.config as any) || {
                mode: "handoff",
                tone: "warm_receptionist",
                assistantName: "Riya",
                servicesOffered: doctorInfo?.specialty ? `${doctorInfo.specialty} Consultation & Treatment` : "General OPD Consultation, Health Checkup",
                clinicTimings: "Mon-Sat: 10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM",
              };

              let aiReply = "";

              // Check if doctor is responding to a pending booking intent (disambiguation)
              if (isStaff) {
                const pendingIntent = this.pendingIntents.get(patientPhone);
                if (pendingIntent) {
                  const replyText = textMessage.trim();
                  let handled = false;

                  if (pendingIntent.type === 'AWAITING_PHONE') {
                    // Doctor provided phone number for a new patient
                    const phoneDigits = replyText.replace(/\D/g, '');
                    if (phoneDigits.length >= 10) {
                      this.pendingIntents.delete(patientPhone);
                      handled = true;
                      try {
                        const { patientName, dateStr, timeStr } = pendingIntent;
                        const nameParts = patientName.split(' ');
                        const last10 = phoneDigits.slice(-10);
                        let newPatient = await prisma.patient.findFirst({
                          where: {
                            doctorId,
                            OR: [
                              { phone: phoneDigits },
                              { phone: `+${phoneDigits}` },
                              { phone: { endsWith: last10 } }
                            ],
                            firstName: { equals: nameParts[0], mode: 'insensitive' }
                          }
                        });
                        if (!newPatient) {
                          newPatient = await prisma.patient.create({
                            data: {
                              doctorId,
                              firstName: nameParts[0],
                              lastName: nameParts.slice(1).join(' ') || '',
                              phone: phoneDigits,
                              patientType: 'ACTIVE'
                            }
                          });
                        }

                        const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                        const { hour, minute } = parseSessionOrTimeToHourMinute(timeStr, 18);
                        const { startTime, endTime, dbAppointmentDate, timeLabel, dateLabel } = createClinicAppointmentDateTimes({
                          dateStr,
                          hour,
                          minute,
                          durationMinutes: 60,
                          timezone: clinicTz
                        });

                        await prisma.appointment.create({
                          data: { patientId: newPatient.id, doctorId, practitionerId: matchedPractitioner?.id || null, date: dbAppointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant (new patient)' }
                        });

                        const docName = formatDoctorDisplayName(doctorInfo?.name);
                        const ptSal = formatPatientSalutation(newPatient);
                        const ptMsg = ptSal.isMinor
                          ? `Dear Parent, an appointment for *${ptSal.fullNameWithSalutation}* with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                          : `Hi ${ptSal.greetingName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                        await this.sendOutboundPatientMessage(sock, doctorId, phoneDigits, ptMsg, newPatient.id, ptSal.fullNameWithSalutation);

                        const confirmMsg = `Done, Doctor! I have created a new patient profile for *${patientName}* and booked their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation has been sent to them.`;
                        await sock.sendMessage(remoteJid, { text: confirmMsg });
                        await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                        await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                        return;
                      } catch (e) {
                        console.error('[WhatsAppManager] AWAITING_PHONE resolution error:', e);
                      }
                    }
                  } else if (pendingIntent.type === 'AWAITING_SELECTION' && pendingIntent.candidates) {
                    // Doctor replied with "1", "2", or last 4 digits of phone
                    const selectionNum = parseInt(replyText) - 1;
                    const phoneDigits4 = replyText.replace(/\D/g, '');
                    type Candidate = { id: string; firstName: string; lastName: string; phone: string; lastVisit?: Date | null };
                    let selectedPatient: Candidate | null = null;
                    if (!isNaN(selectionNum) && selectionNum >= 0 && selectionNum < pendingIntent.candidates.length) {
                      selectedPatient = pendingIntent.candidates[selectionNum];
                    }
                    if (!selectedPatient && phoneDigits4.length >= 4) {
                      selectedPatient = pendingIntent.candidates.find(c => c.phone?.endsWith(phoneDigits4)) ?? null;
                    }
                    if (selectedPatient) {
                       this.pendingIntents.delete(patientPhone);
                       handled = true;
                       try {
                         const { dateStr, timeStr } = pendingIntent;
                         const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                         const { hour, minute } = parseSessionOrTimeToHourMinute(timeStr, 18);
                         const { startTime, endTime, dbAppointmentDate, timeLabel, dateLabel } = createClinicAppointmentDateTimes({
                           dateStr,
                           hour,
                           minute,
                           durationMinutes: 60,
                           timezone: clinicTz
                         });

                         await prisma.appointment.create({
                           data: { patientId: selectedPatient.id, doctorId, practitionerId: matchedPractitioner?.id || null, date: dbAppointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                         });

                         const docName = formatDoctorDisplayName(doctorInfo?.name);
                         if (selectedPatient.phone) {
                            const ptSal = formatPatientSalutation(selectedPatient);
                            const ptMsg = ptSal.isMinor
                              ? `Dear Parent, an appointment for *${ptSal.fullNameWithSalutation}* with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                              : `Hi ${ptSal.greetingName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                            await this.sendOutboundPatientMessage(sock, doctorId, selectedPatient.phone, ptMsg, selectedPatient.id, ptSal.fullNameWithSalutation);
                          }
                         const confirmMsg = `Confirmed, Doctor! I have booked the appointment for *${selectedPatient.firstName} ${selectedPatient.lastName}* on ${dateLabel} at ${timeLabel} and sent them a WhatsApp confirmation.`;
                         await sock.sendMessage(remoteJid, { text: confirmMsg });
                         await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                         await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                         return;
                       } catch (e) {
                         console.error('[WhatsAppManager] AWAITING_SELECTION resolution error:', e);
                       }
                    } else if (phoneDigits4.length >= 10) {
                      // Doctor provided a FULL phone number — treat as brand new patient
                      this.pendingIntents.delete(patientPhone);
                      handled = true;
                      try {
                        const { patientName, dateStr, timeStr } = pendingIntent;
                        const nameParts = patientName.split(' ');
                        const last10_4 = phoneDigits4.slice(-10);
                        let newPatient = await prisma.patient.findFirst({
                          where: {
                            doctorId,
                            OR: [
                              { phone: phoneDigits4 },
                              { phone: `+${phoneDigits4}` },
                              { phone: { endsWith: last10_4 } }
                            ],
                            firstName: { equals: nameParts[0], mode: 'insensitive' }
                          }
                        });
                        if (!newPatient) {
                          newPatient = await prisma.patient.create({
                            data: {
                              doctorId,
                              firstName: nameParts[0],
                              lastName: nameParts.slice(1).join(' ') || '',
                              phone: phoneDigits4,
                              patientType: 'ACTIVE'
                            }
                          });
                        }
                        const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                        const { hour, minute } = parseSessionOrTimeToHourMinute(timeStr, 18);
                        const { startTime, endTime, dbAppointmentDate, timeLabel, dateLabel } = createClinicAppointmentDateTimes({
                          dateStr,
                          hour,
                          minute,
                          durationMinutes: 60,
                          timezone: clinicTz
                        });
                        await prisma.appointment.create({
                          data: { patientId: newPatient.id, doctorId, practitionerId: matchedPractitioner?.id || null, date: dbAppointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant (new patient)' }
                        });
                        const docName = formatDoctorDisplayName(staffName || doctorInfo?.name);
                        const ptMsg = `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                        await this.sendOutboundPatientMessage(sock, doctorId, phoneDigits4, ptMsg, newPatient.id, patientName);
                        const confirmMsg = `Done, Doctor! I have created a new profile for *${patientName}* (Phone: ${phoneDigits4}) and confirmed their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation has been sent.`;
                        await sock.sendMessage(remoteJid, { text: confirmMsg });
                        await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                        await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                        return;
                      } catch (e) {
                        console.error('[WhatsAppManager] New patient from AWAITING_SELECTION error:', e);
                      }
                    }
                  } else if (pendingIntent.type === 'AWAITING_SCHEDULE_CONFIRMATION') {
                    const isYes = /^(1|yes|haan|ha|confirm|theek|ok|sure|proceed|do it)/i.test(replyText);
                    const isNo = /^(2|no|nahi|na|cancel|discard|stop|abort)/i.test(replyText);

                    if (isYes) {
                      this.pendingIntents.delete(patientPhone);
                      handled = true;
                      const { action, delayMinutes, impactedAptIds } = pendingIntent;

                      try {
                        if (action === 'DELAY') {
                          const delay = delayMinutes || 30;
                          await prisma.doctor.update({
                            where: { id: doctorId },
                            data: {
                              opdStatus: "RUNNING_LATE",
                              opdDelayMinutes: delay,
                              opdStatusNote: `Running ${delay} mins late`,
                              opdStatusUpdatedAt: new Date()
                            }
                          });

                          const apts = await prisma.appointment.findMany({
                            where: { id: { in: impactedAptIds } },
                            include: { patient: true }
                          });

                          let count = 0;
                          const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                          const docName = formatDoctorDisplayName(doctorInfo?.name);
                          for (const apt of apts) {
                            if (apt.startTime) {
                              const newStart = new Date(apt.startTime.getTime() + delay * 60000);
                              const newEnd = apt.endTime ? new Date(apt.endTime.getTime() + delay * 60000) : new Date(newStart.getTime() + 30 * 60000);
                              await prisma.appointment.update({
                                where: { id: apt.id },
                                data: { startTime: newStart, endTime: newEnd }
                              });
                              if (apt.patient?.phone) {
                                const newTimeStr = newStart.toLocaleTimeString('en-IN', {
                                  timeZone: clinicTz,
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                });
                                const msg = `⚠️ *OPD Timing Update*\n\nHi ${apt.patient.firstName}, ${docName} is currently running approx *${delay} minutes late* due to urgent hospital procedures. Your appointment is now scheduled for *${newTimeStr}* today. Thank you for your patience! 😊`;
                                await this.sendOutboundPatientMessage(sock, doctorId, apt.patient.phone, msg, apt.patient.id, `${apt.patient.firstName} ${apt.patient.lastName}`.trim());
                                count++;
                              }
                            }
                          }

                          const confirmMsg = `✅ Confirmed, Doctor! Your OPD schedule has been delayed by *${delay} minutes* in Gyrex, and WhatsApp delay notifications have been dispatched to *${count} booked patients*.`;
                          await sock.sendMessage(remoteJid, { text: confirmMsg });
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                          return;
                        } else if (action === 'CANCEL') {
                          await prisma.doctor.update({
                            where: { id: doctorId },
                            data: {
                              opdStatus: "CANCELLED",
                              opdStatusNote: "Emergency cancel",
                              opdStatusUpdatedAt: new Date()
                            }
                          });

                          const apts = await prisma.appointment.findMany({
                            where: { id: { in: impactedAptIds } },
                            include: { patient: true }
                          });

                          let count = 0;
                          const docName = formatDoctorDisplayName(doctorInfo?.name);
                          for (const apt of apts) {
                            await prisma.appointment.update({
                              where: { id: apt.id },
                              data: { status: "CANCELLED" }
                            });
                            if (apt.patient?.phone) {
                              const msg = `⚠️ *Important Clinic Notice*\n\nDear ${apt.patient.firstName}, ${docName} had an unexpected hospital emergency and will not be available for OPD consultations today. We sincerely apologize for any inconvenience. Please reply here to reschedule for tomorrow or call the clinic.`;
                              await this.sendOutboundPatientMessage(sock, doctorId, apt.patient.phone, msg, apt.patient.id, `${apt.patient.firstName} ${apt.patient.lastName}`.trim());
                              count++;
                            }
                          }

                          const confirmMsg = `✅ Confirmed, Doctor! Today's OPD is marked as *Emergency Cancelled* in Gyrex. Cancellation notices have been sent to *${count} booked patients*, and new WhatsApp bookings for today are paused.`;
                          await sock.sendMessage(remoteJid, { text: confirmMsg });
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                          return;
                        } else if (action === 'PAUSE') {
                          await prisma.doctor.update({
                            where: { id: doctorId },
                            data: {
                              opdStatus: "PAUSED",
                              opdStatusNote: "Paused online bookings for today",
                              opdStatusUpdatedAt: new Date()
                            }
                          });

                          const confirmMsg = `✅ Confirmed, Doctor! New online WhatsApp bookings are now *PAUSED for today*. Your existing *${impactedAptIds.length} booked appointment(s)* remain safe and active.`;
                          await sock.sendMessage(remoteJid, { text: confirmMsg });
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                          return;
                        }
                      } catch (e) {
                        console.error('[WhatsAppManager] Schedule confirmation error:', e);
                      }
                    } else if (isNo) {
                      this.pendingIntents.delete(patientPhone);
                      handled = true;
                      const abortMsg = `Understood, Doctor! I have cancelled this request. No changes were made to your Gyrex schedule or patient appointments.`;
                      await sock.sendMessage(remoteJid, { text: abortMsg });
                      await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: abortMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                      await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                      return;
                    }
                  }
                }
              }

              if (isStaff) {
                // ── Doctor Natural Language Schedule Command Detection ──────────
                const lowerText = textMessage.toLowerCase();
                const delayMatch = lowerText.match(/(?:running\s+)?(\d{1,2})\s*(?:mins?|minutes?|hr|hour|hours?)\s+late/i)
                  || lowerText.match(/late\s+by\s+(\d{1,2})\s*(?:mins?|minutes?|hr|hour|hours?)/i);
                const isCancelToday = /cancel\s+(?:all\s+)?(?:today'?s?|evening|morning)?\s*(?:opd|appointments?)/i.test(lowerText) || /emergency.*cancel/i.test(lowerText);
                const isPauseToday = /(?:pause|stop|block)\s+(?:new\s+)?(?:booking|patient|opd|appointment)/i.test(lowerText);
                const isResumeOpd = /resume\s+(?:normal\s+)?opd/i.test(lowerText) || /opd\s+active/i.test(lowerText);

                if (isResumeOpd) {
                  await prisma.doctor.update({
                    where: { id: doctorId },
                    data: { opdStatus: "ACTIVE", opdDelayMinutes: 0, opdStatusNote: null, opdStatusUpdatedAt: new Date() }
                  });
                  const resumeMsg = `✅ Done, Doctor! Your OPD status is back to *Active Normal Schedule*. Online WhatsApp bookings are operating as usual.`;
                  await sock.sendMessage(remoteJid, { text: resumeMsg });
                  await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: resumeMsg, senderName: 'AI Assistant', createdAt: messageDate } });
                  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                  return;
                }

                if (delayMatch || isCancelToday || isPauseToday) {
                  const staffClinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                  const { startOfDay: todayStart, endOfDay: todayEnd } = getClinicDayBounds(new Date(), staffClinicTz);
                  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);

                  const todayApts = await prisma.appointment.findMany({
                    where: {
                      doctorId,
                      date: { gte: todayStart, lte: todayEnd },
                      startTime: { gte: cutoffTime },
                      status: "CONFIRMED"
                    },
                    include: { patient: true },
                    orderBy: { startTime: 'asc' }
                  });

                  if (delayMatch) {
                    let mins = parseInt(delayMatch[1]);
                    if (/hr|hour/i.test(delayMatch[0])) mins = mins * 60;

                    const summaryLines = todayApts.map((a, i) => {
                      const orig = a.startTime ? a.startTime.toLocaleTimeString('en-IN', {
                        timeZone: staffClinicTz,
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }) : 'N/A';
                      const newT = a.startTime ? new Date(a.startTime.getTime() + mins * 60000).toLocaleTimeString('en-IN', {
                        timeZone: staffClinicTz,
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }) : 'N/A';
                      return `  ${i + 1}. *${a.patient.firstName} ${a.patient.lastName}* (${orig} ➔ ${newT})`;
                    });

                    this.pendingIntents.set(patientPhone, {
                      type: 'AWAITING_SCHEDULE_CONFIRMATION',
                      action: 'DELAY',
                      delayMinutes: mins,
                      impactedAptIds: todayApts.map(a => a.id)
                    });

                    const msg = `Doctor, I detected an OPD Schedule Delay request:\n\n⏱️ *Delay*: *${mins} Minutes* for Today's OPD.\n👥 *Impacted Booked Patients* (${todayApts.length}):\n${summaryLines.length > 0 ? summaryLines.join('\n') : '  (No appointments booked yet)'}\n\nShould I shift their appointment times in Gyrex and send polite WhatsApp delay notices to them?\n\n👉 Reply *1* or *CONFIRM* to apply & notify patients.\n👉 Reply *2* or *NO* to cancel.`;
                    await sock.sendMessage(remoteJid, { text: msg });
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant', createdAt: messageDate } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                    return;
                  } else if (isCancelToday) {
                    this.pendingIntents.set(patientPhone, {
                      type: 'AWAITING_SCHEDULE_CONFIRMATION',
                      action: 'CANCEL',
                      impactedAptIds: todayApts.map(a => a.id)
                    });

                    const msg = `⚠️ *Emergency OPD Cancellation Request*\n\nDoctor, you have *${todayApts.length} confirmed appointments* booked for today.\n\nShould I mark today's OPD as Emergency Cancelled, update their status in Gyrex, and send polite cancellation/reschedule messages to all ${todayApts.length} patients?\n\n👉 Reply *1* or *CONFIRM* to proceed.\n👉 Reply *2* or *NO* to keep appointments unchanged.`;
                    await sock.sendMessage(remoteJid, { text: msg });
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant', createdAt: messageDate } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                    return;
                  } else if (isPauseToday) {
                    this.pendingIntents.set(patientPhone, {
                      type: 'AWAITING_SCHEDULE_CONFIRMATION',
                      action: 'PAUSE',
                      impactedAptIds: todayApts.map(a => a.id)
                    });

                    const msg = `Doctor, I received your request to *PAUSE new WhatsApp bookings for today*.\n\n• Existing booked appointments (${todayApts.length}) will remain valid and active.\n• New inquiring patients will be offered tomorrow's slots or clinic walk-in consultations.\n\n👉 Reply *1* or *CONFIRM* to pause today's bookings.\n👉 Reply *2* or *NO* to keep bookings open.`;
                    await sock.sendMessage(remoteJid, { text: msg });
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant', createdAt: messageDate } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: messageDate } });
                    return;
                  }
                }

                const history = conversationHistoryStrings;

                const staffClinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                const { startOfDay: today } = getClinicDayBounds(new Date(), staffClinicTz);
                const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const appointmentWhere: any = {
                  doctorId,
                  date: { gte: today, lt: weekEnd }
                };
                if (matchedPractitioner && !matchedPractitioner.isOwner) {
                  appointmentWhere.practitionerId = matchedPractitioner.id;
                }

                const appointments = await prisma.appointment.findMany({
                  where: appointmentWhere,
                  include: { patient: true, practitioner: true },
                  orderBy: { date: 'asc' }
                });

                aiReply = await AIAgentsService.runStaffAssistantAgent(
                  doctorId,
                  textMessage,
                  history,
                  appointments,
                  { 
                    doctorName: staffName,
                    clinicName: doctorInfo?.clinicName || undefined,
                    assistantName: effectiveConfig?.assistantName || "Riya"
                  }
                );
              } else {
                const history = conversationHistoryStrings;

                const clinicPhone = doctorInfo?.phone || "";

                // Calculate Live Schedule Context & Daily Quota
                const clinicTzForApts = resolveClinicTimezone(doctorInfo?.timezone);
                const { startOfDay: todayStart, endOfDay: todayEnd } = getClinicDayBounds(new Date(), clinicTzForApts);

                const todayAppointments = await prisma.appointment.findMany({
                  where: {
                    doctorId,
                    date: { gte: todayStart, lte: todayEnd },
                    status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] }
                  },
                  select: { startTime: true, notes: true }
                });

                const todayAiCount = todayAppointments.filter(a => 
                  a.notes?.toLowerCase().includes("ai") || a.notes?.toLowerCase().includes("whatsapp")
                ).length;

                const maxDaily = doctorInfo?.maxDailyAiBookings ?? 10;
                const isTodayQuotaFull = maxDaily !== null && todayAiCount >= maxDaily;

                const bookedSlotsToday = todayAppointments
                  .filter(a => a.startTime)
                  .map(a => a.startTime.toLocaleTimeString("en-IN", {
                    timeZone: clinicTzForApts,
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }));

                // ── Auto-Reset Stale OPD Status from Previous Days ──
                const nowClinic = new Date();
                const todayClinicDateStr = nowClinic.toLocaleDateString("en-CA", { timeZone: clinicTzForApts });
                const statusUpdatedDateStr = doctorInfo?.opdStatusUpdatedAt
                  ? new Date(doctorInfo.opdStatusUpdatedAt).toLocaleDateString("en-CA", { timeZone: clinicTzForApts })
                  : null;

                const isStaleOpdStatus = statusUpdatedDateStr && statusUpdatedDateStr < todayClinicDateStr;
                const effectiveOpdStatus = (isStaleOpdStatus || !doctorInfo?.opdStatus) ? "ACTIVE" : doctorInfo.opdStatus;
                const effectiveOpdDelay = isStaleOpdStatus ? 0 : (doctorInfo?.opdDelayMinutes || 0);
                const effectiveOpdNote = isStaleOpdStatus ? null : (doctorInfo?.opdStatusNote || null);

                if (isStaleOpdStatus && doctorInfo?.opdStatus !== "ACTIVE") {
                  prisma.doctor.update({
                    where: { id: doctorId },
                    data: { opdStatus: "ACTIVE", opdDelayMinutes: 0, opdStatusNote: null, opdStatusUpdatedAt: new Date() }
                  }).catch(e => console.warn(`[WhatsAppManager] Failed to background auto-reset stale OPD status:`, e));
                }

                // Fetch existing family member records and active appointments on this phone to prevent hallucinations
                const cleanPtDigitsForApts = patientPhone.replace(/\D/g, '');
                const last10ForApts = cleanPtDigitsForApts.length >= 10 ? cleanPtDigitsForApts.slice(-10) : cleanPtDigitsForApts;
                const existingFamilyPatients = await prisma.patient.findMany({
                  where: {
                    doctorId,
                    OR: [
                      { phone: patientPhone },
                      { phone: `+${patientPhone}` },
                      ...(last10ForApts.length >= 10 ? [{ phone: { endsWith: last10ForApts } }] : [])
                    ]
                  },
                  select: { id: true, firstName: true, lastName: true, dateOfBirth: true, gender: true, vaccinationOptOut: true }
                });
                const existingFamilyNames = existingFamilyPatients
                  .map(p => `${p.firstName} ${p.lastName || ''}`.trim())
                  .filter(name => name.toLowerCase() !== 'patient' && !name.startsWith('+'));

                const patientIds = existingFamilyPatients.map(p => p.id);

                // Fetch existing vaccine records for matched family members
                let existingVaccineRecords: any[] = [];
                try {
                  existingVaccineRecords = await (prisma as any).patientVaccineRecord.findMany({
                    where: { patientId: { in: patientIds } },
                    orderBy: { dueDate: "asc" }
                  });
                } catch (vErr) {
                  console.warn("[WhatsAppManager] Could not load vaccine records:", vErr);
                }

                const familyProfiles = existingFamilyPatients.map(p => {
                  const pVaccines = existingVaccineRecords.filter(v => v.patientId === p.id);
                  const dobStr = p.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : null;
                  return {
                    id: p.id,
                    fullName: `${p.firstName} ${p.lastName || ''}`.trim(),
                    firstName: p.firstName,
                    dateOfBirth: dobStr,
                    gender: p.gender,
                    vaccinationOptOut: p.vaccinationOptOut,
                    totalVaccinesScheduled: pVaccines.length,
                    pendingVaccines: pVaccines.filter(v => v.status === 'PENDING').slice(0, 5).map(v => ({
                      milestone: v.milestone,
                      vaccineName: v.vaccineName,
                      dueDate: v.dueDate.toISOString().split('T')[0]
                    }))
                  };
                });

                const { startOfDay: clinicTodayStart } = getClinicDayBounds(new Date(), clinicTzForApts);
                const upcomingApts = await prisma.appointment.findMany({
                  where: {
                    doctorId,
                    patientId: { in: patientIds },
                    status: { in: ["CONFIRMED", "SCHEDULED", "CHECKED_IN"] },
                    date: { gte: clinicTodayStart }
                  },
                  orderBy: { date: "asc" },
                  include: { practitioner: true, patient: true }
                });

                const activeAppointments = upcomingApts.map(a => ({
                  date: a.date.toLocaleDateString("en-IN", { timeZone: clinicTzForApts, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
                  time: a.startTime ? a.startTime.toLocaleTimeString("en-IN", { timeZone: clinicTzForApts, hour: "numeric", minute: "2-digit", hour12: true }) : "Scheduled Session",
                  doctorName: a.practitioner?.name || doctorInfo?.name || "Doctor",
                  specialty: a.practitioner?.specialty || doctorInfo?.specialty || "General",
                  status: a.status,
                  type: a.type,
                  patientName: a.patient ? `${a.patient.firstName} ${a.patient.lastName || ''}`.trim() : "Patient"
                }));

                const scheduleContext = {
                  opdStatus: effectiveOpdStatus,
                  opdDelayMinutes: effectiveOpdDelay,
                  opdStatusNote: effectiveOpdNote,
                  maxDailyAiBookings: maxDaily,
                  todayAiCount,
                  isTodayQuotaFull,
                  bookedSlotsToday,
                  pacingStrategy: doctorInfo?.aiSlotPacing || "STAGGERED",
                  activeAppointments,
                  existingFamilyNames,
                  familyProfiles,
                  clinicTimezone: clinicTzForApts
                };

                aiReply = await AIAgentsService.runAppointmentAgent(
                  doctorId,
                  textMessage,
                  history,
                  effectiveConfig,
                  clinicPhone,
                  {
                    doctorName: doctorInfo?.name || undefined,
                    clinicName: doctorInfo?.clinicName || undefined,
                    specialty: doctorInfo?.specialty || undefined
                  },
                  clinicAddress,
                  clinicMapsUri,
                  practitioners,
                  websiteUrl,
                  scheduleContext,
                  mediaAttachment
                );
              }

              let finalAiReply = aiReply;

              if (aiReply) {
                // 1. Intercept Delegated Patient Task Tag
                const delegateTaskRegex = /\[DELEGATE_PATIENT_TASK:\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/i;
                const delegateMatch = aiReply.match(delegateTaskRegex);

                if (delegateMatch && isStaff) {
                  const [fullTag, targetIdentifier, actionType, targetTime, instruction] = delegateMatch;
                  try {
                    const cleanId = targetIdentifier.trim();
                    const cleanDigits = cleanId.replace(/\D/g, '');
                    
                    let targetPatient = null;
                    if (cleanDigits.length >= 10) {
                      targetPatient = await prisma.patient.findFirst({
                        where: { doctorId, phone: { endsWith: cleanDigits.slice(-10) } }
                      });
                    }
                    if (!targetPatient) {
                      const nameParts = cleanId.split(/\s+/);
                      targetPatient = await prisma.patient.findFirst({
                        where: {
                          doctorId,
                          firstName: { equals: nameParts[0], mode: 'insensitive' }
                        }
                      });
                    }

                    if (!targetPatient || !targetPatient.phone) {
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += `\n\n*(Doctor, I couldn't find "${cleanId}" in your patient database. Please provide their mobile number so I can contact them.)*`;
                    } else {
                      const ptPhone = targetPatient.phone.replace(/\D/g, '');
                      const docName = formatDoctorDisplayName(staffName || doctorInfo?.name);
                      
                      // Construct polite message to patient
                      const patientOutbound = `Namaste ${targetPatient.firstName}! 🙏\n${docName}'s clinic here. ${instruction.trim()}\n\nPlease reply here to let us know.`;
                      
                      await this.sendOutboundPatientMessage(
                        sock,
                        doctorId,
                        ptPhone,
                        patientOutbound,
                        targetPatient.id,
                        `${targetPatient.firstName} ${targetPatient.lastName}`.trim()
                      );

                      // Register delegated task in memory
                      this.delegatedDoctorTasks.set(ptPhone.slice(-10), {
                        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        doctorId,
                        doctorPhone: patientPhone,
                        patientName: `${targetPatient.firstName} ${targetPatient.lastName}`.trim(),
                        patientPhone: ptPhone,
                        actionType: actionType.trim(),
                        instruction: instruction.trim(),
                        targetTime: targetTime.trim(),
                        status: 'WAITING_FOR_PATIENT',
                        createdAt: Date.now()
                      });

                      console.log(`[WhatsAppManager] 📋 Registered delegated task for patient ${ptPhone}: ${actionType} - "${instruction}"`);
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                    }
                  } catch (dErr) {
                    console.error("[WhatsAppManager] Delegated Task Error:", dErr);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                    finalAiReply += `\n\n*(Doctor, I couldn't send the message to the patient due to a temporary WhatsApp connection issue. Task not completed.)*`;
                  }
                }

                // 2. Intercept Staff Cancellation Tags
                const cancelRegex = /\[CANCEL_APPOINTMENT:\s*([^\]]+)\]/i;
                const cancelMatch = aiReply.match(cancelRegex);

                if (cancelMatch && isStaff) {
                  const [fullTag, appointmentId] = cancelMatch;
                  try {
                    const apt = await prisma.appointment.findUnique({ 
                      where: { id: appointmentId.trim() }, 
                      include: { patient: true }
                    });
                    if (apt && apt.status !== "CANCELLED") {
                       await prisma.appointment.update({ 
                         where: { id: apt.id }, 
                         data: { status: "CANCELLED" }
                       });
                       finalAiReply = finalAiReply.replace(fullTag, "").trim();
                       
                       // Notify patient via WhatsApp
                       if (apt.patient?.phone) {
                          const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                          const docName = formatDoctorDisplayName(doctorInfo?.name);
                          const salutation = formatPatientSalutation(apt.patient || {});
                          const dateFormatted = formatInClinicDate(apt.date, clinicTz, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                          const timeFormatted = apt.startTime ? ` at ${formatInClinicTime(apt.startTime, clinicTz)}` : '';
                          const msg = `Hi ${salutation.greetingName}, I hope you are having a good day. I'm reaching out because ${docName} had an unexpected change in schedule, and unfortunately, we need to cancel your appointment on ${dateFormatted}${timeFormatted}.\n\nWe sincerely apologize for any inconvenience this may cause you. Please reply to this message if you would like us to help you find a new time that works for you. We are here to help!`;
                          await this.sendOutboundPatientMessage(sock, doctorId, apt.patient.phone, msg, apt.patient.id, `${apt.patient.firstName} ${apt.patient.lastName}`.trim());
                        }
                    } else if (!apt) {
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += `\n\n*(Doctor, appointment ID "${appointmentId.trim()}" was not found in the database.)*`;
                    }
                  } catch (e) {
                    console.error("[WhatsAppManager] Cancel Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                    finalAiReply += `\n\n*(Doctor, could not cancel the appointment due to a database error.)*`;
                  }
                }

                const rescheduleRegex = /\[RESCHEDULE_APPOINTMENT:\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/i;
                const rescheduleMatch = aiReply.match(rescheduleRegex);

                if (rescheduleMatch && isStaff) {
                  const [fullTag, appointmentId, dateStr, sessionStr] = rescheduleMatch;
                  try {
                    const apt = await prisma.appointment.findUnique({ 
                      where: { id: appointmentId.trim() }, 
                      include: { patient: true }
                    });
                    
                    if (apt) {
                      const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                      const { startOfDay: todayStart } = getClinicDayBounds(new Date(), clinicTz);
                      const { hour, minute } = parseSessionOrTimeToHourMinute(sessionStr, sessionStr.toLowerCase().includes("morning") ? 10 : 17);
                      const { startTime, endTime, dbAppointmentDate, timeLabel, dateLabel } = createClinicAppointmentDateTimes({
                        dateStr,
                        hour,
                        minute,
                        durationMinutes: 60,
                        timezone: clinicTz
                      });

                      if (dbAppointmentDate >= todayStart) {
                        await prisma.appointment.update({ 
                          where: { id: apt.id }, 
                          data: { 
                            status: "CONFIRMED",
                            date: dbAppointmentDate,
                            startTime,
                            endTime,
                            notes: `Rescheduled via AI Assistant (${sessionStr.trim()})`
                          }
                        });
                        
                        finalAiReply = finalAiReply.replace(fullTag, "").trim();
                        
                        // Notify patient via WhatsApp
                        if (apt.patient?.phone) {
                          const patientJid = `${apt.patient.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                          const salutation = formatPatientSalutation(apt.patient || {});
                          const msg = `🔄 *Appointment Rescheduled*\n\nHi ${salutation.greetingName}, the clinic has rescheduled your appointment to *${dateLabel} at ${timeLabel}*. Reply here if this time does not work for you.`;
                          await sock.sendMessage(patientJid, { text: msg });
                          console.log(`[WhatsAppManager] Sent reschedule to ${patientJid}`);
                        }
                      }
                    }
                  } catch (e) {
                    console.error("[WhatsAppManager] Reschedule Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                  }
                }

                // 3. Intercept Patient Messaging Tag
                const messagePatientRegex = /\[MESSAGE_PATIENT:\s*([^,]+),\s*([^\]]+)\]/i;
                const msgMatch = aiReply.match(messagePatientRegex);
                
                if (msgMatch && isStaff) {
                  const [fullTag, targetPhone, msgContent] = msgMatch;
                  try {
                    const cleanPhone = targetPhone.replace(/\D/g, '');
                    if (!cleanPhone) {
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += "\n\n*(System Note: Could not send the message because the patient's phone number was missing or invalid in my context.)*";
                      throw new Error("Empty phone number in MESSAGE_PATIENT tag");
                    }
                    const patientJid = `${cleanPhone}@s.whatsapp.net`;
                    
                    const patientRecord = await prisma.patient.findFirst({ where: { phone: { endsWith: cleanPhone.slice(-10) }, doctorId } });
                    const ptName = patientRecord ? `${patientRecord.firstName} ${patientRecord.lastName}`.trim() : "Patient";
                    
                    // Send message via Baileys & record in CRM
                    await this.sendOutboundPatientMessage(sock, doctorId, cleanPhone, msgContent.trim(), patientRecord?.id || null, ptName);
                    console.log(`[WhatsAppManager] AI relayed message to patient ${patientJid}`);

                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                  } catch (e) {
                    console.error("[WhatsAppManager] Message Relay Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                    finalAiReply += "\n\n*(Doctor, I couldn't deliver the WhatsApp message to the patient due to a delivery error.)*";
                  }
                }

                // 4. Intercept Doctor-initiated new appointment booking
                const bookNewRegex = /\[BOOK_NEW_APPOINTMENT:\s*([^,]+),\s*([^,]+),\s*([^,\]]+)(?:,\s*([^\]]+))?\]/i;
                const bookNewMatch = aiReply.match(bookNewRegex);

                if (bookNewMatch && isStaff) {
                  const [fullTag, patientName, dateStr, timeStr, phoneFromTag] = bookNewMatch;
                  const cleanName = patientName.trim();
                  const cleanDate = dateStr.trim();
                  const cleanTime = timeStr.trim();
                  // If AI extracted a phone number upfront, use it to skip disambiguation entirely
                  const prefilledPhone = phoneFromTag ? phoneFromTag.trim().replace(/\D/g, '') : '';

                  try {
                    // Parse appointment date & time
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { hour, minute } = parseSessionOrTimeToHourMinute(cleanTime, 18);
                    const { startTime, endTime, dbAppointmentDate, timeLabel, dateLabel } = createClinicAppointmentDateTimes({
                      dateStr: cleanDate,
                      hour,
                      minute,
                      durationMinutes: 60,
                      timezone: clinicTz
                    });
                    const appointmentDate = dbAppointmentDate;

                    finalAiReply = finalAiReply.replace(fullTag, '').trim();

                    // If the doctor already provided a phone number → check if patient exists before creating
                    if (prefilledPhone.length >= 10) {
                      const nameParts = cleanName.split(' ');
                      const last10_pref = prefilledPhone.slice(-10);
                      let newPatient = await prisma.patient.findFirst({
                        where: {
                          doctorId,
                          OR: [
                            { phone: prefilledPhone },
                            { phone: `+${prefilledPhone}` },
                            { phone: { endsWith: last10_pref } }
                          ],
                          firstName: { equals: nameParts[0], mode: 'insensitive' }
                        }
                      });
                      if (!newPatient) {
                        newPatient = await prisma.patient.create({
                          data: {
                            doctorId,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ') || '',
                            phone: prefilledPhone,
                            patientType: 'ACTIVE'
                          }
                        });
                      }
                      await prisma.appointment.create({
                        data: { patientId: newPatient.id, doctorId, practitionerId: matchedPractitioner?.id || null, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                      });
                      const ptMsg = formatAppointmentConfirmationCard({
                        patient: newPatient,
                        doctorName: matchedPractitioner?.name || staffName || doctorInfo?.name,
                        specialty: matchedPractitioner?.specialty || doctorInfo?.specialty || "General Physician",
                        clinicName: doctorInfo?.clinicName,
                        startTime: startTime,
                        clinicTz: clinicTz,
                        consultationFee: matchedPractitioner?.consultationFee,
                        address: clinicAddress || doctorInfo?.address,
                        city: clinicAddress ? null : doctorInfo?.city,
                        mapsUrl: clinicMapsUri
                      });
                      await this.sendOutboundPatientMessage(sock, doctorId, prefilledPhone, ptMsg, newPatient.id, `${newPatient.firstName} ${newPatient.lastName}`.trim());
                      finalAiReply += `\n\nDone, Doctor! I have created a new patient profile for *${cleanName}* and confirmed their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation card has been sent to them.`;
                    } else {
                      // No phone provided upfront: search by name
                      const nameParts2 = cleanName.split(' ');
                      const firstName = nameParts2[0];
                      const lastName = nameParts2.length > 1 ? nameParts2.slice(1).join(' ') : '';

                      const exactMatches = await prisma.patient.findMany({
                        where: {
                          doctorId,
                          firstName: { equals: firstName, mode: 'insensitive' },
                          ...(lastName ? { lastName: { equals: lastName, mode: 'insensitive' } } : {})
                        },
                        include: { appointments: { orderBy: { date: 'desc' }, take: 1 } },
                        take: 10
                      });

                      if (exactMatches.length === 1) {
                        // SCENARIO 1: Exact single match - book immediately
                        const pt = exactMatches[0];
                        await prisma.appointment.create({
                          data: { patientId: pt.id, doctorId, practitionerId: matchedPractitioner?.id || null, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                        });
                        if (pt.phone) {
                          const ptMsg = formatAppointmentConfirmationCard({
                            patient: pt,
                            doctorName: matchedPractitioner?.name || staffName || doctorInfo?.name,
                            specialty: matchedPractitioner?.specialty || doctorInfo?.specialty || "General Physician",
                            clinicName: doctorInfo?.clinicName,
                            startTime: startTime,
                            clinicTz: clinicTz,
                            consultationFee: matchedPractitioner?.consultationFee,
                            address: clinicAddress || doctorInfo?.address,
                            city: clinicAddress ? null : doctorInfo?.city,
                            mapsUrl: clinicMapsUri
                          });
                          await this.sendOutboundPatientMessage(sock, doctorId, pt.phone, ptMsg, pt.id, `${pt.firstName} ${pt.lastName}`.trim());
                          finalAiReply += `\n\nDone, Doctor! I have booked the appointment for ${pt.firstName} ${pt.lastName} on ${dateLabel} at ${timeLabel} and sent them a WhatsApp confirmation card.`;
                        }

                      } else if (exactMatches.length > 1) {
                        // SCENARIO 2: Multiple patients with same name - ask doctor to disambiguate
                        const candidateLines = exactMatches.map((pt, i) => {
                          const lastVisitDate = pt.appointments[0]?.date;
                          const lastVisit = lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('en-IN', { timeZone: clinicTz, day: 'numeric', month: 'short', year: 'numeric' }) : 'No prior visit';
                          const maskedPhone = pt.phone ? `${pt.phone.slice(0, -4).replace(/./g, 'x')}${pt.phone.slice(-4)}` : 'N/A';
                          return `  ${i + 1}. ${pt.firstName} ${pt.lastName} | Phone: ${maskedPhone} | Last visit: ${lastVisit}`;
                        });
                        this.pendingIntents.set(patientPhone, {
                          type: 'AWAITING_SELECTION',
                          patientName: cleanName,
                          dateStr: cleanDate,
                          timeStr: cleanTime,
                          candidates: exactMatches.map(pt => ({ id: pt.id, firstName: pt.firstName, lastName: pt.lastName, phone: pt.phone, lastVisit: pt.appointments[0]?.date ?? null }))
                        });
                        finalAiReply += `\n\nDoctor, I found ${exactMatches.length} patients named *${cleanName}*. Which one would you like to book for?\n\n${candidateLines.join('\n')}\n\nPlease reply with the number (1, 2...) or the last 4 digits of their phone to confirm.`;

                      } else {
                        // SCENARIO 3: No exact match - fuzzy search
                        const fuzzyMatches = await prisma.patient.findMany({
                          where: {
                            doctorId,
                            OR: [
                              { firstName: { contains: firstName, mode: 'insensitive' } },
                              { lastName: { contains: lastName || firstName, mode: 'insensitive' } }
                            ]
                          },
                          take: 3
                        });

                        if (fuzzyMatches.length > 0) {
                          // SCENARIO 4: Fuzzy match - ask to confirm
                          const fuzzyLines = fuzzyMatches.map((pt, i) => `  ${i + 1}. ${pt.firstName} ${pt.lastName} | Phone: ...${pt.phone?.slice(-4) || 'N/A'}`).join('\n');
                          this.pendingIntents.set(patientPhone, {
                            type: 'AWAITING_SELECTION',
                            patientName: cleanName,
                            dateStr: cleanDate,
                            timeStr: cleanTime,
                            candidates: fuzzyMatches.map(pt => ({ id: pt.id, firstName: pt.firstName, lastName: pt.lastName, phone: pt.phone, lastVisit: null }))
                          });
                          finalAiReply += `\n\nDoctor, I couldn't find an exact match for *${cleanName}*. Did you mean one of these patients?\n\n${fuzzyLines}\n\nReply with the number to confirm, or share the full name + phone number if this is a new patient.`;
                        } else {
                          // Brand new patient — ask for phone number first
                          this.pendingIntents.set(patientPhone, {
                            type: 'AWAITING_PHONE',
                            patientName: cleanName,
                            dateStr: cleanDate,
                            timeStr: cleanTime
                          });
                          finalAiReply += `\n\nDoctor, *${cleanName}* is not in your patient records yet. Could you please share their WhatsApp number so I can create their profile and send them an appointment confirmation?`;
                        }
                      }
                    } // end else (no prefilled phone)
                  } catch (e) {
                    console.error('[WhatsAppManager] BOOK_NEW_APPOINTMENT Error:', e);
                    finalAiReply = finalAiReply.replace(fullTag, '').trim();
                  }
                }

                // 2. Intercept Patient Cancellation Tag, Intent, or AI Acknowledgment
                const patientCancelRegex = /\[(?:CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|CANCEL_APPOINTMENT)(?::\s*([^\]]+))?\]/i;
                const ptCancelMatch = aiReply.match(patientCancelRegex);
                const isPatientCancelTag = !!ptCancelMatch;

                // Match English & Hindi phrases in any word order:
                // e.g., "Sushmita ka appointment cancel karna hai", "appointment cancel kar do", "cancel my appointment", "slot cancel", "cancel karna hai", "nahi aa paunga"
                const isCancelWord = /\b(?:cancel|cancellation|radd|hata(?:o|na|de|do)?)\b/i.test(textMessage);
                const isAppointmentWord = /\b(?:appointment|booking|slot|visit)\b/i.test(textMessage);
                const isHindiCancelPhrase = /nahi\s+aa\s*(?:paunga|sakta|sakenge|payenge|paenge|payega)|aana\s+nahi\s+hai|cancel\s*(?:karo|karna|kar|kr|do|hoga)/i.test(textMessage);
                const isPatientCancelIntent = !isStaff && ((isCancelWord && (isAppointmentWord || isHindiCancelPhrase)) || isHindiCancelPhrase);

                // Also detect if the AI text itself acknowledged cancellation even if the tag was omitted
                const isAiAcknowledgedCancel = !isStaff && /(?:appointment|booking)\s+(?:has\s+been\s+)?(?:cancelled|canceled)|(?:appointment|booking|slot).*(?:cancel|radd)\s+kar\s+diya/i.test(aiReply);

                if ((isPatientCancelTag || isPatientCancelIntent || isAiAcknowledgedCancel) && !isStaff) {
                  try {
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { startOfDay: today } = getClinicDayBounds(new Date(), clinicTz);

                    // Extract target beneficiary if specified in tag or mentioned in message
                    const rawCancelTarget = ptCancelMatch?.[1]?.trim().toLowerCase();
                    let targetFirstName: string | null = null;
                    if (rawCancelTarget && rawCancelTarget !== "patient") {
                      targetFirstName = rawCancelTarget.split(' ')[0];
                    } else {
                      // Check if any patient registered under this phone has their firstName in textMessage or aiReply
                      const registeredPts = await prisma.patient.findMany({
                        where: {
                          phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] },
                          doctorId
                        }
                      });
                      const combinedTxt = `${textMessage} ${aiReply}`.toLowerCase();
                      const matchedPt = registeredPts.find(p => p.firstName && p.firstName.length > 2 && combinedTxt.includes(p.firstName.toLowerCase()));
                      if (matchedPt) {
                        targetFirstName = matchedPt.firstName.toLowerCase();
                      }
                    }

                    const activeApt = await prisma.appointment.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          ...(patient ? [{ patientId: patient.id }] : []),
                          { patient: { phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] } } }
                        ],
                        ...(targetFirstName ? { patient: { firstName: { equals: targetFirstName, mode: 'insensitive' } } } : {}),
                        date: { gte: today },
                        status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] }
                      },
                      orderBy: { date: 'asc' },
                      include: { patient: true }
                    });

                    if (activeApt) {
                      await prisma.appointment.update({
                        where: { id: activeApt.id },
                        data: { status: "CANCELLED", notes: `${activeApt.notes || ""} [Cancelled by Patient on WhatsApp]`.trim() }
                      });
                      console.log(`[WhatsAppManager] Successfully cancelled appointment ${activeApt.id} for patient ${patientPhone}`);

                      // Notify Doctor on WhatsApp immediately so doctor knows slot is now open
                      if (doctorInfo?.phone) {
                        const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                        const docPhoneClean = doctorInfo.phone.replace(/\D/g, '');
                        const dateLabel = (activeApt.startTime || activeApt.date).toLocaleDateString('en-IN', { timeZone: clinicTz, weekday: 'short', day: 'numeric', month: 'short' });
                        const timeLabel = activeApt.startTime ? activeApt.startTime.toLocaleTimeString('en-IN', { timeZone: clinicTz, hour: '2-digit', minute: '2-digit' }) : 'Scheduled Time';
                        const cleanPtName = activeApt.patient ? `${activeApt.patient.firstName} ${activeApt.patient.lastName}`.trim() : (patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Patient');
                        
                        const docAlert = `🔔 *Patient Appointment Cancelled*\n\n👤 Patient: *${cleanPtName}* (${patientPhone})\n📅 Cancelled Slot: *${dateLabel} at ${timeLabel}*\n\n✨ This slot is now *OPEN & Available* for new bookings in your Gyrex calendar.`;
                        await this.sendOutboundPatientMessage(sock, doctorId, docPhoneClean, docAlert).catch(() => {});
                      }
                    }
                    finalAiReply = finalAiReply.replace(/\[(?:CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|CANCEL_APPOINTMENT)(?::.*?)?\]/gi, "").trim();
                  } catch (cancelErr) {
                    console.error("[WhatsAppManager] Patient Cancellation Error:", cancelErr);
                  }
                }

                // 2.5 Intercept Patient Reschedule Tag
                const patientRescheduleRegex = /\[RESCHEDULE_APPOINTMENT:\s*([^,]+),\s*([^,]+)(?:,\s*([^\]]+))?\]/i;
                const resMatch = aiReply.match(patientRescheduleRegex);
                if (resMatch && !isStaff) {
                  const [, resDateStr, rawResSessionStr, rawPtName] = resMatch;
                  const resSessionStr = extractAgreedTimeFromHistory(rawResSessionStr, textMessage, conversationHistoryStrings);
                  try {
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { startOfDay: todayStart } = getClinicDayBounds(new Date(), clinicTz);

                    const cleanTargetPtName = rawPtName?.trim().toLowerCase();
                    const existingActiveApt = await prisma.appointment.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          ...(patient ? [{ patientId: patient.id }] : []),
                          { patient: { phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] } } }
                        ],
                        ...(cleanTargetPtName ? { patient: { firstName: { equals: cleanTargetPtName.split(' ')[0], mode: 'insensitive' } } } : {}),
                        date: { gte: todayStart },
                        status: { in: ["SCHEDULED", "CONFIRMED"] }
                      },
                      include: { patient: true, practitioner: true },
                      orderBy: { date: 'asc' }
                    });

                    if (existingActiveApt) {
                      let targetDateStr = resDateStr.trim();
                      const cleanStr = targetDateStr.toLowerCase();
                      const nowInClinic = new Date();
                      if (cleanStr.includes("today") || cleanStr.includes("aaj")) {
                        targetDateStr = getClinicDateOnlyString(nowInClinic, clinicTz);
                      } else if (cleanStr.includes("tomorrow") || cleanStr.includes("kal")) {
                        const tmrw = new Date(nowInClinic.getTime() + 24 * 60 * 60 * 1000);
                        targetDateStr = getClinicDateOnlyString(tmrw, clinicTz);
                      } else {
                        targetDateStr = getClinicDateOnlyString(targetDateStr, clinicTz);
                      }

                      const isMorning = resSessionStr.toLowerCase().includes("morning");
                      const { hour, minute } = parseSessionOrTimeToHourMinute(resSessionStr, isMorning ? 10 : 17, {
                        morningOpd: effectiveConfig?.morningOpd || doctorInfo?.workingHoursStart,
                        eveningOpd: effectiveConfig?.eveningOpd,
                        workingHoursStart: doctorInfo?.workingHoursStart
                      });
                      const { startTime, endTime, dbAppointmentDate } = createClinicAppointmentDateTimes({
                        dateStr: targetDateStr,
                        hour,
                        minute,
                        durationMinutes: 60,
                        timezone: clinicTz
                      });

                      await prisma.appointment.update({
                        where: { id: existingActiveApt.id },
                        data: {
                          date: dbAppointmentDate,
                          startTime,
                          endTime,
                          notes: `${existingActiveApt.notes || ""} [Rescheduled via WhatsApp to ${resSessionStr.trim()}]`.trim()
                        }
                      });
                      console.log(`[WhatsAppManager] Atomically rescheduled appointment ${existingActiveApt.id} for ${patientPhone} to ${targetDateStr} ${hour}:${minute} in ${clinicTz}`);

                      const resPractitioner = existingActiveApt.practitioner || practitioners.find(p => p.id === existingActiveApt.practitionerId) || practitioners[0];
                      const updatedCard = formatAppointmentConfirmationCard({
                        patient: {
                          firstName: existingActiveApt.patient?.firstName || patient?.firstName,
                          lastName: existingActiveApt.patient?.lastName || patient?.lastName,
                          gender: existingActiveApt.patient?.gender || patient?.gender,
                          dateOfBirth: existingActiveApt.patient?.dateOfBirth
                        },
                        doctorName: resPractitioner?.name || doctorInfo?.name,
                        specialty: resPractitioner?.specialty || doctorInfo?.specialty || "General Physician",
                        clinicName: doctorInfo?.clinicName,
                        startTime: startTime,
                        clinicTz: clinicTz,
                        consultationFee: resPractitioner?.consultationFee,
                        address: clinicAddress || doctorInfo?.address,
                        city: clinicAddress ? null : doctorInfo?.city,
                        mapsUrl: clinicMapsUri
                      });

                      finalAiReply = updatedCard;

                      if (doctorInfo?.phone) {
                        const docPhoneClean = doctorInfo.phone.replace(/\D/g, '');
                        const dateLabel = dbAppointmentDate.toLocaleDateString('en-IN', { timeZone: clinicTz, weekday: 'short', day: 'numeric', month: 'short' });
                        const timeLabel = startTime.toLocaleTimeString('en-IN', { timeZone: clinicTz, hour: '2-digit', minute: '2-digit' });
                        const cleanPtName = existingActiveApt.patient ? `${existingActiveApt.patient.firstName} ${existingActiveApt.patient.lastName}`.trim() : (patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Patient');
                        
                        const docAlert = `🔔 *Patient Appointment Rescheduled*\n\n👤 Patient: *${cleanPtName}* (${patientPhone})\n📅 New Slot: *${dateLabel} at ${timeLabel}* (${resSessionStr.trim()})\n\n✨ Updated in your Gyrex calendar.`;
                        await this.sendOutboundPatientMessage(sock, doctorId, docPhoneClean, docAlert).catch(() => {});
                      }
                      
                      await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, existingActiveApt.patientId, existingActiveApt.patient?.firstName || "Patient");
                      return;
                    }
                    finalAiReply = finalAiReply.replace(patientRescheduleRegex, "").trim();
                  } catch (resErr) {
                    console.error("[WhatsAppManager] Patient Rescheduling Error:", resErr);
                  }
                }

                // 2.6 Intercept Status / Resend Confirmation Card Requests
                const isResendConfirmationTag = /\[RESEND_CONFIRMATION\]/i.test(aiReply);
                const isConfirmationRequestText = /(?:send\s*(?:me\s*)?(?:the\s*)?confirmation|confirmation\s*card\s*(?:bhej|send|share)|confirm\s*(?:ho\s*gaya|status)|share\s*confirmation)/i.test(textMessage);

                if ((isResendConfirmationTag || isConfirmationRequestText) && !isStaff) {
                  try {
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { startOfDay: todayStart } = getClinicDayBounds(new Date(), clinicTz);

                    // Check if a specific patient is mentioned in textMessage
                    const registeredPts = await prisma.patient.findMany({
                      where: {
                        phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] },
                        doctorId
                      }
                    });
                    const matchedPt = registeredPts.find(p => p.firstName && p.firstName.length > 2 && textMessage.toLowerCase().includes(p.firstName.toLowerCase()));

                    const activeAppointment = await prisma.appointment.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          ...(patient ? [{ patientId: patient.id }] : []),
                          { patient: { phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] } } }
                        ],
                        ...(matchedPt ? { patientId: matchedPt.id } : {}),
                        date: { gte: todayStart },
                        status: { in: ["SCHEDULED", "CONFIRMED"] }
                      },
                      include: { patient: true, practitioner: true },
                      orderBy: [{ updatedAt: 'desc' }, { date: 'asc' }]
                    });

                    if (activeAppointment && activeAppointment.startTime) {
                      const pDoc = activeAppointment.practitioner || practitioners.find(p => p.id === activeAppointment.practitionerId) || practitioners[0];
                      const card = formatAppointmentConfirmationCard({
                        patient: {
                          firstName: activeAppointment.patient?.firstName || patient?.firstName,
                          lastName: activeAppointment.patient?.lastName || patient?.lastName,
                          gender: activeAppointment.patient?.gender || patient?.gender,
                          dateOfBirth: activeAppointment.patient?.dateOfBirth
                        },
                        doctorName: pDoc?.name || doctorInfo?.name,
                        specialty: pDoc?.specialty || doctorInfo?.specialty || "General Physician",
                        clinicName: doctorInfo?.clinicName,
                        startTime: activeAppointment.startTime,
                        clinicTz: clinicTz,
                        consultationFee: pDoc?.consultationFee,
                        address: clinicAddress || doctorInfo?.address,
                        city: clinicAddress ? null : doctorInfo?.city,
                        mapsUrl: clinicMapsUri
                      });

                      finalAiReply = card;
                      await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, activeAppointment.patientId, activeAppointment.patient?.firstName || "Patient");
                      return;
                    }
                  } catch (cardErr) {
                    console.error("[WhatsAppManager] Resend Confirmation Card Error:", cardErr);
                  }
                }

                // 3. Intercept Patient Booking Tag (with Name, Age, Gender, and Doctor support)
                const bookingTagPattern = /\[(?:BOOK_APPOINTMENT|BOOK_NEW_APPOINTMENT):\s*([^\]]+)\]/i;
                let rawTagMatch = aiReply.match(bookingTagPattern);

                let fullTag = "";
                let dateStr = "";
                let sessionStr = "";
                let patientFullName = "";
                let rawAgeStr = "";
                let rawGenderStr = "";
                let rawDoctorName = "";

                if (rawTagMatch && !isStaff) {
                  fullTag = rawTagMatch[0];
                  const parts = rawTagMatch[1].split(',').map(s => s.trim());
                  dateStr = parts[0] || "";
                  sessionStr = extractAgreedTimeFromHistory(parts[1] || "", textMessage, conversationHistoryStrings);
                  patientFullName = sanitizePersonName(parts[2] || "");
                  rawAgeStr = parts[3] || "";
                  rawGenderStr = parts[4] || "";
                  rawDoctorName = parts[5] || "";

                  // If doctor name was accidentally placed in age or gender slot
                  if (!rawDoctorName) {
                    if (/^(dr\.?|doctor)\b/i.test(rawGenderStr) || practitioners.some(p => p.name.toLowerCase().includes(rawGenderStr.toLowerCase()))) {
                      rawDoctorName = rawGenderStr;
                      rawGenderStr = "";
                    } else if (/^(dr\.?|doctor)\b/i.test(rawAgeStr) || practitioners.some(p => p.name.toLowerCase().includes(rawAgeStr.toLowerCase()))) {
                      rawDoctorName = rawAgeStr;
                      rawAgeStr = "";
                    }
                  }
                } else if (!rawTagMatch && !isStaff) {
                  // Safety net: Check if the AI textually confirmed an appointment but the tag was omitted or malformed
                  const isExistingInquiry = /(?:send\s*(?:me\s*)?confirmation|when\s*is|kab\s*hai|status|already|is\s*(?:it|this)\s*confirm)/i.test(textMessage);
                  const isConfirmationReply = !isExistingInquiry && /(?:appointment\s*(?:is\s*)?confirm|slot\s*(?:is\s*)?confirm|request\s*note\s*kar\s*li|booked\s*(?:your\s*)?appointment|appointment\s*request\s*register|aapka\s*appointment\s*confirm|slot\s*reserve|booking\s*confirm)/i.test(aiReply);
                  if (isConfirmationReply) {
                    const clinicTzFallback = resolveClinicTimezone(doctorInfo?.timezone);
                    const todayStrFallback = getClinicDateOnlyString(new Date(), clinicTzFallback);
                    dateStr = todayStrFallback;
                    const combined = `${textMessage} ${aiReply}`.toLowerCase();
                    if (/\b(kal|tomorrow)\b/.test(combined)) {
                      const tm = new Date();
                      tm.setDate(tm.getDate() + 1);
                      dateStr = getClinicDateOnlyString(tm, clinicTzFallback);
                    } else if (/\b(parso|day after)\b/.test(combined)) {
                      const da = new Date();
                      da.setDate(da.getDate() + 2);
                      dateStr = getClinicDateOnlyString(da, clinicTzFallback);
                    }
                    const timeM = combined.match(/(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|baje)?)/i);
                    const rawFallbackSession = timeM ? timeM[1].replace(".", ":").trim() : (combined.includes("morning") ? "Morning" : "Evening");
                    sessionStr = extractAgreedTimeFromHistory(rawFallbackSession, textMessage, conversationHistoryStrings);
                    patientFullName = (patient?.firstName && patient.firstName !== "Patient") ? sanitizePersonName(`${patient.firstName} ${patient.lastName || ""}`) : "Patient";
                    fullTag = `[BOOK_APPOINTMENT: ${dateStr}, ${sessionStr}, ${patientFullName}]`;
                  }
                }

                if (fullTag && !isStaff) {
                  // PROXY / FAMILY MEMBER INTERCEPTOR:
                  // If patient says "apne papa ka", "father ke liye", "mummy ka" but no beneficiary name has been given yet,
                  // DO NOT confirm or book on the sender's existing profile!
                  const isProxyFamilyMessage = /\b(papa|father|pitaji|daddy|dad|mummy|mother|mataji|mom|wife|patni|husband|pati|beta|son|beti|daughter|brother|bhai|sister|behan|bhabhi)\b/i.test(textMessage);
                  const isBeneficiaryUnspecified = !patientFullName || 
                    patientFullName.toLowerCase() === "patient" || 
                    (patient?.firstName && patientFullName.toLowerCase() === patient.firstName.toLowerCase()) ||
                    /\b(papa|father|pitaji|daddy|dad|mummy|mother|mataji|mom|wife|patni|husband|pati|beta|son|beti|daughter|brother|bhai|sister|behan)\b/i.test(patientFullName);

                  if (isProxyFamilyMessage && isBeneficiaryUnspecified) {
                    const relation = textMessage.match(/\b(papa|father|pitaji|daddy|dad|mummy|mother|mataji|mom|wife|patni|husband|pati|beta|son|beti|daughter|brother|bhai|sister|behan)\b/i)?.[1]?.toLowerCase() || "family member";
                    const relationLabel = ["papa", "father", "pitaji", "dad", "daddy"].includes(relation) ? "father / papa" : relation;
                    console.log(`[WhatsAppManager] 🛑 Intercepted proxy family booking ("${textMessage}") without beneficiary name. Halting premature booking on sender's profile.`);
                    
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                    finalAiReply = `Ji bilkul! Kripya apne ${relationLabel} ji ka Full Name aur Age share kar dijiye taaki main unke naam se appointment register kar sakoon. 🙏`;
                    await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, patient?.id || null, patient?.firstName || "Patient");
                    return;
                  }

                  try {
                    const cleanPtDigitsBk = patientPhone.replace(/\D/g, '');
                    const last10Bk = cleanPtDigitsBk.length >= 10 ? cleanPtDigitsBk.slice(-10) : cleanPtDigitsBk;

                    // Bulletproof phone validation
                    if (cleanPtDigitsBk.length < 10) {
                      console.log(`[WhatsAppManager] 🛑 Booking halted: Patient phone has invalid length ("${patientPhone}").`);
                      return;
                    }

                    const nameParts = (patientFullName || "").trim().split(/\s+/);
                    const candidateFirstName = nameParts[0] || "";
                    const candidateLastName = nameParts.slice(1).join(" ") || "";

                    // Bulletproof name validation: do not create appointment if candidate name is empty, "Patient", too short, or a relation word
                    const isRelationWord = /^(papa|father|pitaji|daddy|dad|mummy|mother|mataji|mom|wife|patni|husband|pati|beta|son|beti|daughter|brother|bhai|sister|behan|bhabhi|chachi|chacha|uncle|aunt)$/i.test(candidateFirstName);
                    if (!candidateFirstName || candidateFirstName.toLowerCase() === "patient" || candidateFirstName.length < 2 || isRelationWord) {
                      console.log(`[WhatsAppManager] 🛑 Booking halted: Patient name is missing, generic, or relation word ("${candidateFirstName}").`);
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply = `Kripya patient ka Full Name aur Age share kar dijiye taaki main unke naam se appointment register kar sakoon. 🙏`;
                      await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, patient?.id || null, patient?.firstName || "Patient");
                      return;
                    }

                    // Clean age & calculate exact/approximate DOB
                    let exactDob: Date | null = null;
                    let parsedAge: number | null = null;

                    if (rawAgeStr) {
                      const cleanStr = rawAgeStr.trim();

                      // 1. Check for standard date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or DD Mon YYYY)
                      const dmyMatch = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
                      const ymdMatch = cleanStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
                      const textParsed = Date.parse(cleanStr);

                      if (dmyMatch) {
                        const day = parseInt(dmyMatch[1], 10);
                        const month = parseInt(dmyMatch[2], 10) - 1;
                        const year = parseInt(dmyMatch[3], 10);
                        const d = new Date(year, month, day);
                        if (!isNaN(d.getTime()) && d <= new Date()) {
                          exactDob = d;
                        }
                      } else if (ymdMatch) {
                        const year = parseInt(ymdMatch[1], 10);
                        const month = parseInt(ymdMatch[2], 10) - 1;
                        const day = parseInt(ymdMatch[3], 10);
                        const d = new Date(year, month, day);
                        if (!isNaN(d.getTime()) && d <= new Date()) {
                          exactDob = d;
                        }
                      } else if (!isNaN(textParsed) && !/^\d+$/.test(cleanStr)) {
                        const d = new Date(textParsed);
                        if (d <= new Date()) {
                          exactDob = d;
                        }
                      }

                      // 2. Check for age with units (e.g. "32 months", "18 days", "2 weeks", "4 yrs"):
                      if (!exactDob) {
                        const unitMatch = cleanStr.match(/(\d+)\s*(days?|d|weeks?|w|months?|m|years?|yrs?|y)?/i);
                        if (unitMatch) {
                          const val = parseInt(unitMatch[1], 10);
                          const unit = (unitMatch[2] || "").toLowerCase();
                          const now = new Date();

                          if (unit.startsWith("d")) {
                            exactDob = new Date(now.getTime() - val * 24 * 60 * 60 * 1000);
                          } else if (unit.startsWith("w")) {
                            exactDob = new Date(now.getTime() - val * 7 * 24 * 60 * 60 * 1000);
                          } else if (unit.startsWith("m")) {
                            const d = new Date();
                            d.setMonth(d.getMonth() - val);
                            exactDob = d;
                          } else {
                            parsedAge = val;
                            if (val > 0 && val < 125) {
                              exactDob = new Date(now.getFullYear() - val, now.getMonth(), now.getDate());
                            }
                          }
                        }
                      }
                    }

                    if (exactDob) {
                      parsedAge = Math.max(0, new Date().getFullYear() - exactDob.getFullYear());
                    }

                    if (!exactDob && !parsedAge) {
                      console.log(`[WhatsAppManager] 🛑 Booking halted: Patient DOB/Age is missing or null.`);
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply = `Kripya patient ki Date of Birth (DOB) ya Age share karein taaki main appointment booking process complete kar sakoon. 🙏`;
                      await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, patient?.id || null, patient?.firstName || "Patient");
                      return;
                    }

                    // Clean gender: enforce strict gender tokens and ensure doctor names are never parsed as gender
                    let parsedGender: string | null = null;
                    if (rawGenderStr) {
                      const gClean = rawGenderStr.trim().toLowerCase();
                      const isDoctorIdentifier = /^(dr\.?|doctor)\b/i.test(gClean) || practitioners.some(p => p.name.toLowerCase().includes(gClean));
                      if (!isDoctorIdentifier) {
                        if (/^(m|male|boy|man)$/i.test(gClean) || (/\bmale\b/i.test(gClean) && !/\bfemale\b/i.test(gClean))) {
                          parsedGender = "MALE";
                        } else if (/^(f|female|girl|woman|lady)$/i.test(gClean) || /\bfemale\b/i.test(gClean)) {
                          parsedGender = "FEMALE";
                        } else if (/^(o|other)$/i.test(gClean)) {
                          parsedGender = "OTHER";
                        }
                      } else if (!rawDoctorName) {
                        rawDoctorName = rawGenderStr;
                      }
                    }

                    const approximateDob = exactDob;

                    // 1. Resolve Family Member Identity: Match strictly by (phone + firstName) or secondary guardian phones
                    let targetPatient = await prisma.patient.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          { phone: patientPhone },
                          { phone: `+${patientPhone}` },
                          ...(last10Bk.length >= 10 ? [{ phone: { endsWith: last10Bk } }] : []),
                          { secondaryPhones: { has: patientPhone } },
                          { secondaryPhones: { has: `+${patientPhone}` } }
                        ],
                        firstName: { equals: candidateFirstName, mode: "insensitive" }
                      }
                    });

                    if (!targetPatient) {
                      // Check if existing patient on this phone is a virgin placeholder with zero history
                      let isVirginPlaceholder = false;
                      if (patient && patient.firstName === "Patient") {
                        const invCount = await prisma.invoice.count({ where: { patientId: patient.id } });
                        const aptCount = await prisma.appointment.count({ where: { patientId: patient.id } });
                        if (invCount === 0 && aptCount === 0) {
                          isVirginPlaceholder = true;
                        }
                      }

                      if (isVirginPlaceholder && patient) {
                        // Only an untouched blank lead can have its initial name set
                        targetPatient = await prisma.patient.update({
                          where: { id: patient.id },
                          data: {
                            firstName: candidateFirstName,
                            lastName: candidateLastName,
                            ...(parsedGender ? { gender: parsedGender } : {}),
                            ...(approximateDob ? { dateOfBirth: approximateDob } : {})
                          }
                        });
                        console.log(`[WhatsAppManager] Initialized placeholder lead to "${candidateFirstName} ${candidateLastName}" (${patientPhone})`);
                      } else {
                        // Enforce max 4 family members under the same mobile number
                        const existingFamilyCount = await prisma.patient.count({
                          where: {
                            doctorId,
                            OR: [
                              { phone: patientPhone },
                              { phone: `+${patientPhone}` },
                              ...(last10Bk.length >= 10 ? [{ phone: { endsWith: last10Bk } }] : [])
                            ]
                          }
                        });

                        if (existingFamilyCount >= 4) {
                          console.log(`[WhatsAppManager] 🛑 Maximum 4 family members reached for phone ${patientPhone}. Halting booking.`);
                          finalAiReply = finalAiReply.replace(fullTag, "").trim();
                          finalAiReply = `Is mobile number par already 4 family members registered hain. Naye patient ke liye kripya alag mobile number share karein ya clinic reception se sampark karein. 🙏`;
                          await this.sendOutboundPatientMessage(sock, doctorId, patientPhone, finalAiReply, patient?.id || null, patient?.firstName || "Patient");
                          return;
                        }

                        // A distinct family member is booking! Create a separate, dedicated profile
                        const defaultPractitioner = practitioners.find(p => p.isOwner) || practitioners[0];
                        targetPatient = await prisma.patient.create({
                          data: {
                            doctorId,
                            firstName: candidateFirstName,
                            lastName: candidateLastName,
                            phone: patientPhone,
                            gender: parsedGender,
                            dateOfBirth: approximateDob,
                            patientType: "ACTIVE",
                            primaryPractitionerId: defaultPractitioner?.id || null,
                            tags: ["WhatsApp", "Family Member"]
                          }
                        });
                        console.log(`[WhatsAppManager] 👨‍👩‍👧 Created separate Family Member profile: "${candidateFirstName} ${candidateLastName}" (${patientPhone})`);
                      }
                    } else {
                      // Target patient already exists: update ONLY missing optional fields — NEVER overwrite firstName or existing non-empty lastName!
                      const updates: any = {};
                      if (!targetPatient.gender && parsedGender) updates.gender = parsedGender;
                      if (!targetPatient.dateOfBirth && approximateDob) updates.dateOfBirth = approximateDob;
                      if (candidateLastName && (!targetPatient.lastName || targetPatient.lastName.trim() === "")) updates.lastName = candidateLastName;
                      if (Object.keys(updates).length > 0) {
                        targetPatient = await prisma.patient.update({
                          where: { id: targetPatient.id },
                          data: updates
                        });
                      }
                    }

                    // 2. Parse Date with intelligent fallback
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { startOfDay: today } = getClinicDayBounds(new Date(), clinicTz);

                    let appointmentDate = new Date(dateStr.trim());

                    if (isNaN(appointmentDate.getTime())) {
                      const cleanStr = dateStr.trim().toLowerCase();
                      if (cleanStr.includes("today") || cleanStr.includes("aaj")) {
                        appointmentDate = new Date(today);
                      } else if (cleanStr.includes("tomorrow") || cleanStr.includes("kal")) {
                        appointmentDate = new Date(today);
                        appointmentDate.setDate(appointmentDate.getDate() + 1);
                      } else if (cleanStr.includes("day after") || cleanStr.includes("parso")) {
                        appointmentDate = new Date(today);
                        appointmentDate.setDate(appointmentDate.getDate() + 2);
                      }
                    }
                    
                    if (!isNaN(appointmentDate.getTime()) && appointmentDate >= today) {
                      // Check daily quota for that date in clinic timezone
                      const { startOfDay: startOfBookingDay, endOfDay: endOfBookingDay } = getClinicDayBounds(appointmentDate, clinicTz);

                      const existingAiBookings = await prisma.appointment.count({
                        where: {
                          doctorId,
                          date: { gte: startOfBookingDay, lte: endOfBookingDay },
                          notes: { contains: "AI" }
                        }
                      });

                      const maxDaily = doctorInfo?.maxDailyAiBookings ?? 10;

                      if (maxDaily !== null && existingAiBookings >= maxDaily) {
                        finalAiReply = finalAiReply.replace(fullTag, "").trim();
                        finalAiReply += `\n\n*(Note: Our online WhatsApp slots for this date are fully reserved. For urgent consultations, direct walk-in consultations are available at the clinic reception.)*`;
                      } else {
                        const isMorning = sessionStr.toLowerCase().includes("morning");
                        const { hour, minute } = parseSessionOrTimeToHourMinute(sessionStr, isMorning ? 10 : 17, {
                          morningOpd: effectiveConfig?.morningOpd || doctorInfo?.workingHoursStart,
                          eveningOpd: effectiveConfig?.eveningOpd,
                          workingHoursStart: doctorInfo?.workingHoursStart
                        });

                        // 3. Construct Exact Clinic Timezone Timestamps
                        const { startTime, endTime, dbAppointmentDate, dateOnlyStr } = createClinicAppointmentDateTimes({
                          dateStr: appointmentDate,
                          hour,
                          minute,
                          durationMinutes: 60,
                          timezone: clinicTz
                        });

                        // Detect In-Clinic vs Tele-Consultation
                        const isTele = /tele|video|online|virtual|remote/i.test(`${sessionStr} ${textMessage} ${aiReply}`);
                        const appointmentType = isTele ? "TELE_CONSULTATION" : "IN_CLINIC";
                        const slotTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        let chosenPractitioner = null;

                        // 1. Check if doctor name was passed in the booking tag
                        if (rawDoctorName && rawDoctorName.trim()) {
                          const cleanDocTarget = rawDoctorName.trim().toLowerCase();
                          chosenPractitioner = practitioners.find(p => {
                            const pName = p.name.toLowerCase();
                            const pBare = pName.replace(/^dr\.?\s*/i, '');
                            return pName.includes(cleanDocTarget) || cleanDocTarget.includes(pBare);
                          }) || null;
                        }

                        // 2. If not specified in tag, check if any doctor is named in conversation or AI reply
                        if (!chosenPractitioner) {
                          const combinedText = `${aiReply} ${textMessage}`.toLowerCase();
                          chosenPractitioner = practitioners.find(p => {
                            const pName = p.name.toLowerCase();
                            const pBare = pName.replace(/^dr\.?\s*/i, '');
                            return combinedText.includes(pName) || (pBare.length > 3 && combinedText.includes(pBare));
                          }) || null;
                        }

                        // 3. Match by shift working hours (e.g. 10:00 AM -> Morning doctor; 18:00 -> Evening doctor)
                        const onDutyDoctor = practitioners.find(p => {
                          if (!p.workingHoursStart || !p.workingHoursEnd) return false;
                          return slotTimeStr >= p.workingHoursStart && slotTimeStr <= p.workingHoursEnd;
                        });

                        // If on-duty doctor is found and (no doctor chosen OR chosen doctor's shift doesn't match the slot time):
                        if (onDutyDoctor && (!chosenPractitioner || (chosenPractitioner.workingHoursStart && chosenPractitioner.workingHoursEnd && (slotTimeStr < chosenPractitioner.workingHoursStart || slotTimeStr > chosenPractitioner.workingHoursEnd)))) {
                          console.log(`[WhatsAppManager] 🕒 Slot time ${slotTimeStr} matches on-duty doctor ${onDutyDoctor.name} (replaces ${chosenPractitioner?.name || 'none'})`);
                          chosenPractitioner = onDutyDoctor;
                        }

                        if (!chosenPractitioner) {
                          chosenPractitioner = practitioners.find(p => p.isOwner) || practitioners[0];
                        }

                        // Check if this patient already has an active upcoming appointment
                        const activeAppointment = await prisma.appointment.findFirst({
                          where: {
                            patientId: targetPatient.id,
                            doctorId: doctorId,
                            date: { gte: today },
                            status: "CONFIRMED"
                          },
                          orderBy: { date: 'asc' }
                        });

                        if (activeAppointment) {
                          const isSameDate = getClinicDateOnlyString(activeAppointment.date, clinicTz) === dateOnlyStr;
                          const isSameTime = activeAppointment.startTime && Math.abs(activeAppointment.startTime.getTime() - startTime.getTime()) < 5 * 60 * 1000;

                          if (isSameDate && isSameTime) {
                            console.log(`[WhatsAppManager] ℹ️ Duplicate booking request for same slot ${dateOnlyStr} ${slotTimeStr}. Resending existing card.`);
                          } else {
                            // Patient is moving / re-booking to a new slot (e.g. after cancellation or slot change)
                            // Atomically update the existing appointment to the new slot in the database
                            await prisma.appointment.update({
                              where: { id: activeAppointment.id },
                              data: {
                                practitionerId: chosenPractitioner?.id || activeAppointment.practitionerId,
                                date: dbAppointmentDate,
                                startTime: startTime,
                                endTime: endTime,
                                status: "CONFIRMED",
                                notes: `${activeAppointment.notes || ""} [Shifted/Re-booked via WhatsApp to ${dateOnlyStr} ${sessionStr.trim()}]`.trim(),
                                type: appointmentType
                              }
                            });
                            console.log(`[WhatsAppManager] 🔄 Updated appointment ${activeAppointment.id} to new slot ${dateOnlyStr} ${slotTimeStr} for ${candidateFirstName} ${candidateLastName}`);
                          }
                        } else {
                          // Fresh appointment creation in CRM
                          await prisma.appointment.create({
                            data: {
                              patientId: targetPatient.id,
                              doctorId: doctorId,
                              practitionerId: chosenPractitioner?.id || null,
                              date: dbAppointmentDate,
                              startTime: startTime,
                              endTime: endTime,
                              status: "CONFIRMED",
                              notes: isTele 
                                ? `Booked via WhatsApp AI Assistant (Tele-Consultation / ${sessionStr.trim()})`
                                : `Booked via WhatsApp AI Assistant (${sessionStr.trim()})`,
                              type: appointmentType
                            }
                          });

                          console.log(`[WhatsAppManager] 📅 Successfully booked ${appointmentType} appointment for ${candidateFirstName} ${candidateLastName} with ${chosenPractitioner?.name || "Doctor"} (${patientPhone}) at ${dateOnlyStr} ${hour}:${minute} in ${clinicTz}`);
                        }

                        // If pediatric clinic, auto-initialize IAP vaccination schedule based on patient's DOB
                        if (targetPatient.dateOfBirth) {
                          const isPediatricDoctor = Boolean(
                            (doctorInfo?.specialty && /pediatric|child|infant|neonato|neonat/i.test(doctorInfo.specialty)) ||
                            (chosenPractitioner?.specialty && /pediatric|child|infant|neonato|neonat/i.test(chosenPractitioner.specialty))
                          );
                          if (isPediatricDoctor) {
                            VaccinationService.initializeScheduleForPatient(targetPatient.id, doctorId, targetPatient.dateOfBirth).catch(err => {
                              console.error("[WhatsAppManager] Failed to initialize IAP vaccine schedule:", err);
                            });
                          }
                        }

                        // Format patient confirmation card matching reference design
                        finalAiReply = formatAppointmentConfirmationCard({
                          patient: {
                            firstName: targetPatient.firstName,
                            lastName: targetPatient.lastName,
                            gender: targetPatient.gender,
                            age: parsedAge,
                            dateOfBirth: targetPatient.dateOfBirth
                          },
                          doctorName: chosenPractitioner?.name || doctorInfo?.name,
                          specialty: chosenPractitioner?.specialty || doctorInfo?.specialty || "General Physician",
                          clinicName: doctorInfo?.clinicName,
                          startTime: startTime,
                          clinicTz: clinicTz,
                          consultationFee: chosenPractitioner?.consultationFee,
                          isTele: isTele,
                          address: clinicAddress || doctorInfo?.address,
                          city: clinicAddress ? null : doctorInfo?.city,
                          mapsUrl: clinicMapsUri
                        });

                        // Notify Doctor on WhatsApp with AI Receptionist Name & Patient Demographics
                        if (doctorInfo?.phone) {
                          const aiConfig = await prisma.aIAgentConfig.findUnique({
                            where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } }
                          });
                          const rawCfg = (aiConfig?.config as any) || {};
                          const assistantName = rawCfg.assistantName || "Riya";

                          const ageLabel = parsedAge ? `Age: ${parsedAge}` : "";
                          const genderLabel = parsedGender ? (parsedGender === "MALE" ? "Male" : (parsedGender === "FEMALE" ? "Female" : parsedGender)) : "";
                          const demoBadgeParts = [ageLabel, genderLabel].filter(Boolean).join(", ");
                          const demoBadge = demoBadgeParts ? ` (${demoBadgeParts})` : "";

                          const docPhoneClean = doctorInfo.phone.replace(/\D/g, '');
                          const dateLabel = dbAppointmentDate.toLocaleDateString('en-IN', { timeZone: clinicTz, weekday: 'short', day: 'numeric', month: 'short' });
                          const timeLabel = startTime.toLocaleTimeString('en-IN', { timeZone: clinicTz, hour: '2-digit', minute: '2-digit' });
                          const cleanPtName = `${candidateFirstName} ${candidateLastName}`.trim();
                          const bookedDoctorLabel = formatDoctorDisplayName(chosenPractitioner?.name || doctorInfo?.name);
                          
                          const actionTitle = activeAppointment ? "Patient Appointment Updated / Shifted" : "New Appointment booked";
                          const docAlert = `🔔 *${actionTitle} by your AI Receptionist ${assistantName} (${isTele ? "🌐 Video Tele-Consult" : "🏥 In-Clinic Visit"})*\n\n👤 Patient: *${cleanPtName}*${demoBadge} (${patientPhone})\n👨‍⚕️ Doctor: *${bookedDoctorLabel}* (${chosenPractitioner?.specialty || "General"})\n📅 Slot: *${dateLabel} at ${timeLabel}* (${sessionStr.trim()})\n\n✨ This appointment has been ${activeAppointment ? "updated in" : "added to"} your Gyrex calendar.`;
                          await this.sendOutboundPatientMessage(sock, doctorId, docPhoneClean, docAlert).catch(() => {});
                        }
                      }
                    } else {
                      // Invalid date
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += "\n\n*(Note: There was an issue processing the requested date. Please call the clinic to finalize your slot.)*";
                    }
                  } catch (e) {
                    console.error("[WhatsAppManager] Agentic Booking Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                  }
                }

                // Process [RECORD_CHILD_DOB_AND_VACCINES: ChildName, YYYY-MM-DD]
                const recordDobMatch = finalAiReply.match(/\[RECORD_CHILD_DOB_AND_VACCINES:\s*([^,\]]+),\s*([^\]]+)\]/i);
                if (recordDobMatch) {
                  const rawChildName = recordDobMatch[1].trim();
                  const rawDobStr = recordDobMatch[2].trim();
                  finalAiReply = finalAiReply.replace(recordDobMatch[0], "").trim();

                  try {
                    const parsedDob = new Date(rawDobStr);
                    if (!isNaN(parsedDob.getTime())) {
                      const familyPts = await prisma.patient.findMany({
                        where: {
                          doctorId,
                          phone: { contains: patientPhone.slice(-10) }
                        }
                      });

                      let targetPt = familyPts.find(p => {
                        const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
                        return rawChildName.toLowerCase().split(/\s+/).some(part => part.length > 2 && fullName.includes(part));
                      });

                      if (!targetPt && familyPts.length === 1) {
                        targetPt = familyPts[0];
                      }

                      if (targetPt) {
                        await prisma.patient.update({
                          where: { id: targetPt.id },
                          data: { dateOfBirth: parsedDob }
                        });
                        await VaccinationService.initializeScheduleForPatient(targetPt.id, doctorId, parsedDob);
                        console.log(`[WhatsAppManager] 💉 Recorded DOB ${rawDobStr} and initialized vaccine schedule for ${targetPt.firstName} ${targetPt.lastName} (${targetPt.id})`);
                      }
                    }
                  } catch (vErr) {
                    console.error("[WhatsAppManager] Error processing RECORD_CHILD_DOB_AND_VACCINES:", vErr);
                  }
                }

                // Process [OPT_IN_VACCINATION_REMINDERS: ChildName]
                const optInMatch = finalAiReply.match(/\[OPT_IN_VACCINATION_REMINDERS:\s*([^\]]+)\]/i);
                if (optInMatch) {
                  const rawChildName = optInMatch[1].trim();
                  finalAiReply = finalAiReply.replace(optInMatch[0], "").trim();

                  try {
                    const familyPts = await prisma.patient.findMany({
                      where: {
                        doctorId,
                        phone: { contains: patientPhone.slice(-10) }
                      }
                    });

                    let targetPt = familyPts.find(p => {
                      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
                      return rawChildName.toLowerCase().split(/\s+/).some(part => part.length > 2 && fullName.includes(part));
                    });

                    if (!targetPt && familyPts.length === 1) {
                      targetPt = familyPts[0];
                    }

                    if (targetPt) {
                      await prisma.patient.update({
                        where: { id: targetPt.id },
                        data: { vaccinationOptOut: false }
                      });
                      console.log(`[WhatsAppManager] 🔔 Opted in vaccination reminders for ${targetPt.firstName} ${targetPt.lastName} (${targetPt.id})`);
                    }
                  } catch (optErr) {
                    console.error("[WhatsAppManager] Error processing OPT_IN_VACCINATION_REMINDERS:", optErr);
                  }
                }

                // Send reply via Baileys
                // Strip any stray internal AI action tags before sending to doctor or patient
                finalAiReply = finalAiReply.replace(/\[(RESCHEDULE_APPOINTMENT|CANCEL_APPOINTMENT|CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|BOOK_NEW_APPOINTMENT|MESSAGE_PATIENT|BOOK_APPOINTMENT|RESEND_CONFIRMATION|RECORD_CHILD_DOB_AND_VACCINES|OPT_IN_VACCINATION_REMINDERS)(?::.*?)?\]/gi, "").trim();
                await sock.sendMessage(remoteJid, { text: finalAiReply });
                
                // Create OUTGOING ChatMessage
                await prisma.chatMessage.create({
                  data: {
                    conversationId: conversation.id,
                    direction: "OUTGOING",
                    messageType: "text",
                    content: finalAiReply,
                    senderName: "AI Assistant",
                    createdAt: messageDate,
                  }
                });
                
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: messageDate }
                });

                this.recordAiReply(doctorId, patientPhone);
              }
            }
          } catch (err: any) {
            console.error(`[WhatsAppManager] Error processing message:`, err);
            logSystemError(err, {
              path: 'whatsapp-manager:messages.upsert',
              method: 'WA_MESSAGE_PROCESSING_ERROR',
              metadata: { doctorId, remoteJid, textMessage }
            });
          }
        }
      }
    });
    } catch (err: any) {
      console.error(`[WhatsAppManager] Unhandled error during connect for ${doctorId}:`, err);
      this.connectingDoctors.delete(doctorId);
      logSystemError(err, {
        path: 'whatsapp-manager:connect',
        method: 'WA_CONNECTION_ERROR',
        metadata: { doctorId }
      });
    }
  }

  getQR(doctorId: string): string | null {
    return this.qrCodes.get(doctorId) || null;
  }

  isConnected(doctorId: string): boolean {
    const sock = this.sockets.get(doctorId);
    return !!sock && this.activeConnections.has(doctorId) && !this.qrCodes.has(doctorId);
  }

  isConnecting(doctorId: string): boolean {
    return this.connectingDoctors.has(doctorId);
  }

  isWarmingUp(doctorId: string): boolean {
    const opened = this.connectionOpenAt.get(doctorId);
    if (!opened) return false;
    return Date.now() - opened < 10000; // 10s quiet period
  }

  getConnectionStatus(doctorId: string): {
    status: 'CONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'DISCONNECTED';
    qr: string | null;
    hasSavedSession: boolean;
    retryCount: number;
  } {
    const isConn = this.isConnected(doctorId);
    if (isConn) {
      return { status: 'CONNECTED', qr: null, hasSavedSession: true, retryCount: 0 };
    }

    const qrStr = this.getQR(doctorId);
    if (qrStr) {
      return { status: 'SCAN_QR', qr: qrStr, hasSavedSession: false, retryCount: this.reconnectAttempts.get(doctorId) || 0 };
    }

    if (this.connectingDoctors.has(doctorId)) {
      return {
        status: 'CONNECTING',
        qr: null,
        hasSavedSession: this.hasSavedSession(doctorId),
        retryCount: this.reconnectAttempts.get(doctorId) || 0,
      };
    }

    return {
      status: 'DISCONNECTED',
      qr: null,
      hasSavedSession: this.hasSavedSession(doctorId),
      retryCount: this.reconnectAttempts.get(doctorId) || 0,
    };
  }

  hasSavedSession(doctorId: string): boolean {
    const sessionDir = getDoctorSessionDir(doctorId);
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credsPath)) return false;
    try {
      const credsRaw = fs.readFileSync(credsPath, 'utf8');
      const parsed = JSON.parse(credsRaw);
      return Boolean(parsed?.registered || parsed?.me);
    } catch (_) {
      return false;
    }
  }

  async logout(doctorId: string) {
    this.clearSession(doctorId);
  }

  // Helper to send outbound messages manually (from inbox or campaigns)
  async sendMessage(doctorId: string, phone: string, text: string, senderName: string = "Clinic AI") {
    const sock = this.sockets.get(doctorId);
    if (!sock || !this.activeConnections.has(doctorId)) {
      const err = new Error("WhatsApp is not connected or device is logged out. Please connect your device in WhatsApp Settings.");
      logSystemError(err, {
        path: 'whatsapp-manager:sendMessage',
        method: 'WA_SEND_FAILED',
        metadata: { doctorId, phone }
      });
      throw err;
    }
    
    const cleanPhone = this.normalizePhone(phone);
    if (!cleanPhone) throw new Error("Invalid patient phone number");

    let jid = `${cleanPhone}@s.whatsapp.net`;
    try {
      const results = await sock.onWhatsApp(cleanPhone);
      if (results && results.length > 0 && results[0]?.jid) {
        jid = results[0].jid;
      }
    } catch (e) {
      console.warn(`[WhatsAppManager] onWhatsApp verification warning for ${cleanPhone}:`, e);
    }

    // 1. Anti-Ban Guard: Enforce 10s quiet warm-up period after connection opens
    if (this.isWarmingUp(doctorId)) {
      console.log(`[WhatsAppManager] Device for ${doctorId} is in 10s post-connect warm-up. Pausing outbound message briefly.`);
      await new Promise(res => setTimeout(res, 4000));
    }

    // 2. Anti-Ban Guard: Human jitter and pacing (minimum 3s between messages per doctor)
    const now = Date.now();
    const lastSent = this.lastMessageSentAt.get(doctorId) || 0;
    if (now - lastSent < 3000) {
      const jitter = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s jitter
      await new Promise(res => setTimeout(res, jitter));
    }
    this.lastMessageSentAt.set(doctorId, Date.now());

    const sent = await sock.sendMessage(jid, { text, linkPreview: null } as any);
    if (!sent) {
      const err = new Error("Failed to deliver message via WhatsApp. Please check WhatsApp connection status.");
      logSystemError(err, {
        path: 'whatsapp-manager:sendMessage',
        method: 'WA_SEND_FAILED',
        metadata: { doctorId, phone: cleanPhone }
      });
      throw err;
    }

    // Ensure Conversation & ChatMessage are recorded in WhatsApp CRM
    let createdMessage: any = null;
    try {
      const last10Out = cleanPhone.slice(-10);
      let conversation = await prisma.conversation.findFirst({
        where: {
          doctorId,
          OR: [
            { patientPhone: cleanPhone },
            { patientPhone: last10Out },
            { patientPhone: { endsWith: last10Out } }
          ]
        }
      });

      // Extract exact message timestamp from WhatsApp sent response
      let sentDate = new Date();
      if (sent && (sent as any).messageTimestamp) {
        const ts = Number((sent as any).messageTimestamp);
        if (ts > 0) sentDate = new Date(ts * 1000);
      }

      if (!conversation) {
        const pt = await prisma.patient.findFirst({
          where: {
            doctorId,
            OR: [
              { phone: cleanPhone },
              { phone: `+${cleanPhone}` },
              { phone: { endsWith: cleanPhone.slice(-10) } }
            ]
          }
        });
        const ptName = pt ? `${pt.firstName} ${pt.lastName}`.trim() : `Patient +${cleanPhone}`;

        conversation = await prisma.conversation.create({
          data: {
            doctorId,
            patientPhone: cleanPhone,
            patientName: ptName,
            patientId: pt?.id || null,
            status: "OPEN",
            lastMessageAt: sentDate,
            createdAt: sentDate,
          }
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: sentDate, status: "OPEN" }
        });
      }

      createdMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "OUTGOING",
          messageType: "text",
          content: text,
          senderName,
          createdAt: sentDate,
        }
      });
    } catch (crmErr) {
      console.warn(`[WhatsAppManager] Failed to record outbound message to CRM database for ${cleanPhone}:`, crmErr);
    }

    return { cleanPhone, message: createdMessage };
  }

  async sendDocument(doctorId: string, phone: string, buffer: Buffer, fileName: string, caption?: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock) throw new Error("WhatsApp not connected for this doctor");
    
    const cleanPhone = this.normalizePhone(phone);
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { 
      document: buffer, 
      mimetype: 'application/pdf', 
      fileName: fileName,
      caption: caption 
    });

    let sentDate = new Date();
    if (sent && (sent as any).messageTimestamp) {
      const ts = Number((sent as any).messageTimestamp);
      if (ts > 0) sentDate = new Date(ts * 1000);
    }

    return { cleanPhone, sentDate };
  }

  async sendImage(doctorId: string, phone: string, buffer: Buffer, caption?: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock) throw new Error("WhatsApp not connected for this doctor");
    
    const cleanPhone = this.normalizePhone(phone);
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { 
      image: buffer, 
      caption: caption 
    });

    let sentDate = new Date();
    if (sent && (sent as any).messageTimestamp) {
      const ts = Number((sent as any).messageTimestamp);
      if (ts > 0) sentDate = new Date(ts * 1000);
    }

    return { cleanPhone, sentDate };
  }

  // Auto-connect all saved sessions on boot
  async autoConnectAll() {
    const authDir = getAuthBaseDir();
    if (!fs.existsSync(authDir)) return;
    
    const dirs = fs.readdirSync(authDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const doctorId = dir.name;
        // Check if it has creds.json to ensure it's a valid session
        if (fs.existsSync(path.join(authDir, doctorId, 'creds.json'))) {
          if (!this.isConnected(doctorId) && !this.connectingDoctors.has(doctorId)) {
            console.log(`[WhatsAppManager] Auto-connecting saved session for ${doctorId}`);
            this.connect(doctorId).catch(console.error);
          }
        }
      }
    }
  }

  // Persistent 24/7 background watchdog to auto-heal and maintain all WhatsApp connections
  startWatchdog() {
    if (this.watchdogTimer) return;
    console.log('[WhatsAppManager] Starting 24/7 WhatsApp Watchdog heartbeat runner...');

    const runWatchdogSweep = async () => {
      try {
        const authDir = getAuthBaseDir();
        if (!fs.existsSync(authDir)) return;

        const dirs = fs.readdirSync(authDir, { withFileTypes: true });
        for (const dir of dirs) {
          if (dir.isDirectory()) {
            const doctorId = dir.name;
            const credsPath = path.join(authDir, doctorId, 'creds.json');

            if (fs.existsSync(credsPath)) {
              // Only auto-revive verified, registered sessions — NEVER revive uncompleted QR pairing attempts
              try {
                const credsRaw = fs.readFileSync(credsPath, "utf8");
                const parsedCreds = JSON.parse(credsRaw);
                const isRegistered = Boolean(parsedCreds?.registered || parsedCreds?.me);
                if (!isRegistered) {
                  // Unfinished QR pairing left on disk, do not auto-revive
                  continue;
                }
              } catch (_) {
                // Unreadable or corrupted creds, skip
                continue;
              }

              const isConnected = this.isConnected(doctorId);
              const isConnecting = this.connectingDoctors.has(doctorId);

              if (!isConnected && !isConnecting) {
                console.log(`[WhatsAppManager Watchdog] Verified session exists for ${doctorId} but socket is inactive. Reviving connection...`);
                this.connect(doctorId).catch(e => console.error(`[WhatsAppManager Watchdog] Failed to auto-revive ${doctorId}:`, e));
              }
            }
          }
        }
      } catch (err) {
        console.error('[WhatsAppManager Watchdog] Error during sweep:', err);
      }
    };

        // Run every 30 seconds
    this.watchdogTimer = setInterval(runWatchdogSweep, 30000);
    // Initial sweep after 5 seconds
    setTimeout(runWatchdogSweep, 5000);

    // Autonomous Background Automations Runner (24h/2h Reminders, 45-90m Review Surveys)
    const runAutonomousAutomations = async () => {
      try {
        // 1. Evaluate and send 24h & 2h pre-appointment reminders
        const { ReminderService } = await import("@/services/reminder.service");
        const reminderService = new ReminderService();
        await reminderService.sendAppointmentReminders().catch(e => console.error('[Autonomous Reminders Error]:', e));

        // 2. Evaluate completed consultations for 45-90m feedback surveys & Google Reviews
        const { ReviewDispatcherService } = await import("@/services/review-dispatcher.service");
        await ReviewDispatcherService.evaluateAppointments().catch(e => console.error('[Autonomous Review Surveys Error]:', e));
      } catch (autoErr) {
        console.error('[WhatsAppManager Autonomous Automations Error]:', autoErr);
      }
    };

    // Run automations every 3 minutes (180,000 ms)
    setInterval(runAutonomousAutomations, 180000);
    // Initial automation sweep 10 seconds after server start
    setTimeout(runAutonomousAutomations, 10000);
  }

  // Helper to check if any sockets exist
  hasAnyConnection(): boolean {
    return this.sockets.size > 0;
  }
}

// Global singleton to survive Next.js hot reloads in dev
declare global {
  var _whatsappManager: WhatsAppManager | undefined;
}

const manager = global._whatsappManager || new WhatsAppManager();
if (process.env.NODE_ENV !== "production") {
  global._whatsappManager = manager;
}

// Auto-connect and start watchdog on start
manager.autoConnectAll();
manager.startWatchdog();

export const whatsappManager = manager;

