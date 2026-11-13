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

    const cleanEmail = email.trim().toLowerCase();

    // Check all user types for verification status
    let user = await prisma.doctor.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: { name: true, emailVerified: true },
    });
    if (!user) {
      user = await prisma.staffMember.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        select: { name: true, emailVerified: true },
      });
    }
    if (!user) {
      user = await prisma.platformUser.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        select: { name: true, emailVerified: true },
      });
    }

    if (user?.emailVerified) {
      const res = NextResponse.json(
        { message: "Your email address is already verified.", alreadyVerified: true },
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

    // Delete any old pending tokens for this email
    await prisma.emailVerificationToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email: cleanEmail,
        token: hashedToken,
        expiresAt,
      },
    });

    await logActivity({
      userId: cleanEmail,
      userType: "UNKNOWN",
      action: "EMAIL_VERIFICATION_SENT",
      details: { email: cleanEmail }
    });

    // Send email using Resend Service
    await sendVerificationEmail(cleanEmail, rawToken, user?.name);

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
