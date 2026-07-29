import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const body = await req.json();
    const { conversationId, messageId, patientMessage, aiResponse, status, correctedReply, customRuleAdded } = body;

    if (!conversationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save feedback log in database
    const feedback = await prisma.aIAgentFeedback.create({
      data: {
        doctorId,
        conversationId,
        messageId,
        patientMessage: patientMessage || "",
        aiResponse: aiResponse || "",
        status, // "APPROVED" | "CORRECTED"
        correctedReply: correctedReply || null,
        customRuleAdded: customRuleAdded || null,
      }
    });

    // If doctor added a custom rule, append it directly into the doctor's AI Agent Config
    if (customRuleAdded && customRuleAdded.trim().length > 0) {
      const agentConfig = await prisma.aIAgentConfig.findUnique({
        where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } }
      });

      const currentConfig: any = agentConfig?.config || {};
      const existingPrompt = currentConfig.trainingPrompt || "";
      const timestamp = new Date().toLocaleDateString();
      const updatedPrompt = `${existingPrompt}\n• [Rule Added ${timestamp}]: ${customRuleAdded.trim()}`.trim();

      await prisma.aIAgentConfig.upsert({
        where: { doctorId_agentType: { doctorId, agentType: "APPOINTMENT" } },
        update: {
          config: {
            ...currentConfig,
            trainingPrompt: updatedPrompt
          }
        },
        create: {
          doctorId,
          agentType: "APPOINTMENT",
          enabled: true,
          config: {
            trainingPrompt: updatedPrompt
          }
        }
      });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("POST /api/ai-agents/feedback error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
