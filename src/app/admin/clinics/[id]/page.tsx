export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClinicDetailsClient } from "./ClinicDetailsClient";

export default async function ClinicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING", "SUPPORT"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const { id: clinicId } = await params;

  const clinic = await prisma.doctor.findUnique({
    where: { id: clinicId },
    include: {
      package: true,
      gbpAccounts: true,
      paymentTransactions: {
        orderBy: { createdAt: "desc" }
      },
      featureOverrides: {
        include: { feature: true }
      },
      subscriptionHistories: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!clinic) {
    redirect("/admin/clinics");
  }

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" }
  });

  const allPackages = await prisma.package.findMany({
    select: { id: true, name: true }
  });

  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <ClinicDetailsClient 
        initialClinic={clinic} 
        packages={packages} 
        allPackages={allPackages}
        featureFlags={featureFlags}
      />
    </div>
  );
}
