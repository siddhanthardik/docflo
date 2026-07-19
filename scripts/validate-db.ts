import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctorsWithoutPackage = await prisma.doctor.count({
    where: { packageId: null },
  });
  console.log(`Doctors without package: ${doctorsWithoutPackage}`);
  if (doctorsWithoutPackage > 0) {
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
