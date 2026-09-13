import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding packages...");
  const free = await prisma.package.create({
    data: {
      name: "FREE",
      description: "For new clinics getting started",
      price: 0,
      features: { maxKeywords: 0, whatsappIntegration: false, geoGrid: false }
    }
  });

  const starter = await prisma.package.create({
    data: {
      name: "STARTER",
      description: "Grow your local presence",
      price: 29,
      features: { maxKeywords: 5, whatsappIntegration: false, geoGrid: true }
    }
  });

  const growth = await prisma.package.create({
    data: {
      name: "GROWTH",
      description: "Dominate your local market",
      price: 99,
      features: { maxKeywords: 20, whatsappIntegration: true, geoGrid: true, prioritySupport: true }
    }
  });

  const enterprise = await prisma.package.create({
    data: {
      name: "ENTERPRISE",
      description: "For multi-location practices",
      price: 299,
      features: { maxKeywords: 9999, whatsappIntegration: true, geoGrid: true, customIntegrations: true }
    }
  });

  console.log("Packages seeded.");

  console.log("Creating SUPERADMIN user...");
  const existingSuperadmin = await prisma.doctor.findUnique({
    where: { email: "superadmin@gyrex.in" }
  });

  if (!existingSuperadmin) {
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || "Admin@" + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(adminPass, 10);
    await prisma.doctor.create({
      data: {
        email: "superadmin@gyrex.in",
        password: hashedPassword,
        name: "Gyrex Superadmin",
        role: UserRole.SUPERADMIN,
        packageId: enterprise.id,
      }
    });
    console.log(`Superadmin created: superadmin@gyrex.in (Password configured via INITIAL_ADMIN_PASSWORD)`);
  } else {
    console.log("Superadmin already exists.");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
