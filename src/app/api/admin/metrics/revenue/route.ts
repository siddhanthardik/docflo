import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic'; // Cache for 60 seconds

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Calculate MRR & ARR separated by currency
    const activeSubscriptions = await prisma.doctor.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      include: {
        package: {
          include: {
            prices: true,
          }
        }
      }
    });

    let inrMrr = 0;
    let usdMrr = 0;

    activeSubscriptions.forEach((doc) => {
      if (!doc.package) return;
      
      const isInternational = doc.country && doc.country !== "IN" && doc.country !== "IND" && doc.country !== "INDIA";
      const inPrice = doc.package.prices?.find((p: any) => p.countryCode === "IN");
      const usPrice = doc.package.prices?.find((p: any) => p.countryCode === "US" || p.countryCode === "GLOBAL");

      let monthlyVal = doc.package.priceMonthly;
      if (doc.billingPeriod === "yearly") {
        monthlyVal = doc.package.priceYearly ? doc.package.priceYearly / 12 : doc.package.priceMonthly * 0.8;
      } else if (doc.billingPeriod === "quarterly") {
        monthlyVal = doc.package.priceQuarterly ? doc.package.priceQuarterly / 3 : doc.package.priceMonthly * 0.9;
      }

      if (isInternational) {
        const usdMonthly = usPrice?.priceMonthly || (monthlyVal > 500 ? Math.round(monthlyVal / 85) : monthlyVal);
        usdMrr += usdMonthly;
      } else {
        const inrMonthly = inPrice?.priceMonthly || monthlyVal;
        inrMrr += inrMonthly;
      }
    });

    const inrArr = inrMrr * 12;
    const usdArr = usdMrr * 12;

    // 2. Calculate Total Revenue separated by currency
    const inrRevenueResult = await prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", currency: "INR" },
      _sum: { amount: true }
    });
    const inrTotalRevenue = inrRevenueResult._sum.amount || 0;

    const usdRevenueResult = await prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", currency: { not: "INR" } },
      _sum: { amount: true }
    });
    const usdTotalRevenue = usdRevenueResult._sum.amount || 0;

    // 3. Last 6 months revenue for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const transactions = await prisma.paymentTransaction.findMany({
      where: { 
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, currency: true, createdAt: true }
    });

    const monthlyData: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyData[key] = 0;
    }

    transactions.forEach(tx => {
      const key = tx.createdAt.toLocaleString('default', { month: 'short' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += tx.amount;
      }
    });

    const revenueChart = Object.keys(monthlyData).reverse().map(month => ({
      name: month,
      revenue: monthlyData[month]
    }));

    return NextResponse.json({
      inr: {
        mrr: Math.round(inrMrr),
        arr: Math.round(inrArr),
        totalRevenue: Math.round(inrTotalRevenue),
      },
      usd: {
        mrr: Math.round(usdMrr),
        arr: Math.round(usdArr),
        totalRevenue: Math.round(usdTotalRevenue),
      },
      mrr: Math.round(inrMrr),
      arr: Math.round(inrArr),
      totalRevenue: Math.round(inrTotalRevenue),
      revenueChart
    });
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
