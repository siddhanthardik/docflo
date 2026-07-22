export class GbpPostsProvider {
  /**
   * Fetches local posts for a given location.
   * Endpoint: GET https://mybusiness.googleapis.com/v4/accounts/ACCOUNT_ID/locations/LOCATION_ID/localPosts
   */
  static async getPosts(accountLocationPath: string, accessToken: string, pageSize: number = 50) {
    // accountLocationPath should be like "accounts/123/locations/456"
    const url = `https://mybusiness.googleapis.com/v4/${accountLocationPath}/localPosts?pageSize=${pageSize}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch local posts: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
