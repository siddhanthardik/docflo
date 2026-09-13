import { NextResponse } from "next/server";
import { ReminderService } from "@/services/reminder.service";
import { verifyCronRequest } from "@/lib/cron-auth";

export async function GET(req: Request) {
  const unauth = verifyCronRequest(req);
  if (unauth) return unauth;
  try {
    console.log("[CRON] Starting Reminder Service CRON...");
    const reminderService = new ReminderService();
    
    // 1. Trigger 24-hour and 2-hour pre-appointment WhatsApp reminders
    const appointmentReminders = await reminderService.sendAppointmentReminders();

    return NextResponse.json({
      success: true,
      message: "Reminder CRON finished successfully",
      appointmentReminders,
    });
  } catch (error: any) {
    console.error("[CRON] Reminder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
