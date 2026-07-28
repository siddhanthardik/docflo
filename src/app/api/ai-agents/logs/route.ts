import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // Fetch conversations for this doctor
    const conversations = await prisma.conversation.findMany({
      where: { doctorId },
      select: { id: true, patientName: true, patientPhone: true }
    });

    const conversationIds = conversations.map(c => c.id);
    const convMap = new Map(conversations.map(c => [c.id, c]));

    // Fetch recent AI Assistant messages
    const aiMessages = await prisma.chatMessage.findMany({
      where: {
        conversationId: { in: conversationIds },
        senderName: "AI Assistant"
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // Pair each AI message with the preceding INCOMING patient message
    const logs = await Promise.all(
      aiMessages.map(async (msg) => {
        const precedingPatientMsg = await prisma.chatMessage.findFirst({
          where: {
            conversationId: msg.conversationId,
            direction: "INCOMING",
            createdAt: { lte: msg.createdAt }
          },
          orderBy: { createdAt: "desc" }
        });

        const conv = convMap.get(msg.conversationId);

        return {
          id: msg.id,
          patientName: conv?.patientName || "Patient",
          patientPhone: conv?.patientPhone || "",
          patientMessage: precedingPatientMsg?.content || "N/A",
          aiResponse: msg.content,
          timestamp: msg.createdAt
        };
      })
    );

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/ai-agents/logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
