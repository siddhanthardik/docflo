import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
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
    orderBy: { priceMonthly: "asc" },
    include: {
      packageFeatures: true,
      prices: true
    }
  });

  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: "asc" }
  });

  const headersList = await headers();
  const ipCountry = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry');
  
  let userCountryCode = "US"; // Default fallback
  
  if (doctor?.currency === "INR") {
    userCountryCode = "IN";
  } 
  else if (doctor?.country) {
    const c = doctor.country.toLowerCase();
    if (c === "india" || c === "in") {
      userCountryCode = "IN";
    } else {
      userCountryCode = "US";
    }
  } 
  else if (ipCountry && ipCountry.toUpperCase() === "IN") {
    userCountryCode = "IN";
  }

  // Serialize Prisma objects to prevent Next.js Server-to-Client component errors
  const activePkg = doctor?.package || (packages.length > 0 ? packages[0] : null);
  const safeDoctorPackage = activePkg ? JSON.parse(JSON.stringify(activePkg)) : null;
  const safePackages = JSON.parse(JSON.stringify(packages));
  const safeFeatureFlags = JSON.parse(JSON.stringify(featureFlags));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and payment methods.</p>
      </div>

      <BillingClient 
        currentPackage={safeDoctorPackage} 
        subscriptionStatus={doctor?.subscriptionStatus || "ACTIVE"}
        availablePackages={safePackages} 
        featureFlags={safeFeatureFlags}
        userCountry={userCountryCode}
      />
    </div>
  );
}
