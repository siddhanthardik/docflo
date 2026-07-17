import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.whatsAppConfig.findUnique({
      where: { doctorId: session.user.id },
    });

    return NextResponse.json(config || { isActive: false });
  } catch (error) {
    console.error("Error fetching WhatsApp config:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumberId, businessAccountId, accessToken } = body;

    const config = await prisma.whatsAppConfig.upsert({
      where: { doctorId: session.user.id },
      update: {
        phoneNumberId,
        businessAccountId,
        accessToken,
        isActive: true,
      },
      create: {
        doctorId: session.user.id,
        phoneNumberId,
        businessAccountId,
        accessToken,
        isActive: true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating WhatsApp config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}