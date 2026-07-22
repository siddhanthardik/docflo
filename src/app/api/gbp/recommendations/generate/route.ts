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

    const prompt = `You are a Local SEO specialist for medical practices.
    Location Name: ${gbpAccount.locationName || 'Unknown'}
    Category: ${insights.primaryCategory || 'Not specified'}
    
    Provide 3 highly actionable, specific SEO suggestions for this clinic to rank higher on Google Maps. Format as a JSON array of strings. Do not use markdown blocks, just return the raw JSON array.`;

    const aiResult = await AIService.generate(
      doctorId, 
      AIFeature.SEO_OPTIMIZATION,
      prompt,
      { temperature: 0.7 }
    );

    let suggestions = [];
    try {
      suggestions = JSON.parse(aiResult.content);
    } catch (e) {
      // Fallback if AI didn't return raw JSON
      const text = aiResult.content.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        suggestions = JSON.parse(text);
      } catch (e2) {
        suggestions = ["Ensure your profile is 100% complete.", "Post weekly updates.", "Respond to all reviews."];
      }
    }

    // Audit the AI action
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "AI_GENERATE",
        details: { feature: AIFeature.SEO_OPTIMIZATION, creditsUsed: aiResult.creditsUsed },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      suggestions,
      creditsUsed: aiResult.creditsUsed,
      remainingCredits: aiResult.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating AI SEO suggestions:", error);
    if (error.name === 'InsufficientAICreditsError') {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
