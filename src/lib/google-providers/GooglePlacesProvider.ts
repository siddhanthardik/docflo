export class GooglePlacesProvider {
  /**
   * Fetches nearby competitors for a given location using the New Places API.
   * Endpoint: POST https://places.googleapis.com/v1/places:searchNearby
   */
  static async searchNearbyCompetitors(
    latitude: number,
    longitude: number,
    primaryCategory: string,
    apiKey: string,
    radiusMeters: number = 5000,
    maxResultCount: number = 20
  ) {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    
    // We request the fields needed to build the Gap Analysis and Comparison UI
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.types',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.regularOpeningHours',
      'places.photos',
      'places.location'
    ].join(',');

    const payload = {
      includedPrimaryTypes: [primaryCategory],
      maxResultCount,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude
          },
          radius: radiusMeters
        }
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch nearby competitors: ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
