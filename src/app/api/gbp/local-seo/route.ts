import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(request: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, request, { module: "GROWTH_SEO" });
    if (block) return block;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { id: locationId, doctorId }
    });

    if (!account) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const insightsData = (account.insightsData as any) || {};

    let keywords = insightsData.localSeoKeywords || [];
    const competitors = insightsData.competitors || [];

    // Auto-seeding of fake keywords has been removed as part of Phase 7 (Cleansing).
    // Keywords will now only be present if explicitly tracked by the user and scanned by the real engine.

    return NextResponse.json({
      keywords,
      competitors
    });
  } catch (error) {
    console.error("Error fetching local SEO data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { doctorId } = await getSessionData();
    const body = await request.json();
    const { locationId, keywords, competitors } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const account = await prisma.gbpAccount.findFirst({
      where: { id: locationId, doctorId }
    });

    if (!account) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const insightsData = (account.insightsData as any) || {};

    if (keywords !== undefined) {
      // Check Subscription Quotas
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, include: { package: true } });
      if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

      const plan = doctor.package?.name || "FREE";
      const maxKeywords = plan === "ENTERPRISE" ? Infinity : plan === "GROWTH" ? 20 : plan === "STARTER" ? 5 : 0;

      if (keywords.length > maxKeywords) {
        return NextResponse.json({ error: "Quota exceeded" }, { status: 403 });
      }

      insightsData.localSeoKeywords = keywords;
    }
    if (competitors !== undefined) {
      insightsData.competitors = competitors;
    }

    const updatedData = JSON.parse(JSON.stringify(insightsData));

    await prisma.gbpAccount.update({
      where: { id: account.id },
      data: { insightsData: updatedData }
    });

    return NextResponse.json({ success: true, keywords: updatedData.localSeoKeywords, competitors: updatedData.competitors });
  } catch (error) {
    console.error("Error saving local SEO data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
