const { PrismaClient } = require('@prisma/client');
const { GoogleSyncEngine } = require('./src/services/sync-engine/GoogleSyncEngine');

const prisma = new PrismaClient();

async function run() {
  const account = await prisma.gbpAccount.findFirst({
    where: { doctorId: 'cmrsz4wov0000vh10b3m4u1hl' }
  });
  
  if (!account) {
    console.log("No account found");
    return;
  }
  
  console.log("Found account, triggering sync...");
  try {
    const syncEngine = new GoogleSyncEngine(account.doctorId);
    await syncEngine.syncAll();
    console.log("Sync complete!");
  } catch(e) {
    console.error("Sync failed", e);
  }
}
run();
