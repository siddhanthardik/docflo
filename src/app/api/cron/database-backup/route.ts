import { NextResponse } from "next/server";
import { BackupService } from "@/services/backup.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Basic CRON secret check
    if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
