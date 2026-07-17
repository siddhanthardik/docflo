import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { PlacesService } from "@/services/places.service";

export async function POST(req: Request) {
  try {
    await getSessionData();
    const { placeId } = await req.json();
    if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

    const placesService = new PlacesService();
    const details = await placesService.getPlaceDetails(placeId);

    // Build a structured insights object from the place details
    const insightsData: any = {
      // basic info
      name: details.name,
      formattedAddress: details.formatted_address,
      phone: details.formatted_phone_number || null,
      website: details.website || null,
      placeId: placeId,
      // completeness-related
      description: details.editorial_summary?.overview || details.name,
      photoCount: details.photos?.length || 0,
      primaryCategory: details.types?.[0] || null,
      regularHours: details.opening_hours?.periods ? true : false,
      unansweredReviews: 0, // can't know from here
      lastPostDate: null,   // can't know
      qaCount: 0,
      // metrics (approximate)
      totalViews: details.user_ratings_total || 0,
      rating: details.rating || 0,
      totalSearches: 0,
      phoneCalls: 0,
      directionRequests: 0,
      searchKeywords: [],
    };

    // Compute audit recommendations without marking this tenant as OAuth-connected.
    const checks = [
      {
        id: "description",
        title: "Add a detailed business description",
        description: "Include your specialty, services, and location keywords.",
        completed: !!(insightsData.description && insightsData.description.length > 50),
        priority: "high",
        category: "content",
        actionLabel: "Update on Google",
        actionHref: "https://business.google.com",
      },
      {
        id: "photos",
        title: "Upload at least 5 high-quality photos",
        description: "Profiles with photos get 42% more direction requests.",
        completed: (insightsData.photoCount || 0) >= 5,
        priority: "high",
        category: "visuals",
        actionLabel: "Add Photos",
        actionHref: "/gbp",
      },
      {
        id: "category",
        title: "Select a primary business category",
        description: "Your primary category tells Google exactly what you do.",
        completed: !!(insightsData.primaryCategory),
        priority: "high",
        category: "basics",
        actionLabel: "Update Category",
        actionHref: "https://business.google.com",
      },
      {
        id: "hours",
        title: "Set accurate opening hours",
        description: "Outdated hours frustrate patients and hurt ranking.",
        completed: !!insightsData.regularHours,
        priority: "high",
        category: "basics",
        actionLabel: "Update Hours",
        actionHref: "/settings",
      },
      {
        id: "reviews",
        title: "Respond to all recent reviews",
        description: "Replying to reviews shows you care and boosts local ranking.",
        completed: (insightsData.unansweredReviews || 0) === 0,
        priority: "medium",
        category: "engagement",
        actionLabel: "View Reviews",
        actionHref: "/gbp",
      },
      {
        id: "posts",
        title: "Post an update this week",
        description: "Active profiles rank higher. Share a health tip.",
        completed: insightsData.lastPostDate
          ? daysSince(insightsData.lastPostDate) < 7
          : false,
        priority: "medium",
        category: "engagement",
        actionLabel: "Create Post",
        actionHref: "/gbp/posts",
      },
      {
        id: "qa",
        title: "Add answers to common questions",
        description: "FAQs appear directly in search results.",
        completed: (insightsData.qaCount || 0) >= 3,
        priority: "low",
        category: "content",
        actionLabel: "Manage Q&A",
        actionHref: "https://business.google.com",
      },
    ];

    const completedCount = checks.filter(c => c.completed).length;
    const score = Math.round((completedCount / checks.length) * 100);

    return NextResponse.json({
      completeness: {
        score,
        completedCount,
        totalCount: checks.length,
      },
      recommendations: checks,
      activity: {
        postsLast7Days: 0,
        reviewsRepliedLast7Days: 0,
        profileViewsLast7Days: insightsData.user_ratings_total || 0,
        lastPostDate: null,
      },
      placeName: details.name,
      placeAddress: details.formatted_address,
    });
  } catch (error: any) {
    console.error("Place lookup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
