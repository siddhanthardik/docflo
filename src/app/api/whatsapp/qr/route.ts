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
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // 1. If explicit connect requested (or forced refresh)
    if (action === "connect") {
      whatsappManager.connect(doctorId).catch((e) => console.error("[WhatsApp QR] Explicit connect error:", e));
    }

    // 2. Query non-destructive state snapshot
    const state = whatsappManager.getConnectionStatus(doctorId);

    if (state.status === "CONNECTED") {
      return NextResponse.json({ status: "CONNECTED", qr: null, hasSavedSession: true }, { status: 200 });
    }

    if (state.status === "SCAN_QR" && state.qr) {
      const qrDataUrl = await QRCode.toDataURL(state.qr);
      return NextResponse.json({ status: "SCAN_QR", qr: qrDataUrl, hasSavedSession: false }, { status: 200 });
    }

    if (state.status === "CONNECTING") {
      return NextResponse.json({ 
        status: "CONNECTING", 
        hasSavedSession: state.hasSavedSession, 
        retryCount: state.retryCount,
        qr: null 
      }, { status: 200 });
    }

    // 3. If DISCONNECTED and this was an explicit connect request, wait a moment or let UI poll
    return NextResponse.json({ 
      status: "DISCONNECTED", 
      hasSavedSession: state.hasSavedSession, 
      retryCount: state.retryCount,
      qr: null 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching QR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { doctorId } = await getSessionData();
  if (!doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
  if (block) return block;

  try {
    whatsappManager.connect(doctorId, { force: true }).catch((e) => {
      console.error("[WhatsApp QR] Explicit connect error:", e);
    });

    const state = whatsappManager.getConnectionStatus(doctorId);
    return NextResponse.json({ success: true, status: state.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { doctorId } = await getSessionData();
  if (!doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await whatsappManager.logout(doctorId);
  return NextResponse.json({ success: true });
}
