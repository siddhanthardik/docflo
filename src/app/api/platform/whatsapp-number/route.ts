import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: "PLATFORM_WHATSAPP_NUMBER" },
    });

    return NextResponse.json({
      whatsappNumber: flag?.description || "919999999999",
    });
  } catch (error: any) {
    console.error("GET /api/platform/whatsapp-number error:", error);
    return NextResponse.json({ whatsappNumber: "919999999999" });
  }
}
