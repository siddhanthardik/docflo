import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // Fetch review metrics from the Appointment table
    const stats = await prisma.appointment.groupBy({
      by: ['reviewStatus'],
      where: {
        doctorId,
        status: "COMPLETED" // only completed appointments matter for this funnel
      },
      _count: {
        _all: true
      }
    });

    const metrics = {
      surveySent: 0,
      positiveResponses: 0,
      negativeResponses: 0,
      linkSent: 0,
      cooldownSkipped: 0 // We map reviewRequested = true AND reviewStatus = NOT_SENT as skipped
    };

    stats.forEach(stat => {
      switch (stat.reviewStatus) {
        case "SURVEY_SENT":
          metrics.surveySent += stat._count._all;
          break;
        case "POSITIVE_RESPONSE":
          metrics.positiveResponses += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
        case "NEGATIVE_RESPONSE":
          metrics.negativeResponses += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
        case "LINK_SENT":
          metrics.linkSent += stat._count._all;
          metrics.positiveResponses += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
      }
    });

    // Calculate Cooldown Skipped
    const skipped = await prisma.appointment.count({
      where: {
        doctorId,
        status: "COMPLETED",
        reviewStatus: "NOT_SENT",
        reviewRequested: true
      }
    });
    metrics.cooldownSkipped = skipped;

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch review metrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
