import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.gbpAccount.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!account) return;

  const insights = account.insightsData as any;
  if (!insights?.timeSeriesData) return;

  const timeSeriesData = insights.timeSeriesData;
  const targetYear = 2026;
  const targetMonth = 6;
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0);

  function sumMetric(data: any, metricName: string) {
    const series =
      data
        ?.flatMap((item: any) => item.dailyMetricTimeSeries || [])
        ?.filter((item: any) => item.dailyMetric === metricName) || [];

    return series.reduce((metricTotal: number, item: any) => {
      const points = item.timeSeries?.datedValues || [];
      return (
        metricTotal +
        points.reduce((pointTotal: number, point: any) => {
          const dateObj = point.date;
          if (!dateObj || !dateObj.year || !dateObj.month || !dateObj.day) return pointTotal;
          const d = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
          
          if (d >= startDate && d <= endDate) {
            return pointTotal + Number(point.value || 0);
          }
          return pointTotal;
        }, 0)
      );
    }, 0);
  }

  const desktopMaps = sumMetric(timeSeriesData, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
  const desktopSearch = sumMetric(timeSeriesData, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
  const mobileMaps = sumMetric(timeSeriesData, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const mobileSearch = sumMetric(timeSeriesData, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");
  const websiteClicks = sumMetric(timeSeriesData, "WEBSITE_CLICKS");
  const phoneCalls = sumMetric(timeSeriesData, "CALL_CLICKS");
  const directionRequests = sumMetric(timeSeriesData, "BUSINESS_DIRECTION_REQUESTS");
  const bookings = sumMetric(timeSeriesData, "BUSINESS_BOOKINGS");

  console.log("From script sumMetric:");
  console.log({
    desktopMaps,
    desktopSearch,
    mobileMaps,
    mobileSearch,
    totalViews: desktopMaps + desktopSearch + mobileMaps + mobileSearch,
    websiteClicks,
    phoneCalls,
    directionRequests,
    bookings,
  });

  console.log("\nFrom DB insights:");
  console.log({
    desktopMaps: insights.desktopMaps,
    desktopSearch: insights.desktopSearch,
    mobileMaps: insights.mobileMaps,
    mobileSearch: insights.mobileSearch,
    totalViews: insights.totalViews,
    websiteClicks: insights.websiteClicks,
    phoneCalls: insights.phoneCalls,
    directionRequests: insights.directionRequests,
    bookings: insights.bookings,
  });
}

main();
