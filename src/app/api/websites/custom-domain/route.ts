import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as dns from "dns";

const dnsPromises = dns.promises;

function sanitizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9.-]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const website = await prisma.clinicWebsite.findUnique({
      where: { doctorId },
      select: { customDomain: true, subdomain: true },
    });

    if (!website?.customDomain) {
      return NextResponse.json({ customDomain: null, dnsConfigured: false });
    }

    const domain = website.customDomain;
    let dnsConfigured = false;
    let dnsDetails = { cname: [] as string[], a: [] as string[] };

    try {
      const cnames = await dnsPromises.resolveCname(domain).catch(() => []);
      const aRecords = await dnsPromises.resolve4(domain).catch(() => []);
      dnsDetails = { cname: cnames, a: aRecords };

      // Check if points to gyrex or cname
      if (
        cnames.some((c) => c.includes("gyrex.in")) ||
        aRecords.length > 0
      ) {
        dnsConfigured = true;
      }
    } catch (e) {}

    return NextResponse.json({
      customDomain: domain,
      dnsConfigured,
      dnsDetails,
      subdomainUrl: `https://${website.subdomain}.gyrex.in`,
    });
  } catch (error: any) {
    console.error("[CUSTOM DOMAIN GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch custom domain" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const body = await req.json();
    const rawDomain = body.domain || "";

    if (!rawDomain) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    const domain = sanitizeDomain(rawDomain);

    if (!domain.includes(".") || domain.length < 4) {
      return NextResponse.json({ error: "Please enter a valid domain name (e.g. www.drvinaykumar.com)" }, { status: 400 });
    }

    if (domain.endsWith("gyrex.in")) {
      return NextResponse.json({ error: "Cannot use gyrex.in domain as a custom domain." }, { status: 400 });
    }

    // Check collision across other clinics
    const existing = await prisma.clinicWebsite.findFirst({
      where: {
        customDomain: domain,
        doctorId: { not: doctorId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: `Domain "${domain}" is already connected to another clinic.` }, { status: 400 });
    }

    // Update database
    const website = await prisma.clinicWebsite.update({
      where: { doctorId },
      data: { customDomain: domain },
    });

    // Check DNS status
    let dnsConfigured = false;
    try {
      const cnames = await dnsPromises.resolveCname(domain).catch(() => []);
      const aRecords = await dnsPromises.resolve4(domain).catch(() => []);
      if (cnames.some((c) => c.includes("gyrex.in")) || aRecords.length > 0) {
        dnsConfigured = true;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      customDomain: domain,
      dnsConfigured,
      message: "Custom domain saved! Please ensure DNS CNAME record points to domains.gyrex.in",
    });
  } catch (error: any) {
    console.error("[CUSTOM DOMAIN POST ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to save custom domain" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    await prisma.clinicWebsite.update({
      where: { doctorId },
      data: { customDomain: null },
    });

    return NextResponse.json({ success: true, message: "Custom domain disconnected." });
  } catch (error: any) {
    console.error("[CUSTOM DOMAIN DELETE ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to disconnect custom domain" }, { status: 500 });
  }
}
