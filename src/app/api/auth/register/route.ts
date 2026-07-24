import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { logActivity } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Register body received:", body);

    const validatedData = registerSchema.parse(body);

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    try {
      // Find affiliate if ref code provided
      let salesRepId = null;
      if (validatedData.affiliateCode) {
        const affiliate = await prisma.platformUser.findUnique({
          where: { affiliateCode: validatedData.affiliateCode }
        });
        if (affiliate) {
          salesRepId = affiliate.id;
        }
      }

      // Create doctor atomically
      const doctor = await prisma.doctor.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          phone: validatedData.phone,
          specialty: validatedData.specialty,
          clinicName: validatedData.clinicName,
          address: validatedData.address,
          salesRepId,
          practitioners: {
            create: {
              name: validatedData.name,
              email: validatedData.email,
              phone: validatedData.phone,
              specialty: validatedData.specialty,
              isOwner: true,
              isActive: true,
              displayOrder: 0,
              workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              workingHoursStart: "09:00",
              workingHoursEnd: "17:00"
            }
          }
        },
      });

      // Generate Verification Email Token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          email: validatedData.email,
          token: hashedToken,
          expiresAt,
        },
      });

      // Send Verification Email via Resend asynchronously
      sendVerificationEmail(validatedData.email, rawToken, validatedData.name).catch((err) =>
        console.error("Failed to send verification email on register:", err)
      );

      const { password, ...doctorWithoutPassword } = doctor;

      await logActivity({
        userId: doctor.id,
        userType: "CLINIC",
        action: "SIGNUP_SUCCESS",
        details: { email: validatedData.email }
      });

      return NextResponse.json(
        { message: "Registration successful. Please check your email to verify your account.", doctor: doctorWithoutPassword },
        { status: 201 }
      );
    } catch (dbError: any) {
      if (dbError.code === "P2002") {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in or use a different email." },
          { status: 400 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    
    let errorMessage = "An unexpected error occurred during registration. Please try again later.";
    if (error.name === "ZodError") {
      errorMessage = "Invalid registration data provided.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}