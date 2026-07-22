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

    const conversation = await prisma.conversation.findUnique({
      where: { id, doctorId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Try to send via WhatsApp Manager first
    try {
      await whatsappManager.sendMessage(doctorId, conversation.patientPhone, content);
    } catch (waError: any) {
      console.error("WhatsApp Send Error:", waError);
      return NextResponse.json({ error: "Failed to deliver WhatsApp message" }, { status: 502 });
    }

    // Create the message log only if delivery succeeded
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        direction: "OUTGOING",
        content,
        senderName: "Doctor",
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
