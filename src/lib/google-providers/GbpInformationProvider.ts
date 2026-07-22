export class GbpInformationProvider {
  /**
   * Fetches Business Profile Information
   * Endpoint: GET https://mybusinessbusinessinformation.googleapis.com/v1/{name=locations/*}
   */
  static async getLocationInformation(locationName: string, accessToken: string) {
    // locationName is the resource name (e.g. "locations/12345")
    const safeReadMask = "title,phoneNumbers,categories,storefrontAddress,websiteUri,profile,regularHours,serviceItems";
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${safeReadMask}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch location information: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
