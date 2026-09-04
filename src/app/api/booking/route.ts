import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveClinicTimezone, createClinicAppointmentDateTimes } from "@/lib/timezone"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, email, serviceId, date, time, doctorId } = body

    const cleanPhone = (phone || "").replace(/\D/g, "");
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    const normalizedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (phone.startsWith("+") ? phone : `+${cleanPhone}`);

    // Find or create patient with resilient 10-digit matching
    let patient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { phone },
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
          ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
        ]
      },
    });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          doctorId,
          firstName,
          lastName,
          phone: normalizedPhone,
          email,
        },
      });
    }

    const service = await prisma.serviceType.findUnique({ where: { id: serviceId } })
    if (!service) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 })
    }

    // Fetch doctor's clinic timezone
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { timezone: true }
    });
    const clinicTz = resolveClinicTimezone(doctor?.timezone);

    // Create appointment with strict clinic timezone
    const [hours, minutes] = time.split(":").map(Number);
    const { startTime, endTime, dbAppointmentDate } = createClinicAppointmentDateTimes({
      dateStr: date,
      hour: hours,
      minute: minutes || 0,
      durationMinutes: service.duration,
      timezone: clinicTz
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        date: dbAppointmentDate,
        startTime,
        endTime,
        reason: service.name,
        status: "CONFIRMED",
      },
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error: any) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Booking failed" }, { status: 500 })
  }
}