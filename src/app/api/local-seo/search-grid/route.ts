import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { prisma } from "@/lib/prisma";
import { extractNeighborhood, unifiedGeoGrid, calculateCompositeRank } from "@/lib/audit/google-places";

const GRID_SIZE = 5;
const SPACING_METERS = 500;
const CACHE_HOURS = 24;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchKeyword = url.searchParams.get("keyword") || "";
    const radiusStep = url.searchParams.get("radiusStep");
    const parsedSpacing = radiusStep ? parseInt(radiusStep, 10) : undefined;
    const spacingFilter = parsedSpacing && !isNaN(parsedSpacing) ? { spacingMeters: parsedSpacing } : {};

    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const authResult = await getValidGbpAccessToken(session.doctorId);
    if (!authResult) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const { account } = authResult;

    // Get default category if no keyword provided
    let targetKeyword = searchKeyword;
    if (!targetKeyword) {
      const profileSnap = await prisma.profileSnapshot.findFirst({
        where: { gbpAccountId: account.id },
        orderBy: { date: "desc" },
      });
      const profileData = profileSnap?.json as any;
      targetKeyword = profileData?.primaryCategory || "doctor";
    }

    // Return cached data if within 24h
    const cached = await prisma.searchGridSnapshot.findFirst({
      where: { 
        gbpAccountId: account.id,
        keyword: targetKeyword,
        ...spacingFilter,
      },
      orderBy: { date: "desc" },
    });

    if (cached) {
      const ageHours = (Date.now() - new Date(cached.date).getTime()) / 1000 / 3600;
      if (ageHours < CACHE_HOURS) {
        return NextResponse.json({
          data: {
            grid: cached.json,
            gridSize: cached.gridSize,
            centerLat: cached.centerLat,
            centerLng: cached.centerLng,
            spacingMeters: cached.spacingMeters,
            businessName: cached.businessName,
            keyword: cached.keyword,
            cached: true,
            cacheAge: Math.round(ageHours),
          },
          source: "Cached Search Grid (24h)",
          lastUpdated: cached.date,
        });
      }
    }

    return NextResponse.json({
      data: cached ? { grid: cached.json, gridSize: cached.gridSize, centerLat: cached.centerLat, centerLng: cached.centerLng, spacingMeters: cached.spacingMeters, businessName: cached.businessName, keyword: cached.keyword, cached: true, cacheAge: 99 } : null,
      source: "Search Grid",
      lastUpdated: cached?.date || null,
      requiresRefresh: true,
    });
  } catch (error: any) {
    console.error("Search Grid GET Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const authResult = await getValidGbpAccessToken(session.doctorId);
    if (!authResult) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const { account } = authResult;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json({ error: "Google Places API key not configured" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Get profile data for address/name
    const profileSnap = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: "desc" },
    });
    const profileData = profileSnap?.json as any;
    const businessName = profileData?.name || account.locationName || "Clinic";
    const primaryCategory = profileData?.primaryCategory || "doctor";
    const searchKeyword = body.keyword || primaryCategory;
    const address = profileData?.address || "";

    // Geocode address to get center lat/lng using unified extractNeighborhood
    const extracted = await extractNeighborhood(address, apiKey);
    if (!extracted) {
      return NextResponse.json({ error: "Could not determine clinic neighborhood. Please ensure your GBP profile has a valid address." }, { status: 400 });
    }

    // Try to get exact clinic GPS
    let centerLat = profileData?.lat || profileData?.location?.latitude;
    let centerLng = profileData?.lng || profileData?.location?.longitude;

    const { neighborhood, searchPhrase } = extracted;

    // If GPS missing from profile, geocode the address
    if (!centerLat || !centerLng) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          centerLat = loc.lat;
          centerLng = loc.lng;
        }
      } catch (e) {}
    }

    // Hard fallback to extracted neighborhood centroid
    if (!centerLat || !centerLng) {
      centerLat = extracted.lat;
      centerLng = extracted.lng;
    }

    const requestSpacing = body.radiusStep ? parseInt(body.radiusStep, 10) : SPACING_METERS;
    const finalSpacing = isNaN(requestSpacing) ? SPACING_METERS : requestSpacing;

    // Run unified 25-point GeoGrid around the exact clinic GPS
    const gridData = await unifiedGeoGrid(
      searchKeyword,
      searchPhrase,
      centerLat,
      centerLng,
      businessName,
      apiKey,
      GRID_SIZE,
      finalSpacing
    );

    const compositeData = calculateCompositeRank(gridData.ranks, gridData.centroidRank, gridData.organicRank);

    // Save to DB
    await prisma.searchGridSnapshot.create({
      data: {
        gbpAccountId: account.id,
        locationId: account.locationId || "",
        date: new Date(),
        gridSize: GRID_SIZE,
        centerLat,
        centerLng,
        spacingMeters: finalSpacing,
        businessName,
        keyword: searchKeyword,
        json: gridData.ranks, // Array of { lat, lng, row, col, rank, found }
      },
    });

    return NextResponse.json({
      data: {
        grid: gridData.ranks,
        compositeData,
        searchContext: searchPhrase,
        gridSize: GRID_SIZE,
        centerLat,
        centerLng,
        spacingMeters: finalSpacing,
        businessName,
        cached: false,
        cacheAge: 0,
      },
      source: "Google Places API (Live)",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Search Grid POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate search grid" }, { status: 500 });
  }
}
