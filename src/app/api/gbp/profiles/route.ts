import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { GoogleBusinessProfileService } from "@/services/googleBusinessProfile.service";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const connected = await GoogleBusinessProfileService.getConnectedProfile(doctorId);
    
    if (!connected) {
      return NextResponse.json({
        connected: false,
        accounts: [],
      });
    }

    const accounts = await GoogleBusinessProfileService.getAccounts(doctorId);

    return NextResponse.json({
      connected: true,
      accounts: accounts,
    });
  } catch (error) {
    console.error("Error fetching GBP profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
