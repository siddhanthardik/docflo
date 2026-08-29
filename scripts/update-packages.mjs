import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Updating and locking exact packages in PostgreSQL...");

  // 1. STARTER (₹1,499)
  const starter = await prisma.package.findFirst({
    where: { slug: "starter" }
  });
  if (starter) {
    await prisma.package.update({
      where: { id: starter.id },
      data: {
        name: "STARTER",
        description: "Grow your local presence on Google Maps & build 5-star reviews",
        priceMonthly: 1499,
        priceQuarterly: 4048,
        priceYearly: 14390,
        isActive: true,
        isArchived: false,
      }
    });

    await prisma.packagePrice.upsert({
      where: { packageId_countryCode: { packageId: starter.id, countryCode: "IN" } },
      update: { currency: "INR", priceMonthly: 1499, priceQuarterly: 4048, priceYearly: 14390 },
      create: { packageId: starter.id, countryCode: "IN", currency: "INR", priceMonthly: 1499, priceQuarterly: 4048, priceYearly: 14390 }
    });

    await prisma.packageModule.deleteMany({ where: { packageId: starter.id } });
    await prisma.packageModule.createMany({
      data: [
        { packageId: starter.id, moduleName: "CLINIC_CORE" },
        { packageId: starter.id, moduleName: "GROWTH_SEO" }
      ]
    });

    await prisma.packageLimit.deleteMany({ where: { packageId: starter.id } });
    await prisma.packageLimit.createMany({
      data: [
        { packageId: starter.id, limitName: "MAX_STAFF_SEATS", limitValue: 3 },
        { packageId: starter.id, limitName: "MAX_PATIENTS", limitValue: null },
        { packageId: starter.id, limitName: "MAX_GBP_LOCATIONS", limitValue: 1 },
        { packageId: starter.id, limitName: "MAX_TRACKED_KEYWORDS", limitValue: 5 },
        { packageId: starter.id, limitName: "MAX_SCHEDULED_POSTS", limitValue: 4 },
        { packageId: starter.id, limitName: "AI_CREDITS_PER_MONTH", limitValue: 50 },
      ]
    });
    console.log("✅ STARTER locked at ₹1,499/mo");
  }

  // 2. GROWTH (₹2,499)
  const growth = await prisma.package.findFirst({
    where: { slug: "growth" }
  });
  if (growth) {
    await prisma.package.update({
      where: { id: growth.id },
      data: {
        name: "GROWTH",
        description: "Full clinical website, Google Maps SEO & digital practice billing",
        priceMonthly: 2499,
        priceQuarterly: 6748,
        priceYearly: 23990,
        isActive: true,
        isArchived: false,
      }
    });

    await prisma.packagePrice.upsert({
      where: { packageId_countryCode: { packageId: growth.id, countryCode: "IN" } },
      update: { currency: "INR", priceMonthly: 2499, priceQuarterly: 6748, priceYearly: 23990 },
      create: { packageId: growth.id, countryCode: "IN", currency: "INR", priceMonthly: 2499, priceQuarterly: 6748, priceYearly: 23990 }
    });

    await prisma.packageModule.deleteMany({ where: { packageId: growth.id } });
    await prisma.packageModule.createMany({
      data: [
        { packageId: growth.id, moduleName: "CLINIC_CORE" },
        { packageId: growth.id, moduleName: "GROWTH_SEO" },
        { packageId: growth.id, moduleName: "WHATSAPP_CRM" }
      ]
    });

    await prisma.packageLimit.deleteMany({ where: { packageId: growth.id } });
    await prisma.packageLimit.createMany({
      data: [
        { packageId: growth.id, limitName: "MAX_STAFF_SEATS", limitValue: 10 },
        { packageId: growth.id, limitName: "MAX_PATIENTS", limitValue: null },
        { packageId: growth.id, limitName: "MAX_GBP_LOCATIONS", limitValue: 1 },
        { packageId: growth.id, limitName: "MAX_TRACKED_KEYWORDS", limitValue: 10 },
        { packageId: growth.id, limitName: "MAX_SCHEDULED_POSTS", limitValue: 15 },
        { packageId: growth.id, limitName: "AI_CREDITS_PER_MONTH", limitValue: 150 },
      ]
    });
    console.log("✅ GROWTH locked at ₹2,499/mo");
  }

  // 3. PREMIUM (₹3,999)
  const premium = await prisma.package.findFirst({
    where: {
      OR: [
        { slug: "premium" },
        { name: { contains: "Premium", mode: "insensitive" } },
        { name: { contains: "Autopilot", mode: "insensitive" } }
      ]
    }
  });
  if (premium) {
    await prisma.package.update({
      where: { id: premium.id },
      data: {
        slug: "premium",
        name: "PREMIUM",
        description: "24/7 Front-Desk Multilingual WhatsApp AI Receptionist & Full Clinic Suite",
        priceMonthly: 3999,
        priceQuarterly: 10798,
        priceYearly: 38390,
        isActive: true,
        isArchived: false,
      }
    });

    await prisma.packagePrice.upsert({
      where: { packageId_countryCode: { packageId: premium.id, countryCode: "IN" } },
      update: { currency: "INR", priceMonthly: 3999, priceQuarterly: 10798, priceYearly: 38390 },
      create: { packageId: premium.id, countryCode: "IN", currency: "INR", priceMonthly: 3999, priceQuarterly: 10798, priceYearly: 38390 }
    });

    await prisma.packageModule.deleteMany({ where: { packageId: premium.id } });
    await prisma.packageModule.createMany({
      data: [
        { packageId: premium.id, moduleName: "CLINIC_CORE" },
        { packageId: premium.id, moduleName: "GROWTH_SEO" },
        { packageId: premium.id, moduleName: "WHATSAPP_CRM" },
        { packageId: premium.id, moduleName: "AI_ASSISTANT" }
      ]
    });

    await prisma.packageLimit.deleteMany({ where: { packageId: premium.id } });
    await prisma.packageLimit.createMany({
      data: [
        { packageId: premium.id, limitName: "MAX_STAFF_SEATS", limitValue: null },
        { packageId: premium.id, limitName: "MAX_PATIENTS", limitValue: null },
        { packageId: premium.id, limitName: "MAX_GBP_LOCATIONS", limitValue: 1 },
        { packageId: premium.id, limitName: "MAX_TRACKED_KEYWORDS", limitValue: null },
        { packageId: premium.id, limitName: "MAX_SCHEDULED_POSTS", limitValue: null },
        { packageId: premium.id, limitName: "AI_CREDITS_PER_MONTH", limitValue: null },
      ]
    });
    console.log("✅ PREMIUM locked at ₹3,999/mo (without AUTOPILOT)");
  }

  // 4. Archive AI Receptionist & all other packages except FREE, STARTER, GROWTH, PREMIUM
  const validIds = [starter?.id, growth?.id, premium?.id].filter(Boolean);
  const freePkg = await prisma.package.findFirst({ where: { name: "FREE" } });
  if (freePkg) validIds.push(freePkg.id);

  const extraPkgs = await prisma.package.findMany({
    where: {
      id: { notIn: validIds },
      isArchived: false,
    }
  });

  for (const extra of extraPkgs) {
    await prisma.package.update({
      where: { id: extra.id },
      data: { isArchived: true }
    });
    console.log(`📦 Archived extra package: ${extra.name} (ID: ${extra.id})`);
  }

  console.log("🎉 Database package update successfully executed!");
}

main()
  .catch((e) => {
    console.error("❌ Error updating packages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
