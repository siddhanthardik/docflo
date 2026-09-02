import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logActivity } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists (Platform, Doctor, or Staff)
    const platformUser = await prisma.platformUser.findUnique({ where: { email: cleanEmail } });
    const doctor = await prisma.doctor.findUnique({ where: { email: cleanEmail } });
    const staff = await prisma.staffMember.findUnique({ where: { email: cleanEmail } });

    const userType = platformUser ? "PLATFORM" : doctor ? "CLINIC" : staff ? "STAFF" : "UNKNOWN";
    const userId = platformUser?.id || doctor?.id || staff?.id || cleanEmail;
    const userName = platformUser?.name || doctor?.name || staff?.name;

    // To prevent user enumeration, we always return a success message
    // even if the user is not found.
    if (!platformUser && !doctor && !staff) {
      await logActivity({
        userId,
        userType,
        action: "PASSWORD_RESET_REQUESTED_NOT_FOUND",
        details: { email: cleanEmail }
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
        email: cleanEmail,
        token: hashedToken,
        expiresAt,
      },
    });

    await logActivity({
      userId,
      userType,
      action: "PASSWORD_RESET_TOKEN_GENERATED",
      details: { email: cleanEmail }
    });

    // Send the password reset email via Resend
    await sendPasswordResetEmail(cleanEmail, rawToken, userName);

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
