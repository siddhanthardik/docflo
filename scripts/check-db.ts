import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const account = await prisma.gbpAccount.findFirst({ orderBy: { createdAt: "desc" } });
  console.log(JSON.stringify(account?.insightsData, null, 2));
}
main();
