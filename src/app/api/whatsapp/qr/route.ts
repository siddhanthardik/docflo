import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";
import QRCode from "qrcode";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  const { doctorId } = await getSessionData();
  if (!doctorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;

  try {
    if (whatsappManager.isConnected(doctorId)) {
      return NextResponse.json({ status: "CONNECTED", qr: null }, { status: 200 });
    }

    const qrStr = whatsappManager.getQR(doctorId);
    if (qrStr) {
      const qrDataUrl = await QRCode.toDataURL(qrStr);
      return NextResponse.json({ status: "SCAN_QR", qr: qrDataUrl }, { status: 200 });
    }

    // If doctor already has a saved session on disk, auto-reconnect without generating new QR
    if (whatsappManager.hasSavedSession(doctorId)) {
      whatsappManager.connect(doctorId).catch((e) => console.error("[WhatsApp QR] Auto connect error:", e));
      return NextResponse.json({ status: "CONNECTING", hasSavedSession: true, qr: null }, { status: 200 });
    }

    // Start connection process in background if not already connected
    whatsappManager.connect(doctorId).catch((e) => console.error("[WhatsApp QR] Fresh connect error:", e));

    return NextResponse.json({ status: "DISCONNECTED", qr: null }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching QR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { doctorId } = await getSessionData();
  if (!doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await whatsappManager.logout(doctorId);
  return NextResponse.json({ success: true });
}
