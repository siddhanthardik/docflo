import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { AIAgentsService } from "@/services/ai-agents.service";
import { LocalSeoOpportunityService } from "@/services/local-seo-opportunity.service";

export async function generateAlgorithmicTasks(doctorId: string, gbpAccountId: string) {
  const [doctor, account, agentConfig] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { specialty: true, name: true, clinicName: true, city: true }
    }),
    prisma.gbpAccount.findUnique({
      where: { id: gbpAccountId }
    }),
    prisma.aIAgentConfig.findFirst({
      where: {
        doctorId,
        OR: [
          { agentType: "LOCAL_SEO" },
          { agentType: "LOCAL_SEO_COPILOT" },
          { agentType: "RANKING" }
        ]
      }
    })
  ]);

  if (!account) return [];

  const profileSnap = await prisma.profileSnapshot.findFirst({
    where: { gbpAccountId: account.id },
    orderBy: { date: 'desc' }
  });

  const competitorSnap = await prisma.competitorSnapshot.findFirst({
    where: { gbpAccountId: account.id },
    orderBy: { date: 'desc' }
  });

  const insights = (account.insightsData as any) || {};
  const profileData = (profileSnap?.json as any) || {};
  const competitors = (competitorSnap?.json as any[]) || [];

  const config = (agentConfig?.config as any) || {};
  const focusStrategy = config.focus || "all";
  const userKeywords = config.keywords
    ? config.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [];

  const primaryCategory = profileData.primaryCategory || insights.primaryCategory || doctor?.specialty || "Medical Clinic";

  // Unanswered reviews count
  const unansweredCount = await prisma.review.count({
    where: { doctorId, responded: false }
  });

  // Total reviews count & competitor gap
  const totalReviews = await prisma.review.count({
    where: { doctorId }
  });

  const topCompetitor = competitors.filter(c => !c.isYou).sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))[0];
  const compReviewGap = topCompetitor ? Math.max(0, (topCompetitor.reviewCount || 0) - totalReviews) : 0;

  const tasks: Array<{
    category: string;
    title: string;
    description: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    impact: string;
  }> = [];

  // 1. Unanswered Reviews
  if (unansweredCount > 0) {
    tasks.push({
      category: "REVIEWS",
      title: `Reply to ${unansweredCount} unanswered patient review${unansweredCount > 1 ? 's' : ''}`,
      description: `You have ${unansweredCount} patient review${unansweredCount > 1 ? 's' : ''} awaiting response on Google. Timely responses show attentiveness and improve your local profile engagement.`,
      priority: unansweredCount >= 5 ? "HIGH" : "MEDIUM",
      impact: "Builds patient trust & improves profile engagement",
    });
  }

  // 2. Competitor Review Count Gap
  if (compReviewGap > 20) {
    tasks.push({
      category: "REVIEWS",
      title: "Request reviews from recent patients",
      description: `Top nearby clinic (${topCompetitor?.name || 'Nearby Clinic'}) has ${topCompetitor?.reviewCount} reviews compared to your ${totalReviews}. Request reviews from satisfied patients after consultations to close the gap.`,
      priority: compReviewGap > 100 ? "HIGH" : "MEDIUM",
      impact: "Strengthens search prominence in local map results",
    });
  }

  // 3. Weekly Google Update
  const targetPostKeyword = userKeywords[0] || primaryCategory;
  tasks.push({
    category: "CONTENT",
    title: `Publish a Google update about "${targetPostKeyword}"`,
    description: `Sharing regular clinic announcements or health advice keeps your Google profile active and signals to local patients that your practice is open and engaged.`,
    priority: focusStrategy === "relevancy" ? "HIGH" : "LOW",
    impact: "Maintains an active presence on Google Maps",
  });

  // 4. Custom Target Keyword Optimization
  if (userKeywords.length > 1) {
    const additionalKeywords = userKeywords.slice(1, 3).join(", ");
    tasks.push({
      category: "PROFILE",
      title: `Focus updates on "${additionalKeywords}"`,
      description: `Incorporate mentions of ${additionalKeywords} in your Google Updates and patient reviews to rank higher for these common patient inquiries.`,
      priority: focusStrategy === "relevancy" ? "HIGH" : "MEDIUM",
      impact: "Improves relevance for target patient searches",
    });
  }

  // Adjust priorities based on focus strategy
  if (focusStrategy === "prominence") {
    tasks.forEach(t => {
      if (t.category === "REVIEWS") {
        t.priority = "HIGH";
      }
    });
  } else if (focusStrategy === "relevancy") {
    tasks.forEach(t => {
      if (t.category === "PROFILE" || t.category === "CONTENT") {
        t.priority = "HIGH";
      }
    });
  }

  return tasks;
}

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

    // Auto-generate initial recommendations using opportunity engine if 0 tasks exist
    if (recommendations.length === 0) {
      const evalContext = {
        doctorId: session.doctorId,
        gbpAccountId: gbpAccount.id,
      };
      const initialOpps = await LocalSeoOpportunityService.evaluateAll(evalContext);
      const result = await LocalSeoOpportunityService.reconcileOpportunities(evalContext, initialOpps);
      recommendations = result.allRecommendations;
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

    // Evaluate all growth opportunities across ranking, grid, competitors, reviews, and content
    const evalContext = {
      doctorId,
      gbpAccountId: gbpAccount.id,
    };
    const freshOpps = await LocalSeoOpportunityService.evaluateAll(evalContext);

    // Reconcile deterministically with existing database records
    const result = await LocalSeoOpportunityService.reconcileOpportunities(evalContext, freshOpps);

    return NextResponse.json({
      recommendations: result.allRecommendations,
      newTasksCount: result.createdCount,
    });
  } catch (error) {
    console.error("POST /api/local-seo/recommendations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
