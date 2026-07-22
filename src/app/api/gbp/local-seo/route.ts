import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { EntitlementService } from "@/services/entitlement.service";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const { searchParams } = new URL(req.url);
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

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    const body = await req.json();
    const { locationId, keywords, competitors } = body;

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

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
      // Use existing Usage Limit infrastructure for keyword tracking limits
      const limitCheck = await EntitlementService.checkLimit(doctorId, "MAX_TRACKED_KEYWORDS");
      if (limitCheck.max !== null && keywords.length > limitCheck.max) {
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
