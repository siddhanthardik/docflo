import { PrismaClient, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create a test doctor (skip if exists)
  const doctorEmail = 'siddhant.elantis@gmail.com'
  let doctor = await prisma.doctor.findUnique({ where: { email: doctorEmail } })

  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        email: doctorEmail,
        password: await bcrypt.hash('password123', 12),
        name: 'Dr. Test',
        phone: '+15551234567',
        specialty: 'General Medicine',
        clinicName: 'Gyrex Clinic',
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
        status: 'CONFIRMED' as AppointmentStatus,
      },
      {
        patientId: patients[1].id,
        doctorId: doctor.id,
        date: tomorrow,
        startTime: setTime(tomorrow, 11, 0),
        endTime: setTime(tomorrow, 11, 30),
        reason: 'Blood pressure review',
        status: 'CONFIRMED' as AppointmentStatus,
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

  // 4. SEED / UPDATE PACKAGES (Starter: 1499, Growth: 2499, Premium: 3999)
  console.log('🚀 Updating packages in database...')

  // Starter
  const starter = await prisma.package.upsert({
    where: { slug: 'starter' },
    update: {
      name: 'Starter',
      description: 'Grow your local presence on Google Maps & build 5-star reviews',
      priceMonthly: 1499,
      priceQuarterly: 4048,
      priceYearly: 14390,
      isActive: true,
      isArchived: false,
    },
    create: {
      slug: 'starter',
      name: 'Starter',
      description: 'Grow your local presence on Google Maps & build 5-star reviews',
      priceMonthly: 1499,
      priceQuarterly: 4048,
      priceYearly: 14390,
      isActive: true,
      isArchived: false,
    },
  })

  await prisma.packagePrice.upsert({
    where: { packageId_countryCode: { packageId: starter.id, countryCode: 'IN' } },
    update: { currency: 'INR', priceMonthly: 1499, priceQuarterly: 4048, priceYearly: 14390 },
    create: { packageId: starter.id, countryCode: 'IN', currency: 'INR', priceMonthly: 1499, priceQuarterly: 4048, priceYearly: 14390 }
  })

  await prisma.packageModule.deleteMany({ where: { packageId: starter.id } })
  await prisma.packageModule.createMany({
    data: [
      { packageId: starter.id, moduleName: 'CLINIC_CORE' },
      { packageId: starter.id, moduleName: 'GROWTH_SEO' }
    ]
  })

  await prisma.packageLimit.deleteMany({ where: { packageId: starter.id } })
  await prisma.packageLimit.createMany({
    data: [
      { packageId: starter.id, limitName: 'MAX_STAFF_SEATS', limitValue: 3 },
      { packageId: starter.id, limitName: 'MAX_PATIENTS', limitValue: null },
      { packageId: starter.id, limitName: 'MAX_GBP_LOCATIONS', limitValue: 1 },
      { packageId: starter.id, limitName: 'MAX_TRACKED_KEYWORDS', limitValue: 5 },
      { packageId: starter.id, limitName: 'MAX_SCHEDULED_POSTS', limitValue: 4 },
      { packageId: starter.id, limitName: 'AI_CREDITS_PER_MONTH', limitValue: 50 },
    ]
  })

  // Growth
  const growth = await prisma.package.upsert({
    where: { slug: 'growth' },
    update: {
      name: 'Growth',
      description: 'Full clinical website, Google Maps SEO & digital practice billing',
      priceMonthly: 2499,
      priceQuarterly: 6748,
      priceYearly: 23990,
      isActive: true,
      isArchived: false,
    },
    create: {
      slug: 'growth',
      name: 'Growth',
      description: 'Full clinical website, Google Maps SEO & digital practice billing',
      priceMonthly: 2499,
      priceQuarterly: 6748,
      priceYearly: 23990,
      isActive: true,
      isArchived: false,
    },
  })

  await prisma.packagePrice.upsert({
    where: { packageId_countryCode: { packageId: growth.id, countryCode: 'IN' } },
    update: { currency: 'INR', priceMonthly: 2499, priceQuarterly: 6748, priceYearly: 23990 },
    create: { packageId: growth.id, countryCode: 'IN', currency: 'INR', priceMonthly: 2499, priceQuarterly: 6748, priceYearly: 23990 }
  })

  await prisma.packageModule.deleteMany({ where: { packageId: growth.id } })
  await prisma.packageModule.createMany({
    data: [
      { packageId: growth.id, moduleName: 'CLINIC_CORE' },
      { packageId: growth.id, moduleName: 'GROWTH_SEO' },
      { packageId: growth.id, moduleName: 'WHATSAPP_CRM' }
    ]
  })

  await prisma.packageLimit.deleteMany({ where: { packageId: growth.id } })
  await prisma.packageLimit.createMany({
    data: [
      { packageId: growth.id, limitName: 'MAX_STAFF_SEATS', limitValue: 10 },
      { packageId: growth.id, limitName: 'MAX_PATIENTS', limitValue: null },
      { packageId: growth.id, limitName: 'MAX_GBP_LOCATIONS', limitValue: 1 },
      { packageId: growth.id, limitName: 'MAX_TRACKED_KEYWORDS', limitValue: 10 },
      { packageId: growth.id, limitName: 'MAX_SCHEDULED_POSTS', limitValue: 15 },
      { packageId: growth.id, limitName: 'AI_CREDITS_PER_MONTH', limitValue: 150 },
    ]
  })

  // Premium / Autopilot (₹3,999)
  const existingPremium = await prisma.package.findFirst({
    where: {
      OR: [
        { slug: 'premium-autopilot' },
        { slug: 'premium' },
        { name: { contains: 'Premium', mode: 'insensitive' } },
        { name: { contains: 'Autopilot', mode: 'insensitive' } }
      ]
    }
  })

  const premium = await prisma.package.upsert({
    where: { id: existingPremium?.id || 'non-existent-premium-id' },
    update: {
      slug: 'premium-autopilot',
      name: 'Premium / Autopilot',
      description: '24/7 Front-Desk Multilingual WhatsApp AI Receptionist & Full Clinic Suite',
      priceMonthly: 3999,
      priceQuarterly: 10798,
      priceYearly: 38390,
      isActive: true,
      isArchived: false,
    },
    create: {
      slug: 'premium-autopilot',
      name: 'Premium / Autopilot',
      description: '24/7 Front-Desk Multilingual WhatsApp AI Receptionist & Full Clinic Suite',
      priceMonthly: 3999,
      priceQuarterly: 10798,
      priceYearly: 38390,
      isActive: true,
      isArchived: false,
    },
  })

  await prisma.packagePrice.upsert({
    where: { packageId_countryCode: { packageId: premium.id, countryCode: 'IN' } },
    update: { currency: 'INR', priceMonthly: 3999, priceQuarterly: 10798, priceYearly: 38390 },
    create: { packageId: premium.id, countryCode: 'IN', currency: 'INR', priceMonthly: 3999, priceQuarterly: 10798, priceYearly: 38390 }
  })

  await prisma.packageModule.deleteMany({ where: { packageId: premium.id } })
  await prisma.packageModule.createMany({
    data: [
      { packageId: premium.id, moduleName: 'CLINIC_CORE' },
      { packageId: premium.id, moduleName: 'GROWTH_SEO' },
      { packageId: premium.id, moduleName: 'WHATSAPP_CRM' },
      { packageId: premium.id, moduleName: 'AI_ASSISTANT' }
    ]
  })

  await prisma.packageLimit.deleteMany({ where: { packageId: premium.id } })
  await prisma.packageLimit.createMany({
    data: [
      { packageId: premium.id, limitName: 'MAX_STAFF_SEATS', limitValue: null },
      { packageId: premium.id, limitName: 'MAX_PATIENTS', limitValue: null },
      { packageId: premium.id, limitName: 'MAX_GBP_LOCATIONS', limitValue: 1 },
      { packageId: premium.id, limitName: 'MAX_TRACKED_KEYWORDS', limitValue: null },
      { packageId: premium.id, limitName: 'MAX_SCHEDULED_POSTS', limitValue: null },
      { packageId: premium.id, limitName: 'AI_CREDITS_PER_MONTH', limitValue: null },
    ]
  })

  // Archive standalone AI Receptionist if exists
  const aiReceptionistPkg = await prisma.package.findFirst({
    where: {
      OR: [
        { slug: 'ai-receptionist' },
        { name: { equals: 'AI Receptionist', mode: 'insensitive' } }
      ]
    }
  })

  if (aiReceptionistPkg) {
    await prisma.package.update({
      where: { id: aiReceptionistPkg.id },
      data: { isArchived: true }
    })
  }

  console.log('🎉 Seeding and package update completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })