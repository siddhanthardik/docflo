import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint - no auth required.
 * Returns all active, non-archived packages with their
 * IN-country pricing, modules, and limits.
 * Used by the public landing page pricing section.
 */
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      include: {
        prices: {
          where: { countryCode: "IN" },
          take: 1,
        },
        modules: true,
        limits: true,
        packageFeatures: {
          include: { feature: true },
        },
      },
      orderBy: { priceMonthly: "asc" },
    });

    const result = packages.map((pkg) => {
      const inPrice = pkg.prices[0];
      return {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        priceMonthly: inPrice?.priceMonthly ?? pkg.priceMonthly,
        priceQuarterly: inPrice?.priceQuarterly ?? pkg.priceQuarterly,
        priceYearly: inPrice?.priceYearly ?? pkg.priceYearly,
        currency: inPrice?.currency ?? "INR",
        modules: pkg.modules.map((m: any) => m.moduleName),
        limits: pkg.limits.reduce((acc: Record<string, number>, l: any) => {
          acc[l.limitName] = l.value;
          return acc;
        }, {}),
        features: pkg.packageFeatures
          .filter((f: any) => f.isEnabled)
          .map((f: any) => f.feature?.name ?? ""),
      };
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("[Public Packages API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
