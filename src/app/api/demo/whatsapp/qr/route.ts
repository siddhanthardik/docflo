import { NextRequest, NextResponse } from "next/server";
import { demoSandboxManager } from "@/lib/demo-sandbox-manager";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctorName, clinicName, specialty, assistantName, email, phone, sessionId: existingSessionId } = body;

    if (!doctorName || !email) {
      return NextResponse.json({ error: "Doctor Name and Email are required to generate QR" }, { status: 400 });
    }

    const formattedDoc = doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`;
    const formattedClinic = clinicName || `${formattedDoc}'s Clinic`;
    const formattedAssistant = assistantName || "Mona";
    const formattedSpecialty = specialty || "General Medicine";

    // 1. Record / upsert lead in database
    let leadId = "demo_" + Date.now();
    try {
      const lead = await prisma.auditLead.create({
        data: {
          name: formattedDoc,
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : null,
          clinicName: formattedClinic,
          leadSource: "WHATSAPP_LIVE_QR_SANDBOX",
          landingPage: "/ai-receptionist-demo",
          activities: {
            create: {
              eventType: "SANDBOX_QR_REQUESTED",
              message: `Doctor requested live WhatsApp linking for assistant ${formattedAssistant} (${formattedSpecialty})`,
              metadata: {
                specialty: formattedSpecialty,
                assistantName: formattedAssistant,
              }
            }
          }
        }
      });
      leadId = lead.id;
    } catch (dbErr) {
      console.warn("[Demo QR] Lead save notice:", dbErr);
    }

    const sessionId = existingSessionId || `sb_${leadId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;

    // 2. Start sandbox Baileys socket
    const qrStr = await demoSandboxManager.startSession({
      sessionId,
      doctorName: formattedDoc,
      clinicName: formattedClinic,
      specialty: formattedSpecialty,
      assistantName: formattedAssistant,
      email,
      phone,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    let qrDataUrl = null;
    if (qrStr) {
      qrDataUrl = await QRCode.toDataURL(qrStr);
    }

    const statusInfo = demoSandboxManager.getStatus(sessionId);

    return NextResponse.json({
      sessionId,
      leadId,
      status: statusInfo.status,
      qr: qrDataUrl || (statusInfo.qr ? await QRCode.toDataURL(statusInfo.qr) : null),
      timeRemainingSeconds: statusInfo.timeRemainingSeconds || 600
    });
  } catch (error: any) {
    console.error("[Demo QR] POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to start WhatsApp sandbox" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const statusInfo = demoSandboxManager.getStatus(sessionId);
    let qrDataUrl = null;

    if (statusInfo.qr) {
      qrDataUrl = await QRCode.toDataURL(statusInfo.qr);
    }

    return NextResponse.json({
      sessionId,
      status: statusInfo.status,
      qr: qrDataUrl,
      timeRemainingSeconds: statusInfo.timeRemainingSeconds
    });
  } catch (error: any) {
    console.error("[Demo QR] GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to get QR status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let sessionId: string | null = null;
    
    // Support JSON body or query param
    try {
      const body = await req.json();
      sessionId = body.sessionId;
    } catch {
      const { searchParams } = new URL(req.url);
      sessionId = searchParams.get("sessionId");
    }

    if (sessionId) {
      await demoSandboxManager.logout(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Demo QR] DELETE Error:", error);
    return NextResponse.json({ success: true }); // Always 200 on logout teardown
  }
}
