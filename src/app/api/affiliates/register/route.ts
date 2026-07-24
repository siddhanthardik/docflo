import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.platformUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    
    let affiliateCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    while (await prisma.platformUser.findUnique({ where: { affiliateCode } })) {
      affiliateCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    }

    const newUser = await prisma.platformUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "AFFILIATE",
        affiliateCode,
        commissionPercentage: 20.0,
      },
    });

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error("Error registering affiliate:", error);
    return NextResponse.json(
      { error: "Failed to register affiliate" },
      { status: 500 }
    );
  }
}
