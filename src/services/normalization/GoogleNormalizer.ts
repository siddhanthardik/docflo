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
  id?: string;
  category?: string;
  formattedAddress?: string;
  googleMapsUri?: string;
  lat?: number | null;
  lng?: number | null;
  isHospital?: boolean;
  isPractitioner?: boolean;
  profileType?: "doctor" | "hospital" | "clinic";
  specialtyMismatch?: boolean;
}

export class GoogleNormalizer {
  /**
   * Normalizes a business or clinic name for conservative fallback matching:
   * lowercases, replaces non-alphanumeric characters with spaces, collapses whitespace, trims.
   */
  static normalizeName(name?: string | null): string {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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
   * Normalizes the Places API Nearby or Text Search response.
   * - Nearby mode (default): enforces 5,000m filter and sorts by distance.
   * - Keyword Ranking mode: preserves Google Places search order (observed position) and calculates distance from origin.
   */
  static normalizeCompetitors(
    rawPlaces: any, 
    originLat: number, 
    originLng: number, 
    targetName?: string,
    targetPlaceId?: string,
    options?: {
      maxDistanceMeters?: number;
      sortByDistance?: boolean;
    }
  ): NormalizedCompetitor[] {
    if (!rawPlaces || !rawPlaces.places || !Array.isArray(rawPlaces.places)) return [];

    const maxDistance = options?.maxDistanceMeters !== undefined ? options.maxDistanceMeters : 5000;
    const sortByDist = options?.sortByDistance !== undefined ? options.sortByDistance : true;
    const targetNormalized = GoogleNormalizer.normalizeName(targetName);

    const items: NormalizedCompetitor[] = [];

    for (let idx = 0; idx < rawPlaces.places.length; idx++) {
      const place = rawPlaces.places[idx];
      let distanceMeters = 0;
      if (place.location && typeof place.location.latitude === "number" && typeof place.location.longitude === "number") {
        const dLat = (place.location.latitude - originLat) * Math.PI / 180;
        const dLon = (place.location.longitude - originLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(originLat * Math.PI / 180) * Math.cos(place.location.latitude * Math.PI / 180) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceMeters = 6371000 * c;
      }

      // Hard filter: discard competitors beyond maxDistance (if maxDistance > 0)
      if (maxDistance > 0 && distanceMeters > maxDistance) continue;

      const isMatchPlaceId = Boolean(
        targetPlaceId && place.id && targetPlaceId === place.id
      );

      const placeNormalized = GoogleNormalizer.normalizeName(place.displayName?.text);

      const isMatchName = !targetPlaceId && Boolean(
        targetNormalized.length > 3 &&
        placeNormalized.length > 3 &&
        placeNormalized === targetNormalized
      );

      const isYou = targetPlaceId ? isMatchPlaceId : isMatchName;

      const placeId = place.id || `comp-${idx}`;
      const name = place.displayName?.text || "";
      const googleMapsUri = place.googleMapsUri || (place.id ? `https://www.google.com/maps/place/?q=place_id:${place.id}` : (name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` : ""));

      const nameLower = name.toLowerCase();
      const typeLower = (place.primaryType || "").toLowerCase();
      const displayNameLower = (place.primaryTypeDisplayName?.text || "").toLowerCase();

      const isHospital = (
        nameLower.includes("hospital") ||
        nameLower.includes("institute") ||
        nameLower.includes("nursing home") ||
        nameLower.includes("medical centre") ||
        nameLower.includes("medical center") ||
        typeLower.includes("hospital") ||
        displayNameLower.includes("hospital")
      );

      const isPractitioner = (
        /\b(?:dr\.?|doctor|prof\.?)\b/i.test(name) ||
        typeLower.includes("pediatrician") ||
        typeLower.includes("physician") ||
        displayNameLower.includes("doctor") ||
        displayNameLower.includes("pediatrician")
      ) && !isHospital;

      const profileType: "doctor" | "hospital" | "clinic" = isPractitioner
        ? "doctor"
        : isHospital
        ? "hospital"
        : "clinic";

      const isUnrelatedCategory = (
        typeLower.includes("dentist") ||
        typeLower.includes("dental") ||
        typeLower.includes("pharmacy") ||
        typeLower.includes("drugstore") ||
        typeLower.includes("diagnostic") ||
        typeLower.includes("laboratory") ||
        typeLower.includes("pathology") ||
        typeLower.includes("optometrist") ||
        typeLower.includes("veterinary") ||
        nameLower.includes("dental") ||
        nameLower.includes("dentist") ||
        nameLower.includes("pharmacy") ||
        nameLower.includes("chemist") ||
        nameLower.includes("diagnostic") ||
        nameLower.includes("pathology lab") ||
        nameLower.includes("mri scan") ||
        nameLower.includes("ultrasound")
      );

      items.push({
        id: placeId,
        placeId,
        name,
        rating: typeof place.rating === "number" ? place.rating : 0,
        reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
        primaryCategory: place.primaryType || "",
        category: place.primaryTypeDisplayName?.text || place.primaryType || "Healthcare Practice",
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
        website: place.websiteUri || "",
        googleMapsUri,
        formattedAddress: place.formattedAddress || "",
        hasPhotos: Boolean(place.photos && place.photos.length > 0),
        isOpenNow: Boolean(place.regularOpeningHours?.openNow),
        distanceMeters: Math.round(distanceMeters),
        rank: idx + 1, // Maintained for backward-compatibility with Opportunity Engine
        isYou,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
        isHospital,
        isPractitioner,
        profileType,
        specialtyMismatch: isUnrelatedCategory,
      });
    }

    if (sortByDist) {
      // Factual default ordering: closest physical distance first
      items.sort((a, b) => a.distanceMeters - b.distanceMeters);

      // Update rank indices to reflect distance ordering for downstream consumers
      items.forEach((item, index) => {
        item.rank = index + 1;
      });
    }

    return items;
  }
}
