import { PrismaClient } from '@prisma/client';
import { GBPService } from '../src/services/gbp.service';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.gbpAccount.findFirst({ orderBy: { createdAt: "desc" } });
  if (!account) {
    console.log("No account found");
    return;
  }

  const doctorId = account.doctorId;
  const locationName = account.locationName;
  const accessToken = account.accessToken;

  console.log("Doctor ID:", doctorId);
  console.log("Location Name:", locationName);

  if (!locationName) {
    console.log("No location name");
    return;
  }

  const gbpService = new GBPService(accessToken, doctorId);

  const targetYear = 2026;
  const targetMonth = 6;
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  let endDate = new Date(targetYear, targetMonth, 0);

  console.log("Fetching insights for", startDate, "to", endDate);
  
  try {
    const insights = await gbpService.getInsights(locationName, startDate, endDate);
    console.log("Success!");
    console.log(JSON.stringify(insights, null, 2));
  } catch (err: any) {
    console.error("Failed to fetch insights:");
    console.error(err);
  }
}

main();
