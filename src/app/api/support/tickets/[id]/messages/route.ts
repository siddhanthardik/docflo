import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/support/tickets/[id]/messages
 * Add a doctor follow-up message to a support ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.id;
    const { id: ticketId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, doctorId },
      include: { doctor: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
    }

    const newMsg = await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        senderType: "DOCTOR",
        senderName: ticket.doctor.name,
        senderEmail: ticket.doctor.email,
        message: message.trim(),
      },
    });

    // If ticket was resolved or closed, re-open it when doctor responds
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "OPEN" },
      });
    }

    return NextResponse.json({ message: "Reply added", supportMessage: newMsg }, { status: 201 });
  } catch (error: any) {
    console.error("[Ticket Messages API] Error:", error);
    return NextResponse.json({ error: "Failed to post message." }, { status: 500 });
  }
}
