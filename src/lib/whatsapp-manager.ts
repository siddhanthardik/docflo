import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { resolveGoogleReviewLink } from '@/services/review-dispatcher.service';
import { PlatformWhatsAppConciergeService } from '@/services/platform-whatsapp-concierge.service';
import { formatDoctorDisplayName } from '@/services/ai-agents.service';
import { logSystemError } from '@/lib/logger';
import {
  createClinicAppointmentDateTimes,
  getClinicDayBounds,
  parseSessionOrTimeToHourMinute,
  resolveClinicTimezone,
  formatInClinicTime,
  formatInClinicDate,
  getClinicDateOnlyString
} from '@/lib/timezone';

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
      await sock.sendMessage(patientJid, { text });
      console.log(`[WhatsAppManager] 📤 Outbound WhatsApp sent to ${patientJid}`);

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
            lastMessageAt: new Date(),
          }
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            status: "OPEN",
            ...(patientName ? { patientName } : {}),
            ...(patientId ? { patientId } : {})
          }
        });
      }

      // Record outbound chat message in CRM
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "OUTGOING",
          messageType: "text",
          content: text,
          senderName: "AI Assistant",
        }
      });

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
        auth: state,
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
          const isPermanentLogout = !isSuperAdmin && statusCode === DisconnectReason.loggedOut;
          const shouldReconnect = isSuperAdmin || !isPermanentLogout;
          
          console.log(`[WhatsAppManager] Connection closed for verified session ${doctorId}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect} (isSuperAdmin: ${isSuperAdmin})`);
          
          if (shouldReconnect) {
            const currentAttempts = (this.reconnectAttempts.get(doctorId) || 0) + 1;

            // Strict Anti-Ban Cap: Max 3 retries (down from 10) to protect account from Meta bot detection
            const MAX_RETRIES = 3;
            if (currentAttempts > MAX_RETRIES) {
              console.warn(`[WhatsAppManager] Maximum reconnection attempts (${MAX_RETRIES}) reached for ${doctorId}. Halting auto-reconnect to protect account.`);
              this.reconnectAttempts.delete(doctorId);

              logSystemError(new Error(`WhatsApp max reconnection attempts reached for ${doctorId}`), {
                path: 'whatsapp-manager:reconnect',
                method: 'MAX_RECONNECT_EXCEEDED',
                metadata: { doctorId, statusCode }
              });

              if (!isSuperAdmin) {
                prisma.notification.create({
                  data: {
                    doctorId,
                    title: "WhatsApp Connection Paused ⚠️",
                    message: "Unable to reach WhatsApp after 3 attempts. Auto-reconnection paused to protect your account. Please verify phone internet and click Reconnect in Settings.",
                    type: "WARNING",
                    actionUrl: "/settings/whatsapp",
                  }
                }).catch(() => {});
              }
              return;
            }

            this.reconnectAttempts.set(doctorId, currentAttempts);

            // Humane Anti-Ban Backoff: Attempt 1: 15s | Attempt 2: 45s | Attempt 3: 90s
            const backoffSchedule = [15000, 45000, 90000];
            const delay = backoffSchedule[currentAttempts - 1] || 90000;

            console.log(`[WhatsAppManager] Scheduling humane auto-reconnect for ${doctorId} (attempt #${currentAttempts}/${MAX_RETRIES}) in ${Math.round(delay / 1000)}s...`);
            
            setTimeout(() => {
              this.connect(doctorId, { force: true }).catch(e => console.error(`[WhatsAppManager] Auto-reconnect failed for ${doctorId}:`, e));
            }, delay);
          } else {
            // Terminal failure for clinic doctor (explicitly logged out on mobile phone)
            console.log(`[WhatsAppManager] Terminal auth failure for ${doctorId} (code ${statusCode}). Purging session on disk.`);
            this.clearSession(doctorId);
            
            logSystemError(new Error(`WhatsApp terminal auth failure (code ${statusCode}) for doctor ${doctorId}`), {
              path: 'whatsapp-manager:connection',
              method: 'WA_TERMINAL_AUTH_FAILURE',
              metadata: { doctorId, statusCode }
            });

            prisma.notification.create({
              data: {
                doctorId,
                title: "WhatsApp Business Disconnected ⚠️",
                message: "Your WhatsApp Business device has been disconnected. Please scan the QR code in Settings to reconnect.",
                type: "ERROR",
                actionUrl: "/settings/whatsapp",
              }
            }).catch(err => console.error(`[WhatsAppManager] Failed to create notification:`, err));
          }
        } else if (connection === 'open') {
          console.log(`[WhatsAppManager] Connection OPEN and verified for session ${doctorId}`);
          this.sockets.set(doctorId, sock);
          this.qrCodes.delete(doctorId);
          this.connectingDoctors.delete(doctorId);
          this.activeConnections.add(doctorId);
          this.reconnectAttempts.delete(doctorId);
          this.connectionOpenAt.set(doctorId, Date.now()); // Start 10s warm-up timer
        }
      });

      sock.ev.on('messages.upsert', async (m) => {
      console.log(`[WhatsAppManager] Raw upsert type: ${m.type}, messages count: ${m.messages.length}`);
      
      // Ignore outgoing messages or updates
      if (m.type !== 'notify') return;
      
      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

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
            const clinicAddress = gbpInsights?.formattedAddress as string | null ?? null;
            const clinicMapsUri = gbpInsights?.mapsUri as string | null ?? null;

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
              const pushNameRaw = (msg.pushName || "").trim();
              const hasValidPushName = pushNameRaw && pushNameRaw.toLowerCase() !== "patient" && !pushNameRaw.startsWith("+") && !/whatsapp/i.test(pushNameRaw);

              if (!patient) {
                const parts = hasValidPushName ? pushNameRaw.split(" ") : ["Patient", `+${patientPhone}`];
                patient = await prisma.patient.create({
                  data: {
                    doctorId,
                    firstName: parts[0] || "Patient",
                    lastName: parts.slice(1).join(" ") || `+${patientPhone}`,
                    phone: patientPhone,
                    patientType: "ACTIVE",
                    tags: ["WhatsApp"]
                  }
                });
                console.log(`[WhatsAppManager] Auto-created new CRM patient for ${patientPhone}: ${patient.firstName} ${patient.lastName}`);
              } else if (patient.firstName === "Patient" && hasValidPushName) {
                const parts = pushNameRaw.split(" ");
                patient = await prisma.patient.update({
                  where: { id: patient.id },
                  data: {
                    firstName: parts[0] || "Patient",
                    lastName: parts.slice(1).join(" ") || ""
                  }
                });
              }

              // Also check if text message explicitly starts with name (e.g. "Saroj Kumari.. tumi ki...")
              if (patient && patient.firstName === "Patient" && textMessage) {
                const nameIntroMatch = textMessage.match(/^(?:my name is|mera naam|naam|i am|this is)?\s*([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)/);
                if (nameIntroMatch && nameIntroMatch[1]) {
                  const extractedName = nameIntroMatch[1].trim();
                  const nameParts = extractedName.split(" ");
                  if (nameParts[0] && !/^(appointment|doctor|clinic|please|hello|namaste|thanks|good)/i.test(nameParts[0])) {
                    patient = await prisma.patient.update({
                      where: { id: patient.id },
                      data: {
                        firstName: nameParts[0],
                        lastName: nameParts.slice(1).join(" ") || ""
                      }
                    });
                  }
                }
              }

              if (patient && patient.isBlocked) {
                console.log(`[WhatsAppManager] Ignored message from BLOCKED patient ${patientPhone}`);
                continue; // Skip processing
              }
            }

            const patientName = isStaff ? (staffName ? `${staffName} (Doctor/Staff)` : "Clinic Staff/Doctor") : `${patient!.firstName} ${patient!.lastName}`.trim();

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
                }
              });
            } else {
              const updatedData: any = {
                lastMessageAt: new Date(), 
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

            // Create ChatMessage
            await prisma.chatMessage.create({
              data: {
                conversationId: conversation.id,
                direction: "INCOMING",
                messageType: "text",
                content: textMessage,
                senderName: patientName,
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
                    data: { conversationId: conversation.id, direction: "OUTGOING", messageType: "text", content: replyText, senderName: "Clinic" }
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
                  data: { conversationId: conversation.id, direction: "OUTGOING", messageType: "text", content: replyText, senderName: "Clinic" }
                });
                
                // Alert Clinic Owner via an internal note
                await prisma.chatMessage.create({
                  data: { conversationId: conversation.id, direction: "INTERNAL_NOTE", messageType: "text", content: "🚨 ALERT: Patient expressed dissatisfaction with their recent consultation.", senderName: "System" }
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
                  }
                });

                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: new Date() }
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
              const { AIAgentsService } = await import('@/services/ai-agents.service');
              
              const recentMessages = await prisma.chatMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: "desc" },
                take: 10,
              });

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
                            ]
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
                        const ptMsg = `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                        await this.sendOutboundPatientMessage(sock, doctorId, phoneDigits, ptMsg, newPatient.id, patientName);

                        const confirmMsg = `Done, Doctor! I have created a new patient profile for *${patientName}* and booked their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation has been sent to them.`;
                        await sock.sendMessage(remoteJid, { text: confirmMsg });
                        await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                        await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                            const ptMsg = `Hi ${selectedPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                            await this.sendOutboundPatientMessage(sock, doctorId, selectedPatient.phone, ptMsg, selectedPatient.id, `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim());
                          }
                         const confirmMsg = `Confirmed, Doctor! I have booked the appointment for *${selectedPatient.firstName} ${selectedPatient.lastName}* on ${dateLabel} at ${timeLabel} and sent them a WhatsApp confirmation.`;
                         await sock.sendMessage(remoteJid, { text: confirmMsg });
                         await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                         await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                            ]
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
                        await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                        await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                                const newTimeStr = newStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                                const msg = `⚠️ *OPD Timing Update*\n\nHi ${apt.patient.firstName}, ${docName} is currently running approx *${delay} minutes late* due to urgent hospital procedures. Your appointment is now scheduled for *${newTimeStr}* today. Thank you for your patience! 😊`;
                                await this.sendOutboundPatientMessage(sock, doctorId, apt.patient.phone, msg, apt.patient.id, `${apt.patient.firstName} ${apt.patient.lastName}`.trim());
                                count++;
                              }
                            }
                          }

                          const confirmMsg = `✅ Confirmed, Doctor! Your OPD schedule has been delayed by *${delay} minutes* in Gyrex, and WhatsApp delay notifications have been dispatched to *${count} booked patients*.`;
                          await sock.sendMessage(remoteJid, { text: confirmMsg });
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                          await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                          await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                      await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: abortMsg, senderName: 'AI Assistant' } });
                      await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
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
                  await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: resumeMsg, senderName: 'AI Assistant' } });
                  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
                  return;
                }

                if (delayMatch || isCancelToday || isPauseToday) {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const todayEnd = new Date(todayStart);
                  todayEnd.setHours(23, 59, 59, 999);

                  const todayApts = await prisma.appointment.findMany({
                    where: {
                      doctorId,
                      date: { gte: todayStart, lte: todayEnd },
                      status: "CONFIRMED"
                    },
                    include: { patient: true },
                    orderBy: { startTime: 'asc' }
                  });

                  if (delayMatch) {
                    let mins = parseInt(delayMatch[1]);
                    if (/hr|hour/i.test(delayMatch[0])) mins = mins * 60;

                    const summaryLines = todayApts.map((a, i) => {
                      const orig = a.startTime ? a.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      const newT = a.startTime ? new Date(a.startTime.getTime() + mins * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
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
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant' } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
                    return;
                  } else if (isCancelToday) {
                    this.pendingIntents.set(patientPhone, {
                      type: 'AWAITING_SCHEDULE_CONFIRMATION',
                      action: 'CANCEL',
                      impactedAptIds: todayApts.map(a => a.id)
                    });

                    const msg = `⚠️ *Emergency OPD Cancellation Request*\n\nDoctor, you have *${todayApts.length} confirmed appointments* booked for today.\n\nShould I mark today's OPD as Emergency Cancelled, update their status in Gyrex, and send polite cancellation/reschedule messages to all ${todayApts.length} patients?\n\n👉 Reply *1* or *CONFIRM* to proceed.\n👉 Reply *2* or *NO* to keep appointments unchanged.`;
                    await sock.sendMessage(remoteJid, { text: msg });
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant' } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
                    return;
                  } else if (isPauseToday) {
                    this.pendingIntents.set(patientPhone, {
                      type: 'AWAITING_SCHEDULE_CONFIRMATION',
                      action: 'PAUSE',
                      impactedAptIds: todayApts.map(a => a.id)
                    });

                    const msg = `Doctor, I received your request to *PAUSE new WhatsApp bookings for today*.\n\n• Existing booked appointments (${todayApts.length}) will remain valid and active.\n• New inquiring patients will be offered tomorrow's slots or clinic walk-in tokens.\n\n👉 Reply *1* or *CONFIRM* to pause today's bookings.\n👉 Reply *2* or *NO* to keep bookings open.`;
                    await sock.sendMessage(remoteJid, { text: msg });
                    await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: msg, senderName: 'AI Assistant' } });
                    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
                    return;
                  }
                }

                const history = recentMessages.reverse().map(rm => 
                  `${rm.direction === "INCOMING" ? "Staff" : "Assistant"}: ${rm.content}`
                );

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                
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
                const history = recentMessages.reverse().map(rm => 
                  `${rm.direction === "INCOMING" ? "Patient" : "Clinic"}: ${rm.content}`
                );

                const clinicPhone = doctorInfo?.phone || "";

                // Calculate Live Schedule Context & Daily Quota
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(todayStart);
                todayEnd.setHours(23, 59, 59, 999);

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
                  .map(a => a.startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));

                // ── Auto-Reset Stale OPD Status from Previous Days ──
                const nowClinic = new Date();
                const todayClinicDateStr = nowClinic.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
                const statusUpdatedDateStr = doctorInfo?.opdStatusUpdatedAt
                  ? new Date(doctorInfo.opdStatusUpdatedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
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

                const scheduleContext = {
                  opdStatus: effectiveOpdStatus,
                  opdDelayMinutes: effectiveOpdDelay,
                  opdStatusNote: effectiveOpdNote,
                  maxDailyAiBookings: maxDaily,
                  todayAiCount,
                  isTodayQuotaFull,
                  bookedSlotsToday,
                  pacingStrategy: doctorInfo?.aiSlotPacing || "STAGGERED"
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
                  scheduleContext
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
                          const docName = formatDoctorDisplayName(doctorInfo?.name);
                          const msg = `Hi ${apt.patient.firstName}, I hope you are having a good day. I'm reaching out because ${docName} had an unexpected change in schedule, and unfortunately, we need to cancel your appointment on ${apt.date.toDateString()}.

We sincerely apologize for any inconvenience this may cause you. Please reply to this message if you would like us to help you find a new time that works for you. We are here to help!`;
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
                          const msg = `🔄 *Appointment Rescheduled*\n\nHi ${apt.patient.firstName}, the clinic has rescheduled your appointment to *${dateLabel} at ${timeLabel}*. Reply here if this time does not work for you.`;
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
                          ]
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
                      const docName = formatDoctorDisplayName(staffName || doctorInfo?.name);
                      const ptMsg = `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                      await this.sendOutboundPatientMessage(sock, doctorId, prefilledPhone, ptMsg, newPatient.id, `${newPatient.firstName} ${newPatient.lastName}`.trim());
                      finalAiReply += `\n\nDone, Doctor! I have created a new patient profile for *${cleanName}* and confirmed their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation has been sent to them.`;
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
                          const docName = formatDoctorDisplayName(staffName || doctorInfo?.name);
                          const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                          const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                          const ptMsg = `Hi ${pt.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`;
                          await this.sendOutboundPatientMessage(sock, doctorId, pt.phone, ptMsg, pt.id, `${pt.firstName} ${pt.lastName}`.trim());
                          finalAiReply += `\n\nDone, Doctor! I have booked the appointment for ${pt.firstName} ${pt.lastName} on ${dateLabel} at ${timeLabel} and sent them a WhatsApp confirmation.`;
                        }

                      } else if (exactMatches.length > 1) {
                        // SCENARIO 2: Multiple patients with same name - ask doctor to disambiguate
                        const candidateLines = exactMatches.map((pt, i) => {
                          const lastVisitDate = pt.appointments[0]?.date;
                          const lastVisit = lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No prior visit';
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

                // 2. Intercept Patient Cancellation Tag or Intent
                const patientCancelRegex = /\[(CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT)\]/i;
                const isPatientCancelTag = patientCancelRegex.test(aiReply);
                const isPatientCancelIntent = !isStaff && /(?:cancel|cancellation)\s+(?:my\s+)?(?:appointment|booking|slot)|nahi\s+aa\s*(?:paunga|sakta|payenge)|cannot\s+come/i.test(textMessage);

                if ((isPatientCancelTag || isPatientCancelIntent) && !isStaff) {
                  try {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const activeApt = await prisma.appointment.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          ...(patient ? [{ patientId: patient.id }] : []),
                          { patient: { phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] } } }
                        ],
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
                        const docPhoneClean = doctorInfo.phone.replace(/\D/g, '');
                        const dateLabel = activeApt.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                        const timeLabel = activeApt.startTime ? activeApt.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Scheduled Time';
                        const cleanPtName = activeApt.patient ? `${activeApt.patient.firstName} ${activeApt.patient.lastName}`.trim() : (patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Patient');
                        
                        const docAlert = `🔔 *Patient Appointment Cancelled*\n\n👤 Patient: *${cleanPtName}* (${patientPhone})\n📅 Cancelled Slot: *${dateLabel} at ${timeLabel}*\n\n✨ This slot is now *OPEN & Available* for new bookings in your Gyrex calendar.`;
                        await this.sendOutboundPatientMessage(sock, doctorId, docPhoneClean, docAlert).catch(() => {});
                      }
                    }
                    finalAiReply = finalAiReply.replace(/\[(CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT)\]/gi, "").trim();
                  } catch (cancelErr) {
                    console.error("[WhatsAppManager] Patient Cancellation Error:", cancelErr);
                  }
                }

                // 2.5 Intercept Patient Reschedule Tag
                const patientRescheduleRegex = /\[RESCHEDULE_APPOINTMENT:\s*([^,]+),\s*([^,]+)(?:,\s*([^\]]+))?\]/i;
                const resMatch = aiReply.match(patientRescheduleRegex);
                if (resMatch && !isStaff) {
                  const [, resDateStr, resSessionStr] = resMatch;
                  try {
                    const clinicTz = resolveClinicTimezone(doctorInfo?.timezone);
                    const { startOfDay: todayStart } = getClinicDayBounds(new Date(), clinicTz);

                    const existingActiveApt = await prisma.appointment.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          ...(patient ? [{ patientId: patient.id }] : []),
                          { patient: { phone: { in: [patientPhone, `+${patientPhone}`, patientPhone.slice(-10)] } } }
                        ],
                        date: { gte: todayStart },
                        status: { in: ["SCHEDULED", "CONFIRMED"] }
                      },
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
                      const { hour, minute } = parseSessionOrTimeToHourMinute(resSessionStr, isMorning ? 10 : 17);
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
                    }
                    finalAiReply = finalAiReply.replace(patientRescheduleRegex, "").trim();
                  } catch (resErr) {
                    console.error("[WhatsAppManager] Patient Rescheduling Error:", resErr);
                  }
                }

                // 3. Intercept Patient Booking Tag (with Name, Age, Gender, and Doctor support)
                const bookingRegex = /\[BOOK_APPOINTMENT:\s*([^,]+),\s*([^,]+),\s*([^,\]]+)(?:,\s*([^,\]]+))?(?:,\s*([^,\]]+))?(?:,\s*([^,\]]+))?\]/i;
                const match = aiReply.match(bookingRegex);
                
                if (match && !isStaff) {
                  const [fullTag, dateStr, sessionStr, patientFullName, rawAgeStr, rawGenderStr, rawDoctorName] = match;
                  
                  try {
                    const nameParts = (patientFullName || "Patient").trim().split(/\s+/);
                    const candidateFirstName = nameParts[0] || "Patient";
                    const candidateLastName = nameParts.slice(1).join(" ") || "";

                    // Clean age & calculate approximate DOB
                    let parsedAge: number | null = null;
                    if (rawAgeStr) {
                      const ageMatch = rawAgeStr.match(/\d+/);
                      if (ageMatch) parsedAge = parseInt(ageMatch[0], 10);
                    }

                    // Clean gender
                    let parsedGender: string | null = null;
                    if (rawGenderStr) {
                      const gUpper = rawGenderStr.trim().toUpperCase();
                      if (gUpper.startsWith("M") || gUpper.includes("BOY") || gUpper.includes("MALE")) parsedGender = "MALE";
                      else if (gUpper.startsWith("F") || gUpper.includes("GIRL") || gUpper.includes("FEMALE")) parsedGender = "FEMALE";
                      else if (gUpper.startsWith("O")) parsedGender = "OTHER";
                    }

                    let approximateDob: Date | null = null;
                    if (parsedAge && parsedAge > 0 && parsedAge < 125) {
                      approximateDob = new Date(new Date().getFullYear() - parsedAge, 0, 1);
                    }

                    // 1. Resolve Family Member Identity: Check for existing patient with this FIRST NAME under this phone (matching any phone variation)
                    const cleanPtDigitsBk = patientPhone.replace(/\D/g, '');
                    const last10Bk = cleanPtDigitsBk.length >= 10 ? cleanPtDigitsBk.slice(-10) : cleanPtDigitsBk;
                    let targetPatient = await prisma.patient.findFirst({
                      where: {
                        doctorId,
                        OR: [
                          { phone: patientPhone },
                          { phone: `+${patientPhone}` },
                          ...(last10Bk.length >= 10 ? [{ phone: { endsWith: last10Bk } }] : [])
                        ],
                        firstName: { equals: candidateFirstName, mode: "insensitive" }
                      }
                    });

                    if (!targetPatient) {
                      // If existing patient on this phone is a temporary placeholder, update it
                      if (patient && (patient.firstName === "Patient" || patient.lastName.startsWith("+") || !patient.lastName)) {
                        targetPatient = await prisma.patient.update({
                          where: { id: patient.id },
                          data: {
                            firstName: candidateFirstName,
                            lastName: candidateLastName,
                            ...(parsedGender ? { gender: parsedGender } : {}),
                            ...(approximateDob ? { dateOfBirth: approximateDob } : {})
                          }
                        });
                      } else {
                        // A distinct family member is booking from this shared mobile number! Create a separate profile
                        targetPatient = await prisma.patient.create({
                          data: {
                            doctorId,
                            firstName: candidateFirstName,
                            lastName: candidateLastName,
                            phone: patientPhone,
                            gender: parsedGender,
                            dateOfBirth: approximateDob,
                            patientType: "ACTIVE",
                            tags: ["WhatsApp", "Family Member"]
                          }
                        });
                        console.log(`[WhatsAppManager] 👨‍👩‍👧 Created separate Family Member profile: "${candidateFirstName} ${candidateLastName}" (${patientPhone})`);
                      }
                    } else {
                      // Update missing demographic fields if provided now
                      const updates: any = {};
                      if (!targetPatient.gender && parsedGender) updates.gender = parsedGender;
                      if (!targetPatient.dateOfBirth && approximateDob) updates.dateOfBirth = approximateDob;
                      if (candidateLastName && (!targetPatient.lastName || targetPatient.lastName.startsWith("+"))) updates.lastName = candidateLastName;
                      if (Object.keys(updates).length > 0) {
                        targetPatient = await prisma.patient.update({
                          where: { id: targetPatient.id },
                          data: updates
                        });
                      }
                    }

                    // 2. Check if this specific family member already has an upcoming appointment
                    const activeAppointment = await prisma.appointment.findFirst({
                      where: {
                        patientId: targetPatient.id,
                        doctorId: doctorId,
                        date: { gte: new Date() },
                        status: "CONFIRMED"
                      }
                    });

                    if (activeAppointment) {
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += "\n\n*(Note: You already have an upcoming appointment scheduled. If you need to change it, please contact the clinic directly.)*";
                    } else {
                      // 3. Parse Date with intelligent fallback
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
                          finalAiReply += `\n\n*(Note: Our online WhatsApp slots for this date are fully reserved. For urgent consultations, direct walk-in tokens are available at the clinic reception.)*`;
                        } else {
                          const isMorning = sessionStr.toLowerCase().includes("morning");
                          const { hour, minute } = parseSessionOrTimeToHourMinute(sessionStr, isMorning ? 10 : 17);

                          // 4. Construct Exact Clinic Timezone Timestamps
                          const { startTime, endTime, dbAppointmentDate, dateOnlyStr } = createClinicAppointmentDateTimes({
                            dateStr: appointmentDate,
                            hour,
                            minute,
                            durationMinutes: 60,
                            timezone: clinicTz
                          });

                          // Create the Appointment in CRM (detect In-Clinic vs Tele-Consultation)
                          const isTele = /tele|video|online|virtual|remote/i.test(sessionStr);
                          const appointmentType = isTele ? "TELE_CONSULTATION" : "IN_CLINIC";
                          const defaultPractitioner = practitioners.find(p => p.isOwner) || practitioners[0];
                          let chosenPractitioner = defaultPractitioner;

                          if (rawDoctorName && rawDoctorName.trim()) {
                            const cleanDocTarget = rawDoctorName.trim().toLowerCase();
                            const matched = practitioners.find(p => {
                              const pName = p.name.toLowerCase();
                              const pBare = pName.replace(/^dr\.?\s*/i, '');
                              return pName.includes(cleanDocTarget) || cleanDocTarget.includes(pBare);
                            });
                            if (matched) {
                              chosenPractitioner = matched;
                            }
                          }

                          await prisma.appointment.create({
                            data: {
                              patientId: targetPatient.id,
                              doctorId: doctorId,
                              practitionerId: chosenPractitioner?.id || null,
                              date: dbAppointmentDate,
                              startTime: startTime,
                              endTime: endTime,
                              status: "CONFIRMED",
                              notes: `Booked via WhatsApp AI Assistant (${sessionStr.trim()})`,
                              type: appointmentType
                            }
                          });

                          console.log(`[WhatsAppManager] 📅 Successfully booked ${appointmentType} appointment for ${candidateFirstName} ${candidateLastName} with ${chosenPractitioner?.name || "Doctor"} (${patientPhone}) at ${dateOnlyStr} ${hour}:${minute} in ${clinicTz}`);
                          finalAiReply = finalAiReply.replace(fullTag, "").trim();

                          // 5. Notify Doctor on WhatsApp with AI Receptionist Name & Patient Demographics
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
                            const dateLabel = dbAppointmentDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
                            const timeLabel = startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
                            const cleanPtName = `${candidateFirstName} ${candidateLastName}`.trim();
                            const bookedDoctorLabel = formatDoctorDisplayName(chosenPractitioner?.name || doctorInfo?.name);
                            
                            const docAlert = `🔔 *New Appointment booked by your AI Receptionist ${assistantName} (${isTele ? "🌐 Video Tele-Consult" : "🏥 In-Clinic Visit"})*\n\n👤 Patient: *${cleanPtName}*${demoBadge} (${patientPhone})\n👨‍⚕️ Doctor: *${bookedDoctorLabel}* (${chosenPractitioner?.specialty || "General"})\n📅 Slot: *${dateLabel} at ${timeLabel}* (${sessionStr.trim()})\n\n✨ This appointment has been added to your Gyrex calendar.`;
                            await this.sendOutboundPatientMessage(sock, doctorId, docPhoneClean, docAlert).catch(() => {});
                          }
                        }
                      } else {
                        // Invalid date
                        finalAiReply = finalAiReply.replace(fullTag, "").trim();
                        finalAiReply += "\n\n*(Note: There was an issue processing the requested date. Please call the clinic to finalize your slot.)*";
                      }
                    }
                  } catch (e) {
                    console.error("[WhatsAppManager] Agentic Booking Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                  }
                }

                // Send reply via Baileys
                // Strip any stray internal AI action tags before sending to doctor or patient
                finalAiReply = finalAiReply.replace(/\[(RESCHEDULE_APPOINTMENT|CANCEL_APPOINTMENT|CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|BOOK_NEW_APPOINTMENT|MESSAGE_PATIENT|BOOK_APPOINTMENT)(?::.*?)?\]/gi, "").trim();
                await sock.sendMessage(remoteJid, { text: finalAiReply });
                
                // Create OUTGOING ChatMessage
                await prisma.chatMessage.create({
                  data: {
                    conversationId: conversation.id,
                    direction: "OUTGOING",
                    messageType: "text",
                    content: finalAiReply,
                    senderName: "AI Assistant",
                  }
                });
                
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: new Date() }
                });
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
  async sendMessage(doctorId: string, phone: string, text: string) {
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
            lastMessageAt: new Date(),
          }
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date(), status: "OPEN" }
        });
      }

      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "OUTGOING",
          messageType: "text",
          content: text,
          senderName: "Clinic AI",
        }
      });
    } catch (crmErr) {
      console.warn(`[WhatsAppManager] Failed to record outbound message to CRM database for ${cleanPhone}:`, crmErr);
    }

    return cleanPhone; // Return the normalized phone so callers can use it for DB lookups
  }

  async sendDocument(doctorId: string, phone: string, buffer: Buffer, fileName: string, caption?: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock) throw new Error("WhatsApp not connected for this doctor");
    
    const cleanPhone = this.normalizePhone(phone);
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { 
      document: buffer, 
      mimetype: 'application/pdf', 
      fileName: fileName,
      caption: caption 
    });
    return cleanPhone;
  }

  async sendImage(doctorId: string, phone: string, buffer: Buffer, caption?: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock) throw new Error("WhatsApp not connected for this doctor");
    
    const cleanPhone = this.normalizePhone(phone);
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { 
      image: buffer, 
      caption: caption 
    });
    return cleanPhone;
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

