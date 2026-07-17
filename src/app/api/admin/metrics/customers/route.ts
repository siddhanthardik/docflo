import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const revalidate = 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const totalCustomers = await prisma.doctor.count();
    
    const activeClinics = await prisma.doctor.count({
      where: { subscriptionStatus: "ACTIVE" }
    });

    const expiredClinics = await prisma.doctor.count({
      where: { subscriptionStatus: { in: ["PAST_DUE", "CANCELED"] } }
    });

    // Trial clinics could be defined as active but on a free package or MRR=0.
    // We'll approximate trial clinics by checking if they don't have a package or if package price is 0
    const trialClinics = await prisma.doctor.count({
      where: {
        subscriptionStatus: "ACTIVE",
        OR: [
          { packageId: null },
          { package: { priceMonthly: 0 } }
        ]
      }
    });

    // Acquisition chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const users = await prisma.doctor.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const monthlyData: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyData[key] = 0;
    }

    users.forEach(u => {
      const key = u.createdAt.toLocaleString('default', { month: 'short' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });

    const acquisitionChart = Object.keys(monthlyData).reverse().map(month => ({
      name: month,
      users: monthlyData[month]
    }));

    return NextResponse.json({
      totalCustomers,
      activeClinics,
      expiredClinics,
      trialClinics,
      acquisitionChart
    });
  } catch (error) {
    console.error("Error fetching customer metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
