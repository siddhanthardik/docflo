import { CLINICAL_MEDICAL_RULES } from "./healthcare-intelligence";

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

  googlePosition: number;  // Real 1-based position in Google search results list
}

export interface CompetitorSearchResult {
  competitors: CompetitorData[];
  userRank: number;
  userIndexInResults: number;
}

/**
 * Builds a hyper-local search query using the clinic's neighborhood and city,
 * NOT a pincode. E.g. "Pediatrician near Safdarjung Enclave, New Delhi"
 */
export function buildLocalSearchQuery(specialty: string, formattedAddress: string): string {
  if (!formattedAddress || !specialty) return specialty;

  const parts = formattedAddress
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)
    .filter(p => !/^india$/i.test(p))      // Remove country
    .filter(p => !/\d{5,}/.test(p));       // Remove pincodes (6-digit)

  if (parts.length >= 3) {
    // Structure: [house], [block], [neighborhood], [city], [state]
    // Neighborhood is 3rd from last, city is 2nd from last
    const neighborhood = parts[parts.length - 3];
    const city = parts[parts.length - 2];
    return `${specialty} near ${neighborhood}, ${city}`;
  } else if (parts.length === 2) {
    return `${specialty} in ${parts[0]}, ${parts[1]}`;
  } else if (parts.length === 1) {
    return `${specialty} in ${parts[0]}`;
  }
  return specialty;
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
  location?: { lat: number; lng: number },
  locationContext?: string // e.g. "Safdarjung Enclave, New Delhi" — used to build accurate local query
): Promise<CompetitorSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing API key for competitor search.");
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }

  // Build hyper-local text query: "Best Pediatrician in Safdarjung Enclave, New Delhi"
  // This triggers Google's Prominence algorithm for authentic SEO audits.
  const textQuery = locationContext
    ? `Best ${query} in ${locationContext}`
    : `Best ${query}`;

  console.log(`[Competitor Search v1] query: "${textQuery}"`);

  // Clean target name for fuzzy matching (remove Dr., Clinic, Hospital)
  const cleanTargetName = targetName
    ? targetName.toLowerCase().replace(/dr\.?\s*/gi, "").replace(/clinic|hospital|centre|center/gi, "").trim()
    : "";

  try {
    const v1Url = "https://places.googleapis.com/v1/places:searchText";
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.rating",
      "places.userRatingCount",
      "places.primaryType",
      "places.primaryTypeDisplayName",
      "places.location",
    ].join(",");

    const requestBody: any = {
      textQuery,
      maxResultCount: 20,
    };

    // Use a broad locationBias to ground the search to the correct city/area
    // without overriding the "Best" Prominence algorithm.
    if (location?.lat && location?.lng) {
      requestBody.locationBias = {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: 5000,
        },
      };
    }

    const res = await fetch(v1Url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    if (res.ok) {
      const data = await res.json();
      const rawPlaces: any[] = data.places || [];

      // ── Step 1: Find user's real position in Google results ──
      let userIndex = -1;
      if (targetPlaceId) {
        userIndex = rawPlaces.findIndex((p: any) => p.id === targetPlaceId);
      }
      if (userIndex === -1 && cleanTargetName.length > 2) {
        userIndex = rawPlaces.findIndex((p: any) =>
          p.displayName?.text?.toLowerCase().includes(cleanTargetName)
        );
      }

      // ── Step 2: If not in top 20, try tighter 3km local search ──
      let finalUserRank = userIndex !== -1 ? userIndex + 1 : 21;

      if (userIndex === -1 && cleanTargetName && location?.lat && location?.lng) {
        try {
          const secondaryRes = await fetch(v1Url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": fieldMask,
            },
            body: JSON.stringify({
              textQuery,
              maxResultCount: 20,
              // Fallback to locationBias only if we couldn't find the user organically
              // and we absolutely need to find where they sit in a tighter 3km radius.
              locationBias: {
                circle: {
                  center: { latitude: location.lat, longitude: location.lng },
                  radius: 3000,
                },
              },
            }),
          });

          if (secondaryRes.ok) {
            const secData = await secondaryRes.json();
            const secPlaces: any[] = secData.places || [];
            let secIdx = -1;
            if (targetPlaceId) {
              secIdx = secPlaces.findIndex((p: any) => p.id === targetPlaceId);
            }
            if (secIdx === -1 && cleanTargetName.length > 2) {
              secIdx = secPlaces.findIndex((p: any) =>
                p.displayName?.text?.toLowerCase().includes(cleanTargetName)
              );
            }
            if (secIdx !== -1) {
              finalUserRank = secIdx + 1;
              console.log(`[Competitor Search v1] Target found in tight 3km search at position #${finalUserRank}`);
            }
          }
        } catch (e) {
          console.warn("[Competitor Search v1] Secondary search failed:", e);
        }
      }

      // ── Step 3: Build competitor list from Google results ──
      // Preserve Google's ordering exactly — DO NOT re-sort by review count.
      // Exclude the target clinic itself.
      const competitors: CompetitorData[] = [];
      let googlePos = 0;

      for (const p of rawPlaces) {
        googlePos++;

        // Skip the target clinic
        if (targetPlaceId && p.id === targetPlaceId) continue;
        const pNameLower = (p.displayName?.text || "").toLowerCase();
        if (cleanTargetName.length > 2 && pNameLower.includes(cleanTargetName)) continue;

        const pLabel = p.primaryTypeDisplayName?.text || "";
        const pType = p.primaryType || "";
        const pName = p.displayName?.text || "";

        // --- Dynamic Strict Specialty Filter ---
        const excludeKeywords = [
          'surgeon', 'surgery', 'physician', 'gastro', 'neuro', 'derma', 'uro', 'onco', 
          'psych', 'ent ', 'eye', 'ophthalm', 'cardio', 'ortho', 'dental', 'dentist', 
          'gynec', 'gynaec', 'diabetes', 'ivf', 'fertility', 'pediatr', 'paediatr', 'clinic'
        ];

        let isUnrelated = false;
        const qStr = query.toLowerCase();
        const cStr = (pName + " " + pLabel).toLowerCase();

        for (const kw of excludeKeywords) {
          if (kw === 'clinic') continue; // Clinic is too generic to block
          
          if (cStr.includes(kw)) {
            if ((kw === 'gynec' || kw === 'gynaec' || kw === 'ivf' || kw === 'fertility') && 
                (qStr.includes('gynec') || qStr.includes('gynaec') || qStr.includes('ivf') || qStr.includes('fertility'))) continue;
            if ((kw === 'pediatr' || kw === 'paediatr') && (qStr.includes('pediatr') || qStr.includes('paediatr'))) continue;
            if ((kw === 'dental' || kw === 'dentist') && (qStr.includes('dental') || qStr.includes('dentist'))) continue;
            
            if (!qStr.includes(kw)) {
              isUnrelated = true;
              break;
            }
          }
        }

        // --- Positive Relevance Filter (Like GrexaAI strictness) ---
        if (!isUnrelated) {
          const targetRule = CLINICAL_MEDICAL_RULES.find(rule => 
            qStr.includes(rule.label.toLowerCase()) || 
            rule.matchers.some(m => qStr.includes(m))
          );
          
          if (targetRule) {
            const hasPositiveMatch = targetRule.matchers.some(m => cStr.includes(m)) || cStr.includes(targetRule.label.toLowerCase());
            if (!hasPositiveMatch) {
              isUnrelated = true;
            }
          }
        }

        if (isUnrelated) {
          console.log(`[Competitor Filter] Excluded: "${pName}" (${pLabel}) — completely unrelated to ${query}`);
          continue;
        }



        let distKm = null;
        if (location?.lat && location?.lng && p.location?.latitude && p.location?.longitude) {
          distKm = calculateDistanceKm(location.lat, location.lng, p.location.latitude, p.location.longitude);
          if (distKm > 5) {
            console.log(`[Competitor Filter] Excluded: "${pName}" — too far away (${distKm}km)`);
            continue;
          }
        }

        competitors.push({
          name: pName,
          rating: p.rating ?? null,
          reviewCount: p.userRatingCount ?? null,
          placeId: p.id || "",
          googlePosition: googlePos, // Real Google list position
        });

        if (competitors.length >= 10) break; // Show up to 10 real competitors
      }

      console.log(`[Competitor Search v1] "${textQuery}" → ${competitors.length} competitors found. User at Google position #${finalUserRank}.`);
      return { competitors, userRank: finalUserRank, userIndexInResults: userIndex };
    }
  } catch (err) {
    console.warn("[Competitor Search v1] Error, falling back to Classic API:", err);
  }

  // ── Fallback: Classic Text Search (uses textQuery with neighborhood context) ──
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", textQuery);
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

    let userIndex = -1;
    if (targetPlaceId) {
      userIndex = rawResults.findIndex((r: any) => r.place_id === targetPlaceId);
    }
    if (userIndex === -1 && cleanTargetName.length > 2) {
      userIndex = rawResults.findIndex((r: any) =>
        r.name?.toLowerCase().includes(cleanTargetName)
      );
    }

    const userRank = userIndex !== -1 ? userIndex + 1 : 21;

    const competitors: CompetitorData[] = [];
    let classicPos = 0;
    for (const r of rawResults) {
      classicPos++;
      if (targetPlaceId && r.place_id === targetPlaceId) continue;
      if (cleanTargetName.length > 2 && r.name?.toLowerCase().includes(cleanTargetName)) continue;

      const pName = r.name || "";
      const pLabel = r.types?.join(" ") || ""; // Classic API returns types array

      // --- Dynamic Strict Specialty Filter ---
      const excludeKeywords = [
        'surgeon', 'surgery', 'physician', 'gastro', 'neuro', 'derma', 'uro', 'onco', 
        'psych', 'ent ', 'eye', 'ophthalm', 'cardio', 'ortho', 'dental', 'dentist', 
        'gynec', 'gynaec', 'diabetes', 'ivf', 'fertility', 'pediatr', 'paediatr'
      ];

      let isUnrelated = false;
      const qStr = query.toLowerCase();
      const cStr = (pName + " " + pLabel).toLowerCase();

      for (const kw of excludeKeywords) {
        if (cStr.includes(kw)) {
          if ((kw === 'gynec' || kw === 'gynaec' || kw === 'ivf' || kw === 'fertility') && 
              (qStr.includes('gynec') || qStr.includes('gynaec') || qStr.includes('ivf') || qStr.includes('fertility'))) continue;
          if ((kw === 'pediatr' || kw === 'paediatr') && (qStr.includes('pediatr') || qStr.includes('paediatr'))) continue;
          if ((kw === 'dental' || kw === 'dentist') && (qStr.includes('dental') || qStr.includes('dentist'))) continue;
          
          if (!qStr.includes(kw)) {
            isUnrelated = true;
            break;
          }
        }
      }

      // --- Positive Relevance Filter (Like GrexaAI strictness) ---
      if (!isUnrelated) {
        const targetRule = CLINICAL_MEDICAL_RULES.find(rule => 
          qStr.includes(rule.label.toLowerCase()) || 
          rule.matchers.some(m => qStr.includes(m))
        );
        
        if (targetRule) {
          const hasPositiveMatch = targetRule.matchers.some(m => cStr.includes(m)) || cStr.includes(targetRule.label.toLowerCase());
          if (!hasPositiveMatch) {
            isUnrelated = true;
          }
        }
      }

      if (isUnrelated) {
        console.log(`[Competitor Filter Classic] Excluded: "${pName}" (${pLabel}) — completely unrelated to ${query}`);
        continue;
      }

      let distKm = null;
      if (location?.lat && location?.lng && r.geometry?.location?.lat && r.geometry?.location?.lng) {
        distKm = calculateDistanceKm(location.lat, location.lng, r.geometry.location.lat, r.geometry.location.lng);
        if (distKm > 5) {
          console.log(`[Competitor Filter Classic] Excluded: "${pName}" — too far away (${distKm}km)`);
          continue;
        }
      }

      competitors.push({
        name: r.name,
        rating: r.rating ?? null,
        reviewCount: r.user_ratings_total ?? null,
        placeId: r.place_id,
        googlePosition: classicPos,
      });

      if (competitors.length >= 10) break;
    }

    return { competitors, userRank, userIndexInResults: userIndex };
  } catch (error) {
    console.error("[Google Places] Error searching competitors:", error);
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }
}

// ── Unified GeoGrid Logic ──

export async function extractNeighborhood(address: string, apiKey: string): Promise<{ neighborhood: string; city: string; searchPhrase: string; lat: number; lng: number } | null> {
  // Geocode the full address to extract structured components
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  try {
    const res = await fetch(geoUrl);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      const components = data.results[0].address_components;
      
      let level1 = "";
      let level2 = "";
      let geoCity = "";
      
      for (const comp of components) {
        if (comp.types.includes("sublocality_level_1")) {
          level1 = comp.long_name;
        } else if (comp.types.includes("sublocality_level_2") || comp.types.includes("neighborhood") || comp.types.includes("sublocality")) {
          if (!level2) level2 = comp.long_name;
        }
        
        if (comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")) {
          if (!geoCity) geoCity = comp.long_name;
        }
      }
      
      const geoNeighborhood = level1 || level2;
      
      if (geoNeighborhood && geoCity) {
        return {
          neighborhood: geoNeighborhood,
          city: geoCity,
          searchPhrase: `${geoNeighborhood}, ${geoCity}`,
          lat: loc.lat,
          lng: loc.lng,
        };
      } else if (geoCity) {
        return {
          neighborhood: geoCity,
          city: geoCity,
          searchPhrase: geoCity,
          lat: loc.lat,
          lng: loc.lng,
        };
      }
    }
  } catch (err) {
    console.error("[Geocode] Error extracting neighborhood:", err);
  }
  
  // Fallback if Geocoding fails to yield components
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  const fallback = parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : address;
  return {
    neighborhood: fallback,
    city: fallback,
    searchPhrase: fallback,
    lat: 0,
    lng: 0
  };
}

export function offsetCoord(lat: number, lng: number, dNorth: number, dEast: number) {
  const R = 6378137; // Earth radius in meters
  const dLat = dNorth / R;
  const dLng = dEast / (R * Math.cos((Math.PI * lat) / 180));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
}

export async function unifiedGeoGrid(
  specialtyLabel: string,
  searchPhraseContext: string,
  centerLat: number,
  centerLng: number,
  businessName: string,
  apiKey: string,
  gridSize = 5,
  spacingMeters = 500
): Promise<{ ranks: {lat: number, lng: number, row: number, col: number, rank: number, found: boolean}[], centroidRank: number, organicRank: number }> {
  
  // 1. Generate 5x5 grid points
  const half = Math.floor(gridSize / 2);
  const gridPoints: any[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const dNorth = (half - row) * spacingMeters;
      const dEast = (col - half) * spacingMeters;
      const { lat, lng } = offsetCoord(centerLat, centerLng, dNorth, dEast);
      gridPoints.push({ row, col, lat, lng });
    }
  }

  // Function to search from a specific point
  const searchFromPoint = async (lat: number, lng: number, useLocationBias: boolean) => {
    let urlStr = "";
    if (useLocationBias) {
      // Clean "near me" from the keyword because Nearby Search expects a raw category/keyword
      const cleanKeyword = specialtyLabel.replace(/near me/gi, "").trim();
      
      // Scale radius dynamically based on grid spacing to ensure we capture competitors at the edges.
      // If spacing is 500m, radius is 1000m. If spacing is 2000m, radius is 3000m.
      const searchRadius = Math.max(1000, spacingMeters * 1.5);
      
      // Nearby Search strictly enforces the lat/lng center point and ranks by prominence/distance.
      // This is exactly how tools like GrexaAI perform a GeoGrid.
      urlStr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&keyword=${encodeURIComponent(cleanKeyword)}&key=${apiKey}`;
    } else {
      const textQuery = `${specialtyLabel} in ${searchPhraseContext}`;
      urlStr = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&key=${apiKey}`;
    }

    try {
      const res = await fetch(urlStr, { headers: { Accept: "application/json" } });
      if (!res.ok) return 21;
      const data = await res.json();
      if (data.status !== "OK" || !data.results) return 21;

      const cleanTargetName = businessName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      
      const idx = data.results.findIndex((r: any) => {
        const rName = (r.name || "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
        return rName.includes(cleanTargetName.split(" ").slice(0, 3).join(" ")) ||
               cleanTargetName.includes(rName.split(" ").slice(0, 2).join(" "));
      });

      return idx >= 0 ? idx + 1 : 21; // 21 means not found in top 20
    } catch {
      return 21;
    }
  };

  // 2. Fetch ranks for 25 points concurrently in batches
  const batchSize = 5;
  const ranks: any[] = [];
  for (let i = 0; i < gridPoints.length; i += batchSize) {
    const batch = gridPoints.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (point) => {
        const rank = await searchFromPoint(point.lat, point.lng, true);
        return { ...point, rank, found: rank <= 20 };
      })
    );
    ranks.push(...batchResults);
    if (i + batchSize < gridPoints.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 3. Get organic rank (no location bias)
  const organicRank = await searchFromPoint(centerLat, centerLng, false);
  
  // 4. Centroid rank is the center of the grid
  const centroidRank = ranks.find(r => r.row === half && r.col === half)?.rank || 21;

  return { ranks, centroidRank, organicRank };
}

export function calculateCompositeRank(gridRanks: {rank: number}[], centroidRank: number, organicRank: number) {
  const avgGridRank = gridRanks.reduce((sum, r) => sum + r.rank, 0) / gridRanks.length;
  const compositeRank = Math.round(0.45 * avgGridRank + 0.35 * centroidRank + 0.20 * organicRank);
  
  // Calculate variance (std dev)
  const allRanks = [...gridRanks.map(r => r.rank), centroidRank, organicRank];
  const mean = allRanks.reduce((sum, r) => sum + r, 0) / allRanks.length;
  const variance = allRanks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / allRanks.length;
  const stdDev = Math.sqrt(variance);

  let confidence: "high" | "medium" | "low" = "low";
  if (stdDev < 2) confidence = "high";
  else if (stdDev < 5) confidence = "medium";

  return { compositeRank, confidence, avgGridRank, stdDev, organicRank, centroidRank };
}

