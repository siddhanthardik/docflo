import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GBPService, sanitizeGbpPostSummary } from "@/services/gbp.service";
import { EntitlementService } from "@/services/entitlement.service";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestId = crypto.randomUUID();
  const context = { route: "/api/gbp/posts", method: "POST", requestId };

  try {
    await EntitlementService.requireModule(session.user.id, "GROWTH_SEO", context);
    await EntitlementService.requireLimit(session.user.id, "MAX_SCHEDULED_POSTS", context);
  } catch (error: any) {
    if (error.status === 403) {
      return NextResponse.json({ success: false, error: "MODULE_NOT_INCLUDED", message: error.message }, { status: 403 });
    }
    if (error.status === 409) {
      return NextResponse.json({ success: false, error: "LIMIT_EXCEEDED", message: error.message }, { status: 409 });
    }
    throw error;
  }

  try {
    const body = await req.json();
    const { title, content, postType, scheduledDate, imageUrl, ctaType, ctaLink } = body;

    const doctorId = session.user.id;

    // Get valid GBP Account & Access Token (with automatic token refresh if expired)
    const authResult = await getValidGbpAccessToken(doctorId);

    let gbpPostId: string | null = null;
    let status: "DRAFT" | "SCHEDULED" | "PUBLISHED" = scheduledDate ? "SCHEDULED" : "PUBLISHED";
    let publishedAt: Date | null = scheduledDate ? null : new Date();

    // Pre-flight sanitize content to ensure Google policy compliance
    const { cleanSummary, hadPhone } = sanitizeGbpPostSummary(content);
    let effectiveCtaType = ctaType || "NONE";
    if (hadPhone && effectiveCtaType === "NONE") {
      effectiveCtaType = "CALL";
    }
    const finalContent = cleanSummary || content;

    // If publishing live right now, call Google Business Profile API
    if (!scheduledDate) {
      if (!authResult || !authResult.account || !authResult.accessToken) {
        return NextResponse.json(
          { error: "Google Business Profile is not connected. Please connect your Google account under GBP Profile." },
          { status: 400 }
        );
      }

      const { account, accessToken } = authResult;
      const insights = account.insightsData as any;

      if (!insights?.locationName) {
        return NextResponse.json(
          { error: "No clinic location selected for Google Business Profile. Please select a location under GBP Profile." },
          { status: 400 }
        );
      }

      let fullLocationName = insights.locationName;
      if (insights.accountName && !fullLocationName.startsWith("accounts/")) {
        const locPart = fullLocationName.startsWith("locations/") ? fullLocationName : `locations/${fullLocationName}`;
        fullLocationName = `${insights.accountName}/${locPart}`;
      }

      try {
        const gbpService = new GBPService(accessToken, doctorId);
        const res = await gbpService.createPost(
          fullLocationName,
          finalContent,
          postType || "STANDARD",
          imageUrl,
          effectiveCtaType,
          ctaLink
        );
        gbpPostId = res.name;
        status = "PUBLISHED";
        publishedAt = new Date();
      } catch (e: any) {
        console.error("GBP API error during Publish Now:", e);
        return NextResponse.json(
          { error: e.message || "Failed to publish post to Google Business Profile." },
          { status: 400 }
        );
      }
    }

    const post = await prisma.gBPPost.create({
      data: {
        doctorId,
        gbpAccountId: authResult?.account?.id,
        title,
        content: finalContent,
        postType: postType || "STANDARD",
        imageUrl,
        ctaType: effectiveCtaType as any,
        ctaLink,
        scheduledFor: scheduledDate ? new Date(scheduledDate) : null,
        publishedAt,
        status: status as any,
        gbpPostId,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error saving post:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestId = crypto.randomUUID();
  const context = { route: "/api/gbp/posts", method: "GET", requestId };

  try {
    await EntitlementService.requireModule(session.user.id, "GROWTH_SEO", context);
  } catch (error: any) {
    if (error.status === 403) {
      return NextResponse.json({ success: false, error: "MODULE_NOT_INCLUDED", message: error.message }, { status: 403 });
    }
    throw error;
  }
  
  const posts = await prisma.gBPPost.findMany({
    where: { doctorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
  
  return NextResponse.json(posts);
}