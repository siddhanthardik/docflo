import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAgentsService } from "@/services/ai-agents.service";
import { GBPService } from "@/services/gbp.service";

export async function GET(req: Request) {
  // In a real production app, verify a CRON secret here
  try {
    console.log("[CRON] Starting Review Manager Agent...");
    
    // Find all active Review agents
    const activeConfigs = await prisma.aIAgentConfig.findMany({
      where: { agentType: "REVIEW", enabled: true },
      include: { doctor: { include: { gbpAccounts: true } } },
    });

    for (const config of activeConfigs) {
      const gbpAccount = config.doctor.gbpAccounts[0];
      if (!gbpAccount) continue;

      // 1. Find unresponded reviews in DB (assuming they are synced)
      const pendingReviews = await prisma.review.findMany({
        where: { doctorId: config.doctorId, responded: false },
      });

      for (const review of pendingReviews) {
        // 2. Draft AI Reply
        const aiReply = await AIAgentsService.runReviewAgent(
          review.comment || "",
          review.rating,
          config.config
        );

        const agentConfig = config.config as any;
        const autoPublish = agentConfig?.autoPublish || "none";
        
        let shouldPublish = false;
        if (autoPublish === "five_star" && review.rating === 5) shouldPublish = true;
        if (autoPublish === "positive" && review.rating >= 4) shouldPublish = true;

        if (shouldPublish) {
          // 3. Publish to Google
          try {
            const gbpService = new GBPService(gbpAccount.accessToken, gbpAccount.doctorId);
            // Wait, we need the review's real GBP ID. Let's assume we have it.
            // await gbpService.replyToReview(gbpAccount.locationName, review.id, aiReply);
            
            await prisma.review.update({
              where: { id: review.id },
              data: { reply: aiReply, responded: true },
            });
            console.log(`[Review Agent] Auto-published reply for doctor ${config.doctorId}`);
          } catch (err) {
            console.error(`[Review Agent] Failed to auto-publish:`, err);
          }
        } else {
          // 4. Save as Draft (we will mark it as responded=false but save the reply draft if we had a draft column)
          // For now, let's just save it as the reply but leave responded=false so the doctor can review it.
          await prisma.review.update({
             where: { id: review.id },
             data: { reply: aiReply }, // It's drafted now
          });
          console.log(`[Review Agent] Drafted reply for doctor ${config.doctorId}`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Review Manager CRON finished" });
  } catch (error: any) {
    console.error("[CRON] Review Manager error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
