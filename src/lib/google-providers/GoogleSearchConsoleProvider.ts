export class GoogleSearchConsoleProvider {
  /**
   * Fetches Search Analytics data from Google Search Console.
   * Endpoint: POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
   */
  static async getSearchAnalytics(
    siteUrl: string, 
    accessToken: string,
    startDate: string, // YYYY-MM-DD
    endDate: string,   // YYYY-MM-DD
    dimensions: string[] = ['query'] // 'query', 'page', 'device', 'date'
  ) {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;
    
    const payload = {
      startDate,
      endDate,
      dimensions,
      rowLimit: 1000 // Get top 1000 queries
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch Search Console analytics: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
