import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, email, phone, clinicName, placeId,
      leadSource, landingPage, utmSource, utmMedium, utmCampaign, gclid, fbclid
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Upsert using the unique constraint [phone, placeId]
    // Note: If placeId is null, Prisma's unique constraint handles it based on DB flavor, 
    // but typically it's better to ensure placeId is at least an empty string or explicitly handled if nulls aren't uniquely indexed.
    // Assuming placeId is always passed if available.
    
    // Fallback if placeId is not provided
    const safePlaceId = placeId || "UNKNOWN_LOCATION";

    const lead = await prisma.auditLead.upsert({
      where: {
        phone_placeId: {
          phone,
          placeId: safePlaceId
        }
      },
      update: {
        name,
        email: email || undefined,
        clinicName: clinicName || undefined,
        updatedAt: new Date()
      },
      create: {
        name,
        email,
        phone,
        clinicName,
        placeId: safePlaceId,
        status: "NEW",
        leadSource,
        landingPage,
        utmSource,
        utmMedium,
        utmCampaign,
        gclid,
        fbclid
      }
    });

    // Log the creation activity if it's new (createdAt == updatedAt)
    // Actually upsert updates updatedAt automatically, so we can just log a touch event
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        eventType: "LEAD_CAPTURED",
        message: "Lead information captured or updated from form.",
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Failed to capture audit lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
