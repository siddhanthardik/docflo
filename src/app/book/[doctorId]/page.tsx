import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingForm } from "@/components/booking/booking-form"

async function getDoctor(doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { serviceTypes: true },
  })
  return doctor
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const { doctorId } = await params
  const doctor = await getDoctor(doctorId)
  if (!doctor) notFound()

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          Book with {doctor.name}
        </h1>
        <p className="text-gray-600 mb-6">{doctor.clinicName}</p>
        <BookingForm
          doctorId={doctor.id}
          services={doctor.serviceTypes}
        />
      </div>
    </main>
  )
}