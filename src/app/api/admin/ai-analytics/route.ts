import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId"); // Optional filter for specific clinic

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch Lifetime Logs
    const whereClause: any = doctorId ? { doctorId } : {};

    const [totalLifetimeStats, totalMonthStats, logsByDoctor, logsByFeature, recentLogs] = await Promise.all([
      // Lifetime aggregation
      prisma.aiTokenLog.aggregate({
        where: whereClause,
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          estimatedCostInr: true,
        },
        _count: { id: true },
      }),

      // This Month aggregation
      prisma.aiTokenLog.aggregate({
        where: {
          ...whereClause,
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          estimatedCostInr: true,
        },
        _count: { id: true },
      }),

      // Group by Doctor
      prisma.aiTokenLog.groupBy({
        by: ["doctorId"],
        where: whereClause,
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          estimatedCostInr: true,
        },
        _count: { id: true },
        orderBy: {
          _sum: {
            totalTokens: "desc",
          },
        },
        take: 50,
      }),

      // Group by Feature
      prisma.aiTokenLog.groupBy({
        by: ["feature"],
        where: whereClause,
        _sum: {
          totalTokens: true,
          estimatedCostInr: true,
        },
        _count: { id: true },
      }),

      // 10 Recent AI Telemetry events
      prisma.aiTokenLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          doctor: {
            select: { name: true, clinicName: true, email: true },
          },
        },
      }),
    ]);

    // 2. Fetch Doctor details for top clinics
    const doctorIds = logsByDoctor.map((item) => item.doctorId);
    const doctors = await prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      select: {
        id: true,
        name: true,
        clinicName: true,
        email: true,
        currentAiCredits: true,
        package: {
          select: { name: true },
        },
      },
    });

    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    const clinicLeaderboard = logsByDoctor.map((item) => {
      const doc = doctorMap.get(item.doctorId);
      return {
        doctorId: item.doctorId,
        clinicName: doc?.clinicName || doc?.name || "Unknown Clinic",
        doctorName: doc?.name || "",
        email: doc?.email || "",
        packageName: doc?.package?.name || "None",
        totalTokens: item._sum.totalTokens || 0,
        promptTokens: item._sum.promptTokens || 0,
        completionTokens: item._sum.completionTokens || 0,
        estimatedCostInr: Number((item._sum.estimatedCostInr || 0).toFixed(4)),
        requestCount: item._count.id,
      };
    });

    // 3. Feature breakdown with percentages
    const totalFeatureTokens = totalLifetimeStats._sum.totalTokens || 1;
    const featureBreakdown = logsByFeature.map((item) => ({
      feature: item.feature,
      totalTokens: item._sum.totalTokens || 0,
      estimatedCostInr: Number((item._sum.estimatedCostInr || 0).toFixed(4)),
      count: item._count.id,
      percentage: Math.round(((item._sum.totalTokens || 0) / totalFeatureTokens) * 100),
    }));

    // 4. Active clinics count
    const activeAiClinics = await prisma.aiTokenLog.findMany({
      where: { createdAt: { gte: startOfMonth } },
      distinct: ["doctorId"],
      select: { doctorId: true },
    });

    return NextResponse.json({
      summary: {
        totalTokensLifetime: totalLifetimeStats._sum.totalTokens || 0,
        totalCostLifetime: Number((totalLifetimeStats._sum.estimatedCostInr || 0).toFixed(2)),
        totalRequestsLifetime: totalLifetimeStats._count.id || 0,
        totalTokensThisMonth: totalMonthStats._sum.totalTokens || 0,
        totalCostThisMonth: Number((totalMonthStats._sum.estimatedCostInr || 0).toFixed(2)),
        totalRequestsThisMonth: totalMonthStats._count.id || 0,
        activeClinicsThisMonth: activeAiClinics.length,
      },
      clinicLeaderboard,
      featureBreakdown,
      recentLogs,
    });
  } catch (error) {
    console.error("Error fetching AI analytics metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
