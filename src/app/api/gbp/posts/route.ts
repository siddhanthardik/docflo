import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { GBPService } from "@/services/gbp.service"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
             content, // GBP API uses 'summary' for the actual text content
             postType,
             imageUrl,
             ctaType,
             ctaLink
           );
           gbpPostId = res.name; // Google API returns the resource name
         } catch(e) {
           console.error("GBP API error:", e);
           // Fallback to DRAFT if API fails
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
  
  const posts = await prisma.gBPPost.findMany({
    where: { doctorId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(posts);
}