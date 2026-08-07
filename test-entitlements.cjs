const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const doctor = await prisma.doctor.findFirst();
    console.log('Doctor ID:', doctor.id);
    const pkg = await prisma.package.findUnique({ where: { id: doctor.packageId }, include: { modules: true } });
    if (pkg) {
      console.log('Modules:', pkg.modules.map(m => m.moduleName));
    } else {
      console.log('No package assigned');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
