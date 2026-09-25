import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionData = await getSessionData();
    if (!sessionData || !sessionData.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = sessionData.doctorId;

    const [stats, positiveFollowUps, negativeFollowUps] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['reviewStatus'],
        where: {
          doctorId,
          status: "COMPLETED" // only completed appointments matter for this funnel
        },
        _count: {
          _all: true
        }
      }),
      prisma.appointmentFollowUp.count({
        where: {
          appointment: { doctorId, status: "COMPLETED" },
          type: "SURVEY_RESPONSE_POSITIVE"
        }
      }),
      prisma.appointmentFollowUp.count({
        where: {
          appointment: { doctorId, status: "COMPLETED" },
          type: "SURVEY_RESPONSE_NEGATIVE"
        }
      })
    ]);

    const metrics = {
      surveySent: 0,
      positiveResponses: positiveFollowUps,
      negativeResponses: negativeFollowUps,
      linkSent: 0,
      cooldownSkipped: 0 // We map reviewRequested = true AND reviewStatus = NOT_SENT as skipped
    };

    let legacyPositive = 0;
    let legacyNegative = 0;

    stats.forEach(stat => {
      switch (stat.reviewStatus) {
        case "SURVEY_SENT":
          metrics.surveySent += stat._count._all;
          break;
        case "POSITIVE_RESPONSE":
          legacyPositive += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
        case "NEGATIVE_RESPONSE":
          legacyNegative += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
        case "LINK_SENT":
          metrics.linkSent += stat._count._all;
          metrics.surveySent += stat._count._all;
          break;
      }
    });

    if (metrics.positiveResponses === 0 && legacyPositive > 0) {
      metrics.positiveResponses = legacyPositive;
    }
    if (metrics.negativeResponses === 0 && legacyNegative > 0) {
      metrics.negativeResponses = legacyNegative;
    }

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
