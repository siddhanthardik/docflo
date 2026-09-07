const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== GYREX PATIENT IDENTITY REMEDIATION SCRIPT ===\n');

  // 1. Locate primary patient row (by production ID or fallback)
  let primaryPatient = await prisma.patient.findFirst({
    where: {
      id: { in: ['cmtkaf6z2002fkkn1y92ztz7g', 'cmru2wt9e0004vh04g275aqhu'] }
    },
    include: {
      invoices: true,
      appointments: true,
      doctor: { select: { id: true, name: true, email: true } }
    }
  });

  // Fallback search by phone if ID differs across environments
  if (!primaryPatient) {
    console.log('Patient with ID cmru2wt9e0004vh04g275aqhu not found by direct ID. Searching by phone 7838033664...');
    primaryPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: '+917838033664' },
          { phone: '917838033664' },
          { phone: '7838033664' },
          { phone: { endsWith: '7838033664' } }
        ],
        invoices: { some: {} } // The primary patient has historical invoices
      },
      include: {
        invoices: true,
        appointments: true,
        doctor: { select: { id: true, name: true, email: true } }
      }
    });
  }

  if (!primaryPatient) {
    console.error('❌ Could not locate primary patient record for Siddhant.');
    return;
  }

  const doctorId = primaryPatient.doctorId;
  console.log(`✓ Located Primary Patient Record:`);
  console.log(`  ID: ${primaryPatient.id}`);
  console.log(`  Current Name: "${primaryPatient.firstName} ${primaryPatient.lastName || ''}".trim()`);
  console.log(`  Doctor: ${primaryPatient.doctor?.name} (${doctorId})`);
  console.log(`  Linked Invoices: ${primaryPatient.invoices.length}`);
  console.log(`  Linked Appointments: ${primaryPatient.appointments.length}`);

  // 2. Revert Primary Patient Name to Siddhant
  const updatedPrimary = await prisma.patient.update({
    where: { id: primaryPatient.id },
    data: {
      firstName: 'Siddhant',
      lastName: '',
      tags: primaryPatient.tags.filter(t => t !== 'Family Member')
    }
  });
  console.log(`\n✓ Restored Primary Patient Name to: "${updatedPrimary.firstName}" (ID: ${updatedPrimary.id})`);
  console.log(`  -> All ${primaryPatient.invoices.length} historical invoices will now correctly display "Siddhant".`);

  // 3. Check / Create 2nd Family Member profile for Ramswaroop Prasad
  let fatherPatient = await prisma.patient.findFirst({
    where: {
      doctorId,
      OR: [
        { phone: '+917838033664' },
        { phone: '917838033664' },
        { phone: { endsWith: '7838033664' } }
      ],
      firstName: { equals: 'Ramswaroop', mode: 'insensitive' }
    }
  });

  if (!fatherPatient) {
    fatherPatient = await prisma.patient.create({
      data: {
        doctorId,
        firstName: 'Ramswaroop',
        lastName: 'Prasad',
        phone: '+917838033664',
        gender: 'Male',
        patientType: 'ACTIVE',
        primaryPractitionerId: primaryPatient.primaryPractitionerId,
        tags: ['WhatsApp', 'Family Member']
      }
    });
    console.log(`\n✓ Created dedicated 2nd Family Member profile for Ramswaroop Prasad (ID: ${fatherPatient.id})`);
  } else {
    console.log(`\n✓ Dedicated profile for Ramswaroop Prasad already exists (ID: ${fatherPatient.id})`);
  }

  // 4. Move any recent appointments meant for the father to Ramswaroop Prasad's profile
  const recentApts = await prisma.appointment.findMany({
    where: {
      doctorId,
      patientId: primaryPatient.id,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    },
    include: { practitioner: true }
  });

  console.log(`\nChecking ${recentApts.length} recent appointment(s) on this phone:`);
  for (const apt of recentApts) {
    const notesAndReason = `${apt.notes || ''} ${apt.reason || ''}`.toLowerCase();
    const isFatherApt = notesAndReason.includes('father') || notesAndReason.includes('papa') || notesAndReason.includes('ramswaroop');
    
    // If appointment notes mention father, or if it is the latest active appointment booked today/tomorrow
    if (isFatherApt || (apt.status === 'CONFIRMED' && apt.date >= new Date(new Date().setHours(0,0,0,0)))) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { patientId: fatherPatient.id }
      });
      console.log(`  -> Moved Appointment ${apt.id} (${apt.date.toISOString().split('T')[0]}) to Ramswaroop Prasad's profile.`);
    } else {
      console.log(`  -> Kept Appointment ${apt.id} with Siddhant.`);
    }
  }

  console.log('\n=== REMEDIATION COMPLETE ===');
}

main()
  .catch((e) => {
    console.error('Error during remediation:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
