import fs from 'fs';
import path from 'path';

const dir = path.join(__dirname, 'src/app/api/local-seo');
const subdirs = fs.readdirSync(dir);

for (const subdir of subdirs) {
  const routePath = path.join(dir, subdir, 'route.ts');
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    content = content.replace(
      /const account = await prisma\.gbpAccount\.findFirst\(\{\s*where:\s*\{\s*doctorId:\s*session\.doctorId\s*\}\s*\}\);/g,
      "const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });"
    );
    fs.writeFileSync(routePath, content);
    console.log("Updated", routePath);
  }
}
