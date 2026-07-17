import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { GBPService } from "@/services/gbp.service";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const tempAuthCookie = cookieStore.get("gbp_temp_auth");

    if (!tempAuthCookie?.value) {
      return NextResponse.json({ error: "No pending authentication found" }, { status: 400 });
    }

    const tempAuth = JSON.parse(tempAuthCookie.value);
    
    if (!tempAuth.accessToken) {
      return NextResponse.json({ error: "Invalid authentication data" }, { status: 400 });
    }

    const gbpService = new GBPService(tempAuth.accessToken, doctorId);
    const discoveredLocations = await gbpService.discoverAllLocations();

    const formattedLocations = discoveredLocations.map(d => ({
      name: d.location.name,
      title: d.location.title,
      address: d.location.storefrontAddress 
        ? [
            ...(d.location.storefrontAddress.addressLines || []),
            d.location.storefrontAddress.locality,
            d.location.storefrontAddress.administrativeArea
          ].filter(Boolean).join(", ")
        : "No Address Provided",
      accountName: d.account.name
    }));

    return NextResponse.json({ locations: formattedLocations });

  } catch (error: any) {
    console.error("Error discovering locations:", error);
    return NextResponse.json({ error: error.message || "Failed to discover locations" }, { status: 500 });
  }
}
