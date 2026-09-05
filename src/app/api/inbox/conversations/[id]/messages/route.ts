import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";
import { whatsappManager } from "@/lib/whatsapp-manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const block = await entitlementGuard(doctorId, req, { module: "WHATSAPP_CRM" });
    if (block) return block;

    const { content } = await req.json();

    const conversation = await prisma.conversation.findFirst({
      where: { id, doctorId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Try to send via WhatsApp Manager (which logs ChatMessage with true WhatsApp timestamp)
    let result: any;
    try {
      result = await whatsappManager.sendMessage(doctorId, conversation.patientPhone, content, "Doctor");
    } catch (waError: any) {
      console.error("WhatsApp Send Error:", waError);
      return NextResponse.json({ error: "Failed to deliver WhatsApp message" }, { status: 502 });
    }

    if (!result?.message) {
      const fallbackMessage = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          direction: "OUTGOING",
          content,
          senderName: "Doctor",
        },
      });
      return NextResponse.json(fallbackMessage);
    }

    return NextResponse.json(result.message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
