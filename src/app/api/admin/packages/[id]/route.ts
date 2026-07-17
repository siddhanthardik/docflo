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
    const { name, description, priceMonthly, priceQuarterly, priceYearly, features, isActive } = body;

    let updatedPackage;
    
    if (features) {
      // Use transaction to clear old features and set new ones
      const [_, pkg] = await prisma.$transaction([
        prisma.packageFeature.deleteMany({ where: { packageId: id } }),
        prisma.package.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(priceMonthly !== undefined && { priceMonthly }),
            ...(priceQuarterly !== undefined && { priceQuarterly }),
            ...(priceYearly !== undefined && { priceYearly }),
            ...(isActive !== undefined && { isActive }),
            packageFeatures: {
              create: features.map((f: any) => ({
                featureId: f.featureId,
                isEnabled: f.isEnabled,
                limit: f.limit || null
              }))
            }
          },
        })
      ]);
      updatedPackage = pkg;
    } else {
      updatedPackage = await prisma.package.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(priceMonthly !== undefined && { priceMonthly }),
          ...(priceQuarterly !== undefined && { priceQuarterly }),
          ...(priceYearly !== undefined && { priceYearly }),
          ...(isActive !== undefined && { isActive }),
        },
      });
    }

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
