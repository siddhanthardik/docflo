import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClinicDetailsClient } from "./ClinicDetailsClient";

export default async function ClinicDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING", "SUPPORT"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const clinicId = params.id;

  const clinic = await prisma.doctor.findUnique({
    where: { id: clinicId },
    include: {
      package: true,
      paymentTransactions: {
        orderBy: { createdAt: "desc" }
      },
      featureOverrides: {
        include: { feature: true }
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

  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <ClinicDetailsClient 
        initialClinic={clinic} 
        packages={packages} 
        featureFlags={featureFlags}
      />
    </div>
  );
}
