import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { GBPService } from "@/services/gbp.service";
import { PlacesService } from "@/services/places.service";
import { entitlementGuard } from "@/lib/withEntitlements";

function mapStoredReview(review: any) {
  return {
    id: review.id,
    author_name: review.reviewerName,
    reviewerName: review.reviewerName,
    rating: review.rating,
    text: review.comment,
    comment: review.comment,
    reply: review.reply,
    replied: review.responded,
    responded: review.responded,
    source: review.source,
    reviewDate: review.reviewDate,
    createTime: review.reviewDate,
    relative_time_description: new Date(review.reviewDate).toLocaleDateString(),
  };
}

export async function GET(req: Request) {
  try {
    const sessionData = await getSessionData();
    const doctorId = sessionData.doctorId;
    
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId") || sessionData.locationId;
    
    const accountWhere: any = { doctorId };
    if (locationId) {
      accountWhere.id = locationId;
    }
    const account = await prisma.gbpAccount.findFirst({ where: accountWhere });

    if (!account) {
      return NextResponse.json({
        connected: false,
        insights: null,
        reviews: [],
      });
    }

    const insights = (account.insightsData as any) || {};
    
    // Construct the full location path required for v4 API (accounts/{accountId}/locations/{locationId})
    let fullLocationPath = account.locationName || "";
    if (insights.accountName && !fullLocationPath.startsWith("accounts/")) {
      const locPart = fullLocationPath.startsWith("locations/") ? fullLocationPath : `locations/${fullLocationPath}`;
      fullLocationPath = `${insights.accountName}/${locPart}`;
    }

    // Attempt to fetch fresh reviews from Google API
    try {
      const tokenData = await getValidGbpAccessToken(doctorId);
      if (tokenData) {
        const gbpService = new GBPService(tokenData.accessToken, doctorId);
        const locationToFetch = fullLocationPath.startsWith("accounts/") 
          ? fullLocationPath 
          : (tokenData.account?.locationName || account.locationName);
        if (locationToFetch) {
          await gbpService.getReviews(locationToFetch, account.id);
        }
      }
    } catch (err) {
      console.warn("Could not fetch fresh OAuth GBP reviews:", err);
    }

    // Fetch stored reviews from DB
    let storedReviews = await prisma.review.findMany({
      where: { doctorId, source: "GOOGLE" },
      orderBy: { reviewDate: "desc" },
    });

    // Calculate response rate and stats
    const totalCount = storedReviews.length || insights.user_ratings_total || 0;
    const respondedCount = storedReviews.filter((r) => r.responded || r.reply).length;
    const responseRate = totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;
    const rawRating = (insights.rating && !isNaN(Number(insights.rating)) && Number(insights.rating) > 0)
      ? Number(insights.rating)
      : (storedReviews.length > 0 ? (storedReviews.reduce((sum, r) => sum + r.rating, 0) / storedReviews.length) : 0);
    const avgRating = (rawRating > 0) ? rawRating.toFixed(1) : "0.0";

    // Update insightsData in DB with calculated response rate & user_ratings_total
    insights.responseRate = responseRate;
    insights.rating = Number(avgRating);
    insights.user_ratings_total = totalCount;
    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData: insights }
    }).catch(e => console.warn("Failed to update gbpAccount insights responseRate:", e));

    return NextResponse.json({
      connected: true,
      stats: {
        avgRating,
        totalReviews: totalCount,
        responseRate,
        needsReply: totalCount - respondedCount,
      },
      insights: {
        name: insights.name || "Google Business Profile",
        formattedAddress: insights.formattedAddress || "",
        rating: insights.rating || 0,
        user_ratings_total: totalCount,
        responseRate,
        phone: insights.phone || "",
        website: insights.website || "",
        placeId: insights.placeId || null,
        mapsUri: insights.mapsUri || "",
        newReviewUri: insights.newReviewUri || "",
      },
      reviews: storedReviews.map(mapStoredReview),
    });
  } catch (error) {
    console.error("Error fetching GBP reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;
    const { reviewId, reply } = await req.json();

    if (!reviewId || !reply) {
      return NextResponse.json(
        { error: "reviewId and reply are required" },
        { status: 400 }
      );
    }

    const tokenData = await getValidGbpAccessToken(doctorId);
    if (!tokenData?.account.locationName) {
      return NextResponse.json(
        { error: "GBP account not connected" },
        { status: 404 }
      );
    }

    const gbpService = new GBPService(tokenData.accessToken, doctorId);
    const result = await gbpService.replyToReview(
      tokenData.account.locationName,
      reviewId,
      reply
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error replying to GBP review:", error);
    return NextResponse.json(
      { error: "Failed to reply to review" },
      { status: 500 }
    );
  }
}
