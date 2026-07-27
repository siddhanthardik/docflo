import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        reviewAutomationEnabled: true,
        reviewCooldownDays: true,
        reviewDelayMinutes: true,
        reviewSurveyMessage: true,
        reviewGoogleInvitationMessage: true,
        enableBookingConfirmation: true,
        enable24hReminder: true,
        enable2hReminder: true,
        enableGoogleReviewAutoDispatch: true,
        enableInvoiceMessages: true,
        enablePaymentReceipts: true,
        enableAIAutoResponder: true,
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
    const { doctorId } = await getSessionData();
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        reviewAutomationEnabled: body.reviewAutomationEnabled ?? true,
        reviewCooldownDays: body.reviewCooldownDays ?? 90,
        reviewDelayMinutes: body.reviewDelayMinutes ?? 45,
        reviewSurveyMessage: body.reviewSurveyMessage || null,
        reviewGoogleInvitationMessage: body.reviewGoogleInvitationMessage || null,
        enableBookingConfirmation: body.enableBookingConfirmation ?? true,
        enable24hReminder: body.enable24hReminder ?? true,
        enable2hReminder: body.enable2hReminder ?? false,
        enableGoogleReviewAutoDispatch: body.enableGoogleReviewAutoDispatch ?? true,
        enableInvoiceMessages: body.enableInvoiceMessages ?? true,
        enablePaymentReceipts: body.enablePaymentReceipts ?? true,
        enableAIAutoResponder: body.enableAIAutoResponder ?? true,
      },
      select: {
        reviewAutomationEnabled: true,
        reviewCooldownDays: true,
        reviewDelayMinutes: true,
        reviewSurveyMessage: true,
        reviewGoogleInvitationMessage: true,
        enableBookingConfirmation: true,
        enable24hReminder: true,
        enable2hReminder: true,
        enableGoogleReviewAutoDispatch: true,
        enableInvoiceMessages: true,
        enablePaymentReceipts: true,
        enableAIAutoResponder: true,
      }
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Failed to update review settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
