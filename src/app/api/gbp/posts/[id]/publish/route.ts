import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GBPService, sanitizeGbpPostSummary } from "@/services/gbp.service";
import { EntitlementService } from "@/services/entitlement.service";
import { getValidGbpAccessToken } from "@/lib/gbp-auth";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const doctorId = session.user.id;

  const requestId = crypto.randomUUID();
  const context = { route: `/api/gbp/posts/${id}/publish`, method: "POST", requestId };

  try {
    await EntitlementService.requireModule(doctorId, "GROWTH_SEO", context);
  } catch (error: any) {
    if (error.status === 403) {
      return NextResponse.json({ success: false, error: "MODULE_NOT_INCLUDED", message: error.message }, { status: 403 });
    }
    throw error;
  }

  try {
    // 1. Fetch target GBP post
    const post = await prisma.gBPPost.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "PUBLISHED") {
      return NextResponse.json({ success: true, post, message: "Post is already live on Google" });
    }

    // 2. Fetch valid GBP OAuth account & access token
    const authResult = await getValidGbpAccessToken(doctorId);

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

    // Pre-flight sanitize content to ensure Google policy compliance
    const { cleanSummary, hadPhone } = sanitizeGbpPostSummary(post.content);
    let effectiveCtaType = post.ctaType || "NONE";
    if (hadPhone && effectiveCtaType === "NONE") {
      effectiveCtaType = "CALL";
    }
    const finalContent = cleanSummary || post.content;

    // 3. Publish to Google Business Profile via API
    const gbpService = new GBPService(accessToken, doctorId);
    const res = await gbpService.createPost(
      fullLocationName,
      finalContent,
      post.postType || "STANDARD",
      post.imageUrl || undefined,
      effectiveCtaType,
      post.ctaLink || undefined
    );

    // 4. Update database status to PUBLISHED
    const updatedPost = await prisma.gBPPost.update({
      where: { id: post.id },
      data: {
        content: finalContent,
        ctaType: effectiveCtaType as any,
        status: "PUBLISHED",
        publishedAt: new Date(),
        gbpPostId: res.name,
        gbpAccountId: account.id,
      },
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    console.error("Error publishing draft post to GBP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish post to Google Business Profile." },
      { status: 400 }
    );
  }
}
