const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED'`)
  } catch (e) {
    console.log("Error adding CONFIRMED", e.message)
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "AppointmentStatus" ADD VALUE 'CHECKED_IN'`)
  } catch (e) {
    console.log("Error adding CHECKED_IN", e.message)
  }
  
  await prisma.$executeRawUnsafe(`UPDATE "appointments" SET "status" = 'CONFIRMED' WHERE "status" = 'SCHEDULED'`)
  console.log("Successfully updated rows")
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
