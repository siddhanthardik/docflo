import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, description, discountPercent, active, endDate, usageLimit, stripeCouponId } = body;

    if (!code || discountPercent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json({ error: "Promotion code already exists" }, { status: 400 });
    }

    const newPromotion = await prisma.promotion.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountPercent: Number(discountPercent),
        isActive: active !== undefined ? active : true,
        expiresAt: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        stripeCouponId: stripeCouponId || null,
      },
    });

    return NextResponse.json(newPromotion, { status: 201 });
  } catch (error: any) {
    console.error("Create Promotion Error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
