export class GooglePlacesProvider {
  /**
   * Maps human-readable or specialty categories to valid Google Places API (New) Table A types.
   */
  static mapCategoryToValidTypes(category: string): string[] {
    const lower = (category || "").toLowerCase();
    if (lower.includes("dent")) return ["dentist", "medical_clinic", "doctor"];
    if (lower.includes("physio")) return ["physiotherapist", "medical_clinic", "doctor"];
    if (lower.includes("pharm")) return ["pharmacy"];
    if (lower.includes("hospital")) return ["hospital", "medical_clinic", "doctor"];
    // Default valid Google Places Table A primary healthcare types
    return ["doctor", "medical_clinic", "hospital"];
  }

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
    
    // Request fields needed for nearby competitor discovery, comparison, contact & directions
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.types',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.googleMapsUri',
      'places.formattedAddress',
      'places.regularOpeningHours',
      'places.photos',
      'places.location'
    ].join(',');

    const includedTypes = this.mapCategoryToValidTypes(primaryCategory);

    const payload = {
      includedPrimaryTypes: includedTypes,
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

  /**
   * Searches competitors using natural language query via Google Places Text Search (New).
   * Endpoint: POST https://places.googleapis.com/v1/places:searchText
   * Uses locationBias (circular preference, NOT strict restriction) around the clinic coordinates.
   */
  static async searchTextCompetitors(
    textQuery: string,
    latitude: number,
    longitude: number,
    apiKey: string,
    biasRadiusMeters: number = 30000,
    maxResultCount: number = 20
  ) {
    const url = 'https://places.googleapis.com/v1/places:searchText';

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.types',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.googleMapsUri',
      'places.formattedAddress',
      'places.regularOpeningHours',
      'places.photos',
      'places.location'
    ].join(',');

    const payload: any = {
      textQuery,
      maxResultCount,
      locationBias: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: biasRadiusMeters,
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to search competitors with query "${textQuery}": ${res.status} ${errorText}`);
    }

    return res.json();
  }
}
