export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  types: string[]; // e.g. ["dentist", "health", "point_of_interest", "establishment"]
  primaryType: string | null;
  businessStatus: string | null;
  phone: string | null;
  hasOpeningHours: boolean;
  lat?: number;
  lng?: number;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing GOOGLE_PLACES_API_KEY. Skipping actual data fetch.");
    return null;
  }

  // Use the Classic Place Details API to fetch reliable, full data
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,geometry,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,business_status,current_opening_hours");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      console.error("[Google Places] Failed to fetch details:", await res.text());
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      console.warn("[Google Places] Invalid status or missing result:", data.status);
      return null;
    }

    const r = data.result;

    return {
      placeId,
      name: r.name || "",
      formattedAddress: r.formatted_address || "",
      website: r.website || null,
      rating: r.rating || null,
      reviewCount: r.user_ratings_total || null,
      types: r.types || [],
      primaryType: r.types && r.types.length > 0 ? r.types[0] : null,
      businessStatus: r.business_status || null,
      phone: r.formatted_phone_number || null,
      hasOpeningHours: !!r.current_opening_hours,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
    };
  } catch (error) {
    console.error("[Google Places] Error fetching place details:", error);
    return null;
  }
}

export interface CompetitorData {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  placeId: string;
  distanceKm?: number;
}

export async function searchCompetitors(
  query: string, 
  excludePlaceId: string, 
  location?: { lat: number; lng: number }
): Promise<CompetitorData[]> {
  const result = await searchCompetitorsWithRank(query, excludePlaceId, "", location);
  return result.competitors;
}

export interface CompetitorSearchResult {
  competitors: CompetitorData[];
  userRank: number;
  userIndexInResults: number;
}

export async function searchCompetitorsWithRank(
  query: string,
  targetPlaceId: string,
  targetName: string,
  location?: { lat: number; lng: number }
): Promise<CompetitorSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing API key for competitor search.");
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  if (location?.lat && location?.lng) {
    url.searchParams.set("location", `${location.lat},${location.lng}`);
    url.searchParams.set("radius", "5000"); // Strict 5 km radius search
  }
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      console.error("[Google Places] Failed to fetch competitors:", await res.text());
      return { competitors: [], userRank: 5, userIndexInResults: -1 };
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results || !Array.isArray(data.results)) {
      return { competitors: [], userRank: 5, userIndexInResults: -1 };
    }

    const rawResults = data.results;

    // 1. Detect target clinic position in Google Places search results
    let userIndex = -1;
    if (targetPlaceId) {
      userIndex = rawResults.findIndex((r: any) => r.place_id === targetPlaceId);
    }
    if (userIndex === -1 && targetName) {
      const cleanTarget = targetName.toLowerCase().replace(/dr\.?|clinic|hospital/g, "").trim();
      if (cleanTarget.length > 2) {
        userIndex = rawResults.findIndex((r: any) => r.name?.toLowerCase().includes(cleanTarget));
      }
    }

    const userRank = userIndex !== -1 ? userIndex + 1 : 5;

    // 2. Gather top competitors within 5 km (excluding target clinic)
    const competitors: CompetitorData[] = [];
    for (const r of rawResults) {
      if (targetPlaceId && r.place_id === targetPlaceId) continue;
      if (targetName && r.name?.toLowerCase().trim() === targetName.toLowerCase().trim()) continue;

      let distanceKm: number | undefined;
      if (location?.lat && location?.lng && r.geometry?.location?.lat && r.geometry?.location?.lng) {
        distanceKm = calculateDistanceKm(
          location.lat,
          location.lng,
          r.geometry.location.lat,
          r.geometry.location.lng
        );
        // Hard filter: Discard any competitor more than 5 km away
        if (distanceKm > 5) {
          continue;
        }
      }

      competitors.push({
        name: r.name,
        rating: r.rating || null,
        reviewCount: r.user_ratings_total || null,
        placeId: r.place_id,
        distanceKm: distanceKm !== undefined ? Math.round(distanceKm * 10) / 10 : undefined,
      });

      if (competitors.length >= 4) break;
    }

    return {
      competitors,
      userRank,
      userIndexInResults: userIndex,
    };
  } catch (error) {
    console.error("[Google Places] Error searching competitors:", error);
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }
}
