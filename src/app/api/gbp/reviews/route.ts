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
    responded: review.responded,
    source: review.source,
    reviewDate: review.reviewDate,
    relative_time_description: new Date(review.reviewDate).toLocaleDateString(),
  };
}

export async function GET(req: Request) {
  try {
    const { doctorId, locationId } = await getSessionData();
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

    if (account.locationName?.startsWith("accounts/")) {
      try {
        const tokenData = await getValidGbpAccessToken(doctorId);
        if (tokenData) {
          const gbpService = new GBPService(tokenData.accessToken, doctorId);
          await gbpService.getReviews(account.locationName);
        }
      } catch (err) {
        console.warn("Could not fetch fresh OAuth GBP reviews:", err);
      }

      const storedReviews = await prisma.review.findMany({
        where: { doctorId, source: "GOOGLE", gbpAccountId: account.id },
        orderBy: { reviewDate: "desc" },
        take: 50,
      });

      return NextResponse.json({
        connected: true,
        insights: {
          name: insights.name || "Google Business Profile",
          formattedAddress: insights.formattedAddress || "",
          rating: insights.rating || 0,
          user_ratings_total: insights.user_ratings_total || storedReviews.length,
          phone: insights.phone || "",
          website: insights.website || "",
          placeId: insights.placeId || null,
          mapsUri: insights.mapsUri || "",
          newReviewUri: insights.newReviewUri || "",
        },
        reviews: storedReviews.map(mapStoredReview),
      });
    }

    if (!account.insightsData) {
      return NextResponse.json({
        connected: false,
        insights: null,
        reviews: [],
      });
    }

    let reviews: any[] = [];
    if (insights.placeId && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const placesService = new PlacesService();
        const details = await placesService.getPlaceDetails(insights.placeId);
        reviews = (details.reviews || []).map((r: any) => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          relative_time_description: r.relative_time_description,
          time: r.time,
        }));
        insights.reviews = reviews;
        await prisma.gbpAccount.updateMany({ where: { doctorId },
          data: { insightsData: insights },
        });
      } catch (err) {
        console.warn("Could not fetch fresh reviews from Places:", err);
        reviews = insights.reviews || [];
      }
    } else {
      reviews = insights.reviews || [];
    }

    return NextResponse.json({
      connected: true,
      insights: {
        name: insights.name || "N/A",
        formattedAddress: insights.formattedAddress || "",
        rating: insights.rating || 0,
        user_ratings_total: insights.user_ratings_total || 0,
        phone: insights.phone || "",
        website: insights.website || "",
        placeId: insights.placeId || null,
      },
      reviews,
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
