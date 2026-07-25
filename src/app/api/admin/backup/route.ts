import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BackupService } from "@/services/backup.service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[MANUAL BACKUP] Admin ${session.user.email} initiated instant backup...`);

    const result = await BackupService.runDailyBackup(session.user.email);

    return NextResponse.json({
      success: true,
      message: "Database backup created, uploaded to Google Drive, and confirmation email sent.",
      result,
    });
  } catch (error: any) {
    console.error("[MANUAL BACKUP ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to trigger backup" }, { status: 500 });
  }
}
