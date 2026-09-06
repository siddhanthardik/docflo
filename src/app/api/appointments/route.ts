import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager";
import { resolveClinicTimezone, getClinicTimezoneOffset, getClinicDateOnlyString, getClinicDayBounds } from "@/lib/timezone";
import { formatAppointmentConfirmationCard } from "@/lib/whatsapp-formatter";

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
      // Intentionally skipping location-based filtering for appointments
      // as one doctor account equals one clinic in the system architecture.
    }

    // Resolve doctor's clinic timezone to avoid UTC server day truncation
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { timezone: true }
    });
    const clinicTz = resolveClinicTimezone(doctor?.timezone);

    if (future === "true") {
      const { startOfDay } = getClinicDayBounds(new Date(), clinicTz);
      where.date = { gte: startOfDay };
    }

    if (date) {
      const { startOfDay, endOfDay } = getClinicDayBounds(date, clinicTz);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startOfMonthStr = `${year}-${monthNum.padStart(2, "0")}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endOfMonthStr = `${year}-${monthNum.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const { startOfDay } = getClinicDayBounds(startOfMonthStr, clinicTz);
      const { endOfDay } = getClinicDayBounds(endOfMonthStr, clinicTz);
      where.date = { gte: startOfDay, lte: endOfDay };
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
    let { patientId, date, startTime, endTime, reason, notes, practitionerId, status = "CONFIRMED", isWalkIn, type = "IN_CLINIC" } = body;

    if (isWalkIn) {
      status = "CHECKED_IN";
    }

    if (!patientId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    const doctorTimezone = resolveClinicTimezone(doctor?.timezone);
    const daysOff = doctor?.daysOff || [];
    let workingStart = doctor?.workingHoursStart || "09:00";
    let workingEnd = doctor?.workingHoursEnd || "17:00";

    if (practitionerId) {
      const practitioner = await prisma.practitioner.findFirst({
        where: { id: practitionerId, doctorId, isActive: true },
        select: { workingHoursStart: true, workingHoursEnd: true },
      });
      if (practitioner?.workingHoursStart && practitioner?.workingHoursEnd) {
        workingStart = practitioner.workingHoursStart;
        workingEnd = practitioner.workingHoursEnd;
      }
    }

    // Extract exact YYYY-MM-DD date string in clinic timezone
    const dateStr = getClinicDateOnlyString(date, doctorTimezone);
    const tzOffset = getClinicTimezoneOffset(doctorTimezone, new Date(`${dateStr}T12:00:00Z`));
    const appointmentDate = new Date(`${dateStr}T00:00:00${tzOffset}`);
    const startDateTime = new Date(`${dateStr}T${startTime}:00${tzOffset}`);
    const endDateTime = new Date(`${dateStr}T${endTime}:00${tzOffset}`);

    // 2. Validate past dates & times (strictly in clinic timezone)
    const todayClinicStr = new Date().toLocaleDateString("en-CA", { timeZone: doctorTimezone });
    const isToday = dateStr === todayClinicStr;

    let isAppointmentPast = false;
    if (dateStr < todayClinicStr) {
      isAppointmentPast = true;
    } else if (isToday) {
      // Reject any slot that started in the past (allow 1 minute buffer for client-server clock drift/network latency)
      if (startDateTime.getTime() < Date.now() - 60000) {
        isAppointmentPast = true;
      }
    }

    if (isAppointmentPast) {
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
        date: appointmentDate,
        startTime: startDateTime,
        endTime: endDateTime,
        reason: reason || "",
        notes: notes || "",
        status: status,
        type: type as any,
        reminderSent: isWalkIn ? true : false,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        practitioner: {
          select: {
            name: true,
            specialty: true,
            calendarColor: true,
            consultationFee: true,
          },
        },
      },
    });

    // --- WhatsApp Notification Logic ---
    try {
      const doctorRecord = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          name: true,
          clinicName: true,
          address: true,
          city: true,
          googleMapsUri: true,
          enableBookingConfirmation: true,
          specialty: true
        }
      });

      if (!isWalkIn && whatsappManager.isConnected(doctorId) && doctorRecord?.enableBookingConfirmation !== false && appointment.patient.phone && status === "CONFIRMED") {
        const messageText = formatAppointmentConfirmationCard({
          patient: appointment.patient,
          doctorName: appointment.practitioner?.name || doctorRecord?.name,
          specialty: appointment.practitioner?.specialty || doctorRecord?.specialty || "General Physician",
          clinicName: doctorRecord?.clinicName,
          startTime: startDateTime,
          clinicTz: doctorTimezone,
          consultationFee: appointment.practitioner?.consultationFee,
          isTele: type === "TELE_CONSULTATION",
          address: doctorRecord?.address,
          city: doctorRecord?.city,
          mapsUrl: doctorRecord?.googleMapsUri,
        });

        const patientPhone = appointment.patient.phone;
        await whatsappManager.sendMessage(doctorId, patientPhone, messageText, "Clinic");
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