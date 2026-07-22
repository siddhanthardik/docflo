import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logActivity } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    if (doctor?.emailVerified) {
      return NextResponse.json(
        { message: "Your email address is already verified." },
        { status: 200 }
      );
    }

    // Delete any old pending tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email },
    });

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt,
      },
    });

    await logActivity({
      userId: email,
      userType: "UNKNOWN",
      action: "EMAIL_VERIFICATION_SENT",
      details: { email }
    });

    // Send email using Resend Service
    await sendVerificationEmail(email, rawToken, doctor?.name);

    return NextResponse.json(
      { message: "Verification email sent successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RESEND VERIFICATION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again later." },
      { status: 500 }
    );
  }
}
