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
