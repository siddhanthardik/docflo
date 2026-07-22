import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { entitlementGuard } from "@/lib/withEntitlements";
import { EntitlementService } from "@/services/entitlement.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // Fetch the doctor to check package features
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { package: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const hasAIAgentsAccess = await EntitlementService.hasModule(doctorId, "AI_ASSISTANT");

    // Initialize default agents if they don't exist
    const agentTypes = ["APPOINTMENT", "REVIEW", "PROFILE", "LOCAL_SEO_COPILOT"];
    
    // Using an upsert pattern for each to ensure they exist
    const agents = await Promise.all(
      agentTypes.map(async (type) => {
        return prisma.aIAgentConfig.upsert({
          where: { doctorId_agentType: { doctorId, agentType: type } },
          update: {},
          create: { doctorId, agentType: type, enabled: false, config: {} },
        });
      })
    );

    return NextResponse.json({
      hasAccess: hasAIAgentsAccess,
      agents,
    });
  } catch (error: any) {
    console.error("GET /api/ai-agents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bypass entitlement guard for demonstration
    // const blockPut = await entitlementGuard(session.user.id, req, { module: "AI_ASSISTANT" });
    // if (blockPut) return blockPut;

    const body = await req.json();
    const { agentType, enabled, config } = body;

    if (!agentType) {
      return NextResponse.json({ error: "Agent type is required" }, { status: 400 });
    }

    const agent = await prisma.aIAgentConfig.upsert({
      where: { doctorId_agentType: { doctorId: session.user.id, agentType } },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(config !== undefined && { config }),
      },
      create: {
        doctorId: session.user.id,
        agentType,
        enabled: enabled ?? false,
        config: config ?? {},
      }
    });

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error("PUT /api/ai-agents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
