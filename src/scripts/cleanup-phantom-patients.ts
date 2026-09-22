import { PrismaClient } from '@prisma/client';
import { isLikelyPersonName, sanitizePersonName } from '../lib/utils';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const targetEmail = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1] || null;

  console.log('================================================================');
  console.log(`  CLEANUP PHANTOM WHATSAPP PATIENTS ${isDryRun ? '(DRY RUN PREVIEW)' : '(LIVE EXECUTION)'}`);
  console.log('================================================================\n');

  const doctorWhere: any = {};
  if (targetEmail) {
    doctorWhere.email = { contains: targetEmail, mode: 'insensitive' };
  }

  const doctors = await prisma.doctor.findMany({
    where: doctorWhere,
    select: { id: true, name: true, email: true, clinicName: true }
  });

  console.log(`Auditing across ${doctors.length} clinic doctor(s)...\n`);

  let totalPhantomsFound = 0;
  let totalConversationsUnlinked = 0;
  let totalPatientsDeleted = 0;

  for (const doc of doctors) {
    const candidatePatients = await prisma.patient.findMany({
      where: {
        doctorId: doc.id,
        appointments: { none: {} },
        invoices: { none: {} },
        vaccineRecords: { none: {} }
      },
      include: {
        conversations: { select: { id: true, patientPhone: true, patientName: true } }
      }
    });

    const phantoms = candidatePatients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName || ''}`.trim();
      const cleanName = sanitizePersonName(fullName);

      // Check 1: Commercial or business entity
      if (!isLikelyPersonName(cleanName)) {
        return true;
      }

      // Check 2: Purely placeholder names
      const lower = cleanName.toLowerCase();
      if (lower === 'patient' || lower === 'doctor' || lower === 'whatsapp lead') {
        return true;
      }

      // Check 3: Name equals phone number
      const digitsOnly = cleanName.replace(/\D/g, '');
      if (digitsOnly.length >= 8 && digitsOnly.length === cleanName.replace(/\s+/g, '').length) {
        return true;
      }

      return false;
    });

    if (phantoms.length === 0) continue;

    console.log(`Clinic: ${doc.name} (${doc.email || 'no-email'}) [ID: ${doc.id}]`);
    console.log(`Found ${phantoms.length} phantom unvisited patient(s):`);

    for (const phantom of phantoms) {
      totalPhantomsFound++;
      const fullName = `${phantom.firstName} ${phantom.lastName || ''}`.trim();
      console.log(`  - [ID: ${phantom.id}] "${fullName}" | Phone: ${phantom.phone} | Tags: ${phantom.tags.join(', ')} | Linked Chats: ${phantom.conversations.length}`);

      if (!isDryRun) {
        await prisma.$transaction(async (tx) => {
          // Unlink conversation so chat history remains completely intact
          if (phantom.conversations.length > 0) {
            await tx.conversation.updateMany({
              where: { patientId: phantom.id },
              data: { patientId: null }
            });
            totalConversationsUnlinked += phantom.conversations.length;
          }

          // Unlink waitlist & campaigns if any
          await tx.waitlistEntry.updateMany({
            where: { patientId: phantom.id },
            data: { patientId: null }
          });
          await tx.campaignRecipient.updateMany({
            where: { patientId: phantom.id },
            data: { patientId: null }
          });

          // Delete the dummy patient CRM profile
          await tx.patient.delete({
            where: { id: phantom.id }
          });
          totalPatientsDeleted++;
        });
        console.log(`    ↳ ✓ Unlinked ${phantom.conversations.length} conversation(s) and deleted dummy patient profile.`);
      }
    }
    console.log('');
  }

  console.log('----------------------------------------------------------------');
  console.log(`Summary:`);
  console.log(`  - Total Phantoms Detected: ${totalPhantomsFound}`);
  if (isDryRun) {
    console.log(`  - Dry Run: No changes were committed to the database.`);
    console.log(`  - Run without --dry-run to execute cleanup.`);
  } else {
    console.log(`  - Total Conversations Unlinked: ${totalConversationsUnlinked} (100% messages preserved)`);
    console.log(`  - Total Dummy Patient Profiles Purged: ${totalPatientsDeleted}`);
  }
  console.log('================================================================\n');
}

main()
  .catch(err => {
    console.error('Error during phantom patient cleanup:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
