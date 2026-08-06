import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetDoctorId = searchParams.get("doctorId");

    // Default target doctor is session doctor unless superadmin specifies targetDoctorId
    let doctorId = session.user.id;
    
    // Check if session user is SUPERADMIN when targeting another doctor
    if (targetDoctorId && targetDoctorId !== session.user.id) {
      const userRole = (session.user as any)?.role;
      if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Superadmin permission required" }, { status: 403 });
      }
      doctorId = targetDoctorId;
    }

    // Find GBP Accounts for target doctor
    const gbpAccounts = await prisma.gbpAccount.findMany({
      where: { doctorId },
      select: { id: true }
    });

    const accountIds = gbpAccounts.map(a => a.id);

    if (accountIds.length > 0) {
      // Purge cached snapshots
      await prisma.competitorSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.profileSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.gbpPerformanceSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.gbpKeywordSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.gbpReviewSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.gbpPostSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.gbpQaSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.searchGridSnapshot.deleteMany({ where: { gbpAccountId: { in: accountIds } } });
      await prisma.seoRecommendation.deleteMany({ where: { gbpAccountId: { in: accountIds } } });

      // Delete actual cached Review rows for these accounts
      await prisma.review.deleteMany({ where: { gbpAccountId: { in: accountIds }, source: "GOOGLE" } });

      // Delete GBP Accounts
      await prisma.gbpAccount.deleteMany({ where: { doctorId } });
    }

    return NextResponse.json({
      success: true,
      message: "Google Business Profile disconnected and cached snapshots reset successfully."
    });
  } catch (error: any) {
    console.error("DELETE /api/gbp/disconnect error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
