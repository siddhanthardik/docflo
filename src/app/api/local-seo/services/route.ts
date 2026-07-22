import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const authResult = await getValidGbpAccessToken(session.doctorId);
    if (!authResult) {
      return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });
    }

    const { account, accessToken } = authResult;

    if (!account.locationId) {
      return NextResponse.json({ error: "No active location" }, { status: 400 });
    }

    // Build the correct location name for the API
    const locationName = account.locationId.startsWith('locations/')
      ? account.locationId
      : `locations/${account.locationId}`;

    // Fetch services directly from GBP with a fresh token
    const readMask = "categories,serviceItems,title";
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${readMask}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Services API] GBP fetch error:", res.status, errText);
      return NextResponse.json({ 
        data: { services: [], categories: [], message: `Google API returned ${res.status}` },
        source: "Google Business Profile API",
        lastUpdated: null
      });
    }

    const gbpData = await res.json();

    // Parse services from response
    const serviceItems = gbpData.serviceItems || [];
    const primaryCategory = gbpData.categories?.primaryCategory?.displayName || "";
    const additionalCategories = gbpData.categories?.additionalCategories?.map((c: any) => ({
      displayName: c.displayName,
      name: c.name,
    })) || [];

    return NextResponse.json({
      data: {
        services: serviceItems,
        primaryCategory,
        additionalCategories,
        businessName: gbpData.title || account.locationName,
      },
      source: "Google Business Profile API (Live)",
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Services API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
