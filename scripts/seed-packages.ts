/**
 * scripts/seed-packages.ts
 *
 * IDEMPOTENT: Safe to run multiple times.
 * Uses `slug` as the stable unique key for upsert.
 * Unlimited limits are stored as NULL in the database.
 */

import { PrismaClient, ModuleName, LimitName } from '@prisma/client';

const prisma = new PrismaClient();

type PackageSeed = {
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  modules: ModuleName[];
  limits: { limitName: LimitName; limitValue: number | null }[];
};

const PACKAGES: PackageSeed[] = [
  {
    slug: 'free',
    name: 'FREE',
    description: 'For new clinics getting started',
    priceMonthly: 0,
    modules: [ModuleName.CLINIC_CORE],
    limits: [
      { limitName: LimitName.MAX_STAFF_SEATS,       limitValue: 1 },
      { limitName: LimitName.MAX_PATIENTS,           limitValue: 50 },
      { limitName: LimitName.MAX_PRACTITIONERS,      limitValue: 1 },
      { limitName: LimitName.MAX_GBP_LOCATIONS,      limitValue: 0 },
      { limitName: LimitName.MAX_TRACKED_KEYWORDS,   limitValue: 0 },
      { limitName: LimitName.MAX_SCHEDULED_POSTS,    limitValue: 0 },
      { limitName: LimitName.AI_CREDITS_PER_MONTH,   limitValue: 0 },
    ],
  },
  {
    slug: 'starter',
    name: 'STARTER',
    description: 'Grow your local presence',
    priceMonthly: 1499,
    modules: [
      ModuleName.CLINIC_CORE,
      ModuleName.GROWTH_SEO,
    ],
    limits: [
      { limitName: LimitName.MAX_STAFF_SEATS,       limitValue: 3 },
      { limitName: LimitName.MAX_PATIENTS,           limitValue: null }, // Unlimited
      { limitName: LimitName.MAX_PRACTITIONERS,      limitValue: 1 },
      { limitName: LimitName.MAX_GBP_LOCATIONS,      limitValue: 1 },
      { limitName: LimitName.MAX_TRACKED_KEYWORDS,   limitValue: 0 },
      { limitName: LimitName.MAX_SCHEDULED_POSTS,    limitValue: 4 },
      { limitName: LimitName.AI_CREDITS_PER_MONTH,   limitValue: 0 },
    ],
  },
  {
    slug: 'growth',
    name: 'GROWTH',
    description: 'Dominate your local market',
    priceMonthly: 2499,
    modules: [
      ModuleName.CLINIC_CORE,
      ModuleName.GROWTH_SEO,
      ModuleName.WHATSAPP_CRM,
    ],
    limits: [
      { limitName: LimitName.MAX_STAFF_SEATS,       limitValue: 10 },
      { limitName: LimitName.MAX_PATIENTS,           limitValue: null }, // Unlimited
      { limitName: LimitName.MAX_PRACTITIONERS,      limitValue: 3 },
      { limitName: LimitName.MAX_GBP_LOCATIONS,      limitValue: 1 },
      { limitName: LimitName.MAX_TRACKED_KEYWORDS,   limitValue: 10 },
      { limitName: LimitName.MAX_SCHEDULED_POSTS,    limitValue: 15 },
      { limitName: LimitName.AI_CREDITS_PER_MONTH,   limitValue: 100 },
    ],
  },
  {
    slug: 'premium',
    name: 'PREMIUM / AUTOPILOT',
    description: 'Fully automated clinic',
    priceMonthly: 4999,
    modules: [
      ModuleName.CLINIC_CORE,
      ModuleName.GROWTH_SEO,
      ModuleName.WHATSAPP_CRM,
      ModuleName.AI_ASSISTANT,
    ],
    limits: [
      { limitName: LimitName.MAX_STAFF_SEATS,       limitValue: null }, // Unlimited
      { limitName: LimitName.MAX_PATIENTS,           limitValue: null }, // Unlimited
      { limitName: LimitName.MAX_PRACTITIONERS,      limitValue: null }, // Unlimited
      { limitName: LimitName.MAX_GBP_LOCATIONS,      limitValue: 1 }, // Max supported by system architecture
      { limitName: LimitName.MAX_TRACKED_KEYWORDS,   limitValue: 50 },
      { limitName: LimitName.MAX_SCHEDULED_POSTS,    limitValue: null }, // Unlimited
      { limitName: LimitName.AI_CREDITS_PER_MONTH,   limitValue: null }, // Unlimited
    ],
  },
];

async function main() {
  console.log('Seeding default packages (idempotent via slug)...\n');

  for (const pkg of PACKAGES) {
    // Upsert the Package row itself (idempotent by slug)
    const record = await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: {
        name: pkg.name,
        description: pkg.description,
        priceMonthly: pkg.priceMonthly,
      },
      create: {
        slug: pkg.slug,
        name: pkg.name,
        description: pkg.description,
        priceMonthly: pkg.priceMonthly,
      },
    });

    // Upsert each module (idempotent by [packageId, moduleName] unique constraint)
    for (const moduleName of pkg.modules) {
      await prisma.packageModule.upsert({
        where: { packageId_moduleName: { packageId: record.id, moduleName } },
        update: {},
        create: { packageId: record.id, moduleName },
      });
    }

    // Upsert each limit (idempotent by [packageId, limitName] unique constraint)
    for (const { limitName, limitValue } of pkg.limits) {
      await prisma.packageLimit.upsert({
        where: { packageId_limitName: { packageId: record.id, limitName } },
        update: { limitValue },
        create: { packageId: record.id, limitName, limitValue },
      });
    }

    console.log(`  ✔ ${pkg.name} (${record.id})`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
