import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Get current user and their package
  const doctor = await prisma.doctor.findUnique({
    where: { id: session.user.id },
    include: {
      package: true
    }
  });

  // Get all active packages
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and payment methods.</p>
      </div>

      <BillingClient 
        currentPackage={doctor?.package} 
        subscriptionStatus={doctor?.subscriptionStatus || "ACTIVE"}
        availablePackages={packages} 
      />
    </div>
  );
}
