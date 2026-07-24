const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/app/page.tsx',
  'src/app/free-audit/page.tsx',
  'src/app/local-seo/free-audit/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(auth)/forgot-password/page.tsx',
  'src/app/(auth)/reset-password/page.tsx',
];

const logoImport = `import { GyrexLogo } from "@/components/ui/GyrexLogo";\n`;

for (const file of filesToProcess) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if missing
  if (!content.includes('GyrexLogo') && !content.includes('@/components/ui/GyrexLogo')) {
    // Insert after the last import
    const importMatch = [...content.matchAll(/^import .*;$/gm)].pop();
    if (importMatch) {
      const idx = importMatch.index + importMatch[0].length;
      content = content.slice(0, idx) + '\n' + logoImport + content.slice(idx);
    } else {
      content = logoImport + content;
    }
    changed = true;
  }

  // Define patterns to replace
  // Pattern 1: Div wrapper with icon and text
  const pattern1 = /<div className="[^"]*flex items-center gap-[^"]*">\s*<div className="[^"]*rounded-lg[^"]*flex items-center[^"]*">\s*<Activity[^>]*\/>\s*<\/div>\s*<span className="[^"]*Gyrex[^"]*">Gyrex<\/span>\s*<\/div>/g;
  
  // Pattern 2: Link wrapper
  const pattern2 = /<Link href="[^"]*" className="[^"]*flex items-center gap-[^"]*">\s*<div className="[^"]*rounded-[^"]*flex items-center[^"]*">\s*<Activity[^>]*\/>\s*<\/div>\s*<span className="[^"]*">Gyrex<\/span>\s*<\/Link>/g;

  // Replace with GyrexLogo wrapped in same container tag if Link
  if (pattern1.test(content)) {
    content = content.replace(pattern1, `<div className="flex items-center gap-2.5">\n            <GyrexLogo size="lg" />\n          </div>`);
    changed = true;
  }
  
  if (pattern2.test(content)) {
    content = content.replace(pattern2, `<Link href="/" className="flex items-center gap-2">\n            <GyrexLogo size="lg" />\n          </Link>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
