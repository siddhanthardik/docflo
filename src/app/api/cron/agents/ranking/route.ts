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
    });

    for (const config of activeConfigs) {
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
