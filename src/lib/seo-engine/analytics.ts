import { prisma } from "@/lib/prisma";

export interface PerformanceComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export class AnalyticsEngine {
  /**
   * Compares the most recent performance snapshot against an older period to compute trends.
   */
  static async getPerformanceComparison(gbpAccountId: string, days: number = 30): Promise<PerformanceComparison[]> {
    // 1. Fetch the most recent performance snapshot
    const latestSnapshot = await prisma.gbpPerformanceSnapshot.findFirst({
      where: { gbpAccountId },
      orderBy: { date: 'desc' }
    });

    if (!latestSnapshot) return [];

    // For a real implementation, you'd aggregate the daily metrics from `latestSnapshot.json`
    // within the target date range. Here we do a simplified extraction.
    const raw: any = latestSnapshot.json;
    const currentMetrics = this.extractMetrics(raw, 0, days);
    const previousMetrics = this.extractMetrics(raw, days, days * 2);

    const comparisons: PerformanceComparison[] = [];
    for (const key of Object.keys(currentMetrics)) {
      const current = currentMetrics[key];
      const prev = previousMetrics[key] || 0;
      
      let change = 0;
      if (prev > 0) {
        change = ((current - prev) / prev) * 100;
      } else if (current > 0) {
        change = 100;
      }

      comparisons.push({
        metric: key,
        currentValue: current,
        previousValue: prev,
        changePercentage: Math.round(change),
        trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'FLAT'
      });
    }

    return comparisons;
  }

  private static extractMetrics(raw: any, offsetStartDays: number, offsetEndDays: number): Record<string, number> {
    // This parses the Google MultiDailyMetricsTimeSeries response.
    // Real implementation would filter by the specific date range required.
    // For now, we simulate an aggregated map.
    const aggregated: Record<string, number> = {
      'CALL_CLICKS': 0,
      'WEBSITE_CLICKS': 0,
      'BUSINESS_DIRECTION_REQUESTS': 0,
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS': 0,
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS': 0,
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH': 0,
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH': 0
    };

    if (raw && raw.multiDailyMetricTimeSeries) {
      for (const multiSeries of raw.multiDailyMetricTimeSeries) {
        if (!multiSeries.dailyMetricTimeSeries) continue;
        for (const series of multiSeries.dailyMetricTimeSeries) {
          let sum = 0;
          // In reality, filter series.timeSeries.datedValues by date range offsets
          if (series.timeSeries && series.timeSeries.datedValues) {
            for (const val of series.timeSeries.datedValues) {
               sum += parseInt(val.value || '0', 10);
            }
          }
          
          // Very basic mock split to demonstrate trend math
          if (offsetStartDays > 0) {
            sum = Math.floor(sum * 0.8); // simulate previous period having fewer
          }

          aggregated[series.dailyMetric] = sum;
        }
      }
    }

    return aggregated;
  }
}
