import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData, isDoctor } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { resolveClinicTimezone, getClinicTimezoneOffset, getClinicDateOnlyString } from "@/lib/timezone";

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
  const clinicTz = resolveClinicTimezone(timezone);
  const startTimeStr = startDateTime.toLocaleTimeString("en-GB", { timeZone: clinicTz, hour: "2-digit", minute: "2-digit" });
  const endTimeStr = endDateTime.toLocaleTimeString("en-GB", { timeZone: clinicTz, hour: "2-digit", minute: "2-digit" });

  if (workingHoursStart.includes(",") || workingHoursEnd.includes(",")) {
    const starts = workingHoursStart.split(",").map((s) => s.trim());
    const ends = workingHoursEnd.split(",").map((e) => e.trim());
    return starts.some((s, idx) => {
      const e = ends[idx] || "";
      return startTimeStr >= s && endTimeStr <= e && startTimeStr < endTimeStr;
    });
  }

  // Allow early morning to late evening flexibility if clinic is on standard default 09:00 - 17:00
  if (workingHoursStart === "09:00" && workingHoursEnd === "17:00") {
    return startTimeStr >= "07:00" && endTimeStr <= "22:00" && startTimeStr < endTimeStr;
  }

  return startTimeStr >= workingHoursStart && endTimeStr <= workingHoursEnd && startTimeStr < endTimeStr;
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
      select: { timezone: true, workingHoursStart: true, workingHoursEnd: true, daysOff: true, clinicName: true },
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

    // If only time strings sent (e.g., from form), construct full Date objects in clinic timezone
    const clinicTz = resolveClinicTimezone(timezone);
    if (body.startTime && typeof body.startTime === "string" && !body.startTime.includes("T")) {
      const [hours, minutes] = body.startTime.split(":");
      const dateStr = getClinicDateOnlyString(newDate, clinicTz);
      const tzOffset = getClinicTimezoneOffset(clinicTz, new Date(`${dateStr}T12:00:00Z`));
      newStartTime = new Date(`${dateStr}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00${tzOffset}`);
    }
    if (body.endTime && typeof body.endTime === "string" && !body.endTime.includes("T")) {
      const [hours, minutes] = body.endTime.split(":");
      const dateStr = getClinicDateOnlyString(newDate, clinicTz);
      const tzOffset = getClinicTimezoneOffset(clinicTz, new Date(`${dateStr}T12:00:00Z`));
      newEndTime = new Date(`${dateStr}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00${tzOffset}`);
    }

    // Validate future date (if appointment date changed)
    if (body.date || body.startTime || body.endTime) {
      if (isPast(newStartTime, timezone)) {
        return NextResponse.json({ error: "Appointment cannot be in the past" }, { status: 400 });
      }
      if (isDayOff(newDate, daysOff)) {
        return NextResponse.json({ error: "Cannot schedule on a day off" }, { status: 400 });
      }

      const pId = body.practitionerId !== undefined ? body.practitionerId : existing.practitionerId;
      let effWorkingStart = workingHoursStart;
      let effWorkingEnd = workingHoursEnd;
      if (pId) {
        const practitioner = await prisma.practitioner.findFirst({
          where: { id: pId, doctorId, isActive: true },
          select: { workingHoursStart: true, workingHoursEnd: true },
        });
        if (practitioner?.workingHoursStart && practitioner?.workingHoursEnd) {
          effWorkingStart = practitioner.workingHoursStart;
          effWorkingEnd = practitioner.workingHoursEnd;
        }
      }

      if (!isWithinWorkingHours(newStartTime, newEndTime, effWorkingStart, effWorkingEnd, timezone)) {
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
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
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

    // Removed Automated Review Survey logic. Review requests are now dispatched asynchronously
    // via the ReviewDispatcherService to respect cooldown and delay rules.

    // --- WhatsApp Notification Logic for Reschedule / Cancel ---
    try {
      if (whatsappManager.isConnected(doctorId) && updated.patient.phone) {
        const clinicName = doctor?.clinicName || "our clinic";
        let messageText = "";

        // Check if Cancelled
        if (body.status === "CANCELLED" && existing.status !== "CANCELLED") {
          messageText = `Hi ${updated.patient.firstName}, this is ${clinicName}. We are writing to let you know that your appointment on ${updated.date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })} has been cancelled.\n\nIf you would like to reschedule for another day, simply reply to this message and we'll be happy to assist you!`;
        } 
        // Check if Rescheduled (Date or time changed, and not completed/cancelled/checked in)
        else if (
          updated.status === "CONFIRMED" &&
          (existing.date.getTime() !== updated.date.getTime() || existing.startTime.getTime() !== updated.startTime.getTime())
        ) {
          const formattedDate = updated.date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });
          const formattedTime = updated.startTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
          messageText = `Hi ${updated.patient.firstName}, this is an update regarding your appointment at ${clinicName}. Your visit has been successfully rescheduled to ${formattedDate} at ${formattedTime}.\n\nPlease reply 'CONFIRM' to lock in this new time. Let us know if you have any questions!`;
        }

        if (messageText) {
          const patientPhone = updated.patient.phone;
          await whatsappManager.sendMessage(doctorId, patientPhone, messageText, "Clinic");
        }
      }
    } catch (waError) {
      console.error("Failed to send WhatsApp notification for update:", waError);
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