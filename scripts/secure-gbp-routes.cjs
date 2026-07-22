const fs = require('fs');
const path = require('path');

const gbpDir = path.join(process.cwd(), 'src', 'app', 'api', 'gbp');
function getRouteFiles(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getRouteFiles(gbpDir);

for (const f of files) {
  if (f.includes('callback')) continue; // Skip callback
  if (f.includes('posts') && f.includes('route.ts')) continue; // Posts already uses EntitlementService directly

  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('entitlementGuard(') || content.includes('EntitlementService')) continue;

  if (!content.includes('import { entitlementGuard }')) {
    content = content.replace(/(import .* from ['"].*['"];\r?\n)+(?!import)/, `$&import { entitlementGuard } from "@/lib/withEntitlements";\n`);
  }

  const match = content.match(/const (?:\{ ?doctorId ?\}|doctorId) = await (?:getSessionData\(\)|session\.user\.id);/g);
  if (!match) continue;

  for (const m of match) {
      let replacement = m + '\n\n    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });\n    if (block) return block;';
      content = content.replace(m, replacement);
  }
  
  // Fix request to req since the function args could be `request: Request`
  content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(request: Request\)/g, 'export async function $1(req: Request)');
  content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(\)/g, 'export async function $1(req: Request)');

  // Sometimes they use next request
  content = content.replace(/export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest\)/g, 'export async function $1(req: NextRequest)');

  // Fix everywhere request is used if we renamed it
  content = content.replace(/request\.json\(\)/g, 'req.json()');
  content = content.replace(/request\.url/g, 'req.url');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Secured: ' + f);
}
