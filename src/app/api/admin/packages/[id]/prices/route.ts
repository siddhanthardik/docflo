import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPackagePricing } from "@/lib/billing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: packageId } = await params;
    const body = await req.json();
    const { countryCode, currency, priceMonthly, priceQuarterly, priceYearly } = body;

    if (!countryCode || !currency || typeof priceMonthly !== 'number') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packagePrice = await createPackagePricing(
      packageId,
      pkg.name,
      pkg.description || "",
      countryCode,
      currency,
      priceMonthly,
      priceQuarterly || 0,
      priceYearly || 0
    );

    return NextResponse.json(packagePrice, { status: 201 });
  } catch (error: any) {
    console.error("Create Package Price Error:", error);
    return NextResponse.json({ error: "Failed to create package price" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const prices = await prisma.packagePrice.findMany({
      where: { packageId: id },
    });

    return NextResponse.json(prices);
  } catch (error: any) {
    console.error("Get Package Prices Error:", error);
    return NextResponse.json({ error: "Failed to fetch package prices" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const priceId = url.searchParams.get('id');

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    await prisma.packagePrice.delete({
      where: { id: priceId }
    });

    const updatedPackage = await prisma.package.findUnique({
      where: { id: id },
      include: { prices: true }
    });

    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    console.error("Delete Package Price Error:", error);
    return NextResponse.json({ error: "Failed to delete package price" }, { status: 500 });
  }
}
