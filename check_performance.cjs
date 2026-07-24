const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.gbpAccount.findFirst({
    where: { lastSyncAt: { not: null } },
    orderBy: { updatedAt: 'desc' }
  });
  
  const snapshot = await prisma.gbpPerformanceSnapshot.findFirst({
    where: { gbpAccountId: account.id },
    orderBy: { date: 'desc' }
  });
  
  if (snapshot) {
    console.log(JSON.stringify(snapshot.json.multiDailyMetricTimeSeries[0], null, 2).substring(0, 500));
  } else {
    console.log("No snapshot");
  }
}

main().finally(() => prisma.$disconnect());
