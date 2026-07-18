import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, name, email, phone, clinicName } = body;

    if (!requestId || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert to ensure we don't duplicate leads if they submit multiple times for the same request
    const lead = await prisma.auditLead.upsert({
      where: { requestId },
      update: {
        name,
        email,
        phone,
        clinicName
      },
      create: {
        requestId,
        name,
        email,
        phone,
        clinicName,
        status: "NEW"
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Failed to capture audit lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
