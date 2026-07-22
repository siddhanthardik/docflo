const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.doctor.findUnique({where: {email: 'superadmin@gyrex.in'}});
  const isValid = await bcrypt.compare('SuperAdmin123!', user.password);
  console.log("Password is valid:", isValid);
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
