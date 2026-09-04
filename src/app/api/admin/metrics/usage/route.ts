import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Distinct clinics with at least one enabled AI assistant
    const activeAiClinics = await prisma.aIAgentConfig.findMany({
      where: { enabled: true },
      select: { doctorId: true },
      distinct: ["doctorId"],
    });
    const activeClinicsWithAi = activeAiClinics.length;

    // 2. Total active AI assistant configurations
    const totalAiConfigs = await prisma.aIAgentConfig.count({
      where: { enabled: true },
    });

    const googleProfileUsage = await prisma.gbpAccount.count();
    
    // Also count total WhatsApp templates as an extra usage metric
    const whatsappTemplates = await prisma.whatsAppTemplate.count();

    return NextResponse.json({
      aiUsage: activeClinicsWithAi,
      activeClinicsWithAi,
      totalAiConfigs,
      googleProfileUsage,
      whatsappTemplates
    });
  } catch (error) {
    console.error("Error fetching usage metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
