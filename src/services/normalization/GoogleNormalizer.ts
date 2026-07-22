export interface NormalizedProfile {
  name: string;
  primaryCategory: string;
  categories: string[];
  description: string;
  phone: string;
  website: string;
  address: string;
  appointmentUrl: string;
  hasPhotos: boolean;
  isVerified: boolean;
  hours: any;
  attributes: any;
  services: any;
}

export interface NormalizedCompetitor {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryCategory: string;
  phone: string;
  website: string;
  hasPhotos: boolean;
  isOpenNow: boolean;
  distanceMeters: number;
}

export class GoogleNormalizer {
  /**
   * Normalizes the raw Business Profile Information response.
   */
  static normalizeProfileInfo(rawInfo: any): NormalizedProfile {
    const categories = rawInfo.categories?.additionalCategories?.map((c: any) => c.displayName) || [];
    
    // Find appointment URL in attributes or moreHours if it exists
    let appointmentUrl = "";
    if (rawInfo.attributes) {
      const urlAttribute = rawInfo.attributes.find((a: any) => a.name === "url_appointment");
      if (urlAttribute && urlAttribute.values && urlAttribute.values.length > 0) {
        appointmentUrl = urlAttribute.values[0].value || "";
      }
    }
    
    return {
      name: rawInfo.title || "",
      primaryCategory: rawInfo.categories?.primaryCategory?.displayName || "",
      categories,
      description: rawInfo.profile?.description || "",
      phone: rawInfo.phoneNumbers?.primaryPhone || "",
      website: rawInfo.websiteUri || "",
      address: rawInfo.storefrontAddress?.addressLines?.join(", ") || "",
      appointmentUrl: appointmentUrl,
      hasPhotos: true, // Requires media API to fully verify, but default to true if we have info
      isVerified: rawInfo.metadata?.hasPendingVerification === false,
      hours: rawInfo.regularHours || null,
      attributes: rawInfo.attributes || null,
      services: rawInfo.serviceItems || rawInfo.serviceArea || null,
    };
  }

  /**
   * Normalizes the Places API Nearby Search response.
   */
  static normalizeCompetitors(rawPlaces: any, originLat: number, originLng: number): NormalizedCompetitor[] {
    if (!rawPlaces || !rawPlaces.places) return [];

    return rawPlaces.places.map((place: any) => {
      // Basic distance calculation (Haversine formula can be used here for precision)
      let distanceMeters = 0;
      if (place.location) {
        const dLat = (place.location.latitude - originLat) * Math.PI / 180;
        const dLon = (place.location.longitude - originLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(originLat * Math.PI / 180) * Math.cos(place.location.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceMeters = 6371000 * c; // Earth radius in meters
      }

      return {
        placeId: place.id,
        name: place.displayName?.text || "",
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        primaryCategory: place.primaryType || "",
        phone: place.nationalPhoneNumber || "",
        website: place.websiteUri || "",
        hasPhotos: (place.photos && place.photos.length > 0),
        isOpenNow: place.regularOpeningHours?.openNow || false,
        distanceMeters: Math.round(distanceMeters)
      };
    }).sort((a: NormalizedCompetitor, b: NormalizedCompetitor) => a.distanceMeters - b.distanceMeters);
  }
}
