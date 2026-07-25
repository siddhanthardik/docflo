import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappManager } from "@/lib/whatsapp-manager";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Basic CRON authorization check
    if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Running Subscription Expiry Reminder Sweep...");

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Find doctors whose subscription expires within the next 3 days or is already expired
    const doctors = await prisma.doctor.findMany({
      where: {
        subscriptionExpiry: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        package: true,
      },
    });

    let remindersSent = 0;

    for (const doctor of doctors) {
      if (!doctor.subscriptionExpiry) continue;

      const daysLeft = Math.ceil((doctor.subscriptionExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const planName = doctor.package?.name || "Gyrex";

      let timeText = `${daysLeft} days`;
      if (daysLeft <= 1) timeText = "24 hours";
      if (daysLeft === 0) timeText = "today";

      const messageContent = `Hello Dr. ${doctor.name}, your ${planName} subscription expires in ${timeText}. Please complete your renewal payment to maintain uninterrupted access to AI Agents and patient scheduling: https://gyrex.in/subscription`;

      // 1. Dispatch In-App Notification
      try {
        await prisma.notification.create({
          data: {
            doctorId: doctor.id,
            title: `⚠️ Subscription Expiring (${timeText})`,
            message: `Your ${planName} subscription expires in ${timeText}. Click here to renew.`,
            type: "BILLING",
          },
        });
      } catch (e) {
        console.error(`[CRON] Failed to create in-app notification for doctor ${doctor.id}`, e);
      }

      // 2. Dispatch WhatsApp Alert (if doctor has connected WhatsApp / phone)
      if (doctor.phone) {
        try {
          await whatsappManager.sendMessage(doctor.id, doctor.phone, messageContent);
          remindersSent++;
        } catch (wErr) {
          console.log(`[CRON] WhatsApp dispatch skipped/failed for doctor ${doctor.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription expiry check completed. Scanned ${doctors.length} doctors, sent ${remindersSent} WhatsApp reminders.`,
      doctorsFound: doctors.length,
    });
  } catch (error: any) {
    console.error("[CRON] Subscription expiry reminder error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
