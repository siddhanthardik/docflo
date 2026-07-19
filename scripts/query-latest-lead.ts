import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.auditLead.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(lead, null, 2));
}

main().finally(() => prisma.$disconnect());
