import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ACCOUNTS"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliates = await prisma.platformUser.findMany({
      where: { 
        OR: [
          { role: "AFFILIATE" },
          { role: "SALES" }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        affiliateCode: true,
        commissionPercentage: true,
        kycStatus: true,
        bankDetails: true,
        kycDocuments: true,
        referredDoctors: {
          select: {
            id: true,
            clinicName: true,
            package: { select: { name: true } },
            paymentTransactions: {
              where: { status: "SUCCESS" },
              select: { amount: true }
            }
          }
        },
        affiliatePayouts: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            referenceId: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    const enrichedAffiliates = affiliates.map(affiliate => {
      let totalRevenueGenerated = 0;
      affiliate.referredDoctors.forEach(doc => {
        const revenue = doc.paymentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        totalRevenueGenerated += revenue;
      });

      const totalEarnings = totalRevenueGenerated * ((affiliate.commissionPercentage || 0) / 100);
      const totalPaidOut = affiliate.affiliatePayouts
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingPayout = totalEarnings - totalPaidOut;

      return {
        ...affiliate,
        totalEarnings,
        totalPaidOut,
        pendingPayout,
      };
    });

    return NextResponse.json(enrichedAffiliates);
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ACCOUNTS"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { affiliateId, amount, referenceId, notes } = body;

    if (!affiliateId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId,
        amount: parseFloat(amount),
        status: "PAID",
        paidAt: new Date(),
        referenceId,
        notes,
      }
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error("Error recording payout:", error);
    return NextResponse.json({ error: "Failed to record payout" }, { status: 500 });
  }
}
