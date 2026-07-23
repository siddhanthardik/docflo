import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) throw new Error("Stripe webhook secret not configured");
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe Webhook Signature Verification Failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Deduplicate using WebhookEvent table
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, msg: "Already processed" });
    }

    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        gateway: "STRIPE",
        eventType: event.type,
        payload: event as any,
      },
    });
  } catch (err) {
    console.warn("Could not save webhook event for deduplication", err);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const doctorId = session.client_reference_id;
        if (!doctorId) break;

        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) break;

        // Retrieve subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;
          
          await prisma.doctor.update({
            where: { id: doctorId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionExpiry: new Date(subscription.current_period_end * 1000),
            },
          });

          await prisma.notification.create({
            data: {
              doctorId,
              title: "Subscription Activated",
              message: "Your new subscription is now active.",
              type: "SUCCESS",
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customerEmail = invoice.customer_email;
        if (!customerEmail || invoice.billing_reason !== "subscription_cycle") break;

        const doctor = await prisma.doctor.findUnique({ where: { email: customerEmail } });
        if (!doctor) break;

        // Extend expiry
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string) as any;
        await prisma.doctor.update({
          where: { id: doctor.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionExpiry: new Date(subscription.current_period_end * 1000),
          },
        });

        // Record Transaction
        await prisma.paymentTransaction.create({
          data: {
            doctorId: doctor.id,
            packageId: doctor.packageId || "",
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: "SUCCESS",
          },
        });

        await sendPaymentSuccessEmail(
          doctor.email,
          doctor.name || "Doctor",
          "Your Gyrex Plan",
          `${invoice.currency.toUpperCase()} ${invoice.amount_paid / 100}`,
          invoice.hosted_invoice_url
        );

        await prisma.notification.create({
          data: {
            doctorId: doctor.id,
            title: "Payment Successful",
            message: `Your subscription renewed successfully for ${invoice.currency.toUpperCase()} ${invoice.amount_paid / 100}.`,
            type: "BILLING",
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerEmail = invoice.customer_email;
        if (!customerEmail) break;

        const doctor = await prisma.doctor.findUnique({ where: { email: customerEmail } });
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
            message: "We could not process your latest subscription payment. Please update your payment method.",
            type: "ERROR",
            actionUrl,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        // find doctor by stripe customer id if stored, or we would need to map it. 
        // For now, if we don't have stripeCustomerId in Doctor model (we should add it if we didn't). 
        // In schema.prisma it has stripeCustomerId, so let's query it.
        const doctor = await prisma.doctor.findFirst({ where: { stripeCustomerId: customerId } });
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
      where: { eventId: event.id },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing Stripe webhook:", err);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processingError: err.message },
    });
    return NextResponse.json({ error: "Processing Error" }, { status: 500 });
  }
}
