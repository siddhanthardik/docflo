const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

const moduleMap = {
  'ai-agents': 'AI_ASSISTANT',
  'gbp': 'GROWTH_SEO',
  'reports/growth': 'GROWTH_SEO',
  'reports/keywords': 'GROWTH_SEO',
  'whatsapp': 'WHATSAPP_CRM',
  'campaigns': 'WHATSAPP_CRM',
  'patients': 'CLINIC_CORE',
  'staff': 'CLINIC_CORE',
};

const limitMap = {
  'patients': 'MAX_PATIENTS',
  'staff': 'MAX_STAFF_SEATS',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const matrix = [];

walkDir(API_DIR, function(filePath) {
  if (filePath.endsWith('route.ts')) {
    const relPath = path.relative(API_DIR, filePath).replace(/\\/g, '/');
    let requiredModule = 'None';
    let requiredLimit = 'None';
    
    for (const [key, mod] of Object.entries(moduleMap)) {
      if (relPath.startsWith(key)) {
        requiredModule = mod;
        break;
      }
    }
    for (const [key, lim] of Object.entries(limitMap)) {
      if (relPath.startsWith(key)) {
        requiredLimit = lim;
        break;
      }
    }

    if (requiredModule !== 'None' || requiredLimit !== 'None') {
      const content = fs.readFileSync(filePath, 'utf8');
      const isProtected = content.includes('withEntitlements(');
      matrix.push({
        Route: relPath,
        'Required Module': requiredModule,
        'Required Usage Limit': requiredLimit,
        'Protection Status': isProtected ? 'Protected' : 'Missing'
      });
    }
  }
});

console.table(matrix);
fs.writeFileSync('matrix.json', JSON.stringify(matrix, null, 2));
