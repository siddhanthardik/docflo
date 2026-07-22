import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { logActivity } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists (Platform, Doctor, or Staff)
    const platformUser = await prisma.platformUser.findUnique({ where: { email } });
    const doctor = await prisma.doctor.findUnique({ where: { email } });
    const staff = await prisma.staffMember.findUnique({ where: { email } });

    const userType = platformUser ? "PLATFORM" : doctor ? "CLINIC" : staff ? "STAFF" : "UNKNOWN";
    const userId = platformUser?.id || doctor?.id || staff?.id || email;

    // To prevent user enumeration, we always return a success message
    // even if the user is not found.
    if (!platformUser && !doctor && !staff) {
      await logActivity({
        userId,
        userType,
        action: "PASSWORD_RESET_REQUESTED_NOT_FOUND",
        details: { email }
      });
      return NextResponse.json(
        { message: "If an account with that email exists, we sent a password reset link." },
        { status: 200 }
      );
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt,
      },
    });

    await logActivity({
      userId,
      userType,
      action: "PASSWORD_RESET_TOKEN_GENERATED",
      details: { email }
    });

    // In a real application, send the email here using rawToken
    console.log(`[DEV MODE] Password reset link for ${email}: http://localhost:3000/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`);

    return NextResponse.json(
      { message: "If an account with that email exists, we sent a password reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
