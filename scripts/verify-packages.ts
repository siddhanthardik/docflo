/**
 * scripts/verify-packages.ts
 * 
 * Reads all packages from the DB with their modules and limits,
 * and prints a formatted verification report to stdout.
 */

import { PrismaClient, ModuleName, LimitName } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_MODULES: ModuleName[] = ['CLINIC_CORE', 'GROWTH_SEO', 'WHATSAPP_CRM', 'AI_ASSISTANT'];
const ALL_LIMITS: LimitName[] = [
  'MAX_STAFF_SEATS', 'MAX_PATIENTS', 'MAX_GBP_LOCATIONS',
  'MAX_TRACKED_KEYWORDS', 'MAX_SCHEDULED_POSTS', 'AI_CREDITS_PER_MONTH',
];

// Expected configuration from the Validation & Test Plan
const EXPECTED: Record<string, { modules: ModuleName[]; limits: Record<string, number | null> }> = {
  starter: {
    modules: ['CLINIC_CORE'],
    limits: {
      MAX_STAFF_SEATS: 1, MAX_PATIENTS: 500,
      MAX_GBP_LOCATIONS: 0, MAX_TRACKED_KEYWORDS: 0,
      MAX_SCHEDULED_POSTS: 0, AI_CREDITS_PER_MONTH: 0,
    },
  },
  growth: {
    modules: ['CLINIC_CORE', 'GROWTH_SEO', 'WHATSAPP_CRM'],
    limits: {
      MAX_STAFF_SEATS: 3, MAX_PATIENTS: 2000,
      MAX_GBP_LOCATIONS: 1, MAX_TRACKED_KEYWORDS: 20,
      MAX_SCHEDULED_POSTS: 4, AI_CREDITS_PER_MONTH: 0,
    },
  },
  enterprise: {
    modules: ['CLINIC_CORE', 'GROWTH_SEO', 'WHATSAPP_CRM', 'AI_ASSISTANT'],
    limits: {
      MAX_STAFF_SEATS: null, MAX_PATIENTS: null,
      MAX_GBP_LOCATIONS: 3, MAX_TRACKED_KEYWORDS: 100,
      MAX_SCHEDULED_POSTS: 15, AI_CREDITS_PER_MONTH: 1000,
    },
  },
};

function formatLimit(val: number | null | undefined): string {
  if (val === null) return 'NULL (Unlimited)';
  if (val === undefined) return 'MISSING ⚠️';
  return String(val);
}

async function main() {
  const packages = await prisma.package.findMany({
    where: { slug: { not: null } },
    include: { modules: true, limits: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('='.repeat(80));
  console.log('PACKAGE SEED VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nPackages found in DB: ${packages.length}\n`);

  let overallPass = true;

  for (const pkg of packages) {
    const expected = EXPECTED[pkg.slug!];
    let pkgPass = true;

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦  ${pkg.name.toUpperCase()} (slug: ${pkg.slug})`);
    console.log(`    ID: ${pkg.id}`);
    console.log(`    Price: ₹${pkg.priceMonthly}/month`);
    console.log(`${'─'.repeat(60)}`);

    if (!expected) {
      console.log('    ⚠️  No expected config found for this slug. Skipping validation.');
      continue;
    }

    // Modules
    console.log('\n  MODULES:');
    for (const mod of ALL_MODULES) {
      const has = pkg.modules.some(m => m.moduleName === mod);
      const shouldHave = expected.modules.includes(mod);
      const match = has === shouldHave;
      if (!match) { pkgPass = false; overallPass = false; }
      const icon = match ? '✅' : '❌';
      const state = has ? 'ENABLED' : 'DISABLED';
      const expected_state = shouldHave ? 'ENABLED' : 'DISABLED';
      console.log(`    ${icon}  ${mod.padEnd(20)} actual=${state.padEnd(8)} expected=${expected_state}`);
    }

    // Limits
    console.log('\n  LIMITS:');
    for (const lim of ALL_LIMITS) {
      const found = pkg.limits.find(l => l.limitName === lim);
      const actualVal = found ? found.limitValue : undefined;
      const expectedVal = expected.limits[lim];
      const match = actualVal === expectedVal;
      if (!match) { pkgPass = false; overallPass = false; }
      const icon = match ? '✅' : '❌';
      console.log(`    ${icon}  ${lim.padEnd(28)} actual=${formatLimit(actualVal).padEnd(18)} expected=${formatLimit(expectedVal)}`);
    }

    const verdict = pkgPass ? '✅ PASS' : '❌ FAIL';
    console.log(`\n  Package Verdict: ${verdict}`);
  }

  console.log(`\n${'='.repeat(80)}`);
  const finalVerdict = overallPass ? '✅ ALL PACKAGES PASS — Seed matches Validation Plan.' : '❌ VALIDATION FAILED — Correct seed data before proceeding.';
  console.log(`OVERALL: ${finalVerdict}`);
  console.log('='.repeat(80));

  if (!overallPass) process.exit(1);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
