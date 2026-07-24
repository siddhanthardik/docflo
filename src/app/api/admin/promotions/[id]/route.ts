import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { code, description, discountPercent, active, endDate, usageLimit, stripeCouponId } = body;

    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
        ...(active !== undefined && { isActive: active }),
        ...(endDate !== undefined && { expiresAt: endDate ? new Date(endDate) : null }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? Number(usageLimit) : null }),
        ...(stripeCouponId !== undefined && { stripeCouponId: stripeCouponId || null }),
      },
    });

    return NextResponse.json(updatedPromotion);
  } catch (error: any) {
    console.error("Update Promotion Error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Instead of hard delete, we just set active to false
    const disabledPromotion = await prisma.promotion.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json(disabledPromotion);
  } catch (error: any) {
    console.error("Delete Promotion Error:", error);
    return NextResponse.json({ error: "Failed to disable promotion" }, { status: 500 });
  }
}
