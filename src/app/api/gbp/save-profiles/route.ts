import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { GBPService } from "@/services/gbp.service";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function formatAddress(location: any) {
  const address = location.storefrontAddress;
  if (!address) return "";

  return [
    ...(address.addressLines || []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { selectedLocations } = await req.json(); // array of location.name strings
    if (!Array.isArray(selectedLocations) || selectedLocations.length === 0) {
      return NextResponse.json({ error: "No locations selected" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const tempAuthCookie = cookieStore.get("gbp_temp_auth");

    if (!tempAuthCookie?.value) {
      return NextResponse.json({ error: "Auth session expired" }, { status: 400 });
    }

    const tempAuth = JSON.parse(tempAuthCookie.value);
    
    const gbpService = new GBPService(tempAuth.accessToken, doctorId);
    const discoveredLocations = await gbpService.discoverAllLocations();

    const locationsToSave = discoveredLocations.filter((l) => 
      selectedLocations.includes(l.location.name)
    );

    if (locationsToSave.length === 0) {
      return NextResponse.json({ error: "Selected locations not found in Google account" }, { status: 400 });
    }

    const syncPromises = [];

    for (const discovered of locationsToSave) {
      const performanceLocationId = discovered.location.name.match(/\/locations\/([^/]+)/)?.[1];
      const profileInsights = {
        name: discovered.location.title || "Google Business Profile",
        formattedAddress: formatAddress(discovered.location),
        phone: discovered.location.phoneNumbers?.primaryPhone || "",
        website: discovered.location.websiteUri || "",
        locationName: discovered.location.name,
        accountName: discovered.account.name,
        mapsUri: discovered.location.metadata?.mapsUri || "",
        newReviewUri: discovered.location.metadata?.newReviewUri || "",
        categories: discovered.location.categories || null,
        regularHours: discovered.location.regularHours || null,
        description: discovered.location.profile?.description || "",
      };

      const gbpAccount = await prisma.gbpAccount.upsert({
        where: {
          doctorId_locationName: {
            doctorId,
            locationName: discovered.location.name,
          },
        },
        update: {
          accessToken: tempAuth.accessToken,
          refreshToken: tempAuth.refreshToken,
          tokenExpiry: new Date(Date.now() + Number(tempAuth.expiresIn) * 1000),
          locationId: performanceLocationId ? `locations/${performanceLocationId}` : discovered.location.name,
          insightsData: profileInsights,
          lastSyncAt: new Date(),
        },
        create: {
          doctorId,
          accessToken: tempAuth.accessToken,
          refreshToken: tempAuth.refreshToken,
          tokenExpiry: new Date(Date.now() + Number(tempAuth.expiresIn) * 1000),
          locationName: discovered.location.name,
          locationId: performanceLocationId ? `locations/${performanceLocationId}` : discovered.location.name,
          insightsData: profileInsights,
          lastSyncAt: new Date(),
        },
      });

      syncPromises.push(
        gbpService.getInsights(discovered.location.name).catch((e) => console.warn("Sync warning (insights):", e)),
        gbpService.getSearchKeywords(discovered.location.name).catch((e) => console.warn("Sync warning (keywords):", e)),
        gbpService.getReviews(`${discovered.account.name}/${discovered.location.name}`, gbpAccount.id).catch((e) => console.warn("Sync warning (reviews):", e))
      );
    }

    await Promise.allSettled(syncPromises);

    // Clear the temp auth cookie
    cookieStore.delete("gbp_temp_auth");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error saving locations:", error);
    return NextResponse.json({ error: error.message || "Failed to save locations" }, { status: 500 });
  }
}
