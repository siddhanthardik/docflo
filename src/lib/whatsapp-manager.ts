import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
// import { AIAgentsService } from '@/services/ai-agents.service'; // We will import dynamically to avoid circular dependencies

class WhatsAppManager {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map(); // doctorId -> QR string

  constructor() {
    // Ensure auth folder exists
    const authDir = path.join(process.cwd(), 'auth_info');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
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
    
    // If it explicitly starts with a '+', the user provided a country code.
    // We just strip all non-digits (including the '+').
    if (phone.trim().startsWith('+')) {
      return phone.replace(/\D/g, '');
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    // If it's exactly 10 digits and no country code was provided, default to India (91)
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    return cleanPhone;
  }

  // Connects or reconnects a doctor's WhatsApp session
  async connect(doctorId: string) {
    console.log(`[WhatsAppManager] Starting connection for doctor: ${doctorId}`);
    const sessionDir = path.join(process.cwd(), 'auth_info', doctorId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      browser: ['Gyrex', 'Chrome', '1.0.0'],
    });

    this.sockets.set(doctorId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WhatsAppManager] New QR for doctor ${doctorId}`);
        this.qrCodes.set(doctorId, qr);
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[WhatsAppManager] Connection closed for ${doctorId}. Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          this.connect(doctorId);
        } else {
          // Logged out
          this.sockets.delete(doctorId);
          this.qrCodes.delete(doctorId);
          // Delete auth folder
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      } else if (connection === 'open') {
        console.log(`[WhatsAppManager] Connection OPEN for doctor ${doctorId}`);
        this.qrCodes.delete(doctorId); // Clear QR once connected
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

            // If no patient exists, auto-create as a LEAD
            if (!patient) {
              patient = await prisma.patient.create({
                data: {
                  doctorId,
                  firstName: "Lead",
                  lastName: `+${patientPhone}`,
                  phone: patientPhone,
                  patientType: "LEAD",
                  tags: ["WhatsApp Lead"]
                }
              });
              console.log(`[WhatsAppManager] Auto-created new CRM lead for ${patientPhone}`);
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

            // Check if this is a reply to the review survey
            const pendingAppointment = await prisma.appointment.findFirst({
              where: {
                doctorId,
                patientId: conversation.patientId || "",
                reviewStatus: "SURVEY_SENT"
              },
              orderBy: { createdAt: "desc" }
            });

            if (pendingAppointment) {
              const textLower = textMessage.trim().toLowerCase();
              const isYes = /^(yes|y|yeah|yep|sure|absolutely|of course|great|good)$/.test(textLower) || textLower.includes("yes");
              const isNo = /^(no|n|nope|nah|never|bad)$/.test(textLower) || textLower.includes("no");

              if (isYes) {
                const gbp = await prisma.gbpAccount.findFirst({ where: { doctorId } });
                const insights: any = gbp?.insightsData || {};
                const placeId = insights?.placeId;
                
                const doctorData = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { clinicName: true, reviewGoogleInvitationMessage: true }});
                const clinicSearch = encodeURIComponent(doctorData?.clinicName || "clinic");
                
                const reviewLink = placeId
                  ? `https://search.google.com/local/writereview?placeid=${placeId}`
                  : `https://google.com/search?q=${clinicSearch}`;
                  
                const defaultReply = `We are absolutely thrilled to hear that! 🌟 \n\nAs a local clinic, we rely heavily on word-of-mouth. If you have 60 seconds, it would mean the world to our staff if you could share your experience on Google:\n${reviewLink}\n\nThank you so much, and stay healthy!`;
                const replyText = doctorData?.reviewGoogleInvitationMessage 
                  ? doctorData.reviewGoogleInvitationMessage.replace("{link}", reviewLink)
                  : defaultReply;
                
                await sock.sendMessage(remoteJid, { text: replyText });
                await prisma.chatMessage.create({
                  data: { conversationId: conversation.id, direction: "OUTGOING", messageType: "text", content: replyText, senderName: "Clinic" }
                });

                await prisma.appointment.update({
                  where: { id: pendingAppointment.id },
                  data: { reviewStatus: "LINK_SENT" }
                });

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

                await prisma.appointment.update({
                  where: { id: pendingAppointment.id },
                  data: { reviewStatus: "NEGATIVE_RESPONSE" }
                });

                return; // Don't pass to AI agent
              }
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
            const agentConfig = await prisma.aIAgentConfig.findUnique({
              where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } }
            });

            if (agentConfig && agentConfig.enabled) {
              const { AIAgentsService } = await import('@/services/ai-agents.service');
              
              const recentMessages = await prisma.chatMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: "desc" },
                take: 10,
              });
              const history = recentMessages.reverse().map(rm => 
                `${rm.direction === "INCOMING" ? "Patient" : "Clinic"}: ${rm.content}`
              );

              const aiReply = await AIAgentsService.runAppointmentAgent(
                doctorId,
                textMessage,
                history,
                agentConfig.config as any
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
  }

  getQR(doctorId: string): string | null {
    return this.qrCodes.get(doctorId) || null;
  }

  isConnected(doctorId: string): boolean {
    return this.sockets.has(doctorId) && !this.qrCodes.has(doctorId);
  }

  async logout(doctorId: string) {
    const sock = this.sockets.get(doctorId);
    if (sock) {
      try { sock.logout(); } catch (e) {}
    }
    
    this.sockets.delete(doctorId);
    this.qrCodes.delete(doctorId);
    const sessionDir = path.join(process.cwd(), 'auth_info', doctorId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  }

  // Helper to send outbound messages manually (from inbox or campaigns)
  async sendMessage(doctorId: string, phone: string, text: string) {
    const sock = this.sockets.get(doctorId);
    if (!sock) throw new Error("WhatsApp not connected for this doctor");
    
    const cleanPhone = this.normalizePhone(phone);
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
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
