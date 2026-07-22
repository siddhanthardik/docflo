import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    // Check GBP connection
    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: {
        locationName: true,
        insightsData: true,
        lastSyncAt: true,
      },
    });

    if (!gbpAccount) {
      return NextResponse.json({ connected: false });
    }

    // ----- Completeness engine -----
    const insights = (gbpAccount.insightsData as any) || {};

    // Build a checklist based on what's in the insights data
    const checks = [
      {
        id: "description",
        title: "Add a detailed business description",
        description:
          "Include your specialty, services, and location keywords. This helps AI search understand your practice.",
        completed: !!(insights.description && insights.description.length > 50),
        priority: "high",
        category: "content",
        actionLabel: "Update on Google",
        actionHref: "https://business.google.com",
      },
      {
        id: "photos",
        title: "Upload at least 5 high-quality photos",
        description:
          "Profiles with photos get 42% more direction requests. Show your clinic interior, staff, and exterior.",
        completed: (insights.photoCount || 0) >= 5,
        priority: "high",
        category: "visuals",
        actionLabel: "Add Photos",
        actionHref: "/gbp",
      },
      {
        id: "category",
        title: "Select a primary business category",
        description:
          "Your primary category tells Google exactly what you do. 'Cardiologist' ranks better than just 'Doctor'.",
        completed: !!(insights.primaryCategory),
        priority: "high",
        category: "basics",
        actionLabel: "Update Category",
        actionHref: "https://business.google.com",
      },
      {
        id: "hours",
        title: "Set accurate opening hours",
        description:
          "Outdated hours lead to frustrated patients and lower ranking. Update regular and holiday hours.",
        completed: !!(insights.regularHours),
        priority: "high",
        category: "basics",
        actionLabel: "Update Hours",
        actionHref: "/settings",
      },
      {
        id: "reviews",
        title: "Respond to all recent reviews",
        description:
          "Reply to every review – positive or negative. It shows you care and boosts your local ranking.",
        completed: (insights.unansweredReviews || 0) === 0,
        priority: "medium",
        category: "engagement",
        actionLabel: "View Reviews",
        actionHref: "/gbp",
      },
      {
        id: "posts",
        title: "Post an update this week",
        description:
          "Active profiles rank higher. Share a health tip, clinic update, or special offer.",
        completed: insights.lastPostDate
          ? daysSince(insights.lastPostDate) < 7
          : false,
        priority: "medium",
        category: "engagement",
        actionLabel: "Create Post",
        actionHref: "/gbp/posts",
      },
      {
        id: "qa",
        title: "Add answers to common questions",
        description:
          "FAQs appear directly in search results. Answer questions about insurance, wait times, and parking.",
        completed: (insights.qaCount || 0) >= 3,
        priority: "low",
        category: "content",
        actionLabel: "Manage Q&A",
        actionHref: "https://business.google.com",
      },
    ];

    // ----- Activity snapshot (last 7 days) -----
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const postsLast7Days = await prisma.gBPPost.count({
      where: {
        doctorId,
        createdAt: { gte: sevenDaysAgo },
        status: "PUBLISHED",
      },
    });

    const reviewsRepliedLast7Days = await prisma.review.count({
      where: {
        doctorId,
        responded: true,
        updatedAt: { gte: sevenDaysAgo },
      },
    });

    const profileViewsLast7Days = insights.totalViews || 0;

    // Calculate completeness
    const completedCount = checks.filter((c) => c.completed).length;
    const totalCount = checks.length;
    const score = Math.round((completedCount / totalCount) * 100);

    return NextResponse.json({
      connected: true,
      completeness: {
        score,
        completedCount,
        totalCount,
      },
      recommendations: checks,
      activity: {
        postsLast7Days,
        reviewsRepliedLast7Days,
        profileViewsLast7Days,
        lastPostDate: insights.lastPostDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper
function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}