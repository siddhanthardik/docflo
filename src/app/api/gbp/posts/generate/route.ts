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

    const body = await req.json();
    const { topic, tone = "professional", targetKeywords = [] } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // 2. Generate Post using AIService
    const keywordsStr = targetKeywords.length > 0 ? `Include these keywords organically: ${targetKeywords.join(", ")}` : "";
    
    const prompt = `You are an expert social media manager for a medical clinic writing a Google Business Profile update post.
    Topic: ${topic}
    Tone: ${tone}
    ${keywordsStr}
    
    Write an engaging, informative post (1-2 paragraphs, max 1500 characters). Include a clear call to action (like 'Call us today' or 'Book an appointment'). Do not include placeholders.`;

    const aiResult = await AIService.generate(
      doctorId, 
      AIFeature.GBP_POST,
      prompt,
      { temperature: 0.8 }
    );

    // Audit the AI action
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "AI_GENERATE",
        details: { feature: AIFeature.GBP_POST, creditsUsed: aiResult.creditsUsed },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      content: aiResult.content,
      creditsUsed: aiResult.creditsUsed,
      remainingCredits: aiResult.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating AI Google Post:", error);
    if (error.name === 'InsufficientAICreditsError') {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
