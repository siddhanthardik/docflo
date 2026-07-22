import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

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

    const { staffId } = await req.json();

    // Verify conversation exists
    const conv = await prisma.conversation.findUnique({ where: { id, doctorId } });
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    let staffName = "Unassigned";

    if (staffId) {
      // Validate clinic ownership
      const staff = await prisma.staffMember.findUnique({
        where: { id: staffId, doctorId }
      });
      if (!staff) {
        return NextResponse.json({ error: "Staff member not found or doesn't belong to this clinic" }, { status: 403 });
      }
      staffName = staff.name;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { assignedToId: staffId || null },
    });

    // Create an internal assignment note
    await prisma.chatMessage.create({
      data: {
        conversationId: id,
        direction: "INTERNAL_NOTE",
        content: `Conversation assigned to ${staffName}`,
        senderName: "System",
      }
    });

    // Maintain complete audit history
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        userType: "CLINIC",
        action: "WHATSAPP_CONV_ASSIGN",
        details: { conversationId: id, assignedToId: staffId }
      }
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
