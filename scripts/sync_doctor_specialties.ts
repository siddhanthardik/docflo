import { prisma } from "../src/lib/prisma";

async function syncDoctorSpecialties() {
  console.log("🔍 Checking doctors for missing or out-of-sync specialties...");

  const doctors = await prisma.doctor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      specialty: true,
      practitioners: {
        select: {
          id: true,
          name: true,
          specialty: true,
          isOwner: true,
        },
        orderBy: [{ isOwner: "desc" }, { displayOrder: "asc" }]
      },
      gbpAccounts: {
        select: { insightsData: true },
        orderBy: { lastSyncAt: "desc" },
        take: 1
      }
    }
  });

  console.log(`Found ${doctors.length} doctor account(s).`);

  let updatedCount = 0;

  for (const doc of doctors) {
    const ownerPractitioner = doc.practitioners.find(p => p.isOwner) || doc.practitioners[0];
    const gbpInsights = doc.gbpAccounts[0]?.insightsData as Record<string, any> | null;
    const gbpPrimaryCategory = gbpInsights?.categories?.primaryCategory?.displayName ||
      (typeof gbpInsights?.primaryCategory === 'string' ? gbpInsights.primaryCategory : undefined);

    const resolvedSpecialty = 
      doc.specialty?.trim() ||
      ownerPractitioner?.specialty?.trim() ||
      gbpPrimaryCategory?.trim() ||
      null;

    if (resolvedSpecialty && (!doc.specialty || doc.specialty.trim() !== resolvedSpecialty)) {
      console.log(`✨ Updating Doctor: "${doc.name}" (${doc.email}) -> Specialty: "${resolvedSpecialty}" (Source: ${doc.specialty ? 'Existing' : (ownerPractitioner?.specialty ? 'Owner Practitioner' : 'GBP Primary Category')})`);
      await prisma.doctor.update({
        where: { id: doc.id },
        data: { specialty: resolvedSpecialty }
      });
      updatedCount++;
    }

    // Also ensure owner practitioner has the specialty if practitioner was empty
    if (ownerPractitioner && !ownerPractitioner.specialty && resolvedSpecialty) {
      console.log(`  └─ Also syncing Owner Practitioner "${ownerPractitioner.name}" -> Specialty: "${resolvedSpecialty}"`);
      await prisma.practitioner.update({
        where: { id: ownerPractitioner.id },
        data: { specialty: resolvedSpecialty }
      });
    }
  }

  console.log(`\n✅ Specialty synchronization complete! Updated ${updatedCount} doctor(s).`);
}

syncDoctorSpecialties()
  .catch((err) => {
    console.error("❌ Synchronization failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
