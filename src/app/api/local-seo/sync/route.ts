import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { GoogleSyncEngine } from "@/services/sync-engine/GoogleSyncEngine";

export async function POST(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // In a production system this might be sent to a queue
    // For now we sync synchronously. It takes ~2-5 seconds for all Google APIs
    await GoogleSyncEngine.syncAll(session.doctorId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync data" }, { status: 500 });
  }
}
