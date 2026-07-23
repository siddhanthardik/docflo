import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email: session.user.email },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const { packageId, countryCode, period } = await req.json();

    if (!packageId || !countryCode || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const packagePrice = await prisma.packagePrice.findUnique({
      where: {
        packageId_countryCode: {
          packageId,
          countryCode,
        },
      },
    });

    if (!packagePrice) {
      return NextResponse.json({ error: "Pricing not found for this country" }, { status: 404 });
    }

    const isStripe = countryCode !== "IN";

    if (isStripe) {
      let priceId = null;
      if (period === "monthly") priceId = packagePrice.stripeMonthlyPriceId;
      if (period === "quarterly") priceId = packagePrice.stripeQuarterlyPriceId;
      if (period === "yearly") priceId = packagePrice.stripeYearlyPriceId;

      if (!priceId) {
        return NextResponse.json({ error: "Price not configured for this period in Stripe" }, { status: 400 });
      }

      // Create Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: doctor.email,
        client_reference_id: doctor.id,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      });

      return NextResponse.json({ provider: "stripe", url: checkoutSession.url });
    } else {
      let planId = null;
      if (period === "monthly") planId = packagePrice.razorpayMonthlyPlanId;
      if (period === "quarterly") planId = packagePrice.razorpayQuarterlyPlanId;
      if (period === "yearly") planId = packagePrice.razorpayYearlyPlanId;

      if (!planId) {
        return NextResponse.json({ error: "Plan not configured for this period in Razorpay" }, { status: 400 });
      }

      // Ensure doctor has Razorpay Customer ID
      let customerId = doctor.razorpayCustomerId;
      if (!customerId) {
        const customer = await razorpay.customers.create({
          name: doctor.name || "Doctor",
          email: doctor.email,
          contact: doctor.phone || undefined,
        });
        customerId = customer.id;
        await prisma.doctor.update({
          where: { id: doctor.id },
          data: { razorpayCustomerId: customerId },
        });
      }

      // Create Razorpay Subscription
      const subscription = (await razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        total_count: period === "monthly" ? 120 : period === "quarterly" ? 40 : 10,
        customer_notify: 1,
      } as any)) as any;

      return NextResponse.json({
        provider: "razorpay",
        subscriptionId: subscription.id,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}
