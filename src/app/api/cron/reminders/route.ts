import { NextResponse } from "next/server";
import { ReminderService } from "@/services/reminder.service";

export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    console.log("[CRON] Starting Reminder Service CRON...");
    const reminderService = new ReminderService();
    
    // We can also trigger sendReviewRequests() here if we want to batch process them.
    // However, our task is specifically to ensure follow-ups are sent.
    await reminderService.sendFollowUpReminders();

    return NextResponse.json({ success: true, message: "Reminder CRON finished successfully" });
  } catch (error: any) {
    console.error("[CRON] Reminder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
