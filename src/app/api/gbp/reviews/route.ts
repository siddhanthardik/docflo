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

    // Fallback & Auto-backfill: If DB has 0 reviews, check insights.reviews or Places API
    if (storedReviews.length === 0) {
      let fallbackReviews: any[] = insights.reviews || insights.recentReviews || [];

      let targetPlaceId = insights.placeId;
      if (fallbackReviews.length === 0 && !targetPlaceId && insights.name && process.env.GOOGLE_PLACES_API_KEY) {
        try {
          const placesService = new PlacesService();
          const searchResults = await placesService.searchPlaces(`${insights.name} ${insights.formattedAddress || ""}`);
          if (searchResults && searchResults.length > 0) {
            targetPlaceId = searchResults[0].placeId;
            insights.placeId = targetPlaceId;
            await prisma.gbpAccount.update({
              where: { id: account.id },
              data: { insightsData: insights }
            }).catch(e => console.warn("Failed to save placeId to insightsData:", e));
          }
        } catch (e) {
          console.warn("Could not search placeId via Places API:", e);
        }
      }

      if (fallbackReviews.length === 0 && targetPlaceId && process.env.GOOGLE_PLACES_API_KEY) {
        try {
          const placesService = new PlacesService();
          const details = await placesService.getPlaceDetails(targetPlaceId);
          if (details.reviews && details.reviews.length > 0) {
            fallbackReviews = details.reviews.map((r: any) => ({
              id: `place-rev-${r.time || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              author_name: r.author_name,
              reviewerName: r.author_name,
              rating: r.rating,
              text: r.text,
              comment: r.text,
              relative_time_description: r.relative_time_description,
              time: r.time,
              createTime: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
            }));
            insights.reviews = fallbackReviews;
            await prisma.gbpAccount.update({
              where: { id: account.id },
              data: { insightsData: insights }
            }).catch(e => console.warn("Failed to update insights with Places reviews:", e));
          }
        } catch (err) {
          console.warn("Could not fetch fresh reviews from Places API:", err);
        }
      }

      // Backfill fallback reviews into DB
      if (fallbackReviews.length > 0) {
        for (const rev of fallbackReviews) {
          const rId = rev.id || rev.reviewId || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          await prisma.review.upsert({
            where: { id: rId },
            update: {
              rating: rev.rating || 5,
              comment: rev.comment || rev.text || "",
              reply: rev.reply || null,
              responded: !!(rev.reply || rev.replied || rev.responded),
              gbpAccountId: account.id,
            },
            create: {
              id: rId,
              doctorId,
              gbpAccountId: account.id,
              reviewerName: rev.reviewerName || rev.author_name || "Google user",
              rating: rev.rating || 5,
              comment: rev.comment || rev.text || "",
              reply: rev.reply || null,
              responded: !!(rev.reply || rev.replied || rev.responded),
              source: "GOOGLE",
              reviewDate: rev.createTime ? new Date(rev.createTime) : new Date(),
            },
          }).catch(e => console.warn("Failed to backfill review to DB:", e));
        }

        // Refetch stored reviews after backfill
        storedReviews = await prisma.review.findMany({
          where: { doctorId, source: "GOOGLE" },
          orderBy: { reviewDate: "desc" },
        });
      }
    }

    // Final list of formatted reviews
    const finalReviewsList = storedReviews.length > 0 
      ? storedReviews.map(mapStoredReview)
      : (insights.reviews || []).map((r: any) => ({
          id: r.id || r.reviewId || `rev-${Math.random().toString(36).substring(2, 6)}`,
          author_name: r.author_name || r.reviewerName || "Google user",
          reviewerName: r.author_name || r.reviewerName || "Google user",
          rating: r.rating || 5,
          text: r.text || r.comment || "",
          comment: r.text || r.comment || "",
          reply: r.reply || null,
          replied: !!(r.reply || r.replied || r.responded),
          responded: !!(r.reply || r.replied || r.responded),
          source: "GOOGLE",
          reviewDate: r.createTime || r.reviewDate || new Date().toISOString(),
          createTime: r.createTime || r.reviewDate || new Date().toISOString(),
          relative_time_description: r.relative_time_description || new Date().toLocaleDateString(),
        }));

    // Calculate response rate and stats
    const totalCount = finalReviewsList.length || insights.user_ratings_total || 0;
    const respondedCount = finalReviewsList.filter((r: any) => r.responded || r.replied || r.reply).length;
    const responseRate = totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;
    const rawRating = (insights.rating && !isNaN(Number(insights.rating)) && Number(insights.rating) > 0)
      ? Number(insights.rating)
      : (finalReviewsList.length > 0 ? (finalReviewsList.reduce((sum: number, r: any) => sum + r.rating, 0) / finalReviewsList.length) : 0);
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
        rating: Number(avgRating),
        user_ratings_total: totalCount,
        responseRate,
        phone: insights.phone || "",
        website: insights.website || "",
        placeId: insights.placeId || null,
        mapsUri: insights.mapsUri || "",
        newReviewUri: insights.newReviewUri || "",
      },
      reviews: finalReviewsList,
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
