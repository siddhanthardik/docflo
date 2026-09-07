import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveClinicTimezone, createClinicAppointmentDateTimes } from "@/lib/timezone"
import { whatsappManager } from "@/lib/whatsapp-manager"
import { formatAppointmentConfirmationCard } from "@/lib/whatsapp-formatter"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, email, serviceId, date, time, doctorId } = body

    const cleanPhone = (phone || "").replace(/\D/g, "");
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    const normalizedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (phone.startsWith("+") ? phone : `+${cleanPhone}`);

    // Find or create patient with resilient 10-digit matching AND firstName matching
    const reqFirstName = (firstName || "").trim();
    const reqLastName = (lastName || "").trim();

    let patient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { phone },
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
          ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
        ],
        firstName: { equals: reqFirstName, mode: "insensitive" }
      },
    });

    if (!patient) {
      // Enforce max 4 family members under the same mobile number
      const existingCount = await prisma.patient.count({
        where: {
          doctorId,
          OR: [
            { phone },
            { phone: cleanPhone },
            { phone: `+${cleanPhone}` },
            ...(last10.length >= 10 ? [{ phone: { endsWith: last10 } }] : [])
          ]
        }
      });

      if (existingCount >= 4) {
        return NextResponse.json(
          { error: `Maximum of 4 family members can be registered under mobile number (${last10}). Please use an alternate mobile number.` },
          { status: 409 }
        );
      }

      patient = await prisma.patient.create({
        data: {
          doctorId,
          firstName: reqFirstName,
          lastName: reqLastName,
          phone: normalizedPhone,
          email,
          tags: existingCount > 0 ? ["Web Booking", "Family Member"] : ["Web Booking"]
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
      select: {
        timezone: true,
        name: true,
        clinicName: true,
        specialty: true,
        address: true,
        city: true,
        enableBookingConfirmation: true
      }
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

    if (startTime.getTime() < Date.now() - 60000) {
      return NextResponse.json(
        { error: "Cannot book an appointment in the past. Please choose a future slot." },
        { status: 400 }
      );
    }

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
    });

    // Send formatted WhatsApp appointment confirmation if connected
    try {
      if (whatsappManager.isConnected(doctorId) && doctor?.enableBookingConfirmation !== false && patient.phone) {
        const mapsSearchUrl = doctor?.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([doctor.clinicName, doctor.address, doctor.city].filter(Boolean).join(", "))}`
          : null;

        const messageText = formatAppointmentConfirmationCard({
          patient: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            gender: patient.gender,
            dateOfBirth: patient.dateOfBirth
          },
          doctorName: doctor?.name,
          specialty: doctor?.specialty || "Medical Specialist",
          clinicName: doctor?.clinicName,
          startTime,
          clinicTz,
          consultationFee: service.price,
          address: doctor?.address,
          city: doctor?.city,
          mapsUrl: mapsSearchUrl
        });
        await whatsappManager.sendMessage(doctorId, patient.phone, messageText, "Clinic");
      }
    } catch (waErr) {
      console.error("[Booking] Failed to send WhatsApp confirmation:", waErr);
    }

    return NextResponse.json({ success: true, appointment })
  } catch (error: any) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Booking failed" }, { status: 500 })
  }
}