import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.gbpAccount.findMany();
  for (const acc of accounts) {
    console.log("Account ID:", acc.id);
    console.log("Location Name:", acc.locationName);
    const insights = acc.insightsData as any;
    console.log("Insights viewsChange:", typeof insights?.viewsChange);
    console.log("Insights totalViews:", insights?.totalViews);
    console.log("-----------------------");
  }
}
main();
