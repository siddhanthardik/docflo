import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["DOCTOR", "ADMIN", "MANAGER", "RECEPTIONIST"];

export async function GET() {
  try {
    const { doctorId, role, isSuperAdmin, isImpersonating } = await getSessionData();

    if (!isSuperAdmin && !isImpersonating && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access AI agents." },
        { status: 403 }
      );
    }

    // Fetch the doctor with package, modules, and packageFeatures
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { 
        package: {
          include: {
            modules: true,
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
    const pkgSlug = (doctor.package?.slug || "").toLowerCase();
    const hasExplicitExpiry = Boolean(doctor.subscriptionExpiry);
    const isExpiryInFuture = hasExplicitExpiry ? new Date(doctor.subscriptionExpiry!) > new Date() : false;
    const isWithin14Days = doctor.createdAt 
      ? (Date.now() - new Date(doctor.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000) 
      : false;
    const isTrialActive = isExpiryInFuture || (!hasExplicitExpiry && isWithin14Days);

    const hasPaidPackage = Boolean(
      doctor.package && 
      !pkgName.includes("FREE") && 
      pkgSlug !== "free" && 
      doctor.subscriptionStatus !== "CANCELED" &&
      (!hasExplicitExpiry || isExpiryInFuture)
    );

    const hasModule = (modName: string) => {
      return doctor.package?.modules?.some((m: any) => m.moduleName === modName) ?? false;
    };

    const isFeatureEnabled = (key: string) => {
      const feat = doctor.package?.packageFeatures?.find(pf => pf.feature?.key === key);
      return feat?.isEnabled ?? false;
    };

    const isSuperOrImpersonating = Boolean(isSuperAdmin || isImpersonating);

    // Agent access logic (Trial active or valid package / modules grant access)
    const hasAppointmentAccess = isSuperOrImpersonating || isTrialActive || (
      hasPaidPackage && (
        hasModule("AI_ASSISTANT") ||
        pkgName.includes("PREMIUM") || 
        pkgName.includes("ENTERPRISE") || 
        pkgName.includes("AUTOPILOT") || 
        pkgSlug.includes("premium") || 
        pkgSlug.includes("enterprise") || 
        isFeatureEnabled("AI_RECEPTIONIST")
      )
    );

    const hasReviewAccess = isSuperOrImpersonating || isTrialActive || hasPaidPackage || isFeatureEnabled("AI_REVIEW_REPLY") || hasModule("GROWTH_SEO");
    const hasPostAccess = isSuperOrImpersonating || isTrialActive || (hasPaidPackage && (hasModule("GROWTH_SEO") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || isFeatureEnabled("AI_POST_CREATOR")));
    const hasSeoAccess = isSuperOrImpersonating || isTrialActive || hasPaidPackage || isFeatureEnabled("AI_SEO_COPILOT") || hasModule("GROWTH_SEO");

    const isAllowedMap: Record<string, { isAllowed: boolean; requiredPackage: string }> = {
      APPOINTMENT: {
        isAllowed: hasAppointmentAccess,
        requiredPackage: "PREMIUM"
      },
      REVIEW: {
        isAllowed: hasReviewAccess,
        requiredPackage: "STARTER"
      },
      POST_CREATION: {
        isAllowed: hasPostAccess,
        requiredPackage: "GROWTH"
      },
      PROFILE: {
        isAllowed: hasPostAccess,
        requiredPackage: "GROWTH"
      },
      LOCAL_SEO_COPILOT: {
        isAllowed: hasSeoAccess,
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
    const { doctorId, role, isSuperAdmin, isImpersonating, userId } = await getSessionData();

    if (!isSuperAdmin && !isImpersonating && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Forbidden: Only doctors, managers, receptionists, and authorized admins can modify AI agents." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { agentType, enabled, config } = body;

    if (!agentType) {
      return NextResponse.json({ error: "Agent type is required" }, { status: 400 });
    }

    // Check doctor's package entitlement before enabling
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { 
        package: { 
          include: { 
            modules: true,
            packageFeatures: { include: { feature: true } } 
          } 
        } 
      }
    });

    const pkgName = (doctor?.package?.name || "").toUpperCase();
    const pkgSlug = (doctor?.package?.slug || "").toLowerCase();
    const hasExplicitExpiry = Boolean(doctor?.subscriptionExpiry);
    const isExpiryInFuture = hasExplicitExpiry ? new Date(doctor!.subscriptionExpiry!) > new Date() : false;
    const isWithin14Days = doctor?.createdAt 
      ? (Date.now() - new Date(doctor.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000) 
      : false;
    const isTrialActive = isExpiryInFuture || (!hasExplicitExpiry && isWithin14Days);

    const hasPaidPackage = Boolean(
      doctor?.package && 
      !pkgName.includes("FREE") && 
      pkgSlug !== "free" && 
      doctor?.subscriptionStatus !== "CANCELED" &&
      (!hasExplicitExpiry || isExpiryInFuture)
    );

    const hasModule = (modName: string) => {
      return doctor?.package?.modules?.some((m: any) => m.moduleName === modName) ?? false;
    };

    const isFeatureEnabled = (key: string) => {
      const feat = doctor?.package?.packageFeatures?.find(pf => pf.feature?.key === key);
      return feat?.isEnabled ?? false;
    };

    const isSuperOrImpersonating = Boolean(isSuperAdmin || isImpersonating);

    let allowed = false;
    let reqPkg = "Premium";
    if (agentType === "APPOINTMENT") {
      allowed = isSuperOrImpersonating || isTrialActive || (
        hasPaidPackage && (
          hasModule("AI_ASSISTANT") ||
          pkgName.includes("PREMIUM") || 
          pkgName.includes("ENTERPRISE") || 
          pkgName.includes("AUTOPILOT") || 
          pkgSlug.includes("premium") || 
          pkgSlug.includes("enterprise") || 
          isFeatureEnabled("AI_RECEPTIONIST")
        )
      );
      reqPkg = "Premium";
    } else if (agentType === "REVIEW") {
      allowed = isSuperOrImpersonating || isTrialActive || hasPaidPackage || isFeatureEnabled("AI_REVIEW_REPLY") || hasModule("GROWTH_SEO");
      reqPkg = "Starter";
    } else if (agentType === "POST_CREATION" || agentType === "PROFILE") {
      allowed = isSuperOrImpersonating || isTrialActive || (hasPaidPackage && (hasModule("GROWTH_SEO") || pkgName.includes("GROWTH") || pkgName.includes("PREMIUM") || isFeatureEnabled("AI_POST_CREATOR")));
      reqPkg = "Growth";
    } else if (agentType === "LOCAL_SEO_COPILOT") {
      allowed = isSuperOrImpersonating || isTrialActive || hasPaidPackage || isFeatureEnabled("AI_SEO_COPILOT") || hasModule("GROWTH_SEO");
      reqPkg = "Starter";
    }

    if (enabled && !allowed) {
      return NextResponse.json({ 
        error: `The ${agentType === "APPOINTMENT" ? "WhatsApp Clinic Receptionist" : agentType} requires the ${reqPkg} package.` 
      }, { status: 403 });
    }

    // 1. Fetch existing agent configuration to guarantee safe deep-merge
    const existingAgent = await prisma.aIAgentConfig.findUnique({
      where: { doctorId_agentType: { doctorId, agentType } }
    });
    const existingConfig: Record<string, any> = (existingAgent?.config as any) || {};

    // 2. Cooldown Guard: AI Receptionist can only be renamed once every 3 months (90 days)
    let updatedAssistantName = existingConfig.assistantName || "Riya";
    let receptionistRenamedAt = existingConfig.receptionistRenamedAt || null;
    let isNameChanging = false;

    if (agentType === "APPOINTMENT" && config && config.assistantName !== undefined) {
      const candidateName = String(config.assistantName).trim();
      const currentName = String(existingConfig.assistantName || "Riya").trim();

      if (candidateName && candidateName.toLowerCase() !== currentName.toLowerCase()) {
        isNameChanging = true;
        // Check 90 days (approx. 3 months) cooldown
        if (receptionistRenamedAt && !isSuperAdmin) {
          const lastRenamedTime = new Date(receptionistRenamedAt).getTime();
          const now = Date.now();
          const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
          const elapsed = now - lastRenamedTime;

          if (elapsed < ninetyDaysMs) {
            const remainingDays = Math.ceil((ninetyDaysMs - elapsed) / (24 * 60 * 60 * 1000));
            const eligibleDate = new Date(lastRenamedTime + ninetyDaysMs).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            return NextResponse.json({
              error: `The AI Receptionist was renamed on ${new Date(receptionistRenamedAt).toLocaleDateString("en-IN")}. It can only be renamed once every 3 months. Next eligible rename date: ${eligibleDate} (in ${remainingDays} days).`
            }, { status: 400 });
          }
        }

        updatedAssistantName = candidateName;
        receptionistRenamedAt = new Date().toISOString();
      }
    }

    // 3. Safe Deep-Merge: Preserve all critical instructions & services from accidental clobbering
    let finalConfig: Record<string, any> = { ...existingConfig };

    if (config !== undefined && config !== null) {
      finalConfig = {
        ...existingConfig,
        ...config,
        // Strictly preserve custom instructions unless explicitly provided by an authorized edit form
        trainingPrompt: config.trainingPrompt !== undefined 
          ? config.trainingPrompt 
          : (existingConfig.trainingPrompt || ""),
        // Strictly preserve clinical services catalog unless explicitly provided
        servicesOffered: config.servicesOffered !== undefined 
          ? config.servicesOffered 
          : (existingConfig.servicesOffered || ""),
        // Strictly preserve vaccinations catalog unless explicitly provided
        vaccinationsList: config.vaccinationsList !== undefined 
          ? config.vaccinationsList 
          : (existingConfig.vaccinationsList || ""),
        // Strictly preserve emergency settings
        emergencyTriggers: config.emergencyTriggers !== undefined 
          ? config.emergencyTriggers 
          : (existingConfig.emergencyTriggers || ""),
        emergencyPhone: config.emergencyPhone !== undefined 
          ? config.emergencyPhone 
          : (existingConfig.emergencyPhone || ""),
        // Stamped assistant identity & rename date
        assistantName: updatedAssistantName,
        receptionistRenamedAt: receptionistRenamedAt,
      };
    }

    const agent = await prisma.aIAgentConfig.upsert({
      where: { doctorId_agentType: { doctorId, agentType } },
      update: {
        ...(enabled !== undefined && { enabled }),
        config: finalConfig,
      },
      create: {
        doctorId,
        agentType,
        enabled: enabled ?? false,
        config: finalConfig,
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

    // 4. Record Immutable Audit Log of changes
    const instructionsModified = config?.trainingPrompt !== undefined && config.trainingPrompt !== existingConfig.trainingPrompt;
    const servicesModified = config?.servicesOffered !== undefined && config.servicesOffered !== existingConfig.servicesOffered;

    if (isNameChanging || instructionsModified || servicesModified || (enabled !== undefined && enabled !== existingAgent?.enabled)) {
      await logActivity({
        userId,
        userType: "CLINIC",
        action: "AI_AGENT_CONFIG_UPDATED",
        details: {
          doctorId,
          agentType,
          userRole: role,
          isImpersonating,
          enabled: enabled ?? existingAgent?.enabled,
          isNameChanging,
          previousAssistantName: existingConfig.assistantName || "Riya",
          newAssistantName: updatedAssistantName,
          instructionsModified,
          servicesModified,
        }
      }).catch(e => console.error("Audit log recording error:", e));
    }

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error("PUT /api/ai-agents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
