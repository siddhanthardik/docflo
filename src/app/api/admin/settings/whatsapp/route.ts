import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { key: "PLATFORM_WHATSAPP_NUMBER" },
    });

    return NextResponse.json({
      whatsappNumber: flag?.description || "919999999999",
    });
  } catch (error: any) {
    console.error("GET /api/admin/settings/whatsapp error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { whatsappNumber } = body;

    if (!whatsappNumber) {
      return NextResponse.json({ error: "WhatsApp Number is required" }, { status: 400 });
    }

    const cleanNumber = whatsappNumber.replace(/[^\d]/g, "");

    await prisma.featureFlag.upsert({
      where: { key: "PLATFORM_WHATSAPP_NUMBER" },
      update: { description: cleanNumber, defaultValue: cleanNumber },
      create: {
        name: "Platform WhatsApp Number",
        key: "PLATFORM_WHATSAPP_NUMBER",
        description: cleanNumber,
        type: "NUMBER",
        defaultValue: cleanNumber,
      },
    });

    return NextResponse.json({
      success: true,
      whatsappNumber: cleanNumber,
      message: "Platform WhatsApp number updated successfully!",
    });
  } catch (error: any) {
    console.error("POST /api/admin/settings/whatsapp error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
