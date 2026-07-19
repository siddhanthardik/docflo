import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSessionData } from "@/lib/session";
import { entitlementGuard } from "@/lib/withEntitlements";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();

    const block = await entitlementGuard(doctorId, req, { module: "GROWTH_SEO" });
    if (block) return block;

    // Fetch GBP account if connected
    const gbpAccount = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      select: {
        locationName: true,
        insightsData: true,
      },
    });

    if (!gbpAccount) {
      return NextResponse.json({
        connected: false,
        tasks: [],
        score: 0,
      });
    }

    // Fetch latest reviews count
    const totalReviews = await prisma.review.count({ where: { doctorId } });
    const respondedReviews = await prisma.review.count({ where: { doctorId, responded: true } });

    // Basic audit tasks (hardcoded for MVP, can be expanded)
    const tasks = [
      {
        id: "1",
        title: "Complete your business description",
        description: "Add a detailed description with keywords like your specialty, location, and services.",
        completed: !!gbpAccount.locationName, // assume locationName indicates profile is somewhat filled
        priority: "high",
      },
      {
        id: "2",
        title: "Add high‑quality photos",
        description: "Profiles with photos get 42% more direction requests. Add at least 5 photos of your clinic.",
        completed: false, // would need real API to check
        priority: "medium",
      },
      {
        id: "3",
        title: "Respond to all reviews",
        description: `${respondedReviews}/${totalReviews} reviews have replies. Reply to the rest to improve trust.`,
        completed: totalReviews === 0 || respondedReviews === totalReviews,
        priority: "high",
      },
      {
        id: "4",
        title: "Select the right categories",
        description: "Make sure your primary category accurately reflects your practice (e.g., 'Cardiologist').",
        completed: false,
        priority: "high",
      },
      {
        id: "5",
        title: "Keep your opening hours accurate",
        description: "Update your holiday hours and special timings so patients know when to visit.",
        completed: false,
        priority: "medium",
      },
    ];

    const completedCount = tasks.filter(t => t.completed).length;
    const score = Math.round((completedCount / tasks.length) * 100);

    return NextResponse.json({
      connected: true,
      tasks,
      score,
    });
  } catch (error) {
    console.error("SEO audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}