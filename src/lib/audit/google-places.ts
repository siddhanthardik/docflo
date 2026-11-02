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
  photoUrl?: string | null;
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
      "photos",
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

        const firstPhoto = r.photos?.[0]?.name;
        const photoUrl = firstPhoto ? `https://places.googleapis.com/v1/${firstPhoto}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}` : null;

        console.log(`[Places API v1] ${r.displayName?.text} → primaryType: "${primaryTypeSlug}", displayName: "${primaryTypeLabel}", reviewsCount: ${reviewsText.length}, hasPhoto: ${!!photoUrl}`);

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
          photoUrl
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
      "name,geometry,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,business_status,current_opening_hours,reviews,photos"
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

    let photoUrl = null;
    if (r.photos && r.photos.length > 0) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${apiKey}`;
    }

    return {
      placeId,
      name: r.name || "",
      formattedAddress: r.formatted_address || "",
      website: r.website || null,
      rating: r.rating || null,
      reviewCount: r.user_ratings_total || null,
      types: r.types || [],
      primaryType: r.types && r.types.length > 0 ? r.types[0] : null,
      primaryTypeDisplayName: null,
      businessStatus: r.business_status || null,
      phone: r.international_phone_number || r.formatted_phone_number || null,
      hasOpeningHours: !!r.opening_hours,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      reviewsText: r.reviews ? r.reviews.map((rev: any) => rev.text).filter(Boolean) : [],
      photoUrl
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
  distanceMeters?: number | null;
  category?: string | null;
  primaryType?: string | null;
  formattedAddress?: string | null;
  lat?: number | null;
  lng?: number | null;
  isYou?: boolean;
}

export interface CompetitorSearchResult {
  competitors: CompetitorData[];
  userRank: number;
  userIndexInResults: number;
  textQueryUsed?: string;
  scope?: "city" | "local";
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
    .map(p => p.replace(/\b\d{5,6}\b/g, "").trim()) // Remove 5 or 6 digit pincodes
    .filter(Boolean);

  if (parts.length >= 3) {
    // Structure: [house], [block], [neighborhood], [city], [state]
    // Neighborhood is 3rd from last, city is 2nd from last
    const neighborhood = parts[parts.length - 3];
    const city = parts[parts.length - 2];
    return `${specialty} in ${neighborhood}, ${city}`;
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

/**
 * Strict specialty relevance evaluator for competitor benchmarking.
 * 1. STRICTLY EXCLUDES major multi-specialty healthcare institutions:
 *    (Hospitals, Super Speciality Hospitals, Medical Centres, Colleges, Nursing Homes)
 * 2. STRICTLY EXCLUDES non-healthcare noise (veterinary, pet, restaurants, hotels, optical, chemist)
 * 3. STRICTLY EXCLUDES unrelated clinical specialties (e.g. gynae, dental, eye, derma when doctor is nephro)
 * 4. STRICTLY REQUIRES positive evidence that the business operates within the doctor's specialty domain.
 */
export function isRelatedCompetitor(targetSpecialty: string, place: {
  name: string;
  primaryType?: string | null;
  primaryTypeDisplayName?: string | null;
  types?: string[];
}): boolean {
  const pName = (place.name || "").toLowerCase();
  const pPrimary = (place.primaryType || "").toLowerCase();
  const pPrimaryLabel = (place.primaryTypeDisplayName || "").toLowerCase();
  const allTypes = (place.types || []).map(t => t.toLowerCase());
  const combined = `${pName} ${pPrimary} ${pPrimaryLabel} ${allTypes.join(" ")}`.toLowerCase();

  // 1. Non-healthcare noise
  if (
    combined.includes("veterinary") ||
    combined.includes("pet clinic") ||
    combined.includes("animal hospital") ||
    combined.includes("restaurant") ||
    combined.includes("hotel") ||
    combined.includes("car service") ||
    combined.includes("pharmacy") ||
    combined.includes("chemist") ||
    combined.includes("optical") ||
    combined.includes("spectacle")
  ) {
    return false;
  }

  // 2. Identify target specialty matchers from CLINICAL_MEDICAL_RULES
  const normTarget = (targetSpecialty || "").toLowerCase();
  const targetRule = CLINICAL_MEDICAL_RULES.find(r => 
    normTarget.includes(r.label.toLowerCase()) || 
    r.matchers.some(m => normTarget.includes(m))
  );

  const targetMatchers = targetRule 
    ? targetRule.matchers 
    : [normTarget.replace(/clinic|specialist|doctor|surgeon/gi, "").trim()].filter(Boolean);

  // 3. Multi-Specialty & Major Institution Exclusion:
  // "do not include major multi-specialty healthcare institutions (Hospital, Super Speciality Hospital, Medical Centre)"
  const isMajorInstitution = 
    pPrimary === "general_hospital" ||
    pPrimary === "hospital" ||
    pPrimary === "university_hospital" ||
    pPrimary === "government_hospital" ||
    combined.includes("super speciality") ||
    combined.includes("superspeciality") ||
    combined.includes("multi speciality") ||
    combined.includes("multispeciality") ||
    combined.includes("medical college") ||
    combined.includes("aiims") ||
    combined.includes("igims") ||
    combined.includes("pmch") ||
    combined.includes("paras hospital") ||
    combined.includes("paras hmri") ||
    combined.includes("ruban hospital") ||
    combined.includes("apollo hospital") ||
    combined.includes("apollo spectra") ||
    combined.includes("max hospital") ||
    combined.includes("fortis hospital") ||
    combined.includes("medanta") ||
    combined.includes("ford hospital") ||
    combined.includes("satyadev");

  if (isMajorInstitution) {
    return false;
  }

  // Broad generic facility without specialty indication in name
  const isGenericFacilityWithoutSpecialty = 
    (pName.includes("hospital") || pName.includes("medical centre") || pName.includes("medical center") || pName.includes("nursing home")) &&
    !targetMatchers.some(m => pName.includes(m));

  if (isGenericFacilityWithoutSpecialty) {
    return false;
  }

  // 4. Unrelated Specialties Exclusion (e.g. dentist, dermatologist, eye clinic)
  for (const rule of CLINICAL_MEDICAL_RULES) {
    if (targetRule && rule.label === targetRule.label) continue;
    
    // Check if place explicitly represents another medical specialty (use length > 3 to avoid substring false positives)
    const matchesOtherSpecialty = rule.matchers.some(m => {
      if (m.length <= 3) return false;
      return pPrimary.includes(m) || pPrimaryLabel.includes(m) || pName.includes(m);
    });

    if (matchesOtherSpecialty) {
      // Exclude unless it ALSO matches the target specialty
      const alsoMatchesTarget = targetMatchers.some(m => combined.includes(m));
      if (!alsoMatchesTarget) {
        return false;
      }
    }
  }

  // 5. Positive Healthcare / Doctor Validation:
  // Since Google Places was queried for the specific specialty (e.g. "Best Nephrologist in Patna"),
  // any doctor profile, medical clinic, or healthcare listing that passed the exclusion criteria is valid.
  const isHealthcareProvider = 
    pPrimary === "doctor" ||
    pPrimary === "medical_clinic" ||
    pPrimary === "health" ||
    pPrimary === "physician" ||
    allTypes.includes("doctor") ||
    allTypes.includes("medical_clinic") ||
    allTypes.includes("health") ||
    allTypes.includes("physician") ||
    targetMatchers.some(m => combined.includes(m));

  return isHealthcareProvider;
}

export function cleanDoctorOrPracticeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(dr|doctor|prof|professor)\b\.?\s*/gi, "")
    .replace(/\b(clinic|hospital|centre|center|nursing home|care)\b/gi, "")
    .trim();
}

/**
 * Resolves the Google Maps Place ID and exact GPS coordinates for a clinic / doctor practice
 * using Places API (New) searchText.
 */
export async function resolveDoctorPlace(
  businessName: string,
  addressOrCity?: string
): Promise<{ placeId: string; lat: number; lng: number; name: string; formattedAddress: string } | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey || !businessName) return null;

  try {
    const textQuery = addressOrCity 
      ? `${businessName} ${addressOrCity}`
      : businessName;

    const v1Url = "https://places.googleapis.com/v1/places:searchText";
    const res = await fetch(v1Url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 1,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const firstPlace = data.places?.[0];
      if (firstPlace && firstPlace.id) {
        return {
          placeId: firstPlace.id,
          lat: firstPlace.location?.latitude,
          lng: firstPlace.location?.longitude,
          name: firstPlace.displayName?.text || "",
          formattedAddress: firstPlace.formattedAddress || "",
        };
      }
    }
  } catch (err) {
    console.warn("[resolveDoctorPlace] Error resolving place:", err);
  }
  return null;
}

export function isMatchingUserClinic(
  place: { id?: string; displayName?: { text?: string }; name?: string },
  targetPlaceId?: string,
  targetName?: string,
  clinicName?: string
): boolean {
  const pId = place.id || (place as any).place_id || "";
  if (targetPlaceId && pId && targetPlaceId === pId) {
    return true;
  }

  const pName = (place.displayName?.text || place.name || "").toLowerCase();
  if (!pName) return false;

  const cleanTarget = cleanDoctorOrPracticeName(targetName || "");
  const cleanClinic = cleanDoctorOrPracticeName(clinicName || "");

  if (cleanTarget.length >= 3 && pName.includes(cleanTarget)) return true;
  if (cleanClinic.length >= 3 && pName.includes(cleanClinic)) return true;

  // Distinctive token matching: only match unique proper nouns or surnames (e.g. "chandra", "maanvvi")
  // Medical vocabulary must NEVER be used to identify a doctor practice!
  const GENERIC_MEDICAL_WORDS = new Set([
    "doctor", "clinic", "hospital", "centre", "center", "care", "specialist", 
    "speciality", "specialty", "physician", "surgeon", "consultant", "services",
    "kidney", "renal", "nephro", "nephrologist", "nephrology", "dialysis",
    "gynae", "gynaec", "gynec", "gynecologist", "obstet", "obstetrics", "maternity", 
    "pediatric", "child", "dental", "dentist", "ortho", "bone", "spine",
    "cardio", "heart", "derma", "skin", "hair", "laser", "eye", "vision",
    "ent", "neuro", "gastro", "liver", "cancer", "onco", "ayurved", "homeo",
    "health", "healthcare", "medic", "medical", "medicine", "patna", "delhi",
    "mumbai", "india", "road", "colony", "nagar", "market", "more"
  ]);

  const extractTokens = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length >= 3 && !GENERIC_MEDICAL_WORDS.has(t));

  const targetTokens = Array.from(new Set([...extractTokens(targetName || ""), ...extractTokens(clinicName || "")]));
  for (const token of targetTokens) {
    if (token.length >= 4 && pName.includes(token)) {
      return true;
    }
  }

  return false;
}

export async function searchCompetitorsWithRank(
  query: string,
  targetPlaceId: string,
  targetName: string,
  location?: { lat: number; lng: number },
  locationContext?: string, // e.g. "Patna" or "Bailey Road, Patna"
  options?: {
    scope?: "city" | "local";
    maxDistanceKm?: number;
    rawQuery?: string;
    clinicName?: string;
  }
): Promise<CompetitorSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[Google Places] Missing API key for competitor search.");
    return { competitors: [], userRank: 5, userIndexInResults: -1 };
  }

  const scope = options?.scope || "city";
  const maxDistance = options?.maxDistanceKm || (scope === "local" ? 5 : 20);

  let textQuery = options?.rawQuery;
  if (!textQuery) {
    if (scope === "local") {
      textQuery = locationContext
        ? `${query} near ${locationContext}`
        : `${query} near me`;
    } else {
      textQuery = locationContext
        ? `Best ${query} in ${locationContext}`
        : `Best ${query}`;
    }
  }

  console.log(`[Competitor Search v1] query: "${textQuery}" (scope: ${scope}, maxDistance: ${maxDistance}km)`);

  try {
    const v1Url = "https://places.googleapis.com/v1/places:searchText";
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.rating",
      "places.userRatingCount",
      "places.primaryType",
      "places.primaryTypeDisplayName",
      "places.types",
      "places.formattedAddress",
      "places.location",
    ].join(",");

    const requestBody: any = {
      textQuery,
      maxResultCount: 20,
    };

    // Location Bias:
    // In "local" scope (Near Clinic, within 5km), bias to the clinic's exact GPS so Google ranks by local proximity.
    // In "city" scope, do NOT bias to the clinic's doorstep, because that distorts city-wide rankings (e.g. ranking a Rupaspur clinic #3 city-wide instead of #12).
    // If the city-wide text query does not mention the city name, ground it with a broad metro bias.
    if (scope === "local" && location?.lat && location?.lng) {
      requestBody.locationBias = {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: 5000,
        },
      };
    } else if (scope === "city" && location?.lat && location?.lng) {
      const queryHasCity = locationContext && textQuery.toLowerCase().includes(locationContext.toLowerCase());
      if (!queryHasCity) {
        requestBody.locationBias = {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: 30000,
          },
        };
      }
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

      // ── Step 1: Detect user's own clinic in Google results to establish ground-truth origin & rank ──
      let userClinicInResults: any = null;
      let userIndex = -1;

      for (let i = 0; i < rawPlaces.length; i++) {
        const p = rawPlaces[i];
        if (isMatchingUserClinic(p, targetPlaceId, targetName, options?.clinicName)) {
          userClinicInResults = p;
          userIndex = i;
          break;
        }
      }

      // Ground-truth origin: if user's clinic is returned by Google, use ITS exact GPS coordinates!
      const originLat = userClinicInResults?.location?.latitude || location?.lat;
      const originLng = userClinicInResults?.location?.longitude || location?.lng;

      // ── Step 2: If in local scope and not in top 20, try tighter 3km local search ──
      let finalUserRank = userIndex !== -1 ? userIndex + 1 : 21;

      if (scope === "local" && userIndex === -1 && (targetName || options?.clinicName) && originLat && originLng) {
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
              locationBias: {
                circle: {
                  center: { latitude: originLat, longitude: originLng },
                  radius: 3000,
                },
              },
            }),
          });

          if (secondaryRes.ok) {
            const secData = await secondaryRes.json();
            const secPlaces: any[] = secData.places || [];
            const secIdx = secPlaces.findIndex((p: any) =>
              isMatchingUserClinic(p, targetPlaceId, targetName, options?.clinicName)
            );
            if (secIdx !== -1) {
              finalUserRank = secIdx + 1;
              console.log(`[Competitor Search v1] Target found in tight 3km search at position #${finalUserRank}`);
            }
          }
        } catch (e) {
          console.warn("[Competitor Search v1] Secondary search failed:", e);
        }
      }

      // ── Step 3: Build authentic competitor list from Google results ──
      const competitors: CompetitorData[] = [];
      let googlePos = 0;

      for (const p of rawPlaces) {
        googlePos++;

        const pName = p.displayName?.text || "";

        // Check if this place is the doctor's own clinic
        const isTargetClinic = isMatchingUserClinic(p, targetPlaceId, targetName, options?.clinicName);

        if (isTargetClinic) {
          competitors.push({
            name: pName,
            rating: p.rating ?? null,
            reviewCount: p.userRatingCount ?? null,
            placeId: p.id || targetPlaceId,
            googlePosition: googlePos,
            distanceMeters: 0,
            category: p.primaryTypeDisplayName?.text || p.primaryType || query,
            primaryType: p.primaryType || null,
            formattedAddress: p.formattedAddress || null,
            lat: p.location?.latitude || null,
            lng: p.location?.longitude || null,
            isYou: true,
          });
          continue;
        }

        // Strictly filter to related businesses only and exclude major generic hospitals
        if (!isRelatedCompetitor(query, {
          name: pName,
          primaryType: p.primaryType,
          primaryTypeDisplayName: p.primaryTypeDisplayName?.text,
          types: p.types,
        })) {
          continue;
        }

        let distKm = null;
        if (originLat && originLng && p.location?.latitude && p.location?.longitude) {
          distKm = calculateDistanceKm(originLat, originLng, p.location.latitude, p.location.longitude);
          if (distKm > maxDistance) {
            continue;
          }
        }

        competitors.push({
          name: pName,
          rating: p.rating ?? null,
          reviewCount: p.userRatingCount ?? null,
          placeId: p.id || "",
          googlePosition: googlePos, // Real Google list position
          distanceMeters: distKm != null ? Math.round(distKm * 1000) : null,
          category: p.primaryTypeDisplayName?.text || p.primaryType || query,
          primaryType: p.primaryType || null,
          formattedAddress: p.formattedAddress || null,
          lat: p.location?.latitude || null,
          lng: p.location?.longitude || null,
          isYou: false,
        });

        if (competitors.length >= 20) break; // Return top authentic competitors
      }

      console.log(`[Competitor Search v1] "${textQuery}" → ${competitors.length} competitors found. User at Google position #${finalUserRank}.`);
      return { 
        competitors, 
        userRank: finalUserRank, 
        userIndexInResults: userIndex,
        textQueryUsed: textQuery,
        scope,
      };
    }
  } catch (err) {
    console.warn("[Competitor Search v1] Error, falling back to Classic API:", err);
  }

  // ── Fallback: Classic Text Search ──
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", textQuery);
  if (scope === "local" && location?.lat && location?.lng) {
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

    let userClinicInResults: any = null;
    let userIndex = -1;
    for (let i = 0; i < rawResults.length; i++) {
      const r = rawResults[i];
      if (isMatchingUserClinic(r, targetPlaceId, targetName, options?.clinicName)) {
        userClinicInResults = r;
        userIndex = i;
        break;
      }
    }

    const originLat = userClinicInResults?.geometry?.location?.lat || location?.lat;
    const originLng = userClinicInResults?.geometry?.location?.lng || location?.lng;
    const userRank = userIndex !== -1 ? userIndex + 1 : 21;

    const competitors: CompetitorData[] = [];
    let classicPos = 0;
    for (const r of rawResults) {
      classicPos++;

      const pName = r.name || "";
      const isTargetClinic = isMatchingUserClinic(r, targetPlaceId, targetName, options?.clinicName);

      if (isTargetClinic) {
        competitors.push({
          name: pName,
          rating: r.rating ?? null,
          reviewCount: r.user_ratings_total ?? null,
          placeId: r.place_id || targetPlaceId,
          googlePosition: classicPos,
          distanceMeters: 0,
          category: r.types?.[0] || query,
          primaryType: r.types?.[0] || null,
          formattedAddress: r.formatted_address || r.vicinity || null,
          lat: r.geometry?.location?.lat || null,
          lng: r.geometry?.location?.lng || null,
          isYou: true,
        });
        continue;
      }

      if (!isRelatedCompetitor(query, {
        name: pName,
        primaryType: r.types?.[0] || null,
        types: r.types || [],
      })) {
        continue;
      }

      let distKm = null;
      if (originLat && originLng && r.geometry?.location?.lat && r.geometry?.location?.lng) {
        distKm = calculateDistanceKm(originLat, originLng, r.geometry.location.lat, r.geometry.location.lng);
        if (distKm > maxDistance) {
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
        distanceMeters: distKm != null ? Math.round(distKm * 1000) : null,
        category: r.types?.[0] || query,
        primaryType: r.types?.[0] || null,
        formattedAddress: r.formatted_address || r.vicinity || null,
        lat: r.geometry?.location?.lat || null,
        lng: r.geometry?.location?.lng || null,
        isYou: false,
      });

      if (competitors.length >= 15) break;
    }

    return { 
      competitors, 
      userRank, 
      userIndexInResults: userIndex,
      textQueryUsed: textQuery,
      scope,
    };
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
        
        // Priority for city: administrative_area_level_3 (e.g. "Patna") or locality (if not division)
        if (comp.types.includes("administrative_area_level_3")) {
          geoCity = comp.long_name;
        } else if (comp.types.includes("locality") && !geoCity) {
          geoCity = comp.long_name;
        } else if (comp.types.includes("administrative_area_level_2") && !geoCity && !comp.long_name.toLowerCase().includes("division")) {
          geoCity = comp.long_name;
        }
      }
      
      const geoNeighborhood = level1 || level2;
      
      if (geoNeighborhood && geoCity && geoNeighborhood.toLowerCase() !== geoCity.toLowerCase()) {
        return {
          neighborhood: geoNeighborhood,
          city: geoCity,
          searchPhrase: `${geoNeighborhood}, ${geoCity}`,
          lat: loc.lat,
          lng: loc.lng,
        };
      } else if (geoCity) {
        return {
          neighborhood: geoNeighborhood || geoCity,
          city: geoCity,
          searchPhrase: geoNeighborhood && geoNeighborhood.toLowerCase() !== geoCity.toLowerCase() ? `${geoNeighborhood}, ${geoCity}` : geoCity,
          lat: loc.lat,
          lng: loc.lng,
        };
      }
    }
  } catch (err) {
    console.error("[Geocode] Error extracting neighborhood:", err);
  }
  
  // Fallback if Geocoding fails to yield components
  const parts = address
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)
    .filter(p => !/^india$/i.test(p))
    .map(p => p.replace(/\b\d{5,6}\b/g, "").trim())
    .filter(Boolean);
  const fallback = parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : (parts[0] || address);
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

