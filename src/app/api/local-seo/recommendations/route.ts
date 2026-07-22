import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AIAgentsService } from "@/services/ai-agents.service";
import { EntitlementService } from "@/services/entitlement.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    let gbpAccount;
    if (locationId) {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: session.user.id, id: locationId }
      });
    } else {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: session.user.id },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!gbpAccount) {
      return NextResponse.json({ recommendations: [] });
    }

    const recommendations = await prisma.seoRecommendation.findMany({
      where: { gbpAccountId: gbpAccount.id },
      orderBy: [
        { status: 'desc' }, // PENDING first (P comes after C and D, wait, PENDING is 'PENDING', COMPLETED is 'COMPLETED'. desc means PENDING comes before COMPLETED. But let's just do by createdAt)
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("GET /api/local-seo/recommendations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const doctorId = session.user.id;

    // Check Entitlement (Optional but good practice)
    // const hasAccess = await EntitlementService.hasModule(doctorId, "GROWTH_SEO");
    // if (!hasAccess) {
    //   return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
    // }

    const body = await req.json();
    const { locationId } = body;

    let gbpAccount;
    if (locationId) {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId, id: locationId }
      });
    } else {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!gbpAccount) {
      return NextResponse.json({ error: "No GBP Account found" }, { status: 404 });
    }

    // Get Agent Config
    const agentConfig = await prisma.aIAgentConfig.findUnique({
      where: { doctorId_agentType: { doctorId, agentType: "LOCAL_SEO_COPILOT" } }
    });

    // Gather some dummy profile data summarizing the account for the LLM
    // In a real scenario, this would query recent reviews, profile snapshots, etc.
    const reviewCount = await prisma.review.count({ where: { gbpAccountId: gbpAccount.id } });
    const profileData = {
      locationName: gbpAccount.locationName,
      totalReviews: reviewCount,
      hasRecentPosts: true, 
      lastSync: gbpAccount.lastSyncAt,
    };

    const newRecs = await AIAgentsService.runLocalSeoCopilot(profileData, agentConfig?.config || {});
    console.log("Copilot Agent Output:", newRecs);

    // Save to DB
    const savedRecs = await Promise.all(
      (Array.isArray(newRecs) ? newRecs : []).map(async (rec: any) => {
        return prisma.seoRecommendation.create({
          data: {
            gbpAccountId: gbpAccount.id,
            category: rec.category || "PROFILE",
            title: rec.title || "Optimization Task",
            description: rec.description || "",
            priority: rec.priority || "MEDIUM",
            impact: rec.impact || "",
            status: "PENDING"
          }
        });
      })
    );

    return NextResponse.json({ recommendations: savedRecs });
  } catch (error) {
    console.error("POST /api/local-seo/recommendations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
