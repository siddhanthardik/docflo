import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const revalidate = 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const aiUsage = await prisma.aIAgentConfig.count({
      where: { enabled: true }
    });

    const googleProfileUsage = await prisma.gbpAccount.count();
    
    // Also count total WhatsApp templates as an extra usage metric
    const whatsappTemplates = await prisma.whatsAppTemplate.count();

    return NextResponse.json({
      aiUsage,
      googleProfileUsage,
      whatsappTemplates
    });
  } catch (error) {
    console.error("Error fetching usage metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
