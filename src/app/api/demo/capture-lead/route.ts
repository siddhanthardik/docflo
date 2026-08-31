import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, clinicName, specialty, assistantName } = body;

    if (!name && !email && !phone) {
      return NextResponse.json({ error: "At least one contact field is required" }, { status: 400 });
    }

    const doctorName = name ? (name.startsWith("Dr.") ? name : `Dr. ${name}`) : "Doctor Lead";

    // Upsert or create marketing lead in AuditLead
    const lead = await prisma.auditLead.create({
      data: {
        name: doctorName,
        email: email ? email.toLowerCase().trim() : null,
        phone: phone ? phone.trim() : null,
        clinicName: clinicName || `${doctorName}'s Clinic`,
        leadSource: "AI_RECEPTIONIST_DEMO",
        landingPage: "/ai-receptionist-demo",
        activities: {
          create: {
            eventType: "DEMO_SIMULATOR_TESTED",
            message: `Doctor configured AI Receptionist (${assistantName || "AI"}) for ${specialty || "General"}`,
            metadata: {
              specialty,
              assistantName,
              consultationMode: "SIMULATOR_AND_QR"
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error: any) {
    console.warn("[CaptureLead] Notice:", error?.message || error);
    // Return success to never block the frontend demo experience
    return NextResponse.json({ success: true });
  }
}
