/**
 * GBP route protection helper script
 * Updates all GBP routes to add entitlementGuard for GROWTH_SEO module
 */
const fs = require('fs');
const path = require('path');

const routes = [
  { file: 'gbp/audit/route.ts', fn: 'GET()', sig: 'GET()', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/connect/route.ts', fn: 'GET(req: Request)', sig: 'GET(req: Request)', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/discover-locations/route.ts', fn: 'GET(req: Request)', sig: 'GET(req: Request)', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/insights/route.ts', fn: null, sig: null, insertAfter: null }, // uses auth()
  { file: 'gbp/local-seo/route.ts', fn: 'GET(request: Request)', sig: 'GET(request: Request)', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/profiles/route.ts', fn: 'GET()', sig: 'GET()', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/recommendations/route.ts', fn: 'GET()', sig: 'GET()', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/reviews/route.ts', fn: null, sig: null, insertAfter: null }, // uses getSessionData
  { file: 'gbp/reviews/reply/route.ts', fn: 'POST(request: Request)', sig: 'POST(request: Request)', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/save-profiles/route.ts', fn: null, sig: null, insertAfter: null }, // already has shadowCheck
  { file: 'gbp/sync/route.ts', fn: null, sig: null, insertAfter: null },
  { file: 'gbp/tasks/route.ts', fn: 'GET(req: NextRequest)', sig: 'GET(req: NextRequest)', insertAfter: "const { doctorId } = await getSessionData();" },
  { file: 'gbp/update-profile/route.ts', fn: 'POST(request: Request)', sig: 'POST(request: Request)', insertAfter: "const { doctorId } = await getSessionData();" },
];

// Print out existing first lines of each file to understand pattern
const apiDir = path.join(__dirname, '../src/app/api');
for (const r of routes) {
  const fp = path.join(apiDir, r.file);
  const content = fs.readFileSync(fp, 'utf8');
  console.log(`\n=== ${r.file} ===`);
  console.log(content.substring(0, 500));
  console.log('...');
}
