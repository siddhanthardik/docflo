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
}

export async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing GOOGLE_PLACES_API_KEY. Skipping actual data fetch.");
    return null;
  }

  // Use the Classic Place Details API to fetch reliable, full data
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,business_status,current_opening_hours");
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
}

export async function searchCompetitors(query: string, excludePlaceId: string): Promise<CompetitorData[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing API key for competitor search.");
    return [];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      console.error("[Google Places] Failed to fetch competitors:", await res.text());
      return [];
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results) {
      return [];
    }

    const competitors: CompetitorData[] = [];
    
    // Grab top 3 that are not the current place
    for (const r of data.results) {
      if (r.place_id !== excludePlaceId) {
        competitors.push({
          name: r.name,
          rating: r.rating || null,
          reviewCount: r.user_ratings_total || null,
          placeId: r.place_id
        });
      }
      if (competitors.length >= 3) break;
    }

    return competitors;
  } catch (error) {
    console.error("[Google Places] Error searching competitors:", error);
    return [];
  }
}
