import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Register body received:", body);

    const validatedData = registerSchema.parse(body);
    console.log("Validation passed:", validatedData);

    // Check if user exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    });

    if (existingDoctor) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        specialty: validatedData.specialty,
        clinicName: validatedData.clinicName,
        address: validatedData.address,
      },
    });

    const { password, ...doctorWithoutPassword } = doctor;

    return NextResponse.json(
      { message: "Registration successful", doctor: doctorWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    // Send the error details back so we can see it in the browser if needed
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}