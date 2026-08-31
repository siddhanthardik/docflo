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
        sock.ev.removeAllListeners('creds.update');
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

    // Fresh start: Wipe sessionDir so Baileys generates clean new QR
    const sessionDir = getSandboxSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore
      }
    }

    await this.connectSocket(sessionId);
    return this.qrCodes.get(sessionId) || null;
  }

  // Internal socket connection engine with automatic Reason 515 restart handling
  private async connectSocket(sessionId: string): Promise<void> {
    const profile = this.profiles.get(sessionId);
    if (!profile) return;

    // Clean up any pre-existing dangling socket for this session
    const existingSock = this.sockets.get(sessionId);
    if (existingSock) {
      try {
        existingSock.ev.removeAllListeners('connection.update');
        existingSock.ev.removeAllListeners('messages.upsert');
        existingSock.ev.removeAllListeners('creds.update');
        existingSock.ws.close();
      } catch (e) {
        // Ignore
      }
      this.sockets.delete(sessionId);
    }

    this.connectingSessions.add(sessionId);

    try {
      const sessionDir = getSandboxSessionDir(sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const vInfo = await fetchLatestBaileysVersion();
        if (vInfo && Array.isArray(vInfo.version)) {
          version = vInfo.version as [number, number, number];
        }
      } catch (vErr) {
        // Fallback to stable version
      }

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 25000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 2000,
      });

      this.sockets.set(sessionId, sock);

      sock.ev.on('creds.update', async () => {
        try {
          await saveCreds();
        } catch (e) {
          console.error(`[DemoSandboxManager] Error saving creds for ${sessionId}:`, e);
        }
      });

      sock.ev.on('connection.update', async (update) => {
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
          
          this.sockets.delete(sessionId);
          this.activeConnections.delete(sessionId);
          this.connectingSessions.delete(sessionId);

          const isPermanentLogout = reason === DisconnectReason.loggedOut;

          // Crucial: When pairing finishes, WhatsApp sends Reason 515 (restartRequired)
          // We MUST immediately reconnect using the saved creds.json without wiping!
          if (!isPermanentLogout && this.profiles.has(sessionId)) {
            const delay = reason === DisconnectReason.restartRequired ? 500 : 1500;
            console.log(`[DemoSandboxManager] Auto-reconnecting sandbox ${sessionId} in ${delay}ms...`);
            setTimeout(() => {
              this.connectSocket(sessionId).catch(e => 
                console.error(`[DemoSandboxManager] Auto-reconnect failed for ${sessionId}:`, e)
              );
            }, delay);
          } else {
            console.log(`[DemoSandboxManager] Permanent logout for ${sessionId}. Purging session.`);
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
    } catch (error) {
      console.error(`[DemoSandboxManager] Failed to connect sandbox socket ${sessionId}:`, error);
      this.connectingSessions.delete(sessionId);
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
