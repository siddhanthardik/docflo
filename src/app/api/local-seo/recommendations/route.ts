import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { AIAgentsService } from "@/services/ai-agents.service";

export async function GET(req: Request) {
  try {
    const session = await getSessionData();
    if (!session || !session.doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    let gbpAccount;
    if (locationId) {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: {
          doctorId: session.doctorId,
          OR: [
            { id: locationId },
            { locationId: locationId },
            { locationName: locationId }
          ]
        }
      });
    }
    
    if (!gbpAccount) {
      gbpAccount = await prisma.gbpAccount.findFirst({
        where: { doctorId: session.doctorId },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!gbpAccount) {
      return NextResponse.json({ recommendations: [] });
    }

    let recommendations = await prisma.seoRecommendation.findMany({
      where: { gbpAccountId: gbpAccount.id },
      orderBy: [
        { status: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Auto-generate initial algorithmic recommendations if 0 tasks exist
    if (recommendations.length === 0) {
      const doc = await prisma.doctor.findUnique({ where: { id: session.doctorId }, select: { specialty: true, name: true, clinicName: true } });
      const insights = (gbpAccount.insightsData as any) || {};

      const spec = doc?.specialty || insights.primaryCategory || "Medical Clinic";
      const categoryExample = spec.toLowerCase().includes("pediat") || spec.toLowerCase().includes("child") ? `"Child Specialist", "Pediatric Clinic", or "Vaccination Center"`
        : spec.toLowerCase().includes("derma") || spec.toLowerCase().includes("skin") ? `"Skin Care Clinic", "Dermatologist", or "Laser Clinic"`
        : spec.toLowerCase().includes("denta") || spec.toLowerCase().includes("teeth") ? `"Dental Clinic", "Orthodontist", or "Teeth Whitening"`
        : spec.toLowerCase().includes("gynae") || spec.toLowerCase().includes("women") ? `"Women's Health Clinic", "Maternity Hospital", or "Gynaecologist"`
        : `"Specialist Clinic", "Urgent Care", or "Health Center"`;

      const initialTasks = [
        {
          category: "PROFILE",
          title: "Add Secondary Categories to Google Profile",
          description: `Expand profile reach by adding secondary categories such as ${categoryExample} to rank in multi-keyword patient searches.`,
          priority: "HIGH",
          impact: "+15% Map Pack Visibility",
        },
        {
          category: "REVIEWS",
          title: "Reply to Unanswered Patient Reviews",
          description: "Google rewards active accounts. Replying to patient reviews with relevant healthcare keywords boosts local ranking authority.",
          priority: "HIGH",
          impact: "+12% Local Trust Score",
        },
        {
          category: "CONTENT",
          title: "Publish Weekly Google Business Post",
          description: "Keep your clinic active by sharing health tips or clinic updates once every 7 days.",
          priority: "MEDIUM",
          impact: "+8% Patient Engagement",
        },
        {
          category: "PROFILE",
          title: "Verify Operating & Festival Hours",
          description: "Ensure your clinic's business hours, holiday schedule, and primary phone number are up to date.",
          priority: "MEDIUM",
          impact: "+5% Profile Completeness",
        }
      ];

      for (const task of initialTasks) {
        await prisma.seoRecommendation.create({
          data: {
            gbpAccountId: gbpAccount.id,
            category: task.category,
            title: task.title,
            description: task.description,
            priority: task.priority,
            impact: task.impact,
            status: "PENDING"
          }
        }).catch(e => console.warn("Could not create initial SEO task:", e));
      }

      recommendations = await prisma.seoRecommendation.findMany({
        where: { gbpAccountId: gbpAccount.id },
        orderBy: [
          { status: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("GET /api/local-seo/recommendations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionData();
    if (!session || !session.doctorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const doctorId = session.doctorId;

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
