import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Invalid configuration or missing signature" }, { status: 400 });
  }

  // Verify Signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  const eventId = req.headers.get("x-razorpay-event-id") || `rzp_${Date.now()}_${Math.random()}`;

  // Deduplicate
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return NextResponse.json({ received: true, msg: "Already processed" });
    }

    await prisma.webhookEvent.create({
      data: {
        eventId,
        gateway: "RAZORPAY",
        eventType: event.event,
        payload: event as any,
      },
    });
  } catch (err) {
    console.warn("Could not save razorpay webhook event for deduplication", err);
  }

  try {
    switch (event.event) {
      case "subscription.charged": {
        const subscription = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        
        const customerId = subscription.customer_id;
        const doctor = await prisma.doctor.findFirst({ where: { razorpayCustomerId: customerId } });
        if (!doctor) break;

        // Extract expiry date from current_end (timestamp)
        const expiryDate = new Date(subscription.current_end * 1000);

        await prisma.doctor.update({
          where: { id: doctor.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionExpiry: expiryDate,
            razorpaySubscriptionId: subscription.id,
          },
        });

        // Record Transaction
        await prisma.paymentTransaction.create({
          data: {
            doctorId: doctor.id,
            packageId: doctor.packageId || "",
            amount: payment.amount / 100,
            currency: payment.currency,
            status: "SUCCESS",
            razorpayPaymentId: payment.id,
          },
        });

        await sendPaymentSuccessEmail(
          doctor.email,
          doctor.name || "Doctor",
          "Your Gyrex Plan",
          `${payment.currency} ${payment.amount / 100}`
        );

        await prisma.notification.create({
          data: {
            doctorId: doctor.id,
            title: "Payment Successful",
            message: `Your subscription renewed successfully for ${payment.currency} ${payment.amount / 100}.`,
            type: "BILLING",
          },
        });
        break;
      }

      case "subscription.halted":
      case "subscription.pending": {
        const subscription = event.payload.subscription.entity;
        const customerId = subscription.customer_id;
        const doctor = await prisma.doctor.findFirst({ where: { razorpayCustomerId: customerId } });
        if (!doctor) break;

        await prisma.doctor.update({
          where: { id: doctor.id },
          data: { subscriptionStatus: "PAST_DUE" },
        });

        const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;
        await sendPaymentFailedEmail(
          doctor.email,
          doctor.name || "Doctor",
          "Your Gyrex Plan",
          actionUrl
        );

        await prisma.notification.create({
          data: {
            doctorId: doctor.id,
            title: "Payment Failed",
            message: "Your subscription payment failed. Please update your payment method to avoid interruption.",
            type: "ERROR",
            actionUrl,
          },
        });
        break;
      }

      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        const customerId = subscription.customer_id;
        const doctor = await prisma.doctor.findFirst({ where: { razorpayCustomerId: customerId } });
        if (!doctor) break;

        await prisma.doctor.update({
          where: { id: doctor.id },
          data: { subscriptionStatus: "CANCELED" },
        });

        await prisma.notification.create({
          data: {
            doctorId: doctor.id,
            title: "Subscription Cancelled",
            message: "Your subscription has been cancelled.",
            type: "INFO",
          },
        });
        break;
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Razorpay webhook:", err);
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processingError: err.message },
    });
    return NextResponse.json({ error: "Processing Error" }, { status: 500 });
  }
}
