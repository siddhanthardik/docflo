import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
      select: { razorpaySubscriptionId: true },
    });

    if (!doctor?.razorpaySubscriptionId) {
      return NextResponse.json(
        { error: "No active Razorpay subscription found for this account." },
        { status: 404 }
      );
    }

    // Fetch subscription details directly from Razorpay SDK to get short_url
    const subscription = await razorpay.subscriptions.fetch(doctor.razorpaySubscriptionId);

    const shortUrl = (subscription as any).short_url || (subscription as any).sub_link;

    if (!shortUrl) {
      return NextResponse.json(
        { error: "Razorpay payment update link is not available yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      updateUrl: shortUrl,
    });
  } catch (error: any) {
    console.error("GET /api/billing/razorpay/update-link error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Razorpay payment update link." },
      { status: 500 }
    );
  }
}
