import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { logActivity } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hash the provided token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    const cleanEmail = (email || "").trim().toLowerCase();

    if (!resetRecord || resetRecord.email.trim().toLowerCase() !== cleanEmail || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Validate password
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid password format" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password.trim(), 12);

    // Update user password and mark token as used
    // Try PlatformUser, Doctor, StaffMember
    let updated = false;
    let userId = "";
    let userType: "PLATFORM" | "CLINIC" | "STAFF" | "UNKNOWN" = "UNKNOWN";

    const platformUser = await prisma.platformUser.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } } });
    if (platformUser) {
      await prisma.platformUser.update({ where: { id: platformUser.id }, data: { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null } });
      updated = true;
      userId = platformUser.id;
      userType = "PLATFORM";
    } else {
      const doctor = await prisma.doctor.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } } });
      if (doctor) {
        await prisma.doctor.update({ where: { id: doctor.id }, data: { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null } });
        updated = true;
        userId = doctor.id;
        userType = "CLINIC";
      } else {
        const staff = await prisma.staffMember.findFirst({ where: { email: { equals: cleanEmail, mode: "insensitive" } } });
        if (staff) {
          await prisma.staffMember.update({ where: { id: staff.id }, data: { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null } });
          updated = true;
          userId = staff.id;
          userType = "STAFF";
        }
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    await logActivity({
      userId,
      userType,
      action: "PASSWORD_RESET_SUCCESS",
      details: { email }
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
