import { PrismaClient } from '@prisma/client';
import { GBPService } from '../src/services/gbp.service';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.gbpAccount.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!account) {
    console.log("No account found");
    return;
  }

  console.log("Using Token:", account.accessToken);

  const gbpService = new GBPService(account.accessToken, account.doctorId);
  
  // Fetch June 2026
  const startDate = new Date(2026, 5, 1);
  const endDate = new Date(2026, 6, 0);
  
  console.log("Fetching for:", startDate.toISOString(), "to", endDate.toISOString());

  try {
    const data = await gbpService.getInsights(account.locationName!, startDate, endDate);
    console.log("Total Views:", data.totalViews);
    
    // Check the first time series item
    const accountRecord = await prisma.gbpAccount.findUnique({
      where: { id: account.id },
    });
    const insightsData = accountRecord?.insightsData as any;
    
    if (insightsData?.timeSeriesData?.length > 0) {
      console.log("Sample TimeSeries Item:");
      console.log(JSON.stringify(insightsData.timeSeriesData[0], null, 2));
    } else {
      console.log("No timeSeriesData found in DB!");
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

main();
