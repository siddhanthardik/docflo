import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, features, isActive } = body;

    if (!name || typeof price !== 'number') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price,
        features,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: any) {
    console.error("Create Package Error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
