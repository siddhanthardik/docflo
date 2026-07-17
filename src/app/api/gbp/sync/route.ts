import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";

export async function POST() {
  try {
    const { doctorId } = await getSessionData();
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

    const gbpService = new GBPService(tokenData.accessToken, doctorId);
    const [insightsResult, reviewsResult, keywordsResult] = await Promise.allSettled([
      gbpService.getInsights(locationName),
      gbpService.getReviews(fullReviewLocationName, tokenData.account.id),
      gbpService.getSearchKeywords(locationName),
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
