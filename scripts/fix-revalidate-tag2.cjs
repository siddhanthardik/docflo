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
    
    // Remove the comment
    content = content.replace(/\/\/ @ts-expect-error - Next\.js Canary type mismatch for revalidateTag\r?\n\s*/g, '');
    
    // Add "default" as second arg if it's missing
    content = content.replace(/revalidateTag\(([^,]+)\)/g, 'revalidateTag($1, "default")');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ${file}`);
  }
}
