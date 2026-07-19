import { prisma } from '../src/lib/prisma';
import { ModuleName, LimitName } from '@prisma/client';

async function main() {
  console.log("Validating Phase 3 DB Schema & Operations...");

  // 1. Create a Package
  const pkg = await prisma.package.create({
    data: {
      slug: "test-pkg-" + Date.now(),
      name: "Test Package",
      priceMonthly: 99,
      modules: {
        create: [
          { moduleName: ModuleName.CLINIC_CORE },
          { moduleName: ModuleName.AI_ASSISTANT }
        ]
      },
      limits: {
        create: [
          { limitName: LimitName.MAX_STAFF_SEATS, limitValue: 5 }
        ]
      }
    },
    include: { modules: true, limits: true }
  });
  console.log("Created Package:", pkg.name, "with", pkg.modules.length, "modules");

  // 2. Clone it
  const cloned = await prisma.package.create({
    data: {
      slug: "test-pkg-clone-" + Date.now(),
      name: pkg.name + " (Clone)",
      priceMonthly: pkg.priceMonthly,
      modules: {
        create: pkg.modules.map(m => ({ moduleName: m.moduleName }))
      },
      limits: {
        create: pkg.limits.map(l => ({ limitName: l.limitName, limitValue: l.limitValue }))
      }
    },
    include: { modules: true, limits: true }
  });
  console.log("Cloned Package:", cloned.name);

  // 3. Create a dummy doctor
  const doc = await prisma.doctor.create({
    data: {
      email: "testdoc" + Date.now() + "@test.com",
      password: "test",
      name: "Test Doctor"
    }
  });

  // 4. Assign package to doctor and create history
  await prisma.$transaction([
    prisma.doctor.update({
      where: { id: doc.id },
      data: { packageId: pkg.id }
    }),
    prisma.subscriptionHistory.create({
      data: {
        doctorId: doc.id,
        newPackageId: pkg.id,
        changedById: "system",
        changedByRole: "ADMIN",
        reason: "Test assignment"
      }
    })
  ]);
  console.log("Assigned Package to Doctor and created SubscriptionHistory");

  // 5. Cleanup
  await prisma.doctor.delete({ where: { id: doc.id } });
  await prisma.package.delete({ where: { id: pkg.id } });
  await prisma.package.delete({ where: { id: cloned.id } });
  
  console.log("Validation Successful!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
