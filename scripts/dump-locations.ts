import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.gbpAccount.findMany({
    select: {
      id: true,
      locationName: true,
      insightsData: true
    }
  });

  console.log("GBP Accounts:");
  accounts.forEach(acc => {
    console.log(`ID: ${acc.id}`);
    console.log(`Location Name: ${acc.locationName}`);
    console.log(`Insights Name: ${(acc.insightsData as any)?.name}`);
    console.log('---');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
