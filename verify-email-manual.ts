import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'siddhant.elantis@gmail.com'

  const doctor = await prisma.doctor.findUnique({ where: { email } })

  if (doctor) {
    console.log(`Found doctor with email ${email}. Updating emailVerified...`)
    await prisma.doctor.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      }
    })
    console.log('Email successfully verified!')
  } else {
    console.log(`Doctor with email ${email} not found.`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
