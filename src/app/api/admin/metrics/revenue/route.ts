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

    // 1. Calculate MRR & ARR
    const activeSubscriptions = await prisma.doctor.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      include: { package: true }
    });

    let mrr = 0;
    activeSubscriptions.forEach((doc) => {
      if (!doc.package) return;
      if (doc.billingPeriod === "yearly") {
        mrr += doc.package.priceYearly / 12;
      } else if (doc.billingPeriod === "quarterly") {
        mrr += doc.package.priceQuarterly / 3;
      } else {
        mrr += doc.package.priceMonthly;
      }
    });

    const arr = mrr * 12;

    // 2. Calculate Total Revenue
    const revenueResult = await prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true }
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    // 3. Last 6 months revenue for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const transactions = await prisma.paymentTransaction.findMany({
      where: { 
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, createdAt: true }
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
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      totalRevenue: Math.round(totalRevenue),
      revenueChart
    });
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
