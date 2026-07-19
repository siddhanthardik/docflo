import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const isReady = !!whatsappManager;
    return NextResponse.json({ 
      isReady
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
