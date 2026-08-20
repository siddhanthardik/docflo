import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { whatsappManager } from "@/lib/whatsapp-manager";
import QRCode from "qrcode";

const SUPERADMIN_DOCTOR_ID = "PLATFORM_SUPERADMIN";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if Platform SuperAdmin WhatsApp is already connected
    if (whatsappManager.isConnected(SUPERADMIN_DOCTOR_ID)) {
      return NextResponse.json({ status: "CONNECTED", qr: null }, { status: 200 });
    }

    // 2. Check if a QR code is currently waiting to be scanned
    const qrStr = whatsappManager.getQR(SUPERADMIN_DOCTOR_ID);
    if (qrStr) {
      const qrDataUrl = await QRCode.toDataURL(qrStr);
      return NextResponse.json({ status: "SCAN_QR", qr: qrDataUrl }, { status: 200 });
    }

    // 3. Initiate new Baileys connection for PLATFORM_SUPERADMIN if not already connecting
    whatsappManager.connect(SUPERADMIN_DOCTOR_ID).catch((e) => {
      console.error("[SuperAdmin WhatsApp QR] Auto connect error:", e);
    });

    return NextResponse.json({ status: "DISCONNECTED", qr: null }, { status: 200 });
  } catch (error: any) {
    console.error("[SuperAdmin WhatsApp QR] GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Disconnect and clear the PLATFORM_SUPERADMIN session from memory & disk
    await whatsappManager.logout(SUPERADMIN_DOCTOR_ID);
    whatsappManager.clearSession(SUPERADMIN_DOCTOR_ID);

    return NextResponse.json({ success: true, message: "SuperAdmin WhatsApp unlinked successfully" });
  } catch (error: any) {
    console.error("[SuperAdmin WhatsApp QR] DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
