const fs = require('fs');
const files = [
  'src/app/api/gbp/audit/generate/route.ts',
  'src/app/api/gbp/posts/generate/route.ts',
  'src/app/api/gbp/recommendations/generate/route.ts',
  'src/app/api/gbp/reviews/reply/ai/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/doctorId,\s+action: "AI_GENERATE"/g, 'userId: doctorId,\n        userType: "CLINIC",\n        action: "AI_GENERATE"');
  
  content = content.replace(/,\s+userAgent: req.headers.get\("user-agent"\) \|\| "unknown"/g, '');
  content = content.replace(/,\s+userAgent: request.headers.get\("user-agent"\) \|\| "unknown"/g, '');
  
  fs.writeFileSync(file, content, 'utf8');
}
