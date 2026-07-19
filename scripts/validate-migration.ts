import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Migration Validation...');

  // Extract old requestId to legacyRequestId from LeadActivity
  console.log('Restoring legacyRequestId from LeadActivity (if missing)...');
  const activities = await prisma.leadActivity.findMany({
    where: { eventType: 'LEAD_BACKFILLED' }
  });
  
  let restored = 0;
  for (const activity of activities) {
    const metadata = activity.metadata as any;
    if (metadata && metadata.originalRequestId) {
      await prisma.auditLead.update({
        where: { id: activity.leadId },
        data: { legacyRequestId: metadata.originalRequestId }
      });
      restored++;
    }
  }
  console.log(`Restored ${restored} legacyRequestIds.`);

  console.log('--- MIGRATION VALIDATION REPORT ---');

  const totalLeads = await prisma.auditLead.count();
  const totalRequests = await prisma.auditRequest.count();
  const totalActivities = await prisma.leadActivity.count();
  
  const orphanedResult: any = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM audit_requests WHERE "leadId" IS NULL`;
  const orphanedRequests = Number(orphanedResult[0].count);

  const backfilledLeads = await prisma.auditLead.count({
    where: { legacyRequestId: { not: null } }
  });

  console.log(`AuditLead count: ${totalLeads}`);
  console.log(`AuditRequest count: ${totalRequests}`);
  console.log(`LeadActivity count: ${totalActivities}`);
  console.log(`Orphan count before migration: ${totalRequests - (totalLeads - backfilledLeads)} (Estimated)`);
  console.log(`Orphan count after migration: ${orphanedRequests}`);
  console.log(`Rows backfilled: ${backfilledLeads}`);
  console.log(`Rows skipped: ${totalRequests - backfilledLeads}`);
  
  const success = orphanedRequests === 0;
  console.log(`Validation success: ${success ? 'YES' : 'NO'}`);

  if (!success) {
    throw new Error('Validation failed: Orphaned requests still exist.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
