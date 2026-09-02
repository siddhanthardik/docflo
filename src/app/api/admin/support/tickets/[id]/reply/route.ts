import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendSupportTicketReplyToDoctor } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/support/tickets/[id]/reply
 * Admin replies to support ticket and sends email update to doctor
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "SUPERADMIN" && role !== "ADMIN")) {
      return new NextResponse("Forbidden - Admin Access Required", { status: 403 });
    }

    const { id: ticketId } = await params;
    const body = await req.json();
    const { message, status = "IN_PROGRESS" } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Reply message cannot be empty." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { doctor: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const adminName = session.user.name || "Gyrex Support Team";
    const adminEmail = session.user.email || "support@gyrex.in";

    // 1. Create support message
    const replyMsg = await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        senderType: "SUPPORT_ADMIN",
        senderName: adminName,
        senderEmail: adminEmail,
        message: message.trim(),
      },
    });

    // 2. Update ticket status
    const isResolved = status === "RESOLVED";
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(isResolved ? { resolutionNote: message.trim() } : {}),
      },
    });

    // 3. Send email to Doctor
    sendSupportTicketReplyToDoctor({
      ticketNumber: ticket.ticketNumber,
      doctorName: ticket.doctor.name,
      doctorEmail: ticket.doctor.email,
      subject: ticket.subject,
      replyMessage: message.trim(),
      isResolved,
    }).catch((err) => {
      console.warn(`[SupportTicket Reply #${ticket.ticketNumber}] Email failed:`, err);
    });

    return NextResponse.json(
      {
        message: "Reply sent and doctor notified via email.",
        supportMessage: replyMsg,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Admin Ticket Reply API] Error:", error);
    return NextResponse.json({ error: "Failed to post reply." }, { status: 500 });
  }
}
