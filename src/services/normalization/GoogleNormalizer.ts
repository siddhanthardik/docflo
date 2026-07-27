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
  rank: number;
  isYou?: boolean;
}

export class GoogleNormalizer {
  /**
   * Normalizes the Business Profile Information response.
   */
  static normalizeProfileInfo(rawInfo: any): NormalizedProfile {
    const categories = rawInfo.categories?.additionalCategories?.map((c: any) => c.displayName) || [];
    
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
      hasPhotos: true,
      isVerified: rawInfo.metadata?.hasPendingVerification === false,
      hours: rawInfo.regularHours || null,
      attributes: rawInfo.attributes || null,
      services: rawInfo.serviceItems || rawInfo.serviceArea || null,
    };
  }

  /**
   * Normalizes the Places API Nearby / Search response with strict 5km filter and rank.
   */
  static normalizeCompetitors(rawPlaces: any, originLat: number, originLng: number, targetName?: string): NormalizedCompetitor[] {
    if (!rawPlaces || !rawPlaces.places || !Array.isArray(rawPlaces.places)) return [];

    const cleanTarget = targetName ? targetName.toLowerCase().replace(/dr\.?|clinic|hospital/g, "").trim() : "";

    const items: NormalizedCompetitor[] = [];

    for (let idx = 0; idx < rawPlaces.places.length; idx++) {
      const place = rawPlaces.places[idx];
      let distanceMeters = 0;
      if (place.location) {
        const dLat = (place.location.latitude - originLat) * Math.PI / 180;
        const dLon = (place.location.longitude - originLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(originLat * Math.PI / 180) * Math.cos(place.location.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceMeters = 6371000 * c;
      }

      // Hard filter: discard competitors > 5000 meters (5 km) away
      if (distanceMeters > 5000) continue;

      const isYou = cleanTarget.length > 2 && place.displayName?.text?.toLowerCase().includes(cleanTarget);

      items.push({
        placeId: place.id || `comp-${idx}`,
        name: place.displayName?.text || "",
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        primaryCategory: place.primaryType || "",
        phone: place.nationalPhoneNumber || "",
        website: place.websiteUri || "",
        hasPhotos: (place.photos && place.photos.length > 0),
        isOpenNow: place.regularOpeningHours?.openNow || false,
        distanceMeters: Math.round(distanceMeters),
        rank: idx + 1,
        isYou: !!isYou
      });
    }

    return items;
  }
}
