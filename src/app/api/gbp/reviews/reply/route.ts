import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;
    const body = await req.json();
    const { reviewId, replyText, locationId } = body;

    if (!reviewId || !replyText || !locationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure the location belongs to the user
    const account = await prisma.gbpAccount.findFirst({
      where: { id: locationId, doctorId }
    });

    if (!account) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Connect to Google Business Profile API to reply
    const { getValidGbpAccessToken } = await import("@/lib/gbp-auth");
    const { GBPService } = await import("@/services/gbp.service");
    
    const tokenData = await getValidGbpAccessToken(doctorId);
    if (!tokenData || !tokenData.accessToken) {
      return NextResponse.json({ error: "Google account not connected or token expired" }, { status: 401 });
    }

    const insights = tokenData.account.insightsData as any;
    const accountName = insights?.accountName;
    const locationName = tokenData.account.locationName;
    
    if (!locationName) {
      return NextResponse.json({ error: "No location linked to this GBP account" }, { status: 400 });
    }

    const fullReviewLocationName = accountName ? `${accountName}/${locationName}` : locationName;

    const gbpService = new GBPService(tokenData.accessToken, doctorId);
    
    // This will post to Google and update our local DB
    await gbpService.replyToReview(fullReviewLocationName, reviewId, replyText);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error replying to review:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
