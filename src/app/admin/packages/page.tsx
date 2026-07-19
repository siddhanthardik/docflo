import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackagesClient } from "./PackagesClient";
import { redirect } from "next/navigation";

export default async function PackagesPage() {
  const session = await auth();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user?.role || '')) {
    redirect('/login');
  }

  // Fetch all packages with their new Module/Limit configuration
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      modules: { select: { moduleName: true } },
      limits: { select: { limitName: true, limitValue: true } },
      _count: { select: { doctors: true } }
    }
  });

  // Fetch all doctors for the assignment modal
  const doctors = await prisma.doctor.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      clinicName: true,
      email: true,
      packageId: true,
      package: { select: { name: true } }
    }
  });

  return (
    <div className="space-y-6">
      <PackagesClient initialPackages={packages} doctors={doctors} />
    </div>
  );
}
