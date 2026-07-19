const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/app/api/admin/subscriptions/doctors/[id]/assign/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/archive/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/restore/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/route.ts',
  'src/app/api/billing/razorpay/route.ts',
  'src/app/api/billing/razorpay/verify/route.ts'
];

for (const file of targetFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix messed up NextResponse.json
    content = content.replace(/NextResponse\.json\(([^,]+), "default"\)/g, 'NextResponse.json($1)');
    content = content.replace(/NextResponse\.json\(([^,]+), \{([^}]+)\}, "default"\)/g, 'NextResponse.json($1, {$2})');
    
    // Remove the remaining @ts-expect-error comments
    content = content.replace(/\/\/ @ts-expect-error[^\r\n]*\r?\n\s*/g, '');
    
    // Fix revalidateTag without second argument (careful not to add if it's already there)
    content = content.replace(/revalidateTag\((`[^`]+`)\)/g, 'revalidateTag($1, "default")');
    content = content.replace(/revalidateTag\((['"][^'"]+['"])\)/g, 'revalidateTag($1, "default")');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ${file}`);
  }
}
