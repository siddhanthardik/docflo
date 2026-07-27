import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { AnalyticsEngine } from "@/lib/seo-engine/analytics";
import { prisma } from "@/lib/prisma";
import { detectSpeciality } from "@/lib/audit/healthcare-intelligence";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId }, orderBy: { updatedAt: 'desc' } });
    if (!account) return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });

    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const comparisons = await AnalyticsEngine.getPerformanceComparison(account.id, days);

    // Get the most recent snapshots
    const latestPerformance = await prisma.gbpPerformanceSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    const latestProfile = await prisma.profileSnapshot.findFirst({
      where: { gbpAccountId: account.id },
      orderBy: { date: 'desc' }
    });

    const insights = (account.insightsData as any) || {};
    const profileData = latestProfile?.json as any;
    const bName = insights.name || profileData?.name || account.locationName || "";
    const bCats = profileData?.categories || profileData?.types || insights.categories || [];
    const bAddr = insights.formattedAddress || profileData?.address || "";
    const detected = detectSpeciality(bName, bCats, bAddr);
    const primaryCategory = detected.isUnknown ? (profileData?.primaryCategory || "Medical Clinic") : detected.speciality;

    const views = comparisons.find(c => c.metric === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH')?.currentValue || insights.views || insights.user_ratings_total || 0;
    const calls = comparisons.find(c => c.metric === 'CALL_CLICKS')?.currentValue || insights.calls || 0;
    const directionRequests = comparisons.find(c => c.metric === 'BUSINESS_DIRECTION_REQUESTS')?.currentValue || 0;
    const websiteClicks = comparisons.find(c => c.metric === 'WEBSITE_CLICKS')?.currentValue || 0;

    return NextResponse.json({
      data: {
        comparisons,
        businessName: bName,
        primaryCategory,
        views,
        calls,
        directionRequests,
        websiteClicks,
        services: profileData?.services || [],
      },
      source: "Google Business Profile Performance API",
      lastUpdated: latestPerformance?.date || latestProfile?.date || account.lastSyncAt || null
    });
  } catch (error: any) {
    console.error("Overview API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
