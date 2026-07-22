import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { prisma } from "@/lib/prisma";

const GRID_SIZE = 5;
const SPACING_METERS = 500;
const CACHE_HOURS = 24;

// Offset lat/lng by meters
function offsetCoord(lat: number, lng: number, dNorth: number, dEast: number) {
  const R = 6378137; // Earth radius in meters
  const dLat = dNorth / R;
  const dLng = dEast / (R * Math.cos((Math.PI * lat) / 180));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
}

// Search for the business rank at a given lat/lng using Places Text Search
async function getRankAtPoint(
  lat: number,
  lng: number,
  businessName: string,
  category: string,
  apiKey: string
): Promise<number> {
  const query = encodeURIComponent(category);
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=doctor&keyword=${query}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json();
    const results: any[] = data.results || [];

    const nameLower = businessName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const idx = results.findIndex((r: any) => {
      const rName = (r.name || "").toLowerCase().replace(/[^a-z0-9\s]/g, "");
      return rName.includes(nameLower.split(" ").slice(0, 3).join(" ")) ||
             nameLower.includes(rName.split(" ").slice(0, 2).join(" "));
    });

    return idx >= 0 ? idx + 1 : 0; // 0 = not found
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchKeyword = url.searchParams.get("keyword") || "";

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
        keyword: targetKeyword
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

    // Geocode address to get center lat/lng
    let centerLat = 0;
    let centerLng = 0;

    if (address) {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.results?.length > 0) {
        centerLat = geoData.results[0].geometry.location.lat;
        centerLng = geoData.results[0].geometry.location.lng;
      }
    }

    if (!centerLat || !centerLng) {
      return NextResponse.json({ error: "Could not determine clinic location. Please ensure your GBP profile has a valid address." }, { status: 400 });
    }

    // Build 5x5 grid
    const half = Math.floor(GRID_SIZE / 2);
    const gridPoints: any[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const dNorth = (half - row) * SPACING_METERS;
        const dEast = (col - half) * SPACING_METERS;
        const { lat, lng } = offsetCoord(centerLat, centerLng, dNorth, dEast);
        gridPoints.push({ row, col, lat, lng });
      }
    }

    // Fetch ranks concurrently in batches of 5
    const batchSize = 5;
    const results: any[] = [];

    for (let i = 0; i < gridPoints.length; i += batchSize) {
      const batch = gridPoints.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (point) => {
          const rank = await getRankAtPoint(point.lat, point.lng, businessName, searchKeyword, apiKey);
          return { ...point, rank, found: rank > 0 };
        })
      );
      results.push(...batchResults);
      // Small delay between batches to respect rate limits
      if (i + batchSize < gridPoints.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Save to DB
    await prisma.searchGridSnapshot.create({
      data: {
        gbpAccountId: account.id,
        locationId: account.locationId || "",
        date: new Date(),
        gridSize: GRID_SIZE,
        centerLat,
        centerLng,
        spacingMeters: SPACING_METERS,
        businessName,
        keyword: searchKeyword,
        json: results,
      },
    });

    return NextResponse.json({
      data: {
        grid: results,
        gridSize: GRID_SIZE,
        centerLat,
        centerLng,
        spacingMeters: SPACING_METERS,
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
