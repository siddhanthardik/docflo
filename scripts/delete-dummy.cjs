const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.review.deleteMany({ where: { gbpAccountId: null } });
  console.log('Dummy reviews deleted');
}
main().finally(() => prisma.$disconnect());
