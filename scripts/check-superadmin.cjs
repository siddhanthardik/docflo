const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.doctor.findUnique({where: {email: 'superadmin@gyrex.in'}});
  console.log("User:", user);
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
