import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.gbpAccount.findMany();

  for (const acc of accounts) {
    const name = (acc.insightsData as any)?.name?.toLowerCase() || '';
    if (name.includes('kongposh') || name.includes('kong posh')) {
      console.log(`Deleting Kongposh account: ${acc.id}`);
      
      // Delete associated reviews first
      await prisma.review.deleteMany({
        where: { gbpAccountId: acc.id }
      });
      
      // Delete the account
      await prisma.gbpAccount.delete({
        where: { id: acc.id }
      });
      
      console.log('Deleted successfully.');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
