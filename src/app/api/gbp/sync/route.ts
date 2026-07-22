import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;
    const tokenData = await getValidGbpAccessToken(doctorId);

    if (!tokenData?.account.locationName) {
      return NextResponse.json(
        { error: "GBP account not connected" },
        { status: 404 }
      );
    }

    const insights = tokenData.account.insightsData as any;
    const accountName = insights?.accountName;
    const locationName = tokenData.account.locationName;
    const fullReviewLocationName = accountName ? `${accountName}/${locationName}` : locationName;

    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const gbpService = new GBPService(tokenData.accessToken, doctorId);
    const [insightsResult, reviewsResult, keywordsResult] = await Promise.allSettled([
      gbpService.getInsights(locationName, thirtyDaysAgo, today),
      gbpService.getReviews(fullReviewLocationName, tokenData.account.id),
      gbpService.getSearchKeywords(locationName, thirtyDaysAgo, today),
    ]);

    if (insightsResult.status === "rejected") {
      throw insightsResult.reason;
    }

    return NextResponse.json({
      message: "Sync completed successfully",
      insights: insightsResult.value,
      reviewsCount: reviewsResult.status === "fulfilled" ? reviewsResult.value.length : 0,
      keywordsCount: keywordsResult.status === "fulfilled" ? keywordsResult.value.length : 0,
      warnings: [reviewsResult, keywordsResult]
        .filter((result) => result.status === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason?.message || "Sync warning"),
    });
  } catch (error) {
    console.error("Error syncing GBP data:", error);
    return NextResponse.json(
      { error: "Failed to sync GBP data" },
      { status: 500 }
    );
  }
}
