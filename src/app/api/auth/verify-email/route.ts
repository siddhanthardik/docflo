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

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user is already verified in the database
    const [alreadyVerifiedDoc, alreadyVerifiedStaff, alreadyVerifiedPlatform] = await Promise.all([
      prisma.doctor.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, select: { emailVerified: true } }),
      prisma.staffMember.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, select: { emailVerified: true } }),
      prisma.platformUser.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, select: { emailVerified: true } })
    ]);

    if (
      alreadyVerifiedDoc?.emailVerified ||
      alreadyVerifiedStaff?.emailVerified ||
      alreadyVerifiedPlatform?.emailVerified
    ) {
      const res = NextResponse.json(
        { message: "Email is already verified.", alreadyVerified: true },
        { status: 200 }
      );
      res.cookies.set("gyrex_email_verified", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });
      return res;
    }

    if (!verificationRecord || verificationRecord.email.trim().toLowerCase() !== cleanEmail || verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const now = new Date();
    await Promise.all([
      prisma.doctor.updateMany({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, data: { emailVerified: now } }),
      prisma.staffMember.updateMany({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, data: { emailVerified: now } }),
      prisma.platformUser.updateMany({ where: { email: { equals: cleanEmail, mode: "insensitive" } }, data: { emailVerified: now } })
    ]);

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

    const res = NextResponse.json(
      { message: "Email verified successfully." },
      { status: 200 }
    );
    res.cookies.set("gyrex_email_verified", "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
