import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/subscriptions/shadow-report
 *
 * Returns an aggregated Shadow Mode report from the ShadowEntitlementLog table.
 * Only accessible by SUPERADMIN and ADMIN roles.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

  const [
    totalLogs,
    moduleLogs,
    limitLogs,
    uniqueDoctors,
    avgEvalTime,
    cacheHitCount,
    recentLogs,
    topRoutes,
    topDoctors,
  ] = await Promise.all([
    // Total shadow events
    prisma.shadowEntitlementLog.count({
      where: { timestamp: { gte: sinceDate } }
    }),

    // Module failures
    prisma.shadowEntitlementLog.count({
      where: { timestamp: { gte: sinceDate }, module: { not: null }, limit: null }
    }),

    // Limit failures
    prisma.shadowEntitlementLog.count({
      where: { timestamp: { gte: sinceDate }, limit: { not: null } }
    }),

    // Unique doctors affected
    prisma.shadowEntitlementLog.findMany({
      where: { timestamp: { gte: sinceDate } },
      select: { doctorId: true },
      distinct: ["doctorId"]
    }),

    // Average evaluation time
    prisma.shadowEntitlementLog.aggregate({
      where: { timestamp: { gte: sinceDate } },
      _avg: { evalTimeMs: true }
    }),

    // Cache hit count
    prisma.shadowEntitlementLog.count({
      where: { timestamp: { gte: sinceDate }, cacheHit: true }
    }),

    // Last 50 log entries (most recent first)
    prisma.shadowEntitlementLog.findMany({
      where: { timestamp: { gte: sinceDate } },
      orderBy: { timestamp: "desc" },
      take: 50,
    }),

    // Top routes by failure count
    prisma.shadowEntitlementLog.groupBy({
      by: ["route"],
      where: { timestamp: { gte: sinceDate } },
      _count: { route: true },
      orderBy: { _count: { route: "desc" } },
      take: 10,
    }),

    // Top affected doctors
    prisma.shadowEntitlementLog.groupBy({
      by: ["doctorId"],
      where: { timestamp: { gte: sinceDate } },
      _count: { doctorId: true },
      orderBy: { _count: { doctorId: "desc" } },
      take: 10,
    }),
  ]);

  const cacheHitRate = totalLogs > 0 ? ((cacheHitCount / totalLogs) * 100).toFixed(1) : "0";

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    window: { from: sinceDate.toISOString(), to: new Date().toISOString() },
    summary: {
      totalShadowEvents: totalLogs,
      moduleFails: moduleLogs,
      limitFails: limitLogs,
      uniqueDoctorsAffected: uniqueDoctors.length,
      avgEvalTimeMs: avgEvalTime._avg.evalTimeMs?.toFixed(2) ?? "N/A",
      cacheHitRate: `${cacheHitRate}%`,
    },
    topRoutesByFailures: topRoutes.map(r => ({ route: r.route, count: r._count.route })),
    topAffectedDoctors: topDoctors.map(d => ({ doctorId: d.doctorId, count: d._count.doctorId })),
    recentEvents: recentLogs,
  });
}
