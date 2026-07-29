import { NextResponse } from "next/server";
import { getSessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionData();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const account = await prisma.gbpAccount.findFirst({ where: { doctorId: session.doctorId, lastSyncAt: { not: null } }, orderBy: { updatedAt: 'desc' } });
    if (!account) return NextResponse.json({ error: "No GBP Account connected" }, { status: 400 });

    const reviews = await prisma.review.findMany({
      where: { doctorId: session.doctorId },
      orderBy: { reviewDate: 'desc' }
    });

    const totalReviewCount = reviews.length;
    const averageRating = totalReviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewCount : 0;
    
    // Map to expected format
    const mappedReviews = reviews.map(r => ({
      ...r,
      reviewReply: r.reply ? { comment: r.reply } : (r.responded ? { comment: "Responded" } : null)
    }));

    return NextResponse.json({
      data: {
        averageRating,
        totalReviewCount,
        reviews: mappedReviews,
      },
      source: "Database Live",
      lastUpdated: new Date()
    });
  } catch (error: any) {
    console.error("Reputation API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
