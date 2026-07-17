import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.gbpAccount.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!account) return;

  const insights = account.insightsData as any;
  if (!insights?.timeSeriesData) return;

  const targetYear = 2026;
  const targetMonth = 6;
  
  let dailyViewsArray: any[] = [];
  const tsMap: Record<string, { views: number | null, calls: number | null, dateObj: Date }> = {};
  
  const numDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  
  let maxDataDate = new Date(0);
  insights.timeSeriesData.forEach((tsItem: any) => {
    (tsItem.dailyMetricTimeSeries || []).forEach((series: any) => {
      (series.timeSeries?.datedValues || []).forEach((dv: any) => {
        const dateObj = dv.date;
        if (dateObj && dateObj.year && dateObj.month && dateObj.day) {
          const d = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
          if (d > maxDataDate) maxDataDate = d;
        }
      });
    });
  });

  console.log("Max data date:", maxDataDate.toISOString());

  const sortedKeys: string[] = [];
  for (let i = 1; i <= numDaysInMonth; i++) {
    const d = new Date(targetYear, targetMonth - 1, i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const isFuture = d > maxDataDate;
    tsMap[key] = { views: isFuture ? null : 0, calls: isFuture ? null : 0, dateObj: d };
    sortedKeys.push(key);
  }
  
  let viewMatchCount = 0;

  insights.timeSeriesData.forEach((tsItem: any) => {
    (tsItem.dailyMetricTimeSeries || []).forEach((series: any) => {
      const isViews = series.dailyMetric?.includes("IMPRESSIONS");
      const isCalls = series.dailyMetric === "CALL_CLICKS";
      if (!isViews && !isCalls) return;
      
      (series.timeSeries?.datedValues || []).forEach((dv: any) => {
        const dateObj = dv.date;
        if (dateObj && dateObj.year && dateObj.month && dateObj.day) {
          const key = `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
          if (tsMap[key]) {
            if (isViews && tsMap[key].views !== null) {
              (tsMap[key].views as number) += Number(dv.value || 0);
              viewMatchCount++;
            }
          } else {
             // console.log("Key not found in tsMap:", key);
          }
        }
      });
    });
  });
  
  console.log("View matches:", viewMatchCount);

  sortedKeys.forEach(key => {
    const entry = tsMap[key];
    const name = entry.dateObj.toLocaleString('default', { month: 'short', day: 'numeric' });
    dailyViewsArray.push({ name, views: entry.views });
  });

  console.log("Daily Views Array Sample:");
  console.log(dailyViewsArray.slice(0, 5));
}

main();
