import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData, isDoctor } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";

// Helper to check if a date is in the past (using clinic timezone)
function isPast(date: Date, timezone: string): boolean {
  // Simple UTC check for now; you can enhance with proper timezone handling
  const now = new Date();
  return date < now;
}

// Check if time falls within working hours
function isWithinWorkingHours(
  startDateTime: Date,
  endDateTime: Date,
  workingHoursStart: string,
  workingHoursEnd: string,
  timezone: string
): boolean {
  // For simplicity, we compare UTC hours. In production, use a library like luxon.
  const startHour = parseInt(workingHoursStart.split(":")[0]);
  const endHour = parseInt(workingHoursEnd.split(":")[0]);
  const startUtcHour = startDateTime.getUTCHours();
  const endUtcHour = endDateTime.getUTCHours();
  // Very basic check – assumes timezone offset is not considered. You can improve.
  return startUtcHour >= startHour && endUtcHour <= endHour && startUtcHour <= endUtcHour;
}

function isDayOff(date: Date, daysOff: string[]): boolean {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayNames[date.getDay()];
  return daysOff.includes(dayOfWeek);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, medicalNotes: true, tags: true },
        },
      },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    const body = await req.json();

    // Fetch clinic settings for validation
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { timezone: true, workingHoursStart: true, workingHoursEnd: true, daysOff: true },
    });

    const timezone = doctor?.timezone || "UTC";
    const workingHoursStart = doctor?.workingHoursStart || "09:00";
    const workingHoursEnd = doctor?.workingHoursEnd || "17:00";
    const daysOff = doctor?.daysOff || [];

    const existing = await prisma.appointment.findFirst({
      where: { id, doctorId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // If date/time is being updated, validate
    let newDate = body.date ? new Date(body.date) : existing.date;
    let newStartTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    let newEndTime = body.endTime ? new Date(body.endTime) : existing.endTime;

    // If only time strings sent (e.g., from form), construct full Date objects
    if (body.startTime && typeof body.startTime === "string" && !body.startTime.includes("T")) {
      const [hours, minutes] = body.startTime.split(":");
      newStartTime = new Date(newDate);
      newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    if (body.endTime && typeof body.endTime === "string" && !body.endTime.includes("T")) {
      const [hours, minutes] = body.endTime.split(":");
      newEndTime = new Date(newDate);
      newEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    // Validate future date (if appointment date changed)
    if (body.date || body.startTime || body.endTime) {
      if (isPast(newStartTime, timezone)) {
        return NextResponse.json({ error: "Appointment cannot be in the past" }, { status: 400 });
      }
      if (isDayOff(newDate, daysOff)) {
        return NextResponse.json({ error: "Cannot schedule on a day off" }, { status: 400 });
      }
      if (!isWithinWorkingHours(newStartTime, newEndTime, workingHoursStart, workingHoursEnd, timezone)) {
        return NextResponse.json({ error: "Appointment time is outside working hours" }, { status: 400 });
      }

      // Check conflicts (exclude current appointment)
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId,
          id: { not: id },
          date: {
            gte: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
            lt: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() + 1),
          },
          status: "SCHEDULED",
          OR: [
            { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } },
          ],
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "Time slot conflicts with another appointment" }, { status: 409 });
      }
    }

    // Update the appointment
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        reason: body.reason,
        notes: body.notes,
        status: body.status,
        ...(body.status === "COMPLETED" && existing.status !== "COMPLETED" && !existing.reviewRequested ? { reviewRequested: true } : {})
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    // --- Automated Review Survey ---
    if (body.status === "COMPLETED" && existing.status !== "COMPLETED" && !existing.reviewRequested) {
      try {
        if (whatsappManager.isConnected(doctorId) && updated.patient.phone) {
          const patientPhone = updated.patient.phone;
          const clinicName = doctor?.clinicName || "our clinic";
          const surveyMessage = `Hi ${updated.patient.firstName}, thank you for visiting ${clinicName} today! \n\nWere you happy with today's consultation? Please reply YES or NO.`;
          
          const normalizedPhone = await whatsappManager.sendMessage(doctorId, patientPhone, surveyMessage);

          let conversation = await prisma.conversation.findUnique({
            where: { doctorId_patientPhone: { doctorId, patientPhone: normalizedPhone } }
          });
          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                doctorId,
                patientPhone: normalizedPhone,
                patientName: `${updated.patient.firstName} ${updated.patient.lastName}`,
                patientId: updated.patient.id,
                status: "OPEN",
              }
            });
          }
          await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              direction: "OUTGOING",
              messageType: "text",
              content: surveyMessage,
              senderName: "Clinic",
            }
          });
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
          });
        }
      } catch (err) {
        console.error("Failed to send review survey:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId, role } = await getSessionData();
    if (!isDoctor(role)) {
      return NextResponse.json({ error: "You do not have permission to delete appointments" }, { status: 403 });
    }
    const existing = await prisma.appointment.findFirst({ where: { id, doctorId } });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}