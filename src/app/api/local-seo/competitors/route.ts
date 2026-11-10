export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { prisma } from "@/lib/prisma";
import { GooglePlacesProvider } from "@/lib/google-providers/GooglePlacesProvider";
import { GoogleNormalizer, NormalizedCompetitor } from "@/services/normalization/GoogleNormalizer";
import { fetchPlaceDetails, resolveDoctorPlace } from "@/lib/audit/google-places";

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0].geometry?.location;
      if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
        return { lat: loc.lat, lng: loc.lng };
      }
    }
  } catch (e) {
    console.warn("[Competitors] Geocoding failed:", e);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true" || searchParams.get("forceRefresh") === "true";

    const authResult = await getValidGbpAccessToken(session.doctorId);
    if (!authResult) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const { account } = authResult;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    // 1. Fetch latest cached snapshot if available
    const latestSnapshot = await prisma.competitorSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });

    const isCacheFresh = latestSnapshot && !forceRefresh && (
      (Date.now() - new Date(latestSnapshot.date).getTime()) < 24 * 60 * 60 * 1000 // 24 hours
    );

    // If cache is fresh and not forcing refresh, return cached data directly (saves Google API calls)
    if (isCacheFresh && Array.isArray(latestSnapshot.json) && latestSnapshot.json.length > 0) {
      return NextResponse.json({
        data: latestSnapshot.json,
        source: "Cached Local SEO Data",
        radiusMeters: 5000,
        lastUpdated: latestSnapshot.date.toISOString(),
      });
    }

    // Fallback to cache if no Google API key is configured
    if (!apiKey) {
      return NextResponse.json({
        data: Array.isArray(latestSnapshot?.json) ? latestSnapshot.json : [],
        source: "Cached Local SEO Data (No API Key)",
        radiusMeters: 5000,
        lastUpdated: latestSnapshot?.date?.toISOString() || null,
      });
    }

    const REFRESH_COOLDOWN_MS = 60 * 1000; // 60-second cooldown for forced refresh requests

    // 2. Server-side 60s refresh cooldown protection (cross-process, PM2-safe via prisma.auditLog)
    if (forceRefresh) {
      const lastRefreshAttempt = await prisma.auditLog.findFirst({
        where: {
          userId: account.id,
          action: "LOCAL_SEO_COMPETITORS_REFRESH",
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastRefreshAttempt) {
        const elapsed = Date.now() - new Date(lastRefreshAttempt.createdAt).getTime();
        if (elapsed < REFRESH_COOLDOWN_MS) {
          const remainingSeconds = Math.max(1, Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000));
          return NextResponse.json(
            {
              error: "COOLDOWN_ACTIVE",
              message: `Refresh is on cooldown. Please wait ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} before requesting fresh data.`,
              remainingSeconds,
              data: Array.isArray(latestSnapshot?.json) ? latestSnapshot.json : [],
              source: "Cached Local SEO Data (Cooldown Active)",
              radiusMeters: 5000,
              lastUpdated: latestSnapshot?.date?.toISOString() || null,
            },
            { status: 429 }
          );
        }
      }
    }

    // 3. Resolve Clinic Profile & Verified Coordinates
    const profileSnap = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });

    const profileData = (profileSnap?.json as any) || {};
    const insights = (account.insightsData as any) || {};
    const doctor = await prisma.doctor.findUnique({
      where: { id: session.doctorId },
      select: { specialty: true, clinicName: true, name: true, phone: true },
    });

    const gbpTitle = insights.name || profileData?.name || account.locationName || "";
    const doctorName = doctor?.name || "";
    const clinicFacilityName = doctor?.clinicName || "";
    const clinicName = gbpTitle || doctorName || clinicFacilityName || "Specialist Clinic";

    let verifiedPlaceId = (account.locationId && !account.locationId.includes("/")) ? account.locationId : "";
    let placeData = null;
    if (verifiedPlaceId) {
      placeData = await fetchPlaceDetails(verifiedPlaceId);
    }

    const fullAddress = placeData?.formattedAddress || insights.formattedAddress || profileData?.address || "";
    let lat: number | null = null;
    let lng: number | null = null;

    // Prioritize ground-truth GPS coordinates from Google
    if (typeof placeData?.lat === "number" && typeof placeData?.lng === "number") {
      lat = placeData.lat;
      lng = placeData.lng;
    } else if (typeof insights.location?.latitude === "number" && typeof insights.location?.longitude === "number") {
      lat = insights.location.latitude;
      lng = insights.location.longitude;
    } else if (typeof profileData?.lat === "number" && typeof profileData?.lng === "number") {
      lat = profileData.lat;
      lng = profileData.lng;
    } else if (typeof profileData?.location?.latitude === "number" && typeof profileData?.location?.longitude === "number") {
      lat = profileData.location.latitude;
      lng = profileData.location.longitude;
    }

    // Try resolving doctor place ID and GPS if still missing
    if (!verifiedPlaceId || !lat || !lng) {
      const candidateAddress = fullAddress || "";
      let resolved = gbpTitle ? await resolveDoctorPlace(gbpTitle, candidateAddress) : null;
      if (!resolved && doctorName && doctorName !== gbpTitle) {
        resolved = await resolveDoctorPlace(doctorName, candidateAddress);
      }
      if (!resolved && clinicFacilityName && clinicFacilityName !== gbpTitle) {
        resolved = await resolveDoctorPlace(clinicFacilityName, candidateAddress);
      }

      if (resolved) {
        verifiedPlaceId = resolved.placeId;
        if (typeof resolved.lat === "number" && typeof resolved.lng === "number") {
          lat = resolved.lat;
          lng = resolved.lng;
        }
      }
    }

    // Geocode physical address if coordinates remain missing
    if ((!lat || !lng) && fullAddress) {
      const geocoded = await geocodeAddress(fullAddress, apiKey);
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
      }
    }

    // STRICT REQUIREMENT: If verified clinic coordinates are unavailable, NEVER use browser, IP, or hardcoded coordinates.
    // Return a clear, informative message asking the user to complete or verify their GBP location.
    if (!lat || !lng) {
      if (Array.isArray(latestSnapshot?.json) && latestSnapshot.json.length > 0) {
        return NextResponse.json({
          data: latestSnapshot.json,
          source: "Cached Local SEO Data (Location Verification Required)",
          radiusMeters: 5000,
          lastUpdated: latestSnapshot.date.toISOString(),
          warning: "Verified coordinates are missing from your Google Business Profile. Showing previously saved snapshot.",
        });
      }

      return NextResponse.json({
        error: "NO_COORDINATES",
        message: "Verified Google Business Profile coordinates are not available for your clinic. Please complete or verify your clinic address and location in Google Business Profile.",
        data: [],
      }, { status: 422 });
    }

    // 3. Resolve Healthcare Primary Category
    const primaryCategory = (
      placeData?.primaryType ||
      insights.primaryCategory ||
      profileData?.primaryCategory ||
      doctor?.specialty ||
      "medical_clinic"
    );

    // 4. Fetch Nearby Competitors (Strict 5,000m / 5 km Radius)
    let refreshAuditRecordId: string | null = null;
    if (forceRefresh) {
      try {
        const record = await prisma.auditLog.create({
          data: {
            userId: account.id,
            userType: "CLINIC",
            action: "LOCAL_SEO_COMPETITORS_REFRESH",
            details: {
              doctorId: session.doctorId,
              locationId: account.locationId || "",
            },
          },
        });
        refreshAuditRecordId = record.id;
      } catch (logErr) {
        console.warn("[Competitors] Failed to record refresh audit log:", logErr);
      }
    }

    let rawPlaces: any = null;
    try {
      rawPlaces = await GooglePlacesProvider.searchNearbyCompetitors(
        lat,
        lng,
        primaryCategory,
        apiKey,
        5000, // Exactly 5 km
        20    // Top authentic nearby places
      );
    } catch (apiErr: any) {
      console.warn("[Competitors] Google Places Nearby Search call failed:", apiErr.message);

      // Release cooldown record if the Google Places API call failed so subsequent requests do not get trapped
      if (refreshAuditRecordId) {
        try {
          await prisma.auditLog.delete({ where: { id: refreshAuditRecordId } });
        } catch (delErr) {
          console.warn("[Competitors] Failed to delete failed refresh audit log:", delErr);
        }
      }

      // Graceful fallback: return previously saved valid snapshot if refresh fails
      if (Array.isArray(latestSnapshot?.json) && latestSnapshot.json.length > 0) {
        return NextResponse.json({
          data: latestSnapshot.json,
          source: "Cached Local SEO Data (Live refresh unavailable)",
          radiusMeters: 5000,
          clinicCoordinates: { lat, lng },
          lastUpdated: latestSnapshot.date.toISOString(),
          warning: "Could not fetch fresh live data from Google Places. Displaying previously saved snapshot.",
        });
      }

      return NextResponse.json({
        error: "FETCH_FAILED",
        message: "Unable to retrieve nearby competitors from Google Places API at this time.",
        data: [],
      }, { status: 502 });
    }

    // 5. Normalize with strict 5km distance enforcement and distance ordering
    const normalizedCompetitors = GoogleNormalizer.normalizeCompetitors(
      rawPlaces,
      lat,
      lng,
      clinicName,
      verifiedPlaceId || undefined
    );

    const userRating = Number(insights.rating) || (typeof profileData?.rating === "number" ? profileData.rating : 0);
    const userReviews = Number(insights.user_ratings_total) || (typeof profileData?.reviewCount === "number" ? profileData.reviewCount : 0);

    // 6. Ensure Clinic's own record (isYou: true) is preserved in the stored array for Opportunity Engine compatibility
    const hasClinicInResults = normalizedCompetitors.some((c) => c.isYou);
    if (!hasClinicInResults) {
      normalizedCompetitors.push({
        id: "you",
        placeId: verifiedPlaceId || account.locationId || "you",
        name: clinicName,
        rating: userRating,
        reviewCount: userReviews,
        primaryCategory,
        category: primaryCategory,
        phone: insights.phoneNumbers?.primaryPhone || profileData?.phone || doctor?.phone || "",
        website: insights.websiteUri || profileData?.website || "",
        googleMapsUri: verifiedPlaceId
          ? `https://www.google.com/maps/place/?q=place_id:${verifiedPlaceId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicName)}`,
        formattedAddress: fullAddress || "",
        hasPhotos: true,
        isOpenNow: true,
        distanceMeters: 0,
        rank: 1,
        isYou: true,
        lat,
        lng,
      });
    }

    // 7. Strict Deduplication by Google Place ID and normalized clinic name
    const seenPlaceIds = new Set<string>();
    const seenNames = new Set<string>();
    let seenYou = false;

    const deduplicatedNormalized: NormalizedCompetitor[] = [];
    for (const item of normalizedCompetitors) {
      const cleanKey = (item.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const placeIdKey = item.placeId && item.placeId !== "you" ? item.placeId : "";

      if (item.isYou) {
        if (seenYou) continue;
        seenYou = true;
        if (placeIdKey) seenPlaceIds.add(placeIdKey);
        if (cleanKey) seenNames.add(cleanKey);
        deduplicatedNormalized.push(item);
        continue;
      }

      if (placeIdKey && seenPlaceIds.has(placeIdKey)) continue;
      if (cleanKey && seenNames.has(cleanKey)) continue;

      if (placeIdKey) seenPlaceIds.add(placeIdKey);
      if (cleanKey) seenNames.add(cleanKey);
      deduplicatedNormalized.push(item);
    }

    // 8. Cache result in database as a direct JSON array (preserves Local SEO Opportunity Engine & Recommendations compatibility)
    try {
      await prisma.competitorSnapshot.create({
        data: {
          gbpAccountId: account.id,
          locationId: account.locationId || "",
          date: new Date(),
          json: JSON.parse(JSON.stringify(deduplicatedNormalized)),
        },
      });
    } catch (cacheErr) {
      console.warn("[Competitors] Snapshot cache write failed (non-critical):", cacheErr);
    }

    return NextResponse.json({
      data: deduplicatedNormalized,
      source: "Google Places API (Nearby Search)",
      radiusMeters: 5000,
      clinicCoordinates: { lat, lng },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Competitors API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
