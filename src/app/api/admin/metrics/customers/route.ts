import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

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

    // Acquisition chart (last 6 months) with safe UTC date boundaries
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

    const users = await prisma.doctor.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const acquisitionChart = monthsList.map(m => {
      const count = users.filter(u => u.createdAt >= m.start && u.createdAt < m.end).length;
      return {
        name: m.name,
        users: count
      };
    });

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
