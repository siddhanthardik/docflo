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

    const { packageId, countryCode, period, promoCode } = await req.json();

    if (!packageId || !countryCode || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let discountPercent = 0;
    let stripeCouponId = null;
    let promoId = null;

    if (promoCode) {
      const promotion = await prisma.promotion.findUnique({
        where: { code: promoCode.toUpperCase() }
      });
      
      if (!promotion || !promotion.isActive || (promotion.expiresAt && promotion.expiresAt < new Date()) || (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit)) {
         return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }
      
      discountPercent = promotion.discountPercent;
      stripeCouponId = promotion.stripeCouponId;
      promoId = promotion.id;
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

      let couponId = stripeCouponId;
      if (discountPercent > 0 && !couponId) {
         try {
           const coupon = await stripe.coupons.create({
              percent_off: discountPercent,
              duration: 'forever',
              name: promoCode.toUpperCase()
           });
           couponId = coupon.id;
         } catch(e) {
           console.error("Stripe coupon creation failed", e);
         }
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
        discounts: couponId ? [{ coupon: couponId }] : undefined,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      });

      if (promoId) {
         await prisma.promotion.update({
            where: { id: promoId },
            data: { usageCount: { increment: 1 } }
         });
      }

      return NextResponse.json({ provider: "stripe", url: checkoutSession.url });
    } else {
      let planId = null;
      if (period === "monthly") planId = packagePrice.razorpayMonthlyPlanId;
      if (period === "quarterly") planId = packagePrice.razorpayQuarterlyPlanId;
      if (period === "yearly") planId = packagePrice.razorpayYearlyPlanId;

      if (!planId) {
        return NextResponse.json({ error: "Plan not configured for this period in Razorpay" }, { status: 400 });
      }

      let finalPlanId = planId;
      if (discountPercent > 0) {
         const amount = period === "monthly" ? packagePrice.priceMonthly : period === "quarterly" ? packagePrice.priceQuarterly : packagePrice.priceYearly;
         const discountedAmount = amount * (1 - discountPercent / 100);
         
         const pkg = await prisma.package.findUnique({ where: { id: packageId } });
         
         const plan = await razorpay.plans.create({
            period: period === "yearly" ? "yearly" : "monthly",
            interval: period === "quarterly" ? 3 : 1,
            item: {
              name: `${pkg?.name || 'Gyrex'} - ${period} - ${discountPercent}% OFF`,
              amount: Math.round(discountedAmount * 100),
              currency: packagePrice.currency.toUpperCase(),
            }
         });
         finalPlanId = plan.id;
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
        plan_id: finalPlanId,
        customer_id: customerId,
        total_count: period === "monthly" ? 120 : period === "quarterly" ? 40 : 10,
        customer_notify: 1,
      } as any)) as any;

      if (promoId) {
         await prisma.promotion.update({
            where: { id: promoId },
            data: { usageCount: { increment: 1 } }
         });
      }

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
