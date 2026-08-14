import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAgentsService } from "@/services/ai-agents.service";
import { GBPService } from "@/services/gbp.service";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import { ReviewDispatcherService } from "@/services/review-dispatcher.service";

export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    console.log("[CRON] Starting Review Manager Agent...");
    
    // Evaluate appointments for review requests (surveys)
    await ReviewDispatcherService.evaluateAppointments();

    // Find all active Review agents with package features included
    const activeConfigs = await prisma.aIAgentConfig.findMany({
      where: { agentType: "REVIEW", enabled: true },
      include: {
        doctor: {
          include: {
            gbpAccounts: true,
            package: {
              include: {
                packageFeatures: {
                  include: { feature: true }
                }
              }
            }
          }
        }
      },
    });

    let autoPublishedCount = 0;
    let draftedCount = 0;

    for (const config of activeConfigs) {
      const doctor = config.doctor;
      const pkgName = (doctor?.package?.name || "").toUpperCase();
      const isTrialActive = doctor?.subscriptionExpiry ? new Date(doctor.subscriptionExpiry) > new Date() : false;
      const isFeatureEnabled = (key: string) => {
        const feat = doctor?.package?.packageFeatures?.find(pf => pf.feature?.key === key);
        return feat?.isEnabled ?? false;
      };

      const hasAccess = isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_REVIEW_REPLY");
      if (!hasAccess) continue;

      const gbpAccount = config.doctor.gbpAccounts[0];
      if (!gbpAccount) continue;

      // Find unresponded reviews in DB
      const pendingReviews = await prisma.review.findMany({
        where: { doctorId: config.doctorId, responded: false },
      });

      for (const review of pendingReviews) {
        // Draft AI Reply incorporating custom clinic guidelines and target keywords
        const aiReply = await AIAgentsService.runReviewAgent(
          review.comment || "",
          review.rating,
          config.config
        );

        const agentConfig = (config.config as any) || {};
        const autoPublish = agentConfig?.autoPublish || "none";
        
        let shouldPublish = false;
        if (autoPublish === "five_star" && review.rating === 5) shouldPublish = true;
        if (autoPublish === "positive" && review.rating >= 4) shouldPublish = true;

        if (shouldPublish) {
          try {
            const tokenData = await getValidGbpAccessToken(config.doctorId);
            if (tokenData && tokenData.accessToken) {
              const insights = (gbpAccount.insightsData as any) || {};
              const accountName = insights?.accountName;
              const locationName = gbpAccount.locationName;

              let fullLocationPath = locationName || "";
              if (accountName && !fullLocationPath.startsWith("accounts/")) {
                const locPart = fullLocationPath.startsWith("locations/") ? fullLocationPath : `locations/${fullLocationPath}`;
                fullLocationPath = `${accountName}/${locPart}`;
              }

              if (fullLocationPath.startsWith("accounts/")) {
                const gbpService = new GBPService(tokenData.accessToken, config.doctorId);
                await gbpService.replyToReview(fullLocationPath, review.id, aiReply);
                autoPublishedCount++;
                console.log(`[Review Agent] Auto-published reply to Google for review ${review.id} (Doctor: ${config.doctorId})`);
              } else {
                await prisma.review.update({
                  where: { id: review.id },
                  data: { reply: aiReply, responded: true },
                });
                autoPublishedCount++;
              }
            } else {
              // Local fallback if token is temporarily unavailable
              await prisma.review.update({
                where: { id: review.id },
                data: { reply: aiReply, responded: true },
              });
              autoPublishedCount++;
            }
          } catch (err) {
            console.error(`[Review Agent] Failed to auto-publish reply to Google:`, err);
            // Save as draft locally if live publishing fails so doctor can publish manually
            await prisma.review.update({
              where: { id: review.id },
              data: { reply: aiReply, responded: false },
            });
            draftedCount++;
          }
        } else {
          // Save as draft (responded = false, reply = aiReply) for manual doctor approval
          await prisma.review.update({
            where: { id: review.id },
            data: { reply: aiReply, responded: false },
          });
          draftedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review Manager CRON finished: ${autoPublishedCount} replies auto-published to Google, ${draftedCount} saved as drafts.`,
    });
  } catch (error: any) {
    console.error("[CRON] Review Manager error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
