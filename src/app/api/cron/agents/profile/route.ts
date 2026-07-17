import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAgentsService } from "@/services/ai-agents.service";

export async function GET(req: Request) {
  try {
    console.log("[CRON] Starting Profile Updater Agent...");
    
    const activeConfigs = await prisma.aIAgentConfig.findMany({
      where: { agentType: "PROFILE", enabled: true },
      include: { doctor: { include: { gbpAccounts: true } } },
    });

    for (const config of activeConfigs) {
      const gbpAccount = config.doctor.gbpAccounts[0];
      if (!gbpAccount) continue;

      // In a real app, you would check the 'frequency' and when the last post was made.
      // For demonstration, we just generate a post.
      const postData = await AIAgentsService.runProfileAgent(config.config);
      
      if (postData && postData.title) {
        await prisma.gBPPost.create({
          data: {
            doctorId: config.doctorId,
            gbpAccountId: gbpAccount.id,
            title: postData.title,
            content: postData.content,
            postType: postData.postType || "STANDARD",
            ctaType: postData.ctaType,
            status: "DRAFT", // Saving as draft so the doctor can review/publish it
          }
        });
        console.log(`[Profile Agent] Drafted new GBP post for doctor ${config.doctorId}`);
      }
    }

    return NextResponse.json({ success: true, message: "Profile Updater CRON finished" });
  } catch (error: any) {
    console.error("[CRON] Profile Updater error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
