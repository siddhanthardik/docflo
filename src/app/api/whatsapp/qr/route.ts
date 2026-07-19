import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { whatsappManager } from "@/lib/whatsapp-manager";
import QRCode from "qrcode";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctorId = session.user.id;

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;

  try {
    // If not connected and no QR, start connection process
    if (!whatsappManager.isConnected(doctorId) && !whatsappManager.getQR(doctorId)) {
      await whatsappManager.connect(doctorId);
      // It takes a few seconds to generate the QR
      return NextResponse.json({ status: "CONNECTING", qr: null }, { status: 200 });
    }

    const qrStr = whatsappManager.getQR(doctorId);
    if (qrStr) {
      const qrDataUrl = await QRCode.toDataURL(qrStr);
      return NextResponse.json({ status: "SCAN_QR", qr: qrDataUrl }, { status: 200 });
    }

    if (whatsappManager.isConnected(doctorId)) {
      return NextResponse.json({ status: "CONNECTED" }, { status: 200 });
    }

    return NextResponse.json({ status: "CONNECTING", qr: null }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching QR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await whatsappManager.logout(session.user.id);
  return NextResponse.json({ success: true });
}
