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
        createdAt: true,
        referredDoctors: {
          select: {
            id: true,
            clinicName: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            subscriptionStatus: true,
            subscriptionExpiry: true,
            billingPeriod: true,
            package: { select: { id: true, name: true, priceMonthly: true, priceYearly: true } },
            paymentTransactions: {
              where: { status: "SUCCESS" },
              select: { 
                id: true, 
                amount: true,
                currency: true,
                createdAt: true,
                razorpayPaymentId: true,
              },
              orderBy: { createdAt: "desc" }
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
            notes: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const enrichedAffiliates = affiliates.map(affiliate => {
      let totalRevenueGenerated = 0;
      const allTransactions: any[] = [];

      const enrichedDoctors = affiliate.referredDoctors.map(doc => {
        const revenue = doc.paymentTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        totalRevenueGenerated += revenue;

        let subscriptionStatusLabel = "Active";
        if (doc.paymentTransactions.length === 0) {
          const daysSinceJoined = Math.floor((now.getTime() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          subscriptionStatusLabel = daysSinceJoined <= 14 ? "14-Day Free Trial" : "Trial Expired";
        } else if (doc.subscriptionStatus === "CANCELED") {
          subscriptionStatusLabel = "Canceled";
        } else if (doc.subscriptionStatus === "PAST_DUE" || (doc.subscriptionExpiry && new Date(doc.subscriptionExpiry) < now)) {
          subscriptionStatusLabel = "Past Due";
        } else {
          subscriptionStatusLabel = "Active (Paid)";
        }

        doc.paymentTransactions.forEach(tx => {
          allTransactions.push({
            id: tx.id,
            clinicName: doc.clinicName || doc.name || "Clinic",
            doctorName: doc.name,
            amount: tx.amount,
            date: tx.createdAt,
            packageName: doc.package?.name || "Subscription",
            commission: (tx.amount || 0) * ((affiliate.commissionPercentage || 0) / 100),
            razorpayPaymentId: tx.razorpayPaymentId
          });
        });

        return {
          id: doc.id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          clinicName: doc.clinicName,
          dateJoined: doc.createdAt,
          package: doc.package?.name || "None",
          billingPeriod: doc.billingPeriod || "monthly",
          status: subscriptionStatusLabel,
          revenue,
          commission: revenue * ((affiliate.commissionPercentage || 0) / 100),
        };
      });

      const totalEarnings = totalRevenueGenerated * ((affiliate.commissionPercentage || 0) / 100);
      const totalPaidOut = affiliate.affiliatePayouts
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingPayout = Math.max(0, totalEarnings - totalPaidOut);
      const pendingPayoutRequest = affiliate.affiliatePayouts.find(p => p.status === "PENDING") || null;
      
      const bank = (affiliate.bankDetails as any) || {};
      const hasBankingDetails = Boolean(
        (bank.accountNumber && (bank.ifscCode || bank.routingNumber)) || bank.upiId
      );

      return {
        ...affiliate,
        referredDoctors: enrichedDoctors,
        transactions: allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        totalRevenueGenerated,
        totalEarnings,
        totalPaidOut,
        pendingPayout,
        pendingPayoutRequest,
        hasBankingDetails,
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
    const { action, affiliateId, amount, referenceId, notes, name, email, password, commission } = body;

    if (action === "create") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      // Check if user exists
      const existing = await prisma.platformUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }

      const { hash } = await import("bcryptjs");
      const hashedPassword = await hash(password, 10);
      const affiliateCode = `AFF${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser = await prisma.platformUser.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "AFFILIATE",
          affiliateCode,
          commissionPercentage: parseFloat(commission) || 20,
        },
      });

      return NextResponse.json(newUser, { status: 201 });
    }

    // Default to payout if no action specified (for backwards compatibility)
    if (!affiliateId || !amount) {
      return NextResponse.json({ error: "Missing required fields for payout" }, { status: 400 });
    }

    const existingPending = await prisma.affiliatePayout.findFirst({
      where: { affiliateId, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    let payout;
    if (existingPending) {
      payout = await prisma.affiliatePayout.update({
        where: { id: existingPending.id },
        data: {
          amount: parseFloat(amount),
          status: "PAID",
          paidAt: new Date(),
          referenceId: referenceId || existingPending.referenceId,
          notes: notes || existingPending.notes,
        }
      });
    } else {
      payout = await prisma.affiliatePayout.create({
        data: {
          affiliateId,
          amount: parseFloat(amount),
          status: "PAID",
          paidAt: new Date(),
          referenceId,
          notes,
        }
      });
    }

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error("Error recording payout/creating affiliate:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !["SUPERADMIN", "ACCOUNTS"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { affiliateId, commission, kycStatus } = body;

    if (!affiliateId) {
      return NextResponse.json({ error: "Affiliate ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (commission !== undefined) updateData.commissionPercentage = parseFloat(commission);
    if (kycStatus) updateData.kycStatus = kycStatus;

    const updated = await prisma.platformUser.update({
      where: { id: affiliateId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating affiliate settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
