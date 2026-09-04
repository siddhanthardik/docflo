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

    // 3. Last 6 months revenue for chart with safe UTC date boundaries
    const now = new Date();
    const monthsList: { key: string; start: Date; end: Date; name: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() - i;
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
      const name = start.toLocaleDateString("en-US", { month: "short" });
      monthsList.push({ key: `${start.getUTCFullYear()}-${start.getUTCMonth()}`, start, end, name });
    }

    const sixMonthsAgo = monthsList[0].start;
    
    const transactions = await prisma.paymentTransaction.findMany({
      where: { 
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, currency: true, createdAt: true }
    });

    const revenueChart = monthsList.map(m => {
      const txsInMonth = transactions.filter(tx => tx.createdAt >= m.start && tx.createdAt < m.end);
      const totalRevenueInMonth = txsInMonth.reduce((sum, tx) => {
        const isUsd = tx.currency && tx.currency !== "INR";
        const amt = isUsd ? tx.amount * 85 : tx.amount;
        return sum + amt;
      }, 0);
      return {
        name: m.name,
        revenue: Math.round(totalRevenueInMonth)
      };
    });

    const totalMrrInr = Math.round(inrMrr + (usdMrr * 85));
    const totalArrInr = Math.round(inrArr + (usdArr * 85));
    const consolidatedTotalRevenue = Math.round(inrTotalRevenue + (usdTotalRevenue * 85));

    return NextResponse.json({
      consolidated: {
        mrr: totalMrrInr,
        arr: totalArrInr,
        totalRevenue: consolidatedTotalRevenue,
      },
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
      mrr: totalMrrInr,
      arr: totalArrInr,
      totalRevenue: consolidatedTotalRevenue,
      revenueChart
    });
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
