import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.package.findMany().then(packages => {
  console.log('Packages:');
  packages.forEach(p => console.log(p.name, p.id));
}).finally(() => prisma.$disconnect());
