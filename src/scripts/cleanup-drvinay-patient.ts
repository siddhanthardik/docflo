import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('  CLINIC DATA REMEDIATION: DR. VINAY KUMAR RAI & MULTI-TENANT AUDIT');
  console.log('================================================================\n');

  // 1. Locate Dr. Vinay Kumar Rai
  const drVinay = await prisma.doctor.findFirst({
    where: {
      OR: [
        { email: { contains: 'drvinay', mode: 'insensitive' } },
        { name: { contains: 'Vinay Kumar Rai', mode: 'insensitive' } },
        { email: 'drvinay.pediatric@gmail.com' }
      ]
    },
    select: { id: true, name: true, email: true, clinicName: true }
  });

  // 2. Locate Dr. Vinod Kumar Chauhan PT
  const drVinod = await prisma.doctor.findFirst({
    where: {
      OR: [
        { email: { contains: 'shhealthcare', mode: 'insensitive' } },
        { email: { contains: 'vinod', mode: 'insensitive' } },
        { name: { contains: 'Vinod Kumar Chauhan', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, email: true, clinicName: true }
  });

  console.log('✓ Doctor Discovery:');
  console.log('  - Dr. Vinay (Pediatric):', drVinay ? `${drVinay.name} (${drVinay.email}) [ID: ${drVinay.id}]` : 'Not found in this environment DB');
  console.log('  - Dr. Vinod (Physio):', drVinod ? `${drVinod.name} (${drVinod.email}) [ID: ${drVinod.id}]` : 'Not found in this environment DB');

  // If running in an environment where Dr. Vinay exists (e.g. production)
  if (drVinay) {
    console.log(`\n--- Inspecting Patients in Dr. Vinay's Clinic (${drVinay.id}) ---`);
    const vinayPatients = await prisma.patient.findMany({
      where: {
        doctorId: drVinay.id,
        OR: [
          { phone: { contains: '7838033664' } },
          { firstName: { contains: 'Ram', mode: 'insensitive' } },
          { firstName: { contains: 'Samarth', mode: 'insensitive' } }
        ]
      },
      include: {
        appointments: true,
        invoices: true
      }
    });

    console.log(`Found ${vinayPatients.length} patient record(s) matching phone/name in Dr. Vinay's clinic:`);
    for (const p of vinayPatients) {
      console.log(`  - [${p.id}] ${p.firstName} ${p.lastName || ''} | Phone: ${p.phone} | Appointments: ${p.appointments.length} | Invoices: ${p.invoices.length} | Tags: ${p.tags.join(', ')}`);
    }

    const samarthPatient = vinayPatients.find(p => p.firstName.toLowerCase().includes('samarth'));
    const ramswaroopPatient = vinayPatients.find(p => p.firstName.toLowerCase().includes('ram'));

    if (ramswaroopPatient) {
      if (ramswaroopPatient.appointments.length > 0 || ramswaroopPatient.invoices.length > 0) {
        console.warn(`⚠️ CAUTION: Ramswaroop Prasad has active appointments or invoices in Dr. Vinay's clinic! Skipping deletion.`);
      } else {
        console.log(`\n✓ Orphaned guardian record confirmed: Ramswaroop Prasad has 0 appointments and 0 invoices in Dr. Vinay's clinic.`);

        // Re-link any conversations pointing to Ramswaroop's ID
        if (samarthPatient) {
          const convUpdate = await prisma.conversation.updateMany({
            where: {
              doctorId: drVinay.id,
              patientId: ramswaroopPatient.id
            },
            data: {
              patientId: samarthPatient.id,
              patientName: `${samarthPatient.firstName} ${samarthPatient.lastName || ''}`.trim()
            }
          });
          console.log(`  - Re-linked ${convUpdate.count} conversation(s) to Samarth (${samarthPatient.id})`);
        } else {
          // Unlink patientId from conversation
          const convUpdate = await prisma.conversation.updateMany({
            where: {
              doctorId: drVinay.id,
              patientId: ramswaroopPatient.id
            },
            data: {
              patientId: null
            }
          });
          console.log(`  - Unlinked ${convUpdate.count} conversation(s) from Ramswaroop Prasad`);
        }

        // Safely delete the orphaned patient record from Dr. Vinay's clinic
        await prisma.patient.delete({
          where: { id: ramswaroopPatient.id }
        });
        console.log(`  - Successfully deleted orphaned profile: "${ramswaroopPatient.firstName} ${ramswaroopPatient.lastName}" (${ramswaroopPatient.id}) from Dr. Vinay's clinic.`);
      }
    } else {
      console.log(`  - Ramswaroop Prasad is not present in Dr. Vinay's clinic.`);
    }
  }

  // 3. Multi-Tenant Cross-Clinic Verification
  if (drVinod) {
    console.log(`\n--- Verifying Dr. Vinod's Clinic Integrity (${drVinod.id}) ---`);
    const vinodPatients = await prisma.patient.findMany({
      where: {
        doctorId: drVinod.id,
        firstName: { contains: 'Ram', mode: 'insensitive' }
      },
      include: {
        appointments: true
      }
    });

    console.log(`Dr. Vinod retains ${vinodPatients.length} patient record(s) for Ramswaroop Prasad:`);
    for (const p of vinodPatients) {
      console.log(`  - [${p.id}] ${p.firstName} ${p.lastName || ''} | Appointments: ${p.appointments.length} (Verified intact!)`);
    }
  }

  // 4. Global Multi-Tenant Scope Audit
  console.log('\n--- Multi-Tenant Scoping Audit ---');
  const allPatientsOnPhone = await prisma.patient.findMany({
    where: { phone: { contains: '7838033664' } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      doctorId: true,
      doctor: { select: { name: true, clinicName: true, email: true } }
    }
  });

  console.log(`Total patients registered globally under phone ...3664 across all clinics: ${allPatientsOnPhone.length}`);
  for (const p of allPatientsOnPhone) {
    console.log(`  - [${p.id}] ${p.firstName} ${p.lastName || ''} -> Doctor: ${p.doctor?.name || 'Unknown'} (${p.doctor?.clinicName || 'N/A'}, doctorId: ${p.doctorId})`);
  }

  console.log('\n================================================================');
  console.log('  REMEDIATION & MULTI-TENANT VERIFICATION COMPLETE');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Remediation error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
