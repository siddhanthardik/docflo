import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WhatsAppService } from "@/services/whatsapp.service";

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
    const { to, templateName, parameters, text, mediaType, mediaUrl, caption } =
      body;

    const whatsappService = new WhatsAppService(
      whatsappConfig.accessToken!,
      whatsappConfig.phoneNumberId!,
      session.user.id
    );

    let result;

    if (templateName) {
      result = await whatsappService.sendTemplateMessage(
        to,
        templateName,
        "en",
        parameters
      );
    } else if (mediaType && mediaUrl) {
      result = await whatsappService.sendMediaMessage(
        to,
        mediaType,
        mediaUrl,
        caption
      );
    } else if (text) {
      result = await whatsappService.sendTextMessage(to, text);
    } else {
      return NextResponse.json(
        { error: "Invalid message payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}