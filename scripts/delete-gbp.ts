import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.gbpAccount.findMany();
  console.log(`Found ${accounts.length} GBP accounts. Deleting all to allow fresh connection...`);
  
  const result = await prisma.gbpAccount.deleteMany({});
  console.log(`Deleted ${result.count} accounts.`);
  
  const reviewsResult = await prisma.review.deleteMany({
    where: { source: "GOOGLE" }
  });
  console.log(`Deleted ${reviewsResult.count} cached Google reviews.`);
}

main().catch(console.error);
