import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, price, features, isActive } = body;

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    console.error("Update Package Error:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Instead of hard delete, we just set isActive to false
    const disabledPackage = await prisma.package.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json(disabledPackage);
  } catch (error: any) {
    console.error("Delete Package Error:", error);
    return NextResponse.json({ error: "Failed to disable package" }, { status: 500 });
  }
}
