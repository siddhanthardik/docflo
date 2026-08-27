import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { resolveGoogleReviewLink } from '@/services/review-dispatcher.service';
import { PlatformWhatsAppConciergeService } from '@/services/platform-whatsapp-concierge.service';
import { formatDoctorDisplayName } from '@/services/ai-agents.service';
import { logSystemError } from '@/lib/logger';

// Obfuscate directory resolution from Next.js Turbopack / Webpack static file tracer
function getAuthBaseDir(): string {
  const parts = ["auth", "info"];
  return path.resolve(process.cwd(), parts.join("_"));
}

function getDoctorSessionDir(doctorId: string): string {
  return path.resolve(getAuthBaseDir(), doctorId);
}

class WhatsAppManager {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map(); // doctorId -> QR string
  private connectingDoctors: Set<string> = new Set(); // Guard against duplicate connect attempts
  private activeConnections: Set<string> = new Set(); // Tracks fully opened connections
  private reconnectAttempts: Map<string, number> = new Map(); // Tracks retry backoff per doctor/superadmin
  private watchdogTimer: NodeJS.Timeout | null = null;
  // Holds mid-flight booking intents awaiting disambiguation (doctorPhone -> intent)
  private pendingIntents: Map<string, {
    type: 'AWAITING_PHONE' | 'AWAITING_SELECTION',
    patientName: string,
    dateStr: string,
    timeStr: string,
    candidates?: Array<{ id: string; firstName: string; lastName: string; phone: string; lastVisit?: Date | null }>
  }> = new Map();

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
    
    if (phone.trim().startsWith('+')) {
      return phone.replace(/\D/g, '');
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    return cleanPhone;
  }

  // Connects or reconnects a doctor's WhatsApp session
  async connect(doctorId: string) {
    if (this.connectingDoctors.has(doctorId)) {
      console.log(`[WhatsAppManager] Connection already in progress for ${doctorId}, skipping duplicate request.`);
      return;
    }

    this.connectingDoctors.add(doctorId);
    console.log(`[WhatsAppManager] Starting connection for session: ${doctorId}`);
    
    try {
      // Clean up any pre-existing dangling socket
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

      const sock = makeWASocket({
        version: version as any,
        auth: state,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: false,
        browser: Browsers.macOS('Desktop'),
        markOnlineOnConnect: true,
        syncFullHistory: false,
        keepAliveIntervalMs: 25000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 2000,
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

          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isSuperAdmin = doctorId === 'PLATFORM_SUPERADMIN';

          // Critical Rule: Never purge SuperAdmin credentials automatically on transient disconnects!
          // Only true explicit logout (user unlinked device from their phone) should ever drop non-superadmin sessions.
          const isPermanentLogout = !isSuperAdmin && statusCode === DisconnectReason.loggedOut;
          const shouldReconnect = isSuperAdmin || !isPermanentLogout;
          
          console.log(`[WhatsAppManager] Connection closed for ${doctorId}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect} (isSuperAdmin: ${isSuperAdmin})`);
          
          if (shouldReconnect) {
            const currentAttempts = (this.reconnectAttempts.get(doctorId) || 0) + 1;
            this.reconnectAttempts.set(doctorId, currentAttempts);

            // Exponential backoff: 2s, 3s, 5s, 8s, 12s, max 25s
            const baseDelay = statusCode === DisconnectReason.restartRequired ? 1500 : 2500;
            const delay = Math.min(baseDelay * Math.pow(1.3, Math.min(currentAttempts, 8)), 25000);

            console.log(`[WhatsAppManager] Scheduling auto-reconnect for ${doctorId} (attempt #${currentAttempts}) in ${Math.round(delay)}ms...`);
            
            setTimeout(() => {
              this.connect(doctorId).catch(e => console.error(`[WhatsAppManager] Auto-reconnect failed for ${doctorId}:`, e));
            }, delay);
          } else {
            // Terminal failure for clinic doctor: Wipe session files on disk so next attempt generates fresh QR
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
        }
      });

      sock.ev.on('messages.upsert', async (m) => {
      console.log(`[WhatsAppManager] Raw upsert type: ${m.type}, messages count: ${m.messages.length}`);
      
      // Ignore outgoing messages or updates
      if (m.type !== 'notify') return;
      
      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

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
                phone: true,
                name: true,
                clinicName: true,
                specialty: true,
                createdAt: true,
                subscriptionStatus: true,
                subscriptionExpiry: true,
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

            const staffPhones = [doctorInfo?.phone, ...practitioners.map(p => p.phone)]
              .filter(Boolean)
              .map(p => this.normalizePhone(p as string));
              
            const isStaff = staffPhones.includes(patientPhone);

            let patient = null;
            if (!isStaff) {
              // Find patient
              patient = await prisma.patient.findFirst({
                where: { phone: patientPhone, doctorId },
              });

              // If no patient exists, auto-create as a Patient
              if (!patient) {
                patient = await prisma.patient.create({
                  data: {
                    doctorId,
                    firstName: "Patient",
                    lastName: `+${patientPhone}`,
                    phone: patientPhone,
                    patientType: "ACTIVE",
                    tags: ["WhatsApp"]
                  }
                });
                console.log(`[WhatsAppManager] Auto-created new CRM patient for ${patientPhone}`);
              }

              if (patient.isBlocked) {
                console.log(`[WhatsAppManager] Ignored message from BLOCKED patient ${patientPhone}`);
                continue; // Skip processing
              }
            }

            const patientName = isStaff ? "Clinic Staff/Doctor" : `${patient!.firstName} ${patient!.lastName}`;

            // Find or create Conversation
            let conversation = await prisma.conversation.findUnique({
              where: { doctorId_patientPhone: { doctorId, patientPhone } }
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
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, status: "OPEN", patientId: isStaff ? null : patient!.id }
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
                        const newPatient = await prisma.patient.create({
                          data: {
                            doctorId,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ') || '',
                            phone: phoneDigits,
                            patientType: 'ACTIVE'
                          }
                        });

                        const appointmentDate = new Date(dateStr);
                        const timeMatchP = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
                        let hour = 18;
                        if (timeMatchP) {
                          hour = parseInt(timeMatchP[1]);
                          const mer = (timeMatchP[3] || '').toLowerCase();
                          if (mer === 'pm' && hour < 12) hour += 12;
                          if (mer === 'am' && hour === 12) hour = 0;
                        }
                        const startTime = new Date(appointmentDate); startTime.setHours(hour, 0, 0, 0);
                        const endTime = new Date(startTime); endTime.setHours(hour + 1, 0, 0, 0);

                        await prisma.appointment.create({
                          data: { patientId: newPatient.id, doctorId, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant (new patient)' }
                        });

                        const docName = formatDoctorDisplayName(doctorInfo?.name);
                        const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                        const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        const patientJid = `${phoneDigits}@s.whatsapp.net`;
                        await sock.sendMessage(patientJid, {
                          text: `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                        });

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
                         const appointmentDate = new Date(dateStr);
                         const timeMatchS = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
                         let hour = 18;
                         if (timeMatchS) {
                           hour = parseInt(timeMatchS[1]);
                           const mer = (timeMatchS[3] || '').toLowerCase();
                           if (mer === 'pm' && hour < 12) hour += 12;
                           if (mer === 'am' && hour === 12) hour = 0;
                         }
                         const startTime = new Date(appointmentDate); startTime.setHours(hour, 0, 0, 0);
                         const endTime = new Date(startTime); endTime.setHours(hour + 1, 0, 0, 0);

                         await prisma.appointment.create({
                           data: { patientId: selectedPatient.id, doctorId, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                         });

                         const docName = formatDoctorDisplayName(doctorInfo?.name);
                         const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                         const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                         if (selectedPatient.phone) {
                           const patientJid = `${selectedPatient.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                           await sock.sendMessage(patientJid, {
                             text: `Hi ${selectedPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                           });
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
                        const newPatient = await prisma.patient.create({
                          data: {
                            doctorId,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ') || '',
                            phone: phoneDigits4,
                            patientType: 'ACTIVE'
                          }
                        });
                        const appointmentDate = new Date(dateStr);
                        const timeMatchN = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
                        let hour = 18;
                        if (timeMatchN) {
                          hour = parseInt(timeMatchN[1]);
                          const mer = (timeMatchN[3] || '').toLowerCase();
                          if (mer === 'pm' && hour < 12) hour += 12;
                          if (mer === 'am' && hour === 12) hour = 0;
                        }
                        const startTime = new Date(appointmentDate); startTime.setHours(hour, 0, 0, 0);
                        const endTime = new Date(startTime); endTime.setHours(hour + 1, 0, 0, 0);
                        await prisma.appointment.create({
                          data: { patientId: newPatient.id, doctorId, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant (new patient)' }
                        });
                        const docName = formatDoctorDisplayName(doctorInfo?.name);
                        const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                        const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        const patientJid = `${phoneDigits4}@s.whatsapp.net`;
                        await sock.sendMessage(patientJid, {
                          text: `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                        });
                        const confirmMsg = `Done, Doctor! I have created a new profile for *${patientName}* (Phone: ${phoneDigits4}) and confirmed their appointment on ${dateLabel} at ${timeLabel}. A WhatsApp confirmation has been sent.`;
                        await sock.sendMessage(remoteJid, { text: confirmMsg });
                        await prisma.chatMessage.create({ data: { conversationId: conversation.id, direction: 'OUTGOING', messageType: 'text', content: confirmMsg, senderName: 'AI Assistant' } });
                        await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
                        return;
                      } catch (e) {
                        console.error('[WhatsAppManager] New patient from AWAITING_SELECTION error:', e);
                      }
                    }
                  }
                }
              }

              if (isStaff) {
                const history = recentMessages.reverse().map(rm => 
                  `${rm.direction === "INCOMING" ? "Staff" : "Assistant"}: ${rm.content}`
                );

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                
                const appointments = await prisma.appointment.findMany({
                  where: {
                    doctorId,
                    date: { gte: today, lt: weekEnd }
                  },
                  include: { patient: true, practitioner: true },
                  orderBy: { date: 'asc' }
                });

                aiReply = await AIAgentsService.runStaffAssistantAgent(
                  doctorId,
                  textMessage,
                  history,
                  appointments,
                  { doctorName: doctorInfo?.name || "Doctor" }
                );
              } else {
                const history = recentMessages.reverse().map(rm => 
                  `${rm.direction === "INCOMING" ? "Patient" : "Clinic"}: ${rm.content}`
                );

                const clinicPhone = doctorInfo?.phone || "";

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
                  practitioners
                );
              }

              let finalAiReply = aiReply;

              if (aiReply) {
                // 1. Intercept Staff Modification Tags
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
                         const patientJid = `${apt.patient.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                         const docName = formatDoctorDisplayName(doctorInfo?.name);
                         const msg = `Hi ${apt.patient.firstName}, I hope you are having a good day. I'm reaching out because ${docName} had an unexpected change in schedule, and unfortunately, we need to cancel your appointment on ${apt.date.toDateString()}.\n\nWe sincerely apologize for any inconvenience this may cause you. Please reply to this message if you would like us to help you find a new time that works for you. We are here to help!`;
                         await sock.sendMessage(patientJid, { text: msg });
                         console.log(`[WhatsAppManager] Sent cancellation to ${patientJid}`);
                       }
                    }
                  } catch (e) {
                    console.error("[WhatsAppManager] Cancel Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
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
                      const newDate = new Date(dateStr.trim());
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (!isNaN(newDate.getTime()) && newDate >= today) {
                        const isMorning = sessionStr.toLowerCase().includes("morning");
                        const startTime = new Date(newDate);
                        startTime.setHours(isMorning ? 10 : 17, 0, 0, 0); 
                        
                        const endTime = new Date(startTime);
                        endTime.setHours(startTime.getHours() + 1);

                        await prisma.appointment.update({ 
                          where: { id: apt.id }, 
                          data: { 
                            status: "CONFIRMED",
                            date: newDate,
                            startTime: startTime,
                            endTime: endTime,
                            notes: `Rescheduled via AI Assistant (${sessionStr.trim()})`
                          }
                        });
                        
                        finalAiReply = finalAiReply.replace(fullTag, "").trim();
                        
                        // Notify patient via WhatsApp
                        if (apt.patient?.phone) {
                          const patientJid = `${apt.patient.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                          const msg = `🔄 *Appointment Rescheduled*\n\nHi ${apt.patient.firstName}, the clinic has rescheduled your appointment to *${newDate.toDateString()} (${sessionStr.trim()})*. Reply here if this time does not work for you.`;
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
                    
                    // Send message via Baileys
                    await sock.sendMessage(patientJid, { text: msgContent.trim() });
                    console.log(`[WhatsAppManager] AI relayed message to patient ${patientJid}`);
                    
                    // Create conversation/message records so AI remembers context
                    let patientConvo = await prisma.conversation.findUnique({
                      where: { doctorId_patientPhone: { doctorId, patientPhone: cleanPhone } }
                    });
                    
                    if (!patientConvo) {
                      const patientRecord = await prisma.patient.findFirst({ where: { phone: cleanPhone, doctorId } });
                      patientConvo = await prisma.conversation.create({
                        data: {
                          doctorId,
                          patientPhone: cleanPhone,
                          patientName: patientRecord ? `${patientRecord.firstName} ${patientRecord.lastName}` : "Patient",
                          patientId: patientRecord ? patientRecord.id : null,
                          status: "OPEN"
                        }
                      });
                    }
                    
                    await prisma.chatMessage.create({
                      data: {
                        conversationId: patientConvo.id,
                        direction: "OUTGOING",
                        messageType: "text",
                        content: msgContent.trim(),
                        senderName: "Clinic"
                      }
                    });
                    
                    await prisma.conversation.update({
                      where: { id: patientConvo.id },
                      data: { lastMessageAt: new Date() }
                    });

                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
                  } catch (e) {
                    console.error("[WhatsAppManager] Message Relay Error:", e);
                    finalAiReply = finalAiReply.replace(fullTag, "").trim();
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
                    const appointmentDate = new Date(cleanDate);
                    let hour = 18;
                    const timeMatch = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
                    if (timeMatch) {
                      hour = parseInt(timeMatch[1]);
                      const meridiem = (timeMatch[3] || '').toLowerCase();
                      if (meridiem === 'pm' && hour < 12) hour += 12;
                      if (meridiem === 'am' && hour === 12) hour = 0;
                    }

                    const startTime = new Date(appointmentDate);
                    startTime.setHours(hour, 0, 0, 0);
                    const endTime = new Date(startTime);
                    endTime.setHours(hour + 1, 0, 0, 0);

                    finalAiReply = finalAiReply.replace(fullTag, '').trim();

                    // If the doctor already provided a phone number → create new patient immediately, no disambiguation
                    if (prefilledPhone.length >= 10) {
                      const nameParts = cleanName.split(' ');
                      const newPatient = await prisma.patient.create({
                        data: {
                          doctorId,
                          firstName: nameParts[0],
                          lastName: nameParts.slice(1).join(' ') || '',
                          phone: prefilledPhone,
                          patientType: 'ACTIVE'
                        }
                      });
                      await prisma.appointment.create({
                        data: { patientId: newPatient.id, doctorId, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                      });
                      const docName = formatDoctorDisplayName(doctorInfo?.name);
                      const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                      const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                      await sock.sendMessage(`${prefilledPhone}@s.whatsapp.net`, {
                        text: `Hi ${newPatient.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                      });
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
                          data: { patientId: pt.id, doctorId, date: appointmentDate, startTime, endTime, status: 'CONFIRMED', type: 'IN_CLINIC', notes: 'Booked via Staff AI Assistant' }
                        });
                        if (pt.phone) {
                          const patientJid = `${pt.phone.replace(/\D/g, '')}@s.whatsapp.net`;
                          const docName = formatDoctorDisplayName(doctorInfo?.name);
                          const dateLabel = appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                          const timeLabel = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                          await sock.sendMessage(patientJid, {
                            text: `Hi ${pt.firstName}, your appointment with ${docName} has been confirmed for *${dateLabel} at ${timeLabel}*. Please arrive a few minutes early. Looking forward to seeing you! 😊`
                          });
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

                // 2. Intercept Patient Booking Tag
                const bookingRegex = /\[BOOK_APPOINTMENT:\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/i;
                const match = aiReply.match(bookingRegex);
                
                if (match && !isStaff && patient) {
                  const [fullTag, dateStr, sessionStr, patientFullName] = match;
                  
                  try {
                    // 1. Check if patient already has an active appointment
                    const activeAppointment = await prisma.appointment.findFirst({
                      where: {
                        patientId: patient.id,
                        doctorId: doctorId,
                        date: { gte: new Date() },
                        status: "CONFIRMED"
                      }
                    });

                    if (activeAppointment) {
                      // Prevent spam/double booking
                      finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      finalAiReply += "\n\n*(Note: You already have an upcoming appointment scheduled. If you need to change it, please contact the clinic directly.)*";
                    } else {
                      // 2. Parse Date
                      const appointmentDate = new Date(dateStr.trim());
                      // Basic validation: Is it a valid date and not in the past?
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (!isNaN(appointmentDate.getTime()) && appointmentDate >= today) {
                        // Create fake times based on session
                        const isMorning = sessionStr.toLowerCase().includes("morning");
                        const startTime = new Date(appointmentDate);
                        startTime.setHours(isMorning ? 10 : 17, 0, 0, 0); // Default 10am or 5pm
                        
                        const endTime = new Date(startTime);
                        endTime.setHours(startTime.getHours() + 1);

                        // 3. Update Patient Profile Name if it's default
                        if (patient.firstName === "Patient" && patient.lastName.startsWith("+")) {
                          const nameParts = patientFullName.trim().split(" ");
                          const firstName = nameParts[0];
                          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
                          await prisma.patient.update({
                            where: { id: patient.id },
                            data: { firstName, lastName }
                          });
                        }

                        // 4. Create the Appointment
                        await prisma.appointment.create({
                          data: {
                            patientId: patient.id,
                            doctorId: doctorId,
                            date: appointmentDate,
                            startTime: startTime,
                            endTime: endTime,
                            status: "CONFIRMED",
                            notes: `Booked via AI Assistant (${sessionStr.trim()})`,
                            type: "IN_CLINIC"
                          }
                        });
                        console.log(`[WhatsAppManager] Successfully agentic-booked appointment for ${patientPhone}`);
                        finalAiReply = finalAiReply.replace(fullTag, "").trim();
                      } else {
                        // Invalid date hallucinated by AI
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

  hasSavedSession(doctorId: string): boolean {
    const sessionDir = getDoctorSessionDir(doctorId);
    const credsPath = path.join(sessionDir, 'creds.json');
    return fs.existsSync(credsPath);
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
              const isConnected = this.isConnected(doctorId);
              const isConnecting = this.connectingDoctors.has(doctorId);

              if (!isConnected && !isConnecting) {
                console.log(`[WhatsAppManager Watchdog] Session exists for ${doctorId} but socket is inactive. Reviving connection...`);
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

