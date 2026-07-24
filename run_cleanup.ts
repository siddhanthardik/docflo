import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe("UPDATE engine_runs SET status = 'SUCCESS' WHERE status = 'PARTIAL'");
  await prisma.$executeRawUnsafe("UPDATE gbp_snapshots SET \"scanStatus\" = 'SUCCESS' WHERE \"scanStatus\" = 'PARTIAL'");
  await prisma.$executeRawUnsafe("UPDATE competitor_snapshots SET \"scanStatus\" = 'SUCCESS' WHERE \"scanStatus\" = 'PARTIAL'");
  console.log('Done');
}
main().finally(() => prisma.$disconnect());
