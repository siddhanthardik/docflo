export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  types: string[];                    // all secondary GBP type slugs
  primaryType: string | null;         // primary GBP type slug e.g. "pediatrician"
  primaryTypeDisplayName: string | null; // human label from Google e.g. "Pediatrician"
  businessStatus: string | null;
  phone: string | null;
  hasOpeningHours: boolean;
  lat?: number;
  lng?: number;
  reviewsText?: string[];             // patient review text snippets for specialty classification
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// ── Places API (New) — fetches actual GBP primaryType, displayName, and reviews ──
export async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing GOOGLE_PLACES_API_KEY.");
    return null;
  }

  // ── Attempt Places API (New) v1 first ──────────────────────────────────────
  try {
    const newApiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "websiteUri",
      "rating",
      "userRatingCount",
      "types",
      "primaryType",
      "primaryTypeDisplayName",
      "nationalPhoneNumber",
      "businessStatus",
      "location",
      "currentOpeningHours",
      "reviews",
    ].join(",");

    const res = await fetch(newApiUrl, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
        "Accept": "application/json",
      },
    });

    if (res.ok) {
      const r = await res.json();

      if (r && r.id && !r.error) {
        const primaryTypeSlug: string | null = r.primaryType || null;
        const primaryTypeLabel: string | null =
          r.primaryTypeDisplayName?.text ||
          r.primaryTypeDisplayName?.languageCode ||
          null;

        const reviewsText: string[] = Array.isArray(r.reviews)
          ? r.reviews.map((rev: any) => rev.text?.text || rev.originalText?.text || "").filter(Boolean)
          : [];

        console.log(`[Places API v1] ${r.displayName?.text} → primaryType: "${primaryTypeSlug}", displayName: "${primaryTypeLabel}", reviewsCount: ${reviewsText.length}`);

        return {
          placeId,
          name: r.displayName?.text || "",
          formattedAddress: r.formattedAddress || "",
          website: r.websiteUri || null,
          rating: r.rating || null,
          reviewCount: r.userRatingCount || null,
          types: Array.isArray(r.types) ? r.types : [],
          primaryType: primaryTypeSlug,
          primaryTypeDisplayName: primaryTypeLabel,
          businessStatus: r.businessStatus || null,
          phone: r.nationalPhoneNumber || null,
          hasOpeningHours: !!r.currentOpeningHours,
          lat: r.location?.latitude,
          lng: r.location?.longitude,
          reviewsText,
        };
      }

      console.warn("[Places API v1] Unexpected response body:", JSON.stringify(r).slice(0, 200));
    } else {
      const errText = await res.text();
      console.warn(`[Places API v1] HTTP ${res.status} — falling back to Classic API. Error: ${errText.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("[Places API v1] Network error — falling back to Classic API:", err);
  }

  // ── Fallback: Classic Place Details API ────────────────────────────────────
  try {
    console.log("[Places Classic API] Falling back for placeId:", placeId);
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set(
      "fields",
      "name,geometry,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,business_status,current_opening_hours,reviews"
    );
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error("[Places Classic API] Failed:", await res.text());
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      console.warn("[Places Classic API] Bad status:", data.status);
      return null;
    }

    const r = data.result;

    const reviewsText: string[] = Array.isArray(r.reviews)
      ? r.reviews.map((rev: any) => rev.text || "").filter(Boolean)
      : [];

    return {
      placeId,
      name: r.name || "",
      formattedAddress: r.formatted_address || "",
      website: r.website || null,
      rating: r.rating || null,
      reviewCount: r.user_ratings_total || null,
      types: r.types || [],
      primaryType: r.types?.[0] || null,
      primaryTypeDisplayName: null,
      businessStatus: r.business_status || null,
      phone: r.formatted_phone_number || null,
      hasOpeningHours: !!r.current_opening_hours,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      reviewsText,
    };
  } catch (error) {
    console.error("[Places Classic API] Error:", error);
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

export interface CompetitorSearchResult {
  competitors: CompetitorData[];
  userRank: number;
  userIndexInResults: number;
}

export async function searchCompetitors(
  query: string,
  excludePlaceId: string,
  location?: { lat: number; lng: number }
): Promise<CompetitorData[]> {
  const result = await searchCompetitorsWithRank(query, excludePlaceId, "", location);
  return result.competitors;
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
    url.searchParams.set("radius", "5000");
  }
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

    if (!res.ok) {
      console.error("[Google Places] Failed competitor search:", await res.text());
      return { competitors: [], userRank: 5, userIndexInResults: -1 };
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results || !Array.isArray(data.results)) {
      return { competitors: [], userRank: 5, userIndexInResults: -1 };
    }

    const rawResults = data.results;

    // Detect target clinic position in results
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

    // Gather top competitors within 5 km (excluding target clinic)
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
        if (distanceKm > 5) continue;
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

    return { competitors, userRank, userIndexInResults: userIndex };
  } catch (error) {
    console.error("[Google Places] Error searching competitors:", error);
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }
}
