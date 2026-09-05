import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { whatsappManager } from "@/lib/whatsapp-manager"; // Initialize WhatsApp Manager
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const conversations = await prisma.conversation.findMany({
      where: { doctorId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Ensure conversation.lastMessageAt reflects the actual latest WhatsApp message timestamp
    const synchronizedConversations = conversations
      .map((c) => {
        const latestMessageDate = c.messages?.[0]?.createdAt;
        return {
          ...c,
          lastMessageAt: latestMessageDate ? new Date(latestMessageDate).toISOString() : c.lastMessageAt,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ conversations: synchronizedConversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
