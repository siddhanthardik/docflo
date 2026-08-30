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

    // Fetch the doctor with package and packageFeatures
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { 
        package: {
          include: {
            packageFeatures: {
              include: { feature: true }
            }
          }
        } 
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const pkgName = (doctor.package?.name || "").toUpperCase();
    const isTrialActive = doctor.subscriptionExpiry 
      ? new Date(doctor.subscriptionExpiry) > new Date() 
      : (Date.now() - new Date(doctor.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000);

    // Helper to check feature flag or default package rank
    const isFeatureEnabled = (key: string) => {
      const feat = doctor.package?.packageFeatures?.find(pf => pf.feature?.key === key);
      return feat?.isEnabled ?? false;
    };

    // Agent access logic (Trial active or valid package grants access)
    const isAllowedMap: Record<string, { isAllowed: boolean; requiredPackage: string }> = {
      APPOINTMENT: {
        isAllowed: isTrialActive || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_RECEPTIONIST"),
        requiredPackage: "PREMIUM"
      },
      REVIEW: {
        isAllowed: isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_REVIEW_REPLY"),
        requiredPackage: "STARTER"
      },
      POST_CREATION: {
        isAllowed: isTrialActive || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_POST_CREATOR"),
        requiredPackage: "GROWTH"
      },
      PROFILE: {
        isAllowed: isTrialActive || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_POST_CREATOR"),
        requiredPackage: "GROWTH"
      },
      LOCAL_SEO_COPILOT: {
        isAllowed: isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_SEO_COPILOT"),
        requiredPackage: "STARTER"
      }
    };

    // Initialize default agents if they don't exist
    const agentTypes = ["APPOINTMENT", "REVIEW", "POST_CREATION", "LOCAL_SEO_COPILOT"];
    
    const rawAgents = await Promise.all(
      agentTypes.map(async (type) => {
        return prisma.aIAgentConfig.upsert({
          where: { doctorId_agentType: { doctorId, agentType: type } },
          update: {},
          create: { doctorId, agentType: type, enabled: false, config: {} },
        });
      })
    );

    const agents = rawAgents.map(agent => ({
      ...agent,
      isAllowed: isAllowedMap[agent.agentType]?.isAllowed ?? false,
      requiredPackage: isAllowedMap[agent.agentType]?.requiredPackage ?? "PREMIUM"
    }));

    return NextResponse.json({
      hasAccess: true,
      packageName: doctor.package?.name || "Free",
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

    const doctorId = session.user.id;
    const body = await req.json();
    const { agentType, enabled, config } = body;

    if (!agentType) {
      return NextResponse.json({ error: "Agent type is required" }, { status: 400 });
    }

    // Check doctor's package entitlement before enabling
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { package: { include: { packageFeatures: { include: { feature: true } } } } }
    });

    const pkgName = (doctor?.package?.name || "").toUpperCase();
    const isTrialActive = doctor?.subscriptionExpiry 
      ? new Date(doctor.subscriptionExpiry) > new Date() 
      : (doctor?.createdAt ? (Date.now() - new Date(doctor.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000) : false);
    const isFeatureEnabled = (key: string) => {
      const feat = doctor?.package?.packageFeatures?.find(pf => pf.feature?.key === key);
      return feat?.isEnabled ?? false;
    };

    let allowed = false;
    let reqPkg = "Premium";
    if (agentType === "APPOINTMENT") {
      allowed = isTrialActive || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_RECEPTIONIST");
      reqPkg = "Premium";
    } else if (agentType === "REVIEW") {
      allowed = isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_REVIEW_REPLY");
      reqPkg = "Starter";
    } else if (agentType === "POST_CREATION" || agentType === "PROFILE") {
      allowed = isTrialActive || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_POST_CREATOR");
      reqPkg = "Growth";
    } else if (agentType === "LOCAL_SEO_COPILOT") {
      allowed = isTrialActive || pkgName.includes("STARTER") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || pkgName.includes("AUTOPILOT") || pkgName.includes("TRIAL") || isFeatureEnabled("AI_SEO_COPILOT");
      reqPkg = "Starter";
    }

    if (enabled && !allowed) {
      return NextResponse.json({ 
        error: `The ${agentType === "APPOINTMENT" ? "AI Receptionist & Booking Assistant" : agentType} requires the ${reqPkg} package.` 
      }, { status: 403 });
    }

    const agent = await prisma.aIAgentConfig.upsert({
      where: { doctorId_agentType: { doctorId, agentType } },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(config !== undefined && { config }),
      },
      create: {
        doctorId,
        agentType,
        enabled: enabled ?? false,
        config: config ?? {},
      }
    });

    // Synchronize capacity settings directly to Doctor model
    if (agentType === "APPOINTMENT" && config) {
      await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          ...(config.maxDailyAiBookings !== undefined && { maxDailyAiBookings: config.maxDailyAiBookings }),
          ...(config.maxMorningAiBookings !== undefined && { maxMorningAiBookings: config.maxMorningAiBookings }),
          ...(config.maxEveningAiBookings !== undefined && { maxEveningAiBookings: config.maxEveningAiBookings }),
          ...(config.aiSlotPacing !== undefined && { aiSlotPacing: config.aiSlotPacing }),
        }
      }).catch(e => console.warn("Failed to sync capacity to doctor model:", e));
    }

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error("PUT /api/ai-agents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
