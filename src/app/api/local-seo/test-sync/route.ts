import { NextResponse } from "next/server";
import { GoogleSyncEngine } from "@/services/sync-engine/GoogleSyncEngine";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const doctors = await prisma.doctor.findMany();
    let count = 0;
    for (const doc of doctors) {
      try {
        await GoogleSyncEngine.syncAll(doc.id);
        count++;
      } catch (e: any) {
        console.error("Skipped doctor", doc.id, e.message);
      }
    }

    return NextResponse.json({ success: true, count, message: "Sync triggered via test route" });
  } catch (error: any) {
    console.error("Test Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync data" }, { status: 500 });
  }
}
