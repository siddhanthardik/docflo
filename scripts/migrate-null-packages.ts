import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration for NULL packages...');

  // 1. Find the Starter package
  const starterPackage = await prisma.package.findFirst({
    where: { name: 'STARTER' }
  });

  if (!starterPackage) {
    console.error('Error: STARTER package not found in the database. Please seed the database first.');
    process.exit(1);
  }

  // 2. Count how many doctors have a null packageId
  const nullCount = await prisma.doctor.count({
    where: { packageId: null }
  });

  console.log(`Found ${nullCount} doctors without a package assigned.`);

  if (nullCount === 0) {
    console.log('No migration needed. All doctors have packages.');
    process.exit(0);
  }

  // 3. Update all doctors with null packageId to the Starter package
  const updateResult = await prisma.doctor.updateMany({
    where: { packageId: null },
    data: { packageId: starterPackage.id }
  });

  console.log(`Successfully assigned STARTER package to ${updateResult.count} doctors.`);

  // 4. Verify no doctors remain without a package
  const remainingCount = await prisma.doctor.count({
    where: { packageId: null }
  });

  if (remainingCount === 0) {
    console.log('Verification passed: 0 doctors remaining without a package.');
  } else {
    console.error(`Verification failed: ${remainingCount} doctors still have no package.`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
