import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { AIService } from "@/services/ai/AIService";
import { AIFeature } from "@/services/ai/types";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    // 1. Verify Growth & SEO module access
    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: { locationName: true, insightsData: true }
    });

    if (!gbpAccount) {
      return NextResponse.json({ error: "Google Business Profile not connected" }, { status: 400 });
    }

    const insights = gbpAccount.insightsData as any || {};

    const prompt = `You are a Local SEO expert analyzing a clinic's Google Business Profile.
    Location Name: ${gbpAccount.locationName || 'Unknown'}
    Category: ${insights.primaryCategory || 'Not specified'}
    Description length: ${(insights.description || '').length} characters
    Photos count: ${insights.photoCount || 0}
    Reviews unanswered: ${insights.unansweredReviews || 0}
    Views last month: ${insights.totalViews || 0}
    
    Write a 3-paragraph executive summary auditing their profile. Point out exactly what they are doing well and what their biggest missed opportunity is for ranking locally.`;

    const aiResult = await AIService.generate(
      doctorId, 
      AIFeature.CLINIC_AUDIT,
      prompt,
      { temperature: 0.5 }
    );

    // Audit the AI action
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "AI_GENERATE",
        details: { feature: AIFeature.CLINIC_AUDIT, creditsUsed: aiResult.creditsUsed },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      auditReport: aiResult.content,
      creditsUsed: aiResult.creditsUsed,
      remainingCredits: aiResult.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating AI SEO audit:", error);
    if (error.name === 'InsufficientAICreditsError') {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
