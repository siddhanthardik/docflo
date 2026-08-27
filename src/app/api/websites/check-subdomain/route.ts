import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "app", "mail", "blog", "support", "billing",
  "webhook", "auth", "team", "affiliate", "affiliates", "status", "gyrex",
  "getgyrex", "help", "pricing", "contact", "terms", "privacy", "refund", "about",
  "login", "register", "signup", "dashboard", "sites", "public", "cdn", "staging"
]);

function sanitizeSubdomain(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSlug = searchParams.get("slug") || searchParams.get("subdomain") || "";
    const excludeDoctorId = searchParams.get("excludeDoctorId") || undefined;

    if (!rawSlug) {
      return NextResponse.json({ available: false, reason: "Please enter a subdomain name." }, { status: 400 });
    }

    const slug = sanitizeSubdomain(rawSlug);

    if (slug.length < 3) {
      return NextResponse.json({
        available: false,
        reason: "Subdomain must be at least 3 characters long.",
        slug,
      });
    }

    if (slug.length > 40) {
      return NextResponse.json({
        available: false,
        reason: "Subdomain cannot exceed 40 characters.",
        slug,
      });
    }

    if (RESERVED_SUBDOMAINS.has(slug)) {
      return NextResponse.json({
        available: false,
        reason: `"${slug}" is a reserved system name. Please choose another name.`,
        slug,
      });
    }

    // Check database
    const existing = await prisma.clinicWebsite.findFirst({
      where: {
        subdomain: slug,
        ...(excludeDoctorId ? { doctorId: { not: excludeDoctorId } } : {}),
      },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: `"${slug}.gyrex.in" is already claimed by another clinic.`,
        slug,
      });
    }

    return NextResponse.json({
      available: true,
      slug,
      formattedSubdomain: `${slug}.gyrex.in`,
      fullUrl: `https://${slug}.gyrex.in`,
    });
  } catch (error: any) {
    console.error("[CHECK SUBDOMAIN ERROR]:", error);
    return NextResponse.json({ error: "Failed to check subdomain availability" }, { status: 500 });
  }
}
