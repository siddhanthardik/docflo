import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("--- CHECKING COLUMNS FOR PLATFORM_USERS, DOCTORS, STAFF_MEMBERS ---");

  const platformColumns = await prisma.$queryRawUnsafe<any[]>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_users';`
  );
  console.log("platform_users columns:", platformColumns.map(c => c.column_name));

  const doctorColumns = await prisma.$queryRawUnsafe<any[]>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors';`
  );
  console.log("doctors columns:", doctorColumns.map(c => c.column_name));

  const staffColumns = await prisma.$queryRawUnsafe<any[]>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'staff_members';`
  );
  console.log("staff_members columns:", staffColumns.map(c => c.column_name));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
