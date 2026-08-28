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

    // Check if domain exists in ClinicWebsite table
    const website = await prisma.clinicWebsite.findFirst({
      where: {
        OR: [
          { customDomain: domain },
          { customDomain: domain.replace(/^www\./, "") },
          { customDomain: `www.${domain}` },
        ],
        isPublished: true,
      },
    });

    if (website) {
      // 200 OK authorizes Caddy to issue Let's Encrypt SSL certificate
      return new NextResponse("AUTHORIZED", { status: 200 });
    }

    // 404 refuses certificate issuance to prevent abuse
    return new NextResponse("UNAUTHORIZED_DOMAIN", { status: 404 });
  } catch (error) {
    console.error("[CADDY VERIFY DOMAIN ERROR]:", error);
    return new NextResponse("INTERNAL_ERROR", { status: 500 });
  }
}
