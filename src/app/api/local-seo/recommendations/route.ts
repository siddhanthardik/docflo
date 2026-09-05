import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { AIAgentsService } from "@/services/ai-agents.service";

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
      where: { doctorId, agentType: "LOCAL_SEO_COPILOT" }
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
  const focusStrategy = config.focus || "all"; // "all" (balanced), "prominence" (reviews), "relevancy" (keywords/content)
  const userKeywords = config.keywords
    ? config.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [];

  const primaryCategory = profileData.primaryCategory || insights.primaryCategory || doctor?.specialty || "Obstetrician-gynecologist";
  const secondaryCats: string[] = profileData.categories || insights.categories || [];
  const description: string = profileData.description || insights.description || "";
  const phone: string = profileData.phone || insights.phone || "";
  const website: string = profileData.website || insights.website || "";
  const appointmentUrl: string = profileData.appointmentUrl || insights.appointmentUrl || "";
  const hours = profileData.hours || insights.hours || null;

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
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    impact: string;
  }> = [];

  // 1. Unanswered Reviews (HIGH / CRITICAL)
  if (unansweredCount > 0) {
    tasks.push({
      category: "REVIEWS",
      title: `Reply to ${unansweredCount} Unanswered Patient Reviews`,
      description: `You have ${unansweredCount} patient review${unansweredCount > 1 ? 's' : ''} waiting on Google. Replying with AI keywords boosts local ranking authority and patient trust.`,
      priority: unansweredCount >= 5 ? "CRITICAL" : "HIGH",
      impact: "+18% Local Trust Score",
    });
  }

  // 2. Secondary Category Expansion (HIGH)
  if (secondaryCats.length < 2) {
    const suggested = primaryCategory.toLowerCase().includes("gynaecolog") || primaryCategory.toLowerCase().includes("obstetr")
      ? "Gynecologist, Women's Health Clinic, Maternity Hospital"
      : primaryCategory.toLowerCase().includes("pediat") || primaryCategory.toLowerCase().includes("child")
      ? "Pediatrician, Child Specialist, Vaccination Center"
      : primaryCategory.toLowerCase().includes("derma")
      ? "Dermatologist, Skin Care Clinic, Hair Transplant Clinic"
      : "Medical Clinic, Specialist Health Center";

    tasks.push({
      category: "PROFILE",
      title: "Add Secondary Categories to Google Profile",
      description: `Your profile currently lists ${secondaryCats.length} secondary category. Expand reach by adding: ${suggested}.`,
      priority: "HIGH",
      impact: "+25% Multi-Keyword Reach",
    });
  }

  // 3. Competitor Review Count Gap (HIGH / CRITICAL)
  if (compReviewGap > 20) {
    tasks.push({
      category: "REVIEWS",
      title: `Close the ${compReviewGap} Review Gap vs Top Competitor`,
      description: `Top local competitor (${topCompetitor?.name || 'Nearby Clinic'}) leads with ${topCompetitor?.reviewCount} reviews. Activate Auto-SMS Review Requests to accelerate patient feedback.`,
      priority: compReviewGap > 100 ? "CRITICAL" : "HIGH",
      impact: "+30% Map Pack Rank",
    });
  }

  // 4. Description Optimization (MEDIUM)
  if (!description || description.length < 200) {
    tasks.push({
      category: "PROFILE",
      title: "Expand Clinic Description for Search AI",
      description: `Your business description is short (${description.length} chars). Expand it to 250+ characters with specialty keywords to help Google Gemini index your clinic.`,
      priority: "MEDIUM",
      impact: "+15% AI Search Indexing",
    });
  }

  // 5. Appointment Link (HIGH)
  if (!appointmentUrl) {
    tasks.push({
      category: "PROFILE",
      title: "Add Direct Online Appointment Link",
      description: "Patients searching on Google Maps expect 1-click booking. Add your appointment URL to increase patient conversions.",
      priority: "HIGH",
      impact: "+40% Booking Conversion",
    });
  }

  // 6. Contact & Hours (HIGH)
  if (!phone || !website || !hours) {
    tasks.push({
      category: "PROFILE",
      title: "Complete Core Contact & Schedule Details",
      description: "Ensure phone number, website link, and weekly opening hours are verified to prevent losing open-now searches.",
      priority: "HIGH",
      impact: "+20% Map Pack Visibility",
    });
  }

  // 7. Weekly Google Post targeting user keyword or primary category
  const targetPostKeyword = userKeywords[0] || primaryCategory;
  tasks.push({
    category: "CONTENT",
    title: `Publish GMB Post for "${targetPostKeyword}"`,
    description: `Keep your clinic active on Google Maps. Sharing weekly health updates targeting "${targetPostKeyword}" signals high local relevance and patient engagement.`,
    priority: focusStrategy === "relevancy" ? "HIGH" : "MEDIUM",
    impact: "+15% Local Search Engagement",
  });

  // 8. Custom Target Keyword Optimization Task (if keywords configured)
  if (userKeywords.length > 1) {
    const additionalKeywords = userKeywords.slice(1, 3).join(", ");
    tasks.push({
      category: "SEARCH_RANK",
      title: `Optimize Map Pack Relevancy for "${additionalKeywords}"`,
      description: `Counter-target nearby competitors for ${additionalKeywords}. Incorporate these concepts in patient reviews and Google update updates.`,
      priority: focusStrategy === "relevancy" ? "HIGH" : "MEDIUM",
      impact: "+20% Patient Search Reach",
    });
  }

  // Adjust priorities based on focus strategy
  if (focusStrategy === "prominence") {
    // Elevate all review and competitor gap tasks to top priority
    tasks.forEach(t => {
      if (t.category === "REVIEWS") {
        t.priority = "CRITICAL";
      }
    });
  } else if (focusStrategy === "relevancy") {
    tasks.forEach(t => {
      if (t.category === "PROFILE" || t.category === "CONTENT") {
        if (t.priority !== "CRITICAL") t.priority = "HIGH";
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

    // Auto-generate initial real-data recommendations if 0 tasks exist
    if (recommendations.length === 0) {
      const initialTasks = await generateAlgorithmicTasks(session.doctorId, gbpAccount.id);

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

    // Generate real-data algorithmic tasks
    const freshTasks = await generateAlgorithmicTasks(doctorId, gbpAccount.id);

    // Save to DB (avoid duplicates for existing pending tasks with same title)
    const savedRecs = [];
    for (const task of freshTasks) {
      const existing = await prisma.seoRecommendation.findFirst({
        where: {
          gbpAccountId: gbpAccount.id,
          title: task.title,
          status: "PENDING"
        }
      });

      if (!existing) {
        const created = await prisma.seoRecommendation.create({
          data: {
            gbpAccountId: gbpAccount.id,
            category: task.category,
            title: task.title,
            description: task.description,
            priority: task.priority,
            impact: task.impact,
            status: "PENDING"
          }
        });
        savedRecs.push(created);
      }
    }

    const allRecommendations = await prisma.seoRecommendation.findMany({
      where: { gbpAccountId: gbpAccount.id },
      orderBy: [
        { status: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ recommendations: allRecommendations, newTasksCount: savedRecs.length });
  } catch (error) {
    console.error("POST /api/local-seo/recommendations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
