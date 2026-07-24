import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const doctor = await prisma.doctor.findUnique({
    where: { email: 'drvinay.pediatric@gmail.com' }
  });
  console.log("Doctor by email:", doctor);

  const count = await prisma.doctor.count();
  console.log("Total doctors:", count);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
