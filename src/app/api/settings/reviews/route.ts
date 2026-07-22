import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: {
        reviewAutomationEnabled: true,
        reviewCooldownDays: true,
        reviewDelayMinutes: true,
        reviewSurveyMessage: true,
        reviewGoogleInvitationMessage: true,
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Failed to fetch review settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const doctor = await prisma.doctor.update({
      where: { id: session.user.id },
      data: {
        reviewAutomationEnabled: body.reviewAutomationEnabled,
        reviewCooldownDays: body.reviewCooldownDays,
        reviewDelayMinutes: body.reviewDelayMinutes,
        reviewSurveyMessage: body.reviewSurveyMessage || null,
        reviewGoogleInvitationMessage: body.reviewGoogleInvitationMessage || null,
      },
      select: {
        reviewAutomationEnabled: true,
        reviewCooldownDays: true,
        reviewDelayMinutes: true,
        reviewSurveyMessage: true,
        reviewGoogleInvitationMessage: true,
      }
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Failed to update review settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
