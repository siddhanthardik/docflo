import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PricingClient } from "./PricingClient";

export default async function PackagePricingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user?.role || '')) {
    redirect('/login');
  }

  const resolvedParams = await params;

  const pkg = await prisma.package.findUnique({
    where: { id: resolvedParams.id },
    include: {
      prices: true
    }
  });

  if (!pkg) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PricingClient initialPackage={pkg} />
    </div>
  );
}
