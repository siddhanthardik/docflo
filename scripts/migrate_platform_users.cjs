const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration of platform users...");

  // Find all doctors that have platform roles
  const platformRoles = ["SUPERADMIN", "SUPERVISOR", "SUPPORT", "SALES", "MARKETING", "ACCOUNTS"];
  
  const existingPlatformUsers = await prisma.doctor.findMany({
    where: {
      role: {
        in: ["SUPERADMIN", "SALES", "ACCOUNTS", "MARKETING"],
      },
    },
  });

  console.log(`Found ${existingPlatformUsers.length} platform users in Doctor table.`);

  let migrated = 0;
  for (const user of existingPlatformUsers) {
    // Check if already in PlatformUser
    const existing = await prisma.platformUser.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      await prisma.platformUser.create({
        data: {
          id: user.id, // Preserve ID so existing relations/logs don't break
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role, // Prisma handles mapping the string to PlatformRole enum
        },
      });
      console.log(`Migrated: ${user.email} (${user.role})`);
      migrated++;
      
      // Optionally, we could delete the user from the Doctor table if they have no appointments/patients
      // But to be safe and avoid foreign key errors, we leave them or just remove their permissions.
      // Since `auth.ts` will check PlatformUser FIRST, it will authenticate them as a PlatformUser anyway!
    } else {
      console.log(`Skipped: ${user.email} (Already exists)`);
    }
  }

  console.log(`Migration complete! Migrated ${migrated} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
