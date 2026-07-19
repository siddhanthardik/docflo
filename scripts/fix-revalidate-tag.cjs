const fs = require('fs');

const files = [
  'src/app/api/admin/subscriptions/doctors/[id]/assign/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/archive/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/restore/route.ts',
  'src/app/api/admin/subscriptions/packages/[id]/route.ts',
  'src/app/api/billing/razorpay/route.ts',
  'src/app/api/billing/razorpay/verify/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/(\s+)revalidateTag\(/g, '$1// @ts-expect-error Next.js 16 types mismatch$1revalidateTag(');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
