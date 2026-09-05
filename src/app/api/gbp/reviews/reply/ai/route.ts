import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { AIService } from "@/services/ai/AIService";
import { AIFeature } from "@/services/ai/types";
import { ReviewReplyService } from "@/services/ai/review-reply.service";

export async function POST(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    // 1. Verify Growth & SEO module access
    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    const body = await req.json();
    const { reviewText, reviewRating, patientName } = body;

    if (!reviewText) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }

    // 2. Generate Review Reply using ReviewReplyService
    const result = await ReviewReplyService.generateReply({
      doctorId,
      reviewText,
      rating: Number(reviewRating) || 5,
      authorName: patientName,
    });

    // Audit the AI action
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "AI_GENERATE",
        details: { feature: AIFeature.REVIEW_REPLY, creditsUsed: result.creditsUsed },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    return NextResponse.json({
      reply: result.reply,
      creditsUsed: result.creditsUsed,
      remainingCredits: result.remainingCredits
    });

  } catch (error: any) {
    console.error("Error generating AI review reply:", error);
    if (error.name === 'InsufficientAICreditsError') {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
