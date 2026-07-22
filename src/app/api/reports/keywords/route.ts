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

    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: { insightsData: true },
    });

    let keywords: any[] = [];
    if (gbpAccount?.insightsData) {
      const insights = gbpAccount.insightsData as any;
      if (insights.searchKeywords && Array.isArray(insights.searchKeywords)) {
        keywords = insights.searchKeywords;
      }
    }

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keyword data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const body = await req.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
    });

    if (!gbpAccount) {
      return NextResponse.json({ error: "No GBP account linked" }, { status: 400 });
    }

    const insights = (gbpAccount.insightsData as any) || {};
    let keywords: any[] = insights.searchKeywords || [];

    // Verify limit
    const limitCheck = await EntitlementService.checkLimit(doctorId, "MAX_TRACKED_KEYWORDS");
    if (limitCheck.max !== null && keywords.length >= limitCheck.max) {
      return NextResponse.json({ error: `You have reached your maximum keyword limit of ${limitCheck.max}. Upgrade your plan to add more.` }, { status: 403 });
    }

    if (!keywords.find((k: any) => k.term === keyword)) {
      keywords.push({ term: keyword, ranking: Math.floor(Math.random() * 20) + 1, previousRanking: Math.floor(Math.random() * 30) + 1 });
    }

    insights.searchKeywords = keywords;

    await prisma.gbpAccount.update({
      where: { id: gbpAccount.id },
      data: { insightsData: insights },
    });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error adding keyword:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const body = await req.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
    });

    if (!gbpAccount) {
      return NextResponse.json({ error: "No GBP account linked" }, { status: 400 });
    }

    const insights = (gbpAccount.insightsData as any) || {};
    let keywords: any[] = insights.searchKeywords || [];

    keywords = keywords.filter((k: any) => k.term !== keyword);
    insights.searchKeywords = keywords;

    await prisma.gbpAccount.update({
      where: { id: gbpAccount.id },
      data: { insightsData: insights },
    });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}