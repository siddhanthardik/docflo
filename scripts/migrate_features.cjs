const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting feature migration...");

  // 1. Define the baseline features that the system currently uses via JSON
  const baselineFeatures = [
    { key: "max_users", name: "Max Users", type: "NUMBER", defaultValue: "1" },
    { key: "max_locations", name: "Max Locations", type: "NUMBER", defaultValue: "1" },
    { key: "has_whatsapp", name: "WhatsApp Integration", type: "BOOLEAN", defaultValue: "false" },
    { key: "has_gbp", name: "Google Business Profile", type: "BOOLEAN", defaultValue: "false" },
    { key: "has_ai_agents", name: "AI Agents", type: "BOOLEAN", defaultValue: "false" },
    { key: "has_campaigns", name: "Marketing Campaigns", type: "BOOLEAN", defaultValue: "false" },
  ];

  console.log("Ensuring baseline feature flags exist...");
  const featureMap = {}; // key -> id
  for (const feat of baselineFeatures) {
    const created = await prisma.featureFlag.upsert({
      where: { key: feat.key },
      update: {},
      create: {
        name: feat.name,
        key: feat.key,
        type: feat.type,
        defaultValue: feat.defaultValue,
      },
    });
    featureMap[feat.key] = created.id;
  }

  // 2. Migrate existing packages
  console.log("Migrating packages...");
  const packages = await prisma.package.findMany();

  for (const pkg of packages) {
    let featuresJson = {};
    try {
      featuresJson = typeof pkg.features === "string" ? JSON.parse(pkg.features) : pkg.features;
    } catch (e) {
      console.warn(`Could not parse JSON features for package ${pkg.name}`);
    }

    // For every baseline feature, see if this package overrides it in the JSON
    for (const feat of baselineFeatures) {
      const jsonVal = featuresJson[feat.key];
      
      let isEnabled = false;
      let limit = null;

      if (feat.type === "BOOLEAN") {
        isEnabled = jsonVal === true || jsonVal === "true";
      } else if (feat.type === "NUMBER") {
        limit = parseInt(jsonVal, 10);
        if (!isNaN(limit)) {
          isEnabled = limit > 0;
        } else {
          limit = null; // Use fallback from engine later
        }
      }

      // Upsert PackageFeature
      await prisma.packageFeature.upsert({
        where: {
          packageId_featureId: {
            packageId: pkg.id,
            featureId: featureMap[feat.key],
          },
        },
        update: {
          isEnabled: isEnabled,
          limit: limit,
        },
        create: {
          packageId: pkg.id,
          featureId: featureMap[feat.key],
          isEnabled: isEnabled,
          limit: limit,
        },
      });
    }

    // Also, map the old price and billingPeriod to the new fields
    const updates = {};
    if (pkg.price !== null && pkg.price !== undefined) {
      if (pkg.billingPeriod === "monthly" || !pkg.billingPeriod) {
        updates.priceMonthly = pkg.price;
      } else if (pkg.billingPeriod === "quarterly") {
        updates.priceQuarterly = pkg.price;
      } else if (pkg.billingPeriod === "yearly") {
        updates.priceYearly = pkg.price;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.package.update({
        where: { id: pkg.id },
        data: updates,
      });
    }
  }

  console.log("Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
