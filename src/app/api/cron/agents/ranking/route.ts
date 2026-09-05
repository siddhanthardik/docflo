import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAgentsService } from "@/services/ai-agents.service";

export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    console.log("[CRON] Starting Local SEO Copilot Agent...");
    
    const activeConfigs = await prisma.aIAgentConfig.findMany({
      where: { agentType: "LOCAL_SEO_COPILOT", enabled: true },
      include: {
        doctor: {
          include: {
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

    for (const config of activeConfigs) {
      const doctor = config.doctor;
      const pkgName = (doctor?.package?.name || "").toUpperCase();
      const isTrialActive = doctor?.subscriptionExpiry ? new Date(doctor.subscriptionExpiry) > new Date() : false;
      const isFeatureEnabled = (key: string) => {
        const feat = doctor?.package?.packageFeatures?.find(pf => pf.feature?.key === key);
        return feat?.isEnabled ?? false;
      };

      const hasAccess = isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_SEO_COPILOT");
      if (!hasAccess) continue;

      const gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: config.doctorId },
        orderBy: { updatedAt: "desc" },
      });

      if (!gbpAccount) continue;

      const { generateAlgorithmicTasks } = await import("@/app/api/local-seo/recommendations/route");
      const tasks = await generateAlgorithmicTasks(config.doctorId, gbpAccount.id);

      // Save new tasks to DB if not already pending
      for (const task of tasks) {
        const existing = await prisma.seoRecommendation.findFirst({
          where: {
            gbpAccountId: gbpAccount.id,
            title: task.title,
            status: "PENDING",
          },
        });

        if (!existing) {
          await prisma.seoRecommendation.create({
            data: {
              gbpAccountId: gbpAccount.id,
              category: task.category,
              title: task.title,
              description: task.description,
              priority: task.priority,
              impact: task.impact,
              status: "PENDING",
            },
          }).catch((e) => console.warn("Could not save cron recommendation:", e));
        }
      }

      console.log(`[Copilot Agent] Generated ${tasks.length} local growth tasks for doctor ${config.doctorId}`);
    }

    return NextResponse.json({ success: true, message: "Google Maps & Local Growth Copilot CRON finished" });
  } catch (error: any) {
    console.error("[CRON] Ranking Engine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
