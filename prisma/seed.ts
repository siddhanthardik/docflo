import { PrismaClient, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create a test doctor (skip if exists)
  const doctorEmail = 'doctor@docflo.com'
  let doctor = await prisma.doctor.findUnique({ where: { email: doctorEmail } })

  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        email: doctorEmail,
        password: await bcrypt.hash('password123', 12),
        name: 'Dr. Test',
        phone: '+15551234567',
        specialty: 'General Medicine',
        clinicName: 'Docflo Clinic',
        address: '123 Health Street',
        city: 'New York',
        state: 'NY',
      },
    })
    console.log('✅ Doctor created:', doctor.email)
  } else {
    console.log('⏭️  Doctor already exists')
  }

  // 2. Create sample patients
  const patientsData = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1555100001',
      email: 'alice@example.com',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Female',
      bloodGroup: 'A+',
      address: '456 Oak Ave',
      medicalNotes: 'Allergic to penicillin',
      tags: ['asthma', 'follow-up'],
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '+1555100002',
      email: 'bob@example.com',
      dateOfBirth: new Date('1985-09-20'),
      gender: 'Male',
      bloodGroup: 'O+',
      medicalNotes: 'Hypertension, on medication',
      tags: ['hypertension'],
    },
    {
      firstName: 'Carol',
      lastName: 'Williams',
      phone: '+1555100003',
      dateOfBirth: new Date('2000-12-01'),
      gender: 'Female',
      bloodGroup: 'B+',
      tags: ['new-patient'],
    },
  ]

  for (const data of patientsData) {
    const existing = await prisma.patient.findFirst({
      where: { doctorId: doctor.id, phone: data.phone },
    })
    if (!existing) {
      await prisma.patient.create({
        data: {
          ...data,
          doctorId: doctor.id,
        },
      })
      console.log(`✅ Patient ${data.firstName} ${data.lastName} created`)
    } else {
      console.log(`⏭️  Patient ${data.firstName} ${data.lastName} already exists`)
    }
  }

  // 3. Create sample appointments
  const patients = await prisma.patient.findMany({
    where: { doctorId: doctor.id },
  })

  if (patients.length >= 2) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Helper to set time on a date
    function setTime(date: Date, hours: number, minutes: number) {
      const d = new Date(date)
      d.setHours(hours, minutes, 0, 0)
      return d
    }

    const appointmentsData = [
      {
        patientId: patients[0].id,
        doctorId: doctor.id,
        date: tomorrow,
        startTime: setTime(tomorrow, 10, 0),
        endTime: setTime(tomorrow, 10, 30),
        reason: 'General checkup',
        status: 'SCHEDULED' as AppointmentStatus,
      },
      {
        patientId: patients[1].id,
        doctorId: doctor.id,
        date: tomorrow,
        startTime: setTime(tomorrow, 11, 0),
        endTime: setTime(tomorrow, 11, 30),
        reason: 'Blood pressure review',
        status: 'SCHEDULED' as AppointmentStatus,
      },
      {
        patientId: patients[0].id,
        doctorId: doctor.id,
        date: today,
        startTime: setTime(today, 15, 0),
        endTime: setTime(today, 15, 30),
        reason: 'Follow-up visit',
        status: 'COMPLETED' as AppointmentStatus,
        notes: 'Patient improved, continue treatment',
      },
    ];

    for (const apt of appointmentsData) {
      const exists = await prisma.appointment.findFirst({
        where: {
          patientId: apt.patientId,
          date: apt.date,
          startTime: apt.startTime,
        },
      })
      if (!exists) {
        await prisma.appointment.create({ data: apt })
        console.log(`✅ Appointment for patient ${apt.patientId} on ${apt.date.toISOString()} created`)
      } else {
        console.log(`⏭️  Appointment already exists`)
      }
    }
  }

  console.log('🎉 Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })