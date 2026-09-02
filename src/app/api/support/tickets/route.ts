import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  sendSupportTicketAlertToAdmin,
  sendSupportTicketAcknowledgmentToDoctor,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/support/tickets
 * Fetch support tickets for the logged-in doctor
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.id;

    const tickets = await prisma.supportTicket.findMany({
      where: { doctorId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("[SupportTickets API] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
  }
}

/**
 * POST /api/support/tickets
 * Create a new support ticket & dispatch emails to Support Team + Doctor
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.id;
    const body = await req.json();
    const { category, priority = "MEDIUM", subject, description, attachments } = body;

    if (!subject?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "Subject, category, and issue description are required." },
        { status: 400 }
      );
    }

    // Fetch Doctor details
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { package: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor account not found." }, { status: 404 });
    }

    // Generate unique human-readable Ticket Number: TKT-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${datePart}-${randomPart}`;

    // Create Ticket in Database
    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        doctorId,
        category,
        priority: priority.toUpperCase(),
        subject: subject.trim(),
        description: description.trim(),
        attachments: attachments || undefined,
        status: "OPEN",
        messages: {
          create: {
            senderType: "DOCTOR",
            senderName: doctor.name,
            senderEmail: doctor.email,
            message: description.trim(),
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Asynchronously dispatch dual emails (does not block response if email is delayed)
    Promise.allSettled([
      // 1. Alert Support Team
      sendSupportTicketAlertToAdmin({
        ticketNumber,
        doctorName: doctor.name,
        clinicName: doctor.clinicName || `${doctor.name}'s Clinic`,
        doctorEmail: doctor.email,
        doctorPhone: doctor.phone || undefined,
        category,
        priority: priority.toUpperCase(),
        subject: subject.trim(),
        description: description.trim(),
        packageTier: doctor.package?.name,
      }),
      // 2. Acknowledge to Doctor
      sendSupportTicketAcknowledgmentToDoctor({
        ticketNumber,
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        subject: subject.trim(),
        description: description.trim(),
        category,
      }),
    ]).then((results) => {
      console.log(`[SupportTicket #${ticketNumber}] Email dispatch results:`, results);
    });

    return NextResponse.json(
      {
        message: "Support ticket raised successfully.",
        ticket: newTicket,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[SupportTickets API] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create support ticket." },
      { status: 500 }
    );
  }
}
