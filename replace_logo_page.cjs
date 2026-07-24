const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let changed = false;

const logoImport = `import { GyrexLogo } from "@/components/ui/GyrexLogo";\n`;
if (!content.includes('GyrexLogo')) {
  const importMatch = [...content.matchAll(/^import .*;$/gm)].pop();
  if (importMatch) {
    const idx = importMatch.index + importMatch[0].length;
    content = content.slice(0, idx) + '\n' + logoImport + content.slice(idx);
  }
  changed = true;
}

const pattern1 = /<div className="flex items-center gap-2.5">\s*<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">\s*<Activity className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} \/>\s*<\/div>\s*<span className="text-xl font-bold text-slate-900 tracking-tight">Docflo<\/span>\s*<\/div>/g;

const pattern2 = /<div className="flex items-center gap-2 mb-4">\s*<div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">\s*<Activity className="h-4 w-4 text-white" \/>\s*<\/div>\s*<span className="text-xl font-bold text-white">Docflo<\/span>\s*<\/div>/g;

if (pattern1.test(content)) {
  content = content.replace(pattern1, `<div className="flex items-center gap-2.5">\n            <GyrexLogo size="lg" />\n          </div>`);
  changed = true;
}

if (pattern2.test(content)) {
  content = content.replace(pattern2, `<div className="flex items-center gap-2 mb-4">\n                <GyrexLogo size="lg" />\n              </div>`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, content);
  console.log('Updated src/app/page.tsx');
} else {
  console.log('No matches found in src/app/page.tsx');
}
