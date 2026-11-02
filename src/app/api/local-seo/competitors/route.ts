import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { prisma } from "@/lib/prisma";
import { GoogleNormalizer } from "@/services/normalization/GoogleNormalizer";
import { detectSpeciality } from "@/lib/audit/healthcare-intelligence";
import { searchCompetitorsWithRank, buildLocalSearchQuery, extractNeighborhood, fetchPlaceDetails } from "@/lib/audit/google-places";

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (e) {
    console.warn("[Competitors] Geocoding failed:", e);
  }
  return null;
}

async function fetchNearbyPlaces(lat: number, lng: number, category: string, apiKey: string) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.rating',
    'places.userRatingCount',
    'places.primaryType',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.regularOpeningHours',
    'places.photos',
    'places.location'
  ].join(',');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({
      textQuery: category,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000,
        }
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Competitors] Places API error:", res.status, errText);
    return null;
  }

  return res.json();
}

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") || "city").toLowerCase() as "city" | "local";
    const customKeyword = searchParams.get("keyword")?.trim() || undefined;

    const authResult = await getValidGbpAccessToken(session.doctorId);
    if (!authResult) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const { account } = authResult;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    if (!apiKey) {
      // Fallback: return cached DB data if no API key
      const snapshot = await prisma.competitorSnapshot.findFirst({
        where: { gbpAccountId: account.id },
        orderBy: { date: 'desc' }
      });
      return NextResponse.json({
        data: (snapshot?.json as any[]) || [],
        source: "Cached Local SEO Data",
        lastUpdated: snapshot?.date || null
      });
    }

    // Try to get lat/lng from latest profile snapshot
    const profileSnap = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    const profileData = profileSnap?.json as any;
    let lat: number | null = null;
    let lng: number | null = null;

    const insights = (account.insightsData as any) || {};
    const doctor = await prisma.doctor.findUnique({ where: { id: session.doctorId }, select: { specialty: true, clinicName: true, name: true } });

    const bName = insights.name || profileData?.name || doctor?.clinicName || doctor?.name || account.locationName || "";
    const rawCategories = insights.categories || profileData?.categories || [];
    const categoryNames: string[] = Array.isArray(rawCategories) 
      ? rawCategories.map((c: any) => typeof c === 'string' ? c : (c?.displayName || c?.name || ''))
      : [insights.primaryCategory, doctor?.specialty].filter(Boolean) as string[];

    const bAddr = insights.formattedAddress || profileData?.address || "";
    
    // Fetch live Google Places data for exact category matching, same as Audit Report
    let placeData = null;
    if (account.locationId) {
      placeData = await fetchPlaceDetails(account.locationId);
    }
    
    const actualName = placeData?.name || bName;
    const actualCategories = placeData?.types || categoryNames;
    const locationStr = placeData?.formattedAddress || bAddr;
    const gbpPrimarySlug = placeData?.primaryType || null;
    const gbpDisplayName = placeData?.primaryTypeDisplayName || insights.primaryCategory || profileData?.primaryCategory || null;

    const detected = detectSpeciality(
      actualName, 
      actualCategories, 
      locationStr, 
      gbpPrimarySlug, 
      gbpDisplayName, 
      placeData?.reviewsText || []
    );
    
    let primaryCategory = !detected.isUnknown 
      ? detected.speciality 
      : (gbpDisplayName || insights.primaryCategory || doctor?.specialty || profileData?.primaryCategory || "Medical Clinic");

    if (gbpDisplayName && gbpDisplayName.toLowerCase() !== "doctor") {
      primaryCategory = gbpDisplayName;
    }

    // Extract GPS coordinates — priority: profileSnapshot lat/lng → insightsData location → geocode
    const fullAddress = locationStr || insights.formattedAddress || profileData?.address || "";
    const insightLocation = (insights.location as any);
    if (typeof insightLocation?.latitude === "number" && typeof insightLocation?.longitude === "number") {
      lat = insightLocation.latitude;
      lng = insightLocation.longitude;
      console.log(`[Competitors] Using GPS from insightsData.location: ${lat},${lng}`);
    } else if (typeof profileData?.lat === "number" && typeof profileData?.lng === "number") {
      lat = profileData.lat;
      lng = profileData.lng;
      console.log(`[Competitors] Using GPS from profileSnapshot: ${lat},${lng}`);
    } else if (typeof profileData?.location?.latitude === "number") {
      lat = profileData.location.latitude;
      lng = profileData.location.longitude;
      console.log(`[Competitors] Using GPS from profileSnapshot.location: ${lat},${lng}`);
    }

    if (!lat || !lng) {
      const geocoded = await geocodeAddress(fullAddress, apiKey);
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
        console.log(`[Competitors] GPS geocoded from address: ${lat},${lng}`);
      } else {
        lat = 28.5631;
        lng = 77.1997;
        console.warn(`[Competitors] WARNING: Using hardcoded fallback GPS. Address was: "${fullAddress}"`);
      }
    }

    const extracted = await extractNeighborhood(fullAddress, apiKey);
    let locationContext = undefined;

    if (extracted) {
      locationContext = scope === "local"
        ? (extracted.neighborhood || extracted.city || extracted.searchPhrase)
        : (extracted.city || extracted.searchPhrase);
      console.log(`[Competitors] Using ${scope} context for organic search: ${locationContext}`);
    }

    // Optional raw query construction if custom keyword is chosen
    let rawQuery: string | undefined = undefined;
    if (customKeyword) {
      const city = extracted?.city;
      const alreadyHasLocation = city && customKeyword.toLowerCase().includes(city.toLowerCase());
      rawQuery = alreadyHasLocation 
        ? customKeyword 
        : (city ? `${customKeyword} in ${city}` : customKeyword);
    }

    // ── Live Google Places API call ───────────────────────────────────────────
    const searchRes = await searchCompetitorsWithRank(
      primaryCategory,
      account.locationId || "",
      bName,
      { lat, lng },
      locationContext,
      {
        scope,
        maxDistanceKm: scope === "local" ? 5 : 20,
        rawQuery,
        clinicName: doctor?.clinicName || bName,
      }
    );

    const userRating = Number(insights.rating) || 4.9;
    const userReviews = Number(insights.user_ratings_total) || 78;

    const validCompetitors = searchRes.competitors || [];
    const hasUserInCompetitors = validCompetitors.some((c: any) => c.isYou);

    // Structure normalized items for dashboard rendering without duplicate "YOU" entries
    const updatedNormalized: any[] = validCompetitors.map((comp: any, idx: number) => ({
      id: comp.placeId || `comp-${idx}`,
      name: comp.name,
      rating: comp.rating,
      reviewCount: comp.reviewCount,
      rank: comp.googlePosition ?? (idx + 1),
      isYou: Boolean(comp.isYou),
      placeId: comp.placeId || "",
      distanceMeters: comp.isYou ? 0 : (comp.distanceMeters ?? null),
      category: comp.category || comp.primaryType || primaryCategory,
      formattedAddress: comp.formattedAddress || "",
      primaryType: comp.primaryType || null,
    }));

    // If Google didn't return the clinic in the results, append it once at userRank
    if (!hasUserInCompetitors) {
      updatedNormalized.push({
        id: "you",
        name: bName,
        rating: userRating,
        reviewCount: userReviews,
        rank: searchRes.userRank > 0 ? searchRes.userRank : 21,
        isYou: true,
        placeId: account.locationId || "",
        distanceMeters: 0,
        category: primaryCategory,
        formattedAddress: fullAddress || "",
        primaryType: "doctor",
      });
    }

    updatedNormalized.sort((a, b) => a.rank - b.rank);

    // Cache result in database
    await prisma.competitorSnapshot.create({
      data: {
        gbpAccountId: account.id,
        locationId: account.locationId || "",
        date: new Date(),
        json: JSON.parse(JSON.stringify(updatedNormalized))
      }
    });

    const finalQueryUsed = searchRes.textQueryUsed || (
      scope === "local"
        ? `${primaryCategory} near ${locationContext || "your location"}`
        : `Best ${primaryCategory} in ${locationContext || "your city"}`
    );

    return NextResponse.json({
      data: updatedNormalized,
      source: "Google Places API (Live Parity)",
      queryUsed: finalQueryUsed,
      scope: searchRes.scope || scope,
      city: extracted?.city || "Patna",
      neighborhood: extracted?.neighborhood || null,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Competitors API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
