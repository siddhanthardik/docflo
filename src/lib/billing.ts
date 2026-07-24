import { stripe } from "./stripe";
import { razorpay } from "./razorpay";
import { prisma } from "./prisma";

export async function createPackagePricing(
  packageId: string,
  packageName: string,
  packageDescription: string,
  countryCode: string,
  currency: string,
  priceMonthly: number,
  priceQuarterly: number,
  priceYearly: number,
  customRazorpayMonthlyPlanId?: string,
  customRazorpayQuarterlyPlanId?: string,
  customRazorpayYearlyPlanId?: string,
  customStripeMonthlyPriceId?: string,
  customStripeQuarterlyPriceId?: string,
  customStripeYearlyPriceId?: string
) {
  let stripeMonthlyPriceId = customStripeMonthlyPriceId || null;
  let stripeQuarterlyPriceId = customStripeQuarterlyPriceId || null;
  let stripeYearlyPriceId = customStripeYearlyPriceId || null;

  let razorpayMonthlyPlanId = customRazorpayMonthlyPlanId || null;
  let razorpayQuarterlyPlanId = customRazorpayQuarterlyPlanId || null;
  let razorpayYearlyPlanId = customRazorpayYearlyPlanId || null;

  const isStripe = countryCode !== "IN";
  const isRazorpay = countryCode === "IN";

  // Create Stripe Prices for Global audiences
  if (isStripe) {
    // Check if Stripe is configured
    if (process.env.STRIPE_SECRET_KEY) {
      const product = await stripe.products.create({
        name: packageName,
        description: packageDescription || "",
        metadata: { packageId },
      });

      if (priceMonthly > 0 && !stripeMonthlyPriceId) {
        const pM = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(priceMonthly * 100), // Stripe expects cents
          currency: currency.toLowerCase(),
          recurring: { interval: "month" },
        });
        stripeMonthlyPriceId = pM.id;
      }

      if (priceQuarterly > 0 && !stripeQuarterlyPriceId) {
        const pQ = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(priceQuarterly * 100),
          currency: currency.toLowerCase(),
          recurring: { interval: "month", interval_count: 3 },
        });
        stripeQuarterlyPriceId = pQ.id;
      }

      if (priceYearly > 0 && !stripeYearlyPriceId) {
        const pY = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(priceYearly * 100),
          currency: currency.toLowerCase(),
          recurring: { interval: "year" },
        });
        stripeYearlyPriceId = pY.id;
      }
    }
  }

  // Create Razorpay Plans for Indian Audience
  if (isRazorpay) {
    if (process.env.RAZORPAY_KEY_SECRET) {
      if (priceMonthly > 0 && !razorpayMonthlyPlanId) {
        const plan = await razorpay.plans.create({
          period: "monthly",
          interval: 1,
          item: {
            name: `${packageName} - Monthly`,
            description: packageDescription || "",
            amount: Math.round(priceMonthly * 100),
            currency: currency.toUpperCase(),
          },
        });
        razorpayMonthlyPlanId = plan.id;
      }

      if (priceQuarterly > 0 && !razorpayQuarterlyPlanId) {
        const plan = await razorpay.plans.create({
          period: "monthly", // Razorpay handles quarterly as monthly period with interval 3 or weekly
          interval: 3,
          item: {
            name: `${packageName} - Quarterly`,
            description: packageDescription || "",
            amount: Math.round(priceQuarterly * 100),
            currency: currency.toUpperCase(),
          },
        });
        razorpayQuarterlyPlanId = plan.id;
      }

      if (priceYearly > 0 && !razorpayYearlyPlanId) {
        const plan = await razorpay.plans.create({
          period: "yearly",
          interval: 1,
          item: {
            name: `${packageName} - Yearly`,
            description: packageDescription || "",
            amount: Math.round(priceYearly * 100),
            currency: currency.toUpperCase(),
          },
        });
        razorpayYearlyPlanId = plan.id;
      }
    }
  }

  // Save to DB
  const packagePrice = await prisma.packagePrice.upsert({
    where: {
      packageId_countryCode: {
        packageId,
        countryCode,
      },
    },
    update: {
      priceMonthly,
      priceQuarterly,
      priceYearly,
      currency,
      stripeMonthlyPriceId,
      stripeQuarterlyPriceId,
      stripeYearlyPriceId,
      razorpayMonthlyPlanId,
      razorpayQuarterlyPlanId,
      razorpayYearlyPlanId,
    },
    create: {
      packageId,
      countryCode,
      currency,
      priceMonthly,
      priceQuarterly,
      priceYearly,
      stripeMonthlyPriceId,
      stripeQuarterlyPriceId,
      stripeYearlyPriceId,
      razorpayMonthlyPlanId,
      razorpayQuarterlyPlanId,
      razorpayYearlyPlanId,
    },
  });

  return packagePrice;
}
