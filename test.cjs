const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({ include: { patient: true } });
  console.log(JSON.stringify(convs, null, 2));
}

main().finally(() => prisma.$disconnect());
