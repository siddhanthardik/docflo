import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, clinicName, city, utmSource, utmMedium, utmCampaign } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Doctor Name and WhatsApp Phone Number are required." },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Save lead to AuditLead table
    const lead = await prisma.auditLead.create({
      data: {
        name,
        phone: cleanPhone,
        clinicName: clinicName || name,
        leadSource: utmSource || "meta_ads",
        landingPage: "/audit",
        utmSource: utmSource || "meta",
        utmMedium: utmMedium || "cpc",
        utmCampaign: utmCampaign || "hinglish_ads",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Audit request received! Sending your instant WhatsApp report...",
      leadId: lead.id,
    });
  } catch (error: any) {
    console.error("POST /api/audit error:", error);
    return NextResponse.json(
      { error: "Failed to process lead audit. Please try again." },
      { status: 500 }
    );
  }
}
