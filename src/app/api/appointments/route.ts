import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { syncAppointmentToGCal } from "@/lib/gcal";

// ---------- Helper functions ----------

/** Returns true if the given date is in the past (UTC comparison). */
function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

function isWithinWorkingHours(
  startDateTime: Date,
  endDateTime: Date,
  workingHoursStart: string,
  workingHoursEnd: string,
  startTimeStr: string,
  endTimeStr: string
): boolean {
  // Simple string comparison for HH:mm works because it's zero-padded (e.g., "09:00" < "17:30")
  // This avoids timezone issues since the user is booking in their local clinic time.
  return startTimeStr >= workingHoursStart && endTimeStr <= workingHoursEnd && startTimeStr < endTimeStr;
}

/** Returns true if the given date falls on a day marked as off. */
function isDayOff(date: Date, daysOff: string[]): boolean {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = dayNames[date.getUTCDay()];
  return daysOff.includes(dayOfWeek);
}

// ---------- API Handlers ----------

export async function GET(req: Request) {
  try {
    const { doctorId, locationId } = await getSessionData();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const future = searchParams.get("future");
    const practitionerId = searchParams.get("practitionerId");

    const where: any = {
      doctorId,
    };
    
    if (practitionerId) {
      where.practitionerId = practitionerId;
    }
    
    if (locationId) {
      where.gbpAccountId = locationId;
    }

    if (future === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = { gte: today };
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      endDate.setHours(23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }

    if (status) {
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
    }
    if (patientId) where.patientId = patientId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        practitioner: {
          select: {
            name: true,
            calendarColor: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId, locationId } = await getSessionData();
    const body = await req.json();
    const { patientId, date, startTime, endTime, reason, notes, practitionerId, status = "CONFIRMED" } = body;

    if (!patientId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);
    const startDateTime = new Date(`${appointmentDate.toISOString().split("T")[0]}T${startTime}:00`);
    const endDateTime = new Date(`${appointmentDate.toISOString().split("T")[0]}T${endTime}:00`);

    // 1. Fetch clinic settings for this doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        timezone: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        daysOff: true,
        clinicName: true,
        address: true,
        city: true,
      },
    });

    const daysOff = doctor?.daysOff || [];
    const workingStart = doctor?.workingHoursStart || "09:00";
    const workingEnd = doctor?.workingHoursEnd || "17:00";

    // 2. Validate past dates (cannot schedule in the past)
    if (isPast(startDateTime)) {
      return NextResponse.json(
        { error: "Appointment cannot be in the past. Please choose a future date and time." },
        { status: 400 }
      );
    }

    // 3. Validate days off
    if (isDayOff(appointmentDate, daysOff)) {
      return NextResponse.json(
        { error: "Cannot schedule appointments on designated days off." },
        { status: 400 }
      );
    }

    // Check if patient is LEAD
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (patient.patientType === "LEAD") {
      return NextResponse.json(
        { error: "Patient must be converted to an active patient before scheduling." },
        { status: 400 }
      );
    }

    // 4. Validate working hours
    if (!isWithinWorkingHours(startDateTime, endDateTime, workingStart, workingEnd, startTime, endTime)) {
      return NextResponse.json(
        { error: `Appointment must be between ${workingStart} and ${workingEnd} on working days.` },
        { status: 400 }
      );
    }

    // 5. Check for conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: {
          gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
          lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1),
        },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        OR: [
          { startTime: { lt: endDateTime }, endTime: { gt: startDateTime } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    let targetPractitionerId = practitionerId;
    if (!targetPractitionerId) {
      const ownerPractitioner = await prisma.practitioner.findFirst({
        where: { doctorId, isOwner: true }
      });
      targetPractitionerId = ownerPractitioner?.id;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        practitionerId: targetPractitionerId || undefined,
        gbpAccountId: locationId || undefined,
        date: appointmentDate,
        startTime: startDateTime,
        endTime: endDateTime,
        reason: reason || "",
        notes: notes || "",
        status: status,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        practitioner: {
          select: {
            name: true,
            calendarColor: true,
          },
        },
      },
    });

    // --- Google Calendar Real-Time Sync ---
    syncAppointmentToGCal(appointment.id).catch((err) =>
      console.error("Failed to sync appointment to GCal:", err)
    );

    // --- WhatsApp Notification Logic ---
    try {
      if (whatsappManager.isConnected(doctorId) && appointment.patient.phone && status === "CONFIRMED") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let messageText = "";
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: 'long', month: 'short', day: 'numeric'
        });
        
        const clinicName = doctor?.clinicName || "our clinic";
        const locationDetails = [doctor?.address, doctor?.city].filter(Boolean).join(", ");
        const locationString = locationDetails ? ` at ${locationDetails}` : "";

        if (appointmentDate.getTime() === today.getTime()) {
          // Same Day
          messageText = `Hi ${appointment.patient.firstName}, this is a quick message from ${clinicName}. Your appointment is confirmed for today at ${startTime}${locationString}.\n\nCould you please reply with 'CONFIRM' to let us know you're still coming? If you need to reschedule, just let us know. We look forward to seeing you! 🌟`;
        } else {
          // Future
          messageText = `Hi ${appointment.patient.firstName}! Your upcoming appointment with ${clinicName} is scheduled for ${formattedDate} at ${startTime}${locationString}.\n\nPlease reply 'CONFIRM' to secure your slot, or let us know if you need to make any changes. Have a wonderful day! ✨`;
        }

        const patientPhone = appointment.patient.phone;
        const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;

        // Send via Baileys and get normalized phone
        const normalizedPhone = await whatsappManager.sendMessage(doctorId, patientPhone, messageText);

        // Find or create Conversation using normalizedPhone
        let conversation = await prisma.conversation.findUnique({
          where: { doctorId_patientPhone: { doctorId, patientPhone: normalizedPhone } }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              doctorId,
              patientPhone: normalizedPhone,
              patientName,
              patientId: appointment.patient.id,
              status: "OPEN",
            }
          });
        }

        // Add to ChatMessage
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "OUTGOING",
            messageType: "text",
            content: messageText,
            senderName: "Clinic", // Or fetch doctor name
          }
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() }
        });
      }
    } catch (waError) {
      console.error("Failed to send WhatsApp confirmation:", waError);
      // Don't fail the appointment booking if WhatsApp fails
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error;
    }
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}