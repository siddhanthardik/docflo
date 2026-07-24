import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "AFFILIATE" && session.user.role !== "SALES")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await prisma.platformUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        affiliateCode: true,
        commissionPercentage: true,
        kycStatus: true,
        kycDocuments: true,
        bankDetails: true,
        createdAt: true,
        referredDoctors: {
          select: {
            id: true,
            name: true,
            clinicName: true,
            createdAt: true,
            package: { select: { name: true, priceMonthly: true, priceYearly: true } },
            paymentTransactions: {
              where: { status: "SUCCESS" },
              select: { amount: true, currency: true, createdAt: true }
            }
          },
          orderBy: { createdAt: "desc" }
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

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    // Calculate metrics
    let totalRevenueGenerated = 0;
    const referrals = affiliate.referredDoctors.map(doc => {
      const revenue = doc.paymentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      totalRevenueGenerated += revenue;
      return {
        id: doc.id,
        name: doc.name,
        clinicName: doc.clinicName,
        dateJoined: doc.createdAt,
        package: doc.package?.name || "None",
        revenue,
      };
    });

    const totalEarnings = totalRevenueGenerated * ((affiliate.commissionPercentage || 0) / 100);
    const totalPaidOut = affiliate.affiliatePayouts
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingPayout = totalEarnings - totalPaidOut;

    return NextResponse.json({
      profile: {
        name: affiliate.name,
        email: affiliate.email,
        affiliateCode: affiliate.affiliateCode,
        commissionPercentage: affiliate.commissionPercentage,
        kycStatus: affiliate.kycStatus,
        bankDetails: affiliate.bankDetails,
        kycDocuments: affiliate.kycDocuments,
      },
      metrics: {
        totalSignups: referrals.length,
        totalEarnings,
        totalPaidOut,
        pendingPayout,
      },
      referrals,
      payouts: affiliate.affiliatePayouts
    });
  } catch (error) {
    console.error("Error fetching affiliate data:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate data" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "AFFILIATE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankDetails, kycDocuments } = body;

    const dataToUpdate: any = {};
    if (bankDetails) dataToUpdate.bankDetails = bankDetails;
    if (kycDocuments) {
      dataToUpdate.kycDocuments = kycDocuments;
      dataToUpdate.kycStatus = "PENDING"; // Re-evaluate KYC when documents are updated
    }

    await prisma.platformUser.update({
      where: { id: session.user.id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating affiliate profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
