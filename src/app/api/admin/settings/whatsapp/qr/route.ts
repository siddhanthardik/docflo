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

    const state = whatsappManager.getConnectionStatus(SUPERADMIN_DOCTOR_ID);

    if (state.status === "CONNECTED") {
      return NextResponse.json({ status: "CONNECTED", qr: null }, { status: 200 });
    }

    if (state.status === "SCAN_QR" && state.qr) {
      const qrDataUrl = await QRCode.toDataURL(state.qr);
      return NextResponse.json({ status: "SCAN_QR", qr: qrDataUrl }, { status: 200 });
    }

    if (state.status === "CONNECTING") {
      return NextResponse.json({ status: "CONNECTING", qr: null }, { status: 200 });
    }

    // Return current state without triggering new QR generation unless requested via POST or action=connect
    return NextResponse.json({ status: "DISCONNECTED", qr: null }, { status: 200 });
  } catch (error: any) {
    console.error("[SuperAdmin WhatsApp QR] GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    whatsappManager.connect(SUPERADMIN_DOCTOR_ID, { force: true }).catch((e) => {
      console.error("[SuperAdmin WhatsApp QR] Connect error:", e);
    });

    const state = whatsappManager.getConnectionStatus(SUPERADMIN_DOCTOR_ID);
    return NextResponse.json({ success: true, status: state.status });
  } catch (error: any) {
    console.error("[SuperAdmin WhatsApp QR] POST error:", error);
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
