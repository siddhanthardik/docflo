import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDoctorDisplayName } from "@/services/ai-agents.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.id;
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        clinicName: true,
        opdStatus: true,
        opdDelayMinutes: true,
        opdStatusNote: true,
        opdStatusUpdatedAt: true,
        maxDailyAiBookings: true,
        maxMorningAiBookings: true,
        maxEveningAiBookings: true,
        aiSlotPacing: true,
        workingHoursStart: true,
        workingHoursEnd: true,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch today's appointments
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] },
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const aiBookingsCount = appointmentsToday.filter((a) =>
      a.notes?.toLowerCase().includes("ai") || a.notes?.toLowerCase().includes("whatsapp")
    ).length;

    return NextResponse.json({
      doctor,
      appointmentsToday,
      todayTotalCount: appointmentsToday.length,
      todayAiCount: aiBookingsCount,
    });
  } catch (error) {
    console.error("Error fetching OPD status:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.id;
    const body = await req.json();
    const { action, delayMinutes, reason, notifyPatients } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, clinicName: true },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const docName = formatDoctorDisplayName(doctor.name);

    if (action === "RESUME") {
      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          opdStatus: "ACTIVE",
          opdDelayMinutes: 0,
          opdStatusNote: null,
          opdStatusUpdatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "OPD resumed to normal schedule", doctor: updated });
    }

    if (action === "DELAY") {
      const delay = parseInt(delayMinutes) || 30;

      // Update doctor record
      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          opdStatus: "RUNNING_LATE",
          opdDelayMinutes: delay,
          opdStatusNote: reason || `Doctor is running approx ${delay} mins late`,
          opdStatusUpdatedAt: new Date(),
        },
      });

      // Shift today's upcoming appointments
      const upcomingApts = await prisma.appointment.findMany({
        where: {
          doctorId,
          date: { gte: todayStart, lte: todayEnd },
          status: "CONFIRMED",
        },
        include: { patient: true },
      });

      let notifiedCount = 0;
      for (const apt of upcomingApts) {
        if (apt.startTime) {
          const newStart = new Date(apt.startTime.getTime() + delay * 60000);
          const newEnd = apt.endTime ? new Date(apt.endTime.getTime() + delay * 60000) : new Date(newStart.getTime() + 30 * 60000);

          await prisma.appointment.update({
            where: { id: apt.id },
            data: {
              startTime: newStart,
              endTime: newEnd,
              notes: `${apt.notes || ""} [Delayed by ${delay}m]`.trim(),
            },
          });

          // Dispatch WhatsApp notice if requested
          if (notifyPatients && apt.patient?.phone) {
            try {
              const { whatsappManager } = await import("@/lib/whatsapp-manager");
              const newTimeStr = newStart.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              const msg = `⚠️ *OPD Timing Update*\n\nHi ${apt.patient.firstName}, ${docName} is currently running approx *${delay} minutes late* due to hospital emergency procedures. Your appointment is now scheduled for *${newTimeStr}* today. Thank you for your patience! 😊`;
              
              if (whatsappManager) {
                await whatsappManager.sendMessage(doctorId, apt.patient.phone, msg);
                notifiedCount++;
              }
            } catch (e) {
              console.warn("Could not dispatch delay notification to patient:", e);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `OPD delayed by ${delay} mins. ${notifiedCount} patients notified.`,
        doctor: updated,
        impactedCount: upcomingApts.length,
      });
    }

    if (action === "PAUSE_TODAY" || action === "CANCEL_TODAY") {
      const isCancel = action === "CANCEL_TODAY";
      const statusToSet = isCancel ? "CANCELLED" : "PAUSED";

      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          opdStatus: statusToSet,
          opdStatusNote: reason || (isCancel ? "Emergency leave today" : "Paused new online bookings for today"),
          opdStatusUpdatedAt: new Date(),
        },
      });

      if (isCancel && notifyPatients) {
        const upcomingApts = await prisma.appointment.findMany({
          where: {
            doctorId,
            date: { gte: todayStart, lte: todayEnd },
            status: "CONFIRMED",
          },
          include: { patient: true },
        });

        let notifiedCount = 0;
        for (const apt of upcomingApts) {
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { status: "CANCELLED", notes: `${apt.notes || ""} [Emergency Cancelled]`.trim() },
          });

          if (apt.patient?.phone) {
            try {
              const { whatsappManager } = await import("@/lib/whatsapp-manager");
              const msg = `⚠️ *Important Clinic Notice*\n\nDear ${apt.patient.firstName}, ${docName} had an unexpected hospital emergency and will not be available for OPD consultations today. We sincerely apologize for any inconvenience. Please reply to this message to reschedule for tomorrow or contact clinic reception.`;
              
              if (whatsappManager) {
                await whatsappManager.sendMessage(doctorId, apt.patient.phone, msg);
                notifiedCount++;
              }
            } catch (e) {
              console.warn("Could not dispatch cancel notice to patient:", e);
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `Today's OPD cancelled. ${notifiedCount} patients notified.`,
          doctor: updated,
        });
      }

      return NextResponse.json({
        success: true,
        message: isCancel ? "Today's OPD cancelled" : "New WhatsApp bookings paused for today",
        doctor: updated,
      });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error updating OPD status:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
