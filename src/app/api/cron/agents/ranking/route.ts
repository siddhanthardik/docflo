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
      // For cron purposes, we pass minimal dummy profile data or ideally fetch it.
      // Since this is just a stub for now:
      const dummyProfileData = { locationName: "Cron Sync" };
      
      const tasks = await AIAgentsService.runLocalSeoCopilot(dummyProfileData, config.config);
      
      if (tasks && tasks.length > 0) {
        console.log(`[Copilot Agent] SEO Tasks generated for doctor ${config.doctorId}:`);
        console.log(tasks);
      }
    }

    return NextResponse.json({ success: true, message: "Local SEO Copilot CRON finished" });
  } catch (error: any) {
    console.error("[CRON] Ranking Engine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
