import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { generateWithFallback } from '@/services/ai-agents.service';

function getSandboxBaseDir(): string {
  const parts = ["auth", "info", "sandbox"];
  return path.resolve(process.cwd(), parts.join("_"));
}

function getSandboxSessionDir(sessionId: string): string {
  return path.resolve(getSandboxBaseDir(), sessionId);
}

export interface SandboxSessionProfile {
  sessionId: string;
  doctorName: string;
  clinicName: string;
  specialty: string;
  assistantName: string;
  email?: string;
  phone?: string;
  createdAt: number;
  expiresAt: number;
}

class DemoSandboxManager {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<string, string> = new Map(); // sessionId -> QR string
  private profiles: Map<string, SandboxSessionProfile> = new Map();
  private activeConnections: Set<string> = new Set();
  private connectingSessions: Set<string> = new Set();
  private expiryTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Ensure sandbox directory exists
    const baseDir = getSandboxBaseDir();
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (e) {
        // Ignore
      }
    }
  }

  // Clear session data and remove directory
  clearSession(sessionId: string) {
    console.log(`[DemoSandboxManager] Clearing ephemeral session: ${sessionId}`);
    
    // Clear auto-logout timer
    const timer = this.expiryTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(sessionId);
    }

    const sock = this.sockets.get(sessionId);
    if (sock) {
      try {
        sock.ev.removeAllListeners('connection.update');
        sock.ev.removeAllListeners('messages.upsert');
        sock.ws.close();
      } catch (e) {
        // Ignore socket close errors
      }
      this.sockets.delete(sessionId);
    }

    this.qrCodes.delete(sessionId);
    this.connectingSessions.delete(sessionId);
    this.activeConnections.delete(sessionId);
    this.profiles.delete(sessionId);

    const sessionDir = getSandboxSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`[DemoSandboxManager] Failed to delete session dir for ${sessionId}:`, err);
      }
    }
  }

  // Check connection status
  getStatus(sessionId: string): { status: "CONNECTED" | "SCAN_QR" | "CONNECTING" | "DISCONNECTED"; qr: string | null; timeRemainingSeconds?: number } {
    const profile = this.profiles.get(sessionId);
    const timeRemainingSeconds = profile ? Math.max(0, Math.floor((profile.expiresAt - Date.now()) / 1000)) : undefined;

    if (this.activeConnections.has(sessionId)) {
      return { status: "CONNECTED", qr: null, timeRemainingSeconds };
    }

    const qr = this.qrCodes.get(sessionId);
    if (qr) {
      return { status: "SCAN_QR", qr, timeRemainingSeconds };
    }

    if (this.connectingSessions.has(sessionId)) {
      return { status: "CONNECTING", qr: null, timeRemainingSeconds };
    }

    return { status: "DISCONNECTED", qr: null, timeRemainingSeconds };
  }

  // Initialize or get connection for sandbox
  async startSession(profile: SandboxSessionProfile): Promise<string | null> {
    const { sessionId } = profile;
    
    // Set 10-minute expiry TTL
    const TTL_MS = 10 * 60 * 1000;
    profile.createdAt = Date.now();
    profile.expiresAt = Date.now() + TTL_MS;
    this.profiles.set(sessionId, profile);

    // Set auto-logout timeout
    if (this.expiryTimers.has(sessionId)) {
      clearTimeout(this.expiryTimers.get(sessionId)!);
    }
    const timer = setTimeout(() => {
      console.log(`[DemoSandboxManager] Session ${sessionId} expired after 10 mins. Auto logging out.`);
      this.logout(sessionId).catch(console.error);
    }, TTL_MS);
    this.expiryTimers.set(sessionId, timer);

    // If already connected
    if (this.activeConnections.has(sessionId)) {
      return null;
    }

    // If QR code is already waiting
    if (this.qrCodes.has(sessionId)) {
      return this.qrCodes.get(sessionId)!;
    }

    if (this.connectingSessions.has(sessionId)) {
      return null;
    }

    this.connectingSessions.add(sessionId);

    try {
      const sessionDir = getSandboxSessionDir(sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as [number, number, number] }));

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      this.sockets.set(sessionId, sock);

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`[DemoSandboxManager] New QR received for sandbox: ${sessionId}`);
          this.qrCodes.set(sessionId, qr);
        }

        if (connection === 'open') {
          console.log(`[DemoSandboxManager] ✅ Sandbox connected for session: ${sessionId}`);
          this.activeConnections.add(sessionId);
          this.connectingSessions.delete(sessionId);
          this.qrCodes.delete(sessionId);
        }

        if (connection === 'close') {
          const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[DemoSandboxManager] Connection closed for ${sessionId}, reason:`, reason);
          
          this.activeConnections.delete(sessionId);
          this.connectingSessions.delete(sessionId);

          if (reason === DisconnectReason.loggedOut) {
            this.clearSession(sessionId);
          }
        }
      });

      // Handle inbound message auto-reply in sandbox mode
      sock.ev.on('messages.upsert', async (m) => {
        try {
          if (m.type !== 'notify') return;
          for (const msg of m.messages) {
            if (msg.key.fromMe) continue;
            
            const senderJid = msg.key.remoteJid;
            if (!senderJid || senderJid.endsWith('@g.us')) continue; // Ignore groups

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || "";
            if (!text.trim()) continue;

            const currentProfile = this.profiles.get(sessionId) || profile;
            const assistantName = currentProfile.assistantName || "Mona";
            const doctorName = currentProfile.doctorName || "the Doctor";
            const clinicName = currentProfile.clinicName || "our Clinic";
            const specialty = currentProfile.specialty || "Medical Consultation";

            const prompt = `You are ${assistantName}, the friendly, professional 24/7 WhatsApp AI Receptionist for "${doctorName}" at "${clinicName}" (${specialty}).
Rules:
1. Speak concisely and warmly in Hinglish/English.
2. If the user wants to book, offer available slots for tomorrow (10:30 AM, 5:30 PM, 6:45 PM).
3. If asked for fees, mention consultation fee is ₹800.
4. Never prescribe drugs or make diagnoses. Offer to schedule an appointment with ${doctorName}.
5. Keep message under 3 short WhatsApp lines with polite emojis.

Patient Message: "${text.trim()}"
Reply:`;

            const reply = await generateWithFallback(prompt).catch(() => 
              `Namaste! 🙏 I am ${assistantName}, 24/7 AI Receptionist for ${doctorName} at ${clinicName}. How may I help you with your appointment today?`
            );

            await sock.sendMessage(senderJid, { text: reply });
            console.log(`[DemoSandboxManager] 📤 Replied to ${senderJid} in sandbox ${sessionId}`);
          }
        } catch (msgErr) {
          console.error(`[DemoSandboxManager] Message reply error:`, msgErr);
        }
      });

      return this.qrCodes.get(sessionId) || null;
    } catch (error) {
      console.error(`[DemoSandboxManager] Failed to start sandbox session ${sessionId}:`, error);
      this.connectingSessions.delete(sessionId);
      return null;
    }
  }

  // Gracefully logout and destroy session
  async logout(sessionId: string): Promise<boolean> {
    console.log(`[DemoSandboxManager] Logging out session: ${sessionId}`);
    const sock = this.sockets.get(sessionId);
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
    this.clearSession(sessionId);
    return true;
  }
}

export const demoSandboxManager = new DemoSandboxManager();
