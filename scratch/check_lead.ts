import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const leads = await prisma.platformLead.findMany({
    where: { 
      OR: [
        { email: 'drvinay.pediatric@gmail.com' },
        { name: { contains: 'Vinay' } }
      ]
    }
  });
  console.log("Leads:", leads);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
