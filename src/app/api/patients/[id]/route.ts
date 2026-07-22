import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData, isDoctor } from "@/lib/session";
import { patientSchema } from "@/lib/validators";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 50,
          include: {
            practitioner: { select: { name: true, specialty: true } }
          }
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        primaryPractitioner: {
          select: { id: true, name: true, specialty: true }
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 50
            }
          }
        }
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Build Unified Activity Timeline
    const activities: any[] = [];

    // Patient Registered
    activities.push({
      id: `reg-${patient.id}`,
      type: "REGISTERED",
      title: "Patient Registered",
      description: "Patient profile was created in the system.",
      date: patient.createdAt,
    });

    // Appointments
    patient.appointments.forEach((apt) => {
      activities.push({
        id: `apt-${apt.id}`,
        type: "APPOINTMENT",
        title: `Appointment ${apt.status === "CONFIRMED" ? "Confirmed" : apt.status === "CHECKED_IN" ? "Checked In" : apt.status === "COMPLETED" ? "Completed" : apt.status === "CANCELLED" ? "Cancelled" : "No Show"}`,
        description: `With ${apt.practitioner?.name || 'Clinic'}${apt.reason ? ` for ${apt.reason}` : ''}`,
        date: apt.date, // or apt.createdAt if we have it, but apt.date is the clinical event time
        status: apt.status
      });
    });

    // Invoices
    patient.invoices.forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: "INVOICE",
        title: `Invoice Generated (${inv.invoiceNumber})`,
        description: `Amount: $${inv.totalAmount}`,
        date: inv.createdAt,
        status: inv.status
      });

      if (inv.status === "PAID" && inv.updatedAt > inv.createdAt) {
        activities.push({
          id: `pay-${inv.id}`,
          type: "PAYMENT",
          title: `Payment Received`,
          description: `Invoice ${inv.invoiceNumber} was fully paid.`,
          date: inv.updatedAt,
        });
      }
    });

    // WhatsApp Messages (Reviews & Communication)
    patient.conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        // Classify review-related messages
        let title = "WhatsApp Message";
        let type = "WHATSAPP";
        
        if (msg.direction === "OUTGOING") {
          if (msg.content.includes("reply YES")) {
            title = "Review Survey Sent";
            type = "REVIEW_SURVEY";
          } else if (msg.content.includes("leave us a quick review on Google")) {
            title = "Google Review Link Sent";
            type = "REVIEW_LINK";
          }
        } else if (msg.direction === "INCOMING") {
          const textLower = msg.content.trim().toLowerCase();
          const isYes = /^(yes|y|yeah|yep|sure|absolutely|of course|great|good)$/.test(textLower) || textLower.includes("yes");
          const isNo = /^(no|n|nope|nah|never|bad)$/.test(textLower) || textLower.includes("no");
          if (isYes) {
            title = "Positive Review Response";
            type = "REVIEW_POSITIVE";
          } else if (isNo) {
            title = "Negative Review Response";
            type = "REVIEW_NEGATIVE";
          }
        } else if (msg.direction === "INTERNAL_NOTE" && msg.content.includes("🚨 ALERT:")) {
          title = "Internal Alert";
          type = "ALERT";
        }

        activities.push({
          id: `msg-${msg.id}`,
          type: type,
          title: title,
          description: msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content,
          date: msg.createdAt,
          status: msg.direction
        });
      });
    });

    // Sort descending (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      ...patient,
      activityTimeline: activities
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId } = await getSessionData();
    const body = await req.json();
    const validatedData = patientSchema.parse(body);

    const existingPatient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : null,
      },
    });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { doctorId, role } = await getSessionData();

    // Only doctors (or admins) can delete patients
    if (!isDoctor(role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete patients" },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}