import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });
    if (!account) return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });

    const latestProfile = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    const latestReview = await prisma.gbpReviewSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    const latestPerformance = await prisma.gbpPerformanceSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });
    
    const latestKeywords = await prisma.gbpKeywordSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    // Calculate sub-scores out of 100
    // Profile Completeness
    let profileCompleteness = 0;
    if (latestProfile && latestProfile.json) {
      const p = latestProfile.json as any;
      let score = 0;
      if (p.name) score += 10;
      if (p.primaryCategory) score += 10;
      if (p.phone) score += 10;
      if (p.website) score += 10;
      if (p.description) score += 15;
      if (p.hours) score += 15;
      if (p.hasPhotos) score += 10;
      if (p.appointmentUrl) score += 10;
      if (p.attributes && Object.keys(p.attributes).length > 0) score += 10;
      profileCompleteness = Math.min(100, score);
    }

    // Review & Reputation
    let reviewReputation = 0;
    if (latestReview && latestReview.json) {
      const r = latestReview.json as any;
      const rating = r.averageRating || 0;
      const totalReviews = r.totalReviewCount || 0;
      if (rating >= 4.5) reviewReputation = 90 + Math.min(10, totalReviews / 10);
      else if (rating >= 4.0) reviewReputation = 70 + Math.min(20, totalReviews / 5);
      else if (rating > 0) reviewReputation = 50;
      else reviewReputation = 0;
      reviewReputation = Math.round(reviewReputation);
    }

    // Keyword Rankings
    let keywordRankings = 0;
    if (latestKeywords && latestKeywords.json) {
      const k = latestKeywords.json as any;
      if (k.keywords && k.keywords.length > 0) {
        keywordRankings = Math.min(100, k.keywords.length * 5); // 5 points per keyword
      }
    }

    // Posting Frequency (No snapshot currently, assume 0 unless we fetch posts)
    const postingFrequency = 0;

    // Q&A Activity (No snapshot currently, assume 0)
    const qaActivity = 0;
    
    // Overall Score
    // Weightings: Profile 30%, Reviews 30%, Keywords 20%, Posts 10%, Q&A 10%
    const overallScore = Math.round(
      (profileCompleteness * 0.3) + 
      (reviewReputation * 0.3) + 
      (keywordRankings * 0.2) + 
      (postingFrequency * 0.1) + 
      (qaActivity * 0.1)
    );

    let status = "Good";
    if (overallScore >= 80) status = "Excellent";
    else if (overallScore < 50) status = "Needs Attention";

    // Performance Data (Clicks & Views)
    let totalClicks = 0;
    let totalViews = 0;
    if (latestPerformance && latestPerformance.json) {
      const p = latestPerformance.json as any;
      totalClicks = (p.websiteClicks || 0) + (p.calls || 0) + (p.directionRequests || 0);
      totalViews = (p.profileViews || 0) + (p.searchViews || 0) + (p.mapsViews || 0);
    }

    return NextResponse.json({
      data: {
        score: overallScore,
        status,
        trend: "+0%",
        subScores: {
          keywordRankings,
          profileCompleteness,
          reviewReputation,
          postingFrequency,
          qaActivity
        },
        performance: {
          totalClicks,
          totalViews,
          clicksTrend: "+0%",
          viewsTrend: "+0%"
        }
      },
      source: "Google API Snapshots",
      lastUpdated: latestProfile?.date || new Date()
    });
  } catch (error: any) {
    console.error("Visibility API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
