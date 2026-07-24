const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let changed = false;

// 1. Remove "Pricing" from navbar
if (content.includes('["Features", "How It Works", "Pricing", "Blog"]')) {
  content = content.replace(
    '["Features", "How It Works", "Pricing", "Blog"]',
    '["Features", "How It Works", "Blog"]'
  );
  changed = true;
}

// 2. Remove "Pricing" from footer
if (content.includes('["Features", "Pricing", "GBP Audit", "Changelog"]')) {
  content = content.replace(
    '["Features", "Pricing", "GBP Audit", "Changelog"]',
    '["Features", "GBP Audit", "Changelog"]'
  );
  changed = true;
}

// 3. Remove Pricing section using regex
// Matches from {/* ── PRICING TEASER ── */} to </section> before the footer
const pricingSectionRegex = /\s*\{\/\* ── PRICING TEASER ── \*\/\}\s*<section id="pricing"[\s\S]*?<\/section>/;

if (pricingSectionRegex.test(content)) {
  content = content.replace(pricingSectionRegex, '');
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, content);
  console.log('Successfully removed pricing section and links.');
} else {
  console.log('No changes made, could not find pricing sections.');
}
