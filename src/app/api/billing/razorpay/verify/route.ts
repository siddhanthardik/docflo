import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId, promoCode } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Razorpay secret is not defined in env");
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment is successful, update doctor's subscription
      const updatedDoctor = await prisma.doctor.update({
        where: { id: session.user.id },
        data: {
          packageId: packageId,
          subscriptionStatus: "ACTIVE",
          // Store razorpay details if needed later
          // razorpayCustomerId: razorpay_payment_id 
        },
        include: { package: true }
      });

      // Log the payment transaction
      if (updatedDoctor.package) {
        await prisma.paymentTransaction.create({
          data: {
            doctorId: session.user.id,
            packageId: packageId,
            amount: updatedDoctor.package.priceMonthly || 0,
            currency: "USD",
            status: "SUCCESS",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            promoCode: promoCode || null,
          }
        });
      }

      if (promoCode) {
        await prisma.promotion.update({
          where: { code: promoCode },
          data: { usageCount: { increment: 1 } }
        }).catch(err => console.error("Failed to update promo code usage", err));
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
