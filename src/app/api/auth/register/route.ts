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

    const normalizedEmail = validatedData.email.trim().toLowerCase();
    const normalizedPassword = validatedData.password.trim();

    // Check if email already exists as a clinic doctor
    const existingDoctor = await prisma.doctor.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } }
    });
    if (existingDoctor) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // Check if email is already registered as a clinic staff member
    const existingStaff = await prisma.staffMember.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: { doctor: { select: { name: true, clinicName: true } } }
    });
    if (existingStaff) {
      const clinicName = existingStaff.doctor?.clinicName || existingStaff.doctor?.name || "your clinic";
      return NextResponse.json(
        { error: `This email is already registered as a staff member for ${clinicName}. Please sign in directly at the login page with your staff credentials.` },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(normalizedPassword, 12);

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

      // Find default Free package
      const freePackage = await prisma.package.findFirst({
        where: {
          OR: [
            { slug: "free" },
            { name: { contains: "Free", mode: "insensitive" } },
            { priceMonthly: 0 }
          ]
        }
      });

      // Calculate 14-day trial expiry
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14);

      // Create doctor atomically
      const doctor = await prisma.doctor.create({
        data: {
          name: validatedData.name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          phone: validatedData.phone,
          specialty: validatedData.specialty,
          clinicName: validatedData.clinicName,
          address: validatedData.address,
          salesRepId,
          packageId: freePackage?.id || null,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiry: trialExpiry,
          practitioners: {
            create: {
              name: validatedData.name.trim(),
              email: normalizedEmail,
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
          email: normalizedEmail,
          token: hashedToken,
          expiresAt,
        },
      });

      // Send Verification Email via Resend asynchronously
      sendVerificationEmail(normalizedEmail, rawToken, validatedData.name.trim()).catch((err) =>
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