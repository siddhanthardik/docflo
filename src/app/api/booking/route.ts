import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, email, serviceId, date, time, doctorId } = body

    // Find or create patient
    let patient = await prisma.patient.findFirst({
      where: { doctorId, phone },
    })
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          doctorId,
          firstName,
          lastName,
          phone,
          email,
        },
      })
    }

    const service = await prisma.serviceType.findUnique({ where: { id: serviceId } })
    if (!service) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 })
    }

    // Create appointment
    const [hours, minutes] = time.split(":").map(Number)
    const startTime = new Date(date)
    startTime.setHours(hours, minutes, 0, 0)
    const endTime = new Date(startTime.getTime() + service.duration * 60000)

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        reason: service.name,
        status: "SCHEDULED",
      },
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error: any) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Booking failed" }, { status: 500 })
  }
}