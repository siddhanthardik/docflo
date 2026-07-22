import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { AnalyticsEngine } from "@/lib/seo-engine/analytics";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });
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

    const profileData = latestProfile?.json as any;

    return NextResponse.json({
      data: {
        comparisons,
        businessName: profileData?.name || account.locationName,
        primaryCategory: profileData?.primaryCategory || "Medical Clinic",
        views: comparisons.find(c => c.metric === 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH')?.currentValue || 0,
        calls: comparisons.find(c => c.metric === 'CALL_CLICKS')?.currentValue || 0,
        directionRequests: comparisons.find(c => c.metric === 'BUSINESS_DIRECTION_REQUESTS')?.currentValue || 0,
        websiteClicks: comparisons.find(c => c.metric === 'WEBSITE_CLICKS')?.currentValue || 0,
        services: profileData?.services || [],
      },
      source: "Google Business Profile Performance API",
      lastUpdated: latestPerformance?.date || latestProfile?.date || null
    });
  } catch (error: any) {
    console.error("Overview API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
