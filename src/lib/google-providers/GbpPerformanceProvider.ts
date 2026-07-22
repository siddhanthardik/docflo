export class GbpPerformanceProvider {
  /**
   * Fetches the MultiDailyMetricsTimeSeries from the Performance API
   * Endpoint: GET https://businessprofileperformance.googleapis.com/v1/{name=locations/*}:fetchMultiDailyMetricsTimeSeries
   */
  static async getPerformanceMetrics(locationName: string, accessToken: string, dailyRange: { startDate: { year: number, month: number, day: number }, endDate: { year: number, month: number, day: number } }) {
    // Construct the query parameters
    const params = new URLSearchParams();
    
    // We want to fetch all available daily metrics
    const metrics = [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'WEBSITE_CLICKS',
      'CALL_CLICKS',
      'BUSINESS_DIRECTION_REQUESTS',
      'BUSINESS_BOOKINGS',
      'BUSINESS_FOOD_ORDERS'
    ];

    metrics.forEach(m => params.append('dailyMetrics', m));

    params.append('dailyRange.startDate.year', dailyRange.startDate.year.toString());
    params.append('dailyRange.startDate.month', dailyRange.startDate.month.toString());
    params.append('dailyRange.startDate.day', dailyRange.startDate.day.toString());
    
    params.append('dailyRange.endDate.year', dailyRange.endDate.year.toString());
    params.append('dailyRange.endDate.month', dailyRange.endDate.month.toString());
    params.append('dailyRange.endDate.day', dailyRange.endDate.day.toString());

    const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries?${params.toString()}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch performance metrics: ${res.status} ${errorText}`);
    }

    return res.json();
  }

  /**
   * Fetches Monthly Search Keywords from the Performance API
   * Endpoint: GET https://businessprofileperformance.googleapis.com/v1/{name=locations/*}/searchkeywords/impressions/monthly
   */
  static async getSearchKeywords(locationName: string, accessToken: string, monthlyRange: { startMonth: { year: number, month: number }, endMonth: { year: number, month: number } }) {
    const params = new URLSearchParams();
    
    params.append('monthlyRange.startMonth.year', monthlyRange.startMonth.year.toString());
    params.append('monthlyRange.startMonth.month', monthlyRange.startMonth.month.toString());
    
    params.append('monthlyRange.endMonth.year', monthlyRange.endMonth.year.toString());
    params.append('monthlyRange.endMonth.month', monthlyRange.endMonth.month.toString());

    // Note: pageSize can be up to 100
    params.append('pageSize', '100');

    const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}/searchkeywords/impressions/monthly?${params.toString()}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch search keywords: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
