import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WhatsAppService } from "@/services/whatsapp.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check local database
    const localTemplates = await prisma.whatsAppTemplate.findMany({
      where: { doctorId: session.user.id },
    });

    return NextResponse.json(localTemplates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whatsappConfig = await prisma.whatsAppConfig.findUnique({
      where: { doctorId: session.user.id },
    });

    if (!whatsappConfig?.isActive) {
      return NextResponse.json(
        { error: "WhatsApp not configured" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const whatsappService = new WhatsAppService(
      whatsappConfig.accessToken!,
      whatsappConfig.phoneNumberId!,
      session.user.id
    );

    const result = await whatsappService.createTemplate(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}