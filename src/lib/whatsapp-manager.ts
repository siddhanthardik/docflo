import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { resolveGoogleReviewLink } from '@/services/review-dispatcher.service';

class WhatsAppManager {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map(); // doctorId -> QR string
  private connectingDoctors: Set<string> = new Set(); // Guard against duplicate connect attempts

  constructor() {
    // Ensure auth folder exists
    const authDir = path.join(process.cwd(), 'auth_info');
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

    const sessionDir = path.join(process.cwd(), 'auth_info', doctorId);
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
      const sessionDir = path.join(process.cwd(), 'auth_info', doctorId);
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
    console.log(`[WhatsAppManager] Starting fresh connection for doctor: ${doctorId}`);
    
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

      const sessionDir = path.join(process.cwd(), 'auth_info', doctorId);
      
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

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: false,
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
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
          console.log(`[WhatsAppManager] New QR generated for doctor ${doctorId}`);
          this.qrCodes.set(doctorId, qr);
        }

        if (connection === 'close') {
          this.sockets.delete(doctorId);
          this.connectingDoctors.delete(doctorId);

          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isTerminalAuthFailure = 
            statusCode === DisconnectReason.loggedOut || 
            statusCode === DisconnectReason.badSession || 
            statusCode === 405 || 
            statusCode === 401;

          // We SHOULD reconnect if the connection was simply closed (428) or timed out.
          // We only avoid reconnecting if it was a definitive auth failure.
          const shouldReconnect = !isTerminalAuthFailure;
          
          console.log(`[WhatsAppManager] Connection closed for ${doctorId}. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
          
          if (shouldReconnect) {
            const delay = statusCode === DisconnectReason.restartRequired ? 2000 : 3000;
            setTimeout(() => {
              console.log(`[WhatsAppManager] Auto-reconnecting ${doctorId} now...`);
              this.connect(doctorId).catch(e => console.error(`[WhatsAppManager] Auto-reconnect error for ${doctorId}:`, e));
            }, delay);
          } else {
            // Terminal failure (405/401): Wipe session files on disk so next attempt generates fresh QR
            console.log(`[WhatsAppManager] Terminal auth failure for ${doctorId} (code ${statusCode}). Purging corrupted session on disk.`);
            this.clearSession(doctorId);
            
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
          console.log(`[WhatsAppManager] Connection OPEN for doctor ${doctorId}`);
          this.sockets.set(doctorId, sock);
          this.qrCodes.delete(doctorId);
          this.connectingDoctors.delete(doctorId);
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

          // --- Process the incoming message via AI Agents ---
          try {
            // Find patient
            let patient = await prisma.patient.findFirst({
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

            const patientName = `${patient.firstName} ${patient.lastName}`;

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
                  patientId: patient.id,
                  status: "OPEN",
                }
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, status: "OPEN", patientId: patient.id }
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
            let pendingAppointment = await prisma.appointment.findFirst({
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

            // Check if an actual Google Review Survey was sent to this patient in the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const lastSurveyMessage = await prisma.chatMessage.findFirst({
              where: {
                conversationId: conversation.id,
                direction: "OUTGOING",
                createdAt: { gte: twentyFourHoursAgo },
                OR: [
                  { content: { contains: "5-star" } },
                  { content: { contains: "rate your experience" } }
                ]
              },
              orderBy: { createdAt: "desc" }
            });

            // ONLY run Review Survey Interceptor if an actual review survey invitation was sent AND the last message was NOT from AI Assistant AND it is NOT a booking request
            const isSurveySent = !isLastMsgFromAI && !isBookingRequest && !!lastSurveyMessage;
            const isYes = isSurveySent && (/^(yes|y|yeah|yep|sure|absolutely|of course|great|good|ok|okay|thx|thanks|1|👍|😊|🌟|❤️)$/i.test(textLower) || 
              textLower === "yes" || textLower === "yeah" || textLower === "sure" || textLower === "ok" || textLower === "okay");
            const isNo = isSurveySent && (/^(no|n|nope|nah|never|bad)$/i.test(textLower) || textLower === "no" || textLower === "bad" || textLower === "poor");

            if (isYes) {
              const doctorData = await prisma.doctor.findUnique({ 
                where: { id: doctorId }, 
                select: { clinicName: true, reviewGoogleInvitationMessage: true, enableGoogleReviewAutoDispatch: true }
              });

              if (doctorData?.enableGoogleReviewAutoDispatch !== false) {
                try {
                  const reviewLink = await resolveGoogleReviewLink(doctorId);
                  
                  const displayName = (patient.firstName && patient.firstName !== "Lead" && patient.firstName !== "Patient") ? ` ${patient.firstName}` : "";
                  const defaultReply = `Hello${displayName},\n\nThank you so much for your positive feedback! We are delighted to hear that you were happy with your care at ${doctorData?.clinicName || "our clinic"}.\n\nIf you have 60 seconds, it would mean the world to our team if you could share your experience on Google:\n\n${reviewLink}\n\nWishing you the very best of health!`;
                  
                  const replyText = doctorData?.reviewGoogleInvitationMessage 
                    ? doctorData.reviewGoogleInvitationMessage.replace("{link}", `\n\n${reviewLink}\n\n`).replace("{firstName}", patient.firstName || "")
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
            } else if (isNo) {
                const replyText = `We are so sorry to hear that we didn't meet your expectations today. We take patient feedback very seriously.\n\nCould you please share a bit more about what went wrong? Our management team will review your feedback immediately so we can make things right.`;
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
            const isConfirming = /^(confirm|yes|i confirm|confirmed|ok|okay)$/.test(textLowerConfirm) || textLowerConfirm.includes("confirm");

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

            // Check AI Appointment Agent
            const doctorInfo = await prisma.doctor.findUnique({
              where: { id: doctorId },
              select: { 
                enableAIAutoResponder: true,
                phone: true,
                name: true,
                clinicName: true,
                specialty: true
              }
            });

            const agentConfig = await prisma.aIAgentConfig.findUnique({
              where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } }
            });

            if (doctorInfo?.enableAIAutoResponder !== false && agentConfig && agentConfig.enabled) {
              const { AIAgentsService } = await import('@/services/ai-agents.service');
              
              const recentMessages = await prisma.chatMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: "desc" },
                take: 10,
              });
              const history = recentMessages.reverse().map(rm => 
                `${rm.direction === "INCOMING" ? "Patient" : "Clinic"}: ${rm.content}`
              );

              const clinicPhone = doctorInfo?.phone || "";

              const aiReply = await AIAgentsService.runAppointmentAgent(
                doctorId,
                textMessage,
                history,
                agentConfig.config as any,
                clinicPhone,
                {
                  doctorName: doctorInfo?.name || undefined,
                  clinicName: doctorInfo?.clinicName || undefined,
                  specialty: doctorInfo?.specialty || undefined
                }
              );

              if (aiReply) {
                // Send reply via Baileys
                await sock.sendMessage(remoteJid, { text: aiReply });
                
                // Create OUTGOING ChatMessage
                await prisma.chatMessage.create({
                  data: {
                    conversationId: conversation.id,
                    direction: "OUTGOING",
                    messageType: "text",
                    content: aiReply,
                    senderName: "AI Assistant",
                  }
                });
                
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { lastMessageAt: new Date() }
                });
              }
            }
          } catch (err) {
            console.error(`[WhatsAppManager] Error processing message:`, err);
          }
        }
      }
    });
    } catch (err) {
      console.error(`[WhatsAppManager] Unhandled error during connect for ${doctorId}:`, err);
      this.connectingDoctors.delete(doctorId);
    }
  }

  getQR(doctorId: string): string | null {
    return this.qrCodes.get(doctorId) || null;
  }

  isConnected(doctorId: string): boolean {
    const sock = this.sockets.get(doctorId);
    return !!sock && !!sock.user && !this.qrCodes.has(doctorId);
  }

  async logout(doctorId: string) {
    this.clearSession(doctorId);
  }

  // Helper to send outbound messages manually (from inbox or campaigns)
  async sendMessage(doctorId: string, phone: string, text: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock || !sock.user) {
      throw new Error("WhatsApp is not connected or device is logged out. Please connect your device in WhatsApp Settings.");
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
      throw new Error("Failed to deliver message via WhatsApp. Please check WhatsApp connection status.");
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
    const authDir = path.join(process.cwd(), 'auth_info');
    if (!fs.existsSync(authDir)) return;
    
    const dirs = fs.readdirSync(authDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const doctorId = dir.name;
        // Check if it has creds.json to ensure it's a valid session
        if (fs.existsSync(path.join(authDir, doctorId, 'creds.json'))) {
          console.log(`[WhatsAppManager] Auto-connecting saved session for ${doctorId}`);
          this.connect(doctorId).catch(console.error);
        }
      }
    }
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

// Auto-connect on server start if not already connected
if (!manager.hasAnyConnection()) {
  manager.autoConnectAll();
}

export const whatsappManager = manager;
