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
    console.log("✅ PREMIUM locked at ₹3,999/mo");
  }

  // 4. FREE Tier (₹0)
  const freePkg = await prisma.package.findFirst({
    where: { slug: "free" }
  }) || await prisma.package.findFirst({
    where: { name: "FREE" }
  });

  if (freePkg) {
    await prisma.package.update({
      where: { id: freePkg.id },
      data: {
        slug: "free",
        name: "FREE",
        description: "Essential clinical EMR & OPD patient management",
        priceMonthly: 0,
        priceQuarterly: 0,
        priceYearly: 0,
        isActive: true,
        isArchived: false,
      }
    });

    await prisma.packageModule.deleteMany({ where: { packageId: freePkg.id } });
    await prisma.packageModule.createMany({
      data: [
        { packageId: freePkg.id, moduleName: "CLINIC_CORE" }
      ]
    });

    await prisma.packageLimit.deleteMany({ where: { packageId: freePkg.id } });
    await prisma.packageLimit.createMany({
      data: [
        { packageId: freePkg.id, limitName: "MAX_STAFF_SEATS", limitValue: 1 },
        { packageId: freePkg.id, limitName: "MAX_PATIENTS", limitValue: 50 },
        { packageId: freePkg.id, limitName: "MAX_GBP_LOCATIONS", limitValue: 0 },
        { packageId: freePkg.id, limitName: "MAX_TRACKED_KEYWORDS", limitValue: 0 },
        { packageId: freePkg.id, limitName: "MAX_SCHEDULED_POSTS", limitValue: 0 },
        { packageId: freePkg.id, limitName: "AI_CREDITS_PER_MONTH", limitValue: 0 },
      ]
    });
    console.log("✅ FREE locked at ₹0/mo");
  }

  // 5. Populate Feature Flags and PackageFeatures for all tiers
  const aiFeatureFlags = [
    { key: "AI_RECEPTIONIST", name: "WhatsApp Clinic Receptionist" },
    { key: "AI_REVIEW_REPLY", name: "Review Manager Assistant" },
    { key: "AI_POST_CREATOR", name: "Google Updates Assistant" },
    { key: "AI_SEO_COPILOT", name: "Google Maps Rank Assistant" },
  ];

  const flagMap = {};
  for (const flag of aiFeatureFlags) {
    const ff = await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { name: flag.name },
      create: { key: flag.key, name: flag.name, type: "BOOLEAN", defaultValue: "true" }
    });
    flagMap[flag.key] = ff.id;
  }

  // Attach features to tiers
  const tierFeatures = [
    { pkg: starter, features: ["AI_REVIEW_REPLY", "AI_SEO_COPILOT"] },
    { pkg: growth, features: ["AI_REVIEW_REPLY", "AI_POST_CREATOR", "AI_SEO_COPILOT"] },
    { pkg: premium, features: ["AI_RECEPTIONIST", "AI_REVIEW_REPLY", "AI_POST_CREATOR", "AI_SEO_COPILOT"] },
  ];

  for (const tf of tierFeatures) {
    if (!tf.pkg) continue;
    await prisma.packageFeature.deleteMany({ where: { packageId: tf.pkg.id } });
    for (const fKey of tf.features) {
      await prisma.packageFeature.create({
        data: {
          packageId: tf.pkg.id,
          featureId: flagMap[fKey],
          isEnabled: true,
        }
      });
    }
    console.log(`✅ Attached AI features to ${tf.pkg.name}`);
  }

  // 6. Archive all 11 legacy/test packages except the 4 official ones
  const validIds = [starter?.id, growth?.id, premium?.id, freePkg?.id].filter(Boolean);

  const extraPkgs = await prisma.package.findMany({
    where: {
      id: { notIn: validIds },
    }
  });

  for (const extra of extraPkgs) {
    await prisma.package.update({
      where: { id: extra.id },
      data: { isArchived: true, isActive: false }
    });
    console.log(`📦 Archived & deactivated extra package: "${extra.name}" (ID: ${extra.id})`);
  }

  // 7. Migrate any doctors currently assigned to archived packages (e.g. legacy ENTERPRISE) to PREMIUM
  if (premium) {
    const doctorsOnArchived = await prisma.doctor.findMany({
      where: {
        OR: [
          { packageId: { in: extraPkgs.map(p => p.id) } },
          { package: { name: { contains: "ENTERPRISE", mode: "insensitive" } } }
        ]
      }
    });

    for (const doc of doctorsOnArchived) {
      await prisma.doctor.update({
        where: { id: doc.id },
        data: {
          packageId: premium.id,
          subscriptionStatus: "ACTIVE",
        }
      });
      console.log(`🔄 Reassigned doctor "${doc.name}" (${doc.email}) from legacy package to PREMIUM`);
    }
  }

  console.log("🎉 Database package update and migration successfully executed!");
}

main()
  .catch((e) => {
    console.error("❌ Error updating packages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
