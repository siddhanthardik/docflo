import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Practitioner migration...");
  
  const doctors = await prisma.doctor.findMany({
    include: {
      practitioners: true
    }
  });

  let migratedCount = 0;

  for (const doctor of doctors) {
    if (doctor.practitioners.length === 0) {
      console.log(`Creating Owner Practitioner for Doctor: ${doctor.name} (${doctor.id})`);
      await prisma.practitioner.create({
        data: {
          doctorId: doctor.id,
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          specialty: doctor.specialty,
          isOwner: true,
          isActive: true,

          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHoursStart: doctor.workingHoursStart || "09:00",
          workingHoursEnd: doctor.workingHoursEnd || "17:00",
          displayOrder: 0
        }
      });
      migratedCount++;
    }
  }

  console.log(`Migration complete. Created ${migratedCount} owner practitioners.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
