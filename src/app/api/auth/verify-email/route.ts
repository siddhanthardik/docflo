import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logActivity } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationRecord || verificationRecord.email !== email || verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update Doctor record to mark emailVerified
    await prisma.doctor.updateMany({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete used verification token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationRecord.id },
    });

    await logActivity({
      userId: email,
      userType: "CLINIC",
      action: "EMAIL_VERIFICATION_SUCCESS",
      details: { email }
    });

    return NextResponse.json(
      { message: "Email verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
