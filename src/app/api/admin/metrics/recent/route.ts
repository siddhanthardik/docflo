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

    const recentActivities = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const latestPayments = await prisma.paymentTransaction.findMany({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { name: true, clinicName: true } },
        package: { select: { name: true } }
      },
      take: 5
    });

    const topClinicsRaw = await prisma.doctor.findMany({
      where: { subscriptionStatus: "ACTIVE" },
      include: { package: true }
    });

    // Calculate MRR for each and sort
    const topClinics = topClinicsRaw
      .map(doc => {
        let mrr = 0;
        if (doc.package) {
          if (doc.billingPeriod === "yearly") mrr = doc.package.priceYearly / 12;
          else if (doc.billingPeriod === "quarterly") mrr = doc.package.priceQuarterly / 3;
          else mrr = doc.package.priceMonthly;
        }
        return {
          id: doc.id,
          name: doc.clinicName || doc.name,
          mrr: Math.round(mrr),
          package: doc.package?.name || "None"
        };
      })
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 5);

    return NextResponse.json({
      recentActivities,
      latestPayments,
      topClinics
    });
  } catch (error) {
    console.error("Error fetching recent metrics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
