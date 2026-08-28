import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawDomain = searchParams.get("domain") || searchParams.get("host") || "";

    if (!rawDomain) {
      return new NextResponse("Domain parameter required", { status: 400 });
    }

    const domain = rawDomain.toLowerCase().trim();

    // 1. Allow root platform domain, www, and domains
    if (domain === "gyrex.in" || domain === "www.gyrex.in" || domain === "domains.gyrex.in") {
      return new NextResponse("AUTHORIZED_PLATFORM", { status: 200 });
    }

    // 2. Handle *.gyrex.in clinic subdomains (e.g. dr-vinay-kumar-rai.gyrex.in)
    if (domain.endsWith(".gyrex.in")) {
      const sub = domain.replace(/\.gyrex\.in$/, "").trim();
      const website = await prisma.clinicWebsite.findFirst({
        where: {
          subdomain: sub,
          isPublished: true,
        },
      });

      if (website) {
        return new NextResponse("AUTHORIZED_SUBDOMAIN", { status: 200 });
      }
    }

    // 3. Handle external custom branded domains (e.g. www.drvinaykumar.com)
    const customWebsite = await prisma.clinicWebsite.findFirst({
      where: {
        OR: [
          { customDomain: domain },
          { customDomain: domain.replace(/^www\./, "") },
          { customDomain: `www.${domain}` },
        ],
        isPublished: true,
      },
    });

    if (customWebsite) {
      return new NextResponse("AUTHORIZED_CUSTOM_DOMAIN", { status: 200 });
    }

    // 404 refuses certificate issuance to prevent abuse
    return new NextResponse("UNAUTHORIZED_DOMAIN", { status: 404 });
  } catch (error) {
    console.error("[CADDY VERIFY DOMAIN ERROR]:", error);
    return new NextResponse("INTERNAL_ERROR", { status: 500 });
  }
}
