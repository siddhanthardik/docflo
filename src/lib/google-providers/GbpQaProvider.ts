export class GbpQaProvider {
  /**
   * Fetches the latest Q&A from the Google Business Profile API.
   * This calls the mybusinessqanda.googleapis.com endpoint.
   */
  static async getQuestionsAndAnswers(locationName: string, accessToken: string) {
    const url = `https://mybusinessqanda.googleapis.com/v1/${locationName}/questions`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      // If the API isn't enabled or location has no Q&A, return empty rather than throwing
      if (res.status === 403 || res.status === 404) {
        console.warn(`[GbpQaProvider] Q&A API might not be enabled or found: ${res.status}`);
        return { questions: [] };
      }
      throw new Error(`Failed to fetch Q&A: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
