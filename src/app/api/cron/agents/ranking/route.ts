import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAgentsService } from "@/services/ai-agents.service";

export async function GET(req: Request) {
  try {
    console.log("[CRON] Starting Ranking Engine Agent...");
    
    const activeConfigs = await prisma.aIAgentConfig.findMany({
      where: { agentType: "RANKING", enabled: true },
    });

    for (const config of activeConfigs) {
      // Generate actionable SEO tasks based on the keywords
      const tasks = await AIAgentsService.runRankingAgent(config.config);
      
      if (tasks && tasks.length > 0) {
        // In a full implementation, you would save these tasks to an `SEOTask` table.
        // For now, we will log them. The frontend can fetch these or we can send them via email.
        console.log(`[Ranking Agent] SEO Tasks generated for doctor ${config.doctorId}:`);
        console.log(tasks);
      }
    }

    return NextResponse.json({ success: true, message: "Ranking Engine CRON finished" });
  } catch (error: any) {
    console.error("[CRON] Ranking Engine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
