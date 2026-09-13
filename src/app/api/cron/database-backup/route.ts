import { NextResponse } from "next/server";
import { BackupService } from "@/services/backup.service";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const unauth = verifyCronRequest(req);
    if (unauth) return unauth;

    console.log("[CRON] Executing Automated Daily Database Backup...");

    const result = await BackupService.runDailyBackup();

    return NextResponse.json({
      success: true,
      message: "Daily database backup created, stored on Google Drive, and confirmation email sent.",
      result,
    });
  } catch (error: any) {
    console.error("[CRON DATABASE BACKUP ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
