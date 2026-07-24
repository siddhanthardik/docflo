import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.platformUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        affiliateCode: true,
        commissionPercentage: true,
        kycStatus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only Superadmins can add team members." }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.platformUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    
    let affiliateCode = null;
    if (role === "SALES" || role === "AFFILIATE") {
      affiliateCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      // Ensure unique
      while (await prisma.platformUser.findUnique({ where: { affiliateCode } })) {
        affiliateCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      }
    }

    const newUser = await prisma.platformUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        affiliateCode,
        commissionPercentage: 20.0,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
