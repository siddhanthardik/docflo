import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { getSessionData } from "@/lib/session";

export async function GET() {
  try {
    const isReady = !!whatsappManager;
    return NextResponse.json({ 
      isReady
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
