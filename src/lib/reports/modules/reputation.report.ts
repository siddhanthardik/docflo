import { prisma } from "@/lib/prisma";

export async function generateReputationReport(doctorId: string, start: Date, end: Date) {
  // Use Prisma aggregate to calculate average rating
  const reviewStats = await prisma.review.aggregate({
    where: { doctorId, reviewDate: { gte: start, lte: end } },
    _count: { rating: true },
    _avg: { rating: true }
  });

  const reviewCount = reviewStats._count.rating || 0;
  const avgRating = reviewStats._avg.rating || null;

  // GBP Insights are cached directly in the GbpAccount table as JSON
  let gbpData = null;
  const gbpAccount = await prisma.gbpAccount.findFirst({
    where: { doctorId },
    select: { insightsData: true },
  });

  if (gbpAccount?.insightsData) {
    const insights = gbpAccount.insightsData as any;
    gbpData = {
      totalViews: insights.totalViews || 0,
      totalSearches: insights.totalSearches || 0,
      phoneCalls: insights.phoneCalls || 0,
      directionRequests: insights.directionRequests || 0,
    };
  }

  return {
    reviewCount,
    avgRating,
    gbpData
  };
}
