import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "AFFILIATE" && session.user.role !== "SALES")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await prisma.platformUser.findUnique({
      where: { id: session.user.id },
      include: {
        referredDoctors: {
          include: {
            paymentTransactions: {
              where: { status: "SUCCESS" },
              select: { amount: true }
            }
          }
        },
        affiliatePayouts: true
      }
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    // Verify Indian bank or UPI details are on file
    const bank = (affiliate.bankDetails as any) || {};
    const hasBank = bank.accountNumber && (bank.ifscCode || bank.routingNumber);
    const hasUpi = Boolean(bank.upiId && bank.upiId.trim());

    if (!hasBank && !hasUpi) {
      return NextResponse.json({ 
        error: "Please provide your Bank Account (with IFSC) or UPI ID in Bank & KYC Settings before requesting a payout." 
      }, { status: 400 });
    }

    // Calculate real-time pending balance
    let totalRevenue = 0;
    affiliate.referredDoctors.forEach(doc => {
      doc.paymentTransactions.forEach(tx => {
        totalRevenue += tx.amount || 0;
      });
    });

    const commissionRate = (affiliate.commissionPercentage || 20) / 100;
    const totalEarnings = totalRevenue * commissionRate;
    const totalPaidOut = affiliate.affiliatePayouts
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayout = totalEarnings - totalPaidOut;

    if (pendingPayout < 1000) {
      return NextResponse.json({ 
        error: `Minimum payout threshold is ₹1,000. Your current pending earnings are ₹${Math.max(0, pendingPayout).toLocaleString("en-IN")}.` 
      }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingPending = affiliate.affiliatePayouts.find(p => p.status === "PENDING");
    if (existingPending) {
      return NextResponse.json({ 
        error: `You already have a payout request of ₹${existingPending.amount.toLocaleString("en-IN")} pending review.` 
      }, { status: 400 });
    }

    // Create pending payout record
    const newPayout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: Math.round(pendingPayout * 100) / 100,
        status: "PENDING",
        notes: "Payout requested by partner via portal",
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Payout request submitted successfully. Our accounts team will review and transfer via NEFT/UPI.",
      payout: newPayout 
    });
  } catch (error: any) {
    console.error("Error requesting payout:", error);
    return NextResponse.json({ error: error.message || "Failed to submit payout request" }, { status: 500 });
  }
}
