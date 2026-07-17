import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClinicsClient } from "./ClinicsClient";

export default async function ClinicsPage() {
  const session = await auth();

  if (!session || !["SUPERADMIN", "ADMIN", "SALES", "MARKETING"].includes(session.user?.role || "")) {
    redirect("/");
  }

  const clinics = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      package: true,
      paymentTransactions: {
        where: { status: "SUCCESS" },
        select: { amount: true }
      }
    }
  });

  const packages = await prisma.package.findMany({
    where: { isActive: true }
  });

  return (
    <div className="space-y-6">
      <ClinicsClient initialClinics={clinics} packages={packages} />
    </div>
  );
}
