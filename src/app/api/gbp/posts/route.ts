import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { GBPService } from "@/services/gbp.service"
import { EntitlementService } from "@/services/entitlement.service"
import crypto from "crypto"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
    const body = await req.json()
    const { title, content, postType, scheduledDate, imageUrl, ctaType, ctaLink } = body

    const doctorId = session.user.id;

    // Get GBP Account
    const account = await prisma.gbpAccount.findFirst({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });

    let gbpPostId = null;
    let status = scheduledDate ? "SCHEDULED" : "PUBLISHED";
    let publishedAt = scheduledDate ? null : new Date();

    // If publishing now, call GBP API
    if (!scheduledDate && account && account.accessToken && account.insightsData) {
      const insights = account.insightsData as any;
      const locationName = insights.locationName;
      
      if (locationName) {
         try {
           const gbpService = new GBPService(account.accessToken, account.doctorId);
           const res = await gbpService.createPost(
             locationName,
             content,
             postType,
             imageUrl,
             ctaType,
             ctaLink
           );
           gbpPostId = res.name;
         } catch(e) {
           console.error("GBP API error:", e);
           status = "DRAFT";
           publishedAt = null;
         }
      }
    }

    const post = await prisma.gBPPost.create({
      data: {
        doctorId,
        gbpAccountId: account?.id,
        title,
        content,
        postType,
        imageUrl,
        ctaType,
        ctaLink,
        scheduledFor: scheduledDate ? new Date(scheduledDate) : null,
        publishedAt,
        status: status as any,
        gbpPostId,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error saving post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(posts);
}