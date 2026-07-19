import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId, promoCode } = await req.json();

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    // Fetch the package details
    const selectedPackage = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!selectedPackage || !selectedPackage.isActive) {
      return NextResponse.json({ error: "Invalid or inactive package" }, { status: 400 });
    }

    let finalAmount = selectedPackage.priceMonthly;
    let discountPercent = 0;
    let appliedPromoCode = null;

    if (promoCode) {
      const promotion = await prisma.promotion.findUnique({
        where: { code: promoCode.toUpperCase() }
      });

      if (!promotion) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }

      if (!promotion.isActive) {
        return NextResponse.json({ error: "Promo code is inactive" }, { status: 400 });
      }

      if (promotion.expiresAt && new Date() > promotion.expiresAt) {
        return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
      }

      if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      discountPercent = promotion.discountPercent;
      appliedPromoCode = promotion.code;
    }

    // Get the user (doctor)
    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.id },
    });

    if (!doctor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const priceAfterDiscount = finalAmount * (1 - discountPercent / 100);
    const amountInCents = Math.round(priceAfterDiscount * 100);

    if (amountInCents <= 0) {
      // Free package or 100% discount
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { packageId: selectedPackage.id, subscriptionStatus: "ACTIVE" },
      });
      
      revalidateTag(`doctor-package-${doctor.id}`, "default");
      
      // Log $0 payment transaction
      await prisma.paymentTransaction.create({
        data: {
          doctorId: doctor.id,
          packageId: selectedPackage.id,
          amount: 0,
          currency: "USD",
          status: "SUCCESS",
          promoCode: appliedPromoCode || null,
        }
      });
      
      if (appliedPromoCode) {
        await prisma.promotion.update({
          where: { code: appliedPromoCode },
          data: { usageCount: { increment: 1 } }
        });
      }
      
      return NextResponse.json({ success: true, isFree: true });
    }

    const options = {
      amount: amountInCents,
      currency: "USD",
      receipt: `receipt_order_${doctor.id}_${Date.now()}`,
      notes: {
        packageId: selectedPackage.id,
        doctorId: doctor.id,
        promoCode: appliedPromoCode || "",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      promoCode: appliedPromoCode,
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend for Razorpay checkout
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
