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
  const rawPackages = await prisma.package.findMany({
    include: {
      modules: { select: { moduleName: true } },
      limits: { select: { limitName: true, limitValue: true } },
      _count: { select: { doctors: true } },
      prices: true
    }
  });

  const PACKAGE_RANK: Record<string, number> = {
    "FREE": 1,
    "STARTER": 2,
    "GROWTH": 3,
    "PREMIUM": 4,
    "AUTOPILOT": 4,
  };

  const getRank = (name: string) => {
    const upper = name.toUpperCase();
    for (const [key, rank] of Object.entries(PACKAGE_RANK)) {
      if (upper.includes(key)) return rank;
    }
    return 99;
  };

  const packages = rawPackages.sort((a, b) => getRank(a.name) - getRank(b.name));

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
