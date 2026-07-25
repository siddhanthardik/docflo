import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
      include: {
        packageFeatures: true,
        prices: true
      }
    });
    console.log("Success:", packages.length, "packages found");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
