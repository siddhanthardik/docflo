import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";

export async function GET() {
  try {
    const { doctorId } = await getSessionData();

    const accounts = await prisma.gbpAccount.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' }
    });

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        connected: false,
        accounts: [],
      });
    }

    const accountsData = await Promise.all(accounts.map(async (account) => {
      const insights = (account.insightsData as any) || {};
      
      const storedReviews = await prisma.review.findMany({
        where: { doctorId, source: "GOOGLE", gbpAccountId: account.id }, 
        orderBy: { reviewDate: "desc" },
      });

      return {
        id: account.id,
        locationId: account.locationId,
        locationName: account.locationName,
        insights: {
          name: insights.name || "Google Business Profile",
          formattedAddress: insights.formattedAddress || "",
          rating: insights.rating || 0,
          user_ratings_total: insights.user_ratings_total || 0,
          phone: insights.phone || "",
          website: insights.website || "",
          placeId: insights.placeId || null,
          mapsUri: insights.mapsUri || "",
          newReviewUri: insights.newReviewUri || "",
          // Performance metrics
          totalViews: insights.totalViews || 0,
          searchViews: insights.searchViews || 0,
          mapsViews: insights.mapsViews || 0,
          phoneCalls: insights.phoneCalls || 0,
          directionRequests: insights.directionRequests || 0,
          websiteClicks: insights.websiteClicks || 0,
          directSearches: insights.directSearches || 0,
          discoverySearches: insights.discoverySearches || 0,
          totalActions: insights.totalActions || 0,
          // Keywords & categories
          searchKeywords: insights.searchKeywords || [],
          categories: insights.categories || null,
          description: insights.description || "",
          accountName: insights.accountName || "",
        },
        recentReviews: storedReviews.map(r => ({
          id: r.id,
          author_name: r.reviewerName,
          rating: r.rating,
          text: r.comment,
          replied: r.responded,
          reply: r.reply,
          relative_time_description: r.reviewDate ? r.reviewDate.toISOString() : new Date().toISOString(),
        }))
      };
    }));

    return NextResponse.json({
      connected: true,
      accounts: accountsData,
    });
  } catch (error) {
    console.error("Error fetching GBP profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
