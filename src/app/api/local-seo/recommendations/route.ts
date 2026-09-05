import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionData } from "@/lib/session";
import { AIAgentsService } from "@/services/ai-agents.service";

function getSuggestedCategories(specialtyOrCategory: string): string {
  const s = (specialtyOrCategory || "").toLowerCase();
  if (s.includes("pediat") || s.includes("child")) {
    return "Pediatrician, Children's Health Clinic, Child Specialist";
  }
  if (s.includes("gynaec") || s.includes("gynec") || s.includes("obstetr") || s.includes("women")) {
    return "Gynecologist, Women's Health Clinic, Maternity Hospital";
  }
  if (s.includes("derma") || s.includes("skin") || s.includes("hair")) {
    return "Dermatologist, Skin Care Clinic, Cosmetology Clinic";
  }
  if (s.includes("dent") || s.includes("orthodont") || s.includes("teeth")) {
    return "Dentist, Dental Clinic, Orthodontist";
  }
  if (s.includes("ortho") || s.includes("bone") || s.includes("joint")) {
    return "Orthopedic Surgeon, Bone & Joint Clinic, Sports Medicine Clinic";
  }
  if (s.includes("cardio") || s.includes("heart")) {
    return "Cardiologist, Heart Care Clinic";
  }
  if (s.includes("ent") || s.includes("ear") || s.includes("throat")) {
    return "ENT Specialist, Ear Nose Throat Clinic";
  }
  if (s.includes("ophthal") || s.includes("eye") || s.includes("vision")) {
    return "Ophthalmologist, Eye Care Clinic";
  }
  if (s.includes("physician") || s.includes("general") || s.includes("internal") || s.includes("family")) {
    return "General Physician, Family Doctor, Medical Clinic";
  }
  const cleanName = specialtyOrCategory.replace(/clinic|doctor|specialist/gi, "").trim();
  return `${cleanName || "Specialist"} Clinic, Healthcare Center`;
}

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

  // 2. Secondary Category Expansion
  if (secondaryCats.length < 2) {
    const suggested = getSuggestedCategories(primaryCategory);
    tasks.push({
      category: "PROFILE",
      title: "Add secondary categories to your Google profile",
      description: `Your profile currently lists ${secondaryCats.length === 0 ? "no secondary categories" : "only 1 secondary category"}. Adding relevant categories like ${suggested} helps patients find you for specific clinical services.`,
      priority: "HIGH",
      impact: "Expands search reach for relevant specialties",
    });
  }

  // 3. Competitor Review Count Gap
  if (compReviewGap > 20) {
    tasks.push({
      category: "REVIEWS",
      title: "Request reviews from recent patients",
      description: `Top nearby clinic (${topCompetitor?.name || 'Nearby Clinic'}) has ${topCompetitor?.reviewCount} reviews compared to your ${totalReviews}. Request reviews from satisfied patients after consultations to close the gap.`,
      priority: compReviewGap > 100 ? "HIGH" : "MEDIUM",
      impact: "Strengthens search prominence in local map results",
    });
  }

  // 4. Description Optimization
  if (!description || description.length < 200) {
    tasks.push({
      category: "PROFILE",
      title: "Complete your clinic overview description",
      description: `Your profile description is currently ${description.length ? `brief (${description.length} characters)` : "empty"}. A complete 250+ character overview detailing your clinical specialties, doctor qualifications, and available facilities helps prospective patients choose your practice.`,
      priority: "MEDIUM",
      impact: "Helps patients understand your full scope of care",
    });
  }

  // 5. Appointment Link
  if (!appointmentUrl) {
    tasks.push({
      category: "PROFILE",
      title: "Add an online appointment booking link",
      description: "Patients searching on Google Maps prefer direct booking options. Adding your booking link helps convert profile viewers into booked appointments.",
      priority: "HIGH",
      impact: "Makes it easy for patients to book consultations",
    });
  }

  // 6. Contact & Hours
  if (!phone || !website || !hours) {
    const missing = [!phone && "phone number", !website && "website", !hours && "operating hours"].filter(Boolean).join(", ");
    tasks.push({
      category: "PROFILE",
      title: "Complete essential contact and schedule details",
      description: `Ensure your ${missing || "contact details and consultation schedule"} are verified on Google to prevent patients from calling during closed hours.`,
      priority: "HIGH",
      impact: "Ensures patients can reach and visit your practice",
    });
  }

  // 7. Weekly Google Update
  const targetPostKeyword = userKeywords[0] || primaryCategory;
  tasks.push({
    category: "CONTENT",
    title: `Publish a Google update about "${targetPostKeyword}"`,
    description: `Sharing regular clinic announcements or health advice keeps your Google profile active and signals to local patients that your practice is open and engaged.`,
    priority: focusStrategy === "relevancy" ? "HIGH" : "LOW",
    impact: "Maintains an active presence on Google Maps",
  });

  // 8. Custom Target Keyword Optimization
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

    // Auto-generate initial recommendations if 0 tasks exist
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

    // Save or update tasks
    const savedRecs = [];
    for (const task of freshTasks) {
      // Find matching pending task by title or category/intent
      const existing = await prisma.seoRecommendation.findFirst({
        where: {
          gbpAccountId: gbpAccount.id,
          category: task.category,
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
      } else {
        // Refresh existing task details to remove any legacy robotic text
        await prisma.seoRecommendation.update({
          where: { id: existing.id },
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            impact: task.impact
          }
        });
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
