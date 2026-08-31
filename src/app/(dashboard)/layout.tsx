import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LocationProvider } from "@/contexts/LocationContext";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // Fetch fresh doctor data to check subscription status & package
  const doctor = await prisma.doctor.findUnique({
    where: { id: session.user.doctorId || session.user.id },
    select: {
      subscriptionExpiry: true,
      stripeCustomerId: true,
      razorpayCustomerId: true,
      subscriptionStatus: true,
      package: {
        select: {
          slug: true,
          name: true,
          priceMonthly: true,
        }
      }
    }
  });

  const hasPaymentMethod = !!(doctor?.stripeCustomerId || doctor?.razorpayCustomerId);

  return (
    <SessionProvider>
      <LocationProvider>
        <div className="flex h-screen bg-gray-50 print:h-auto print:block print:bg-white overflow-hidden">
          
          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden md:flex h-full shrink-0">
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block relative">
            <ImpersonationBanner />
            <TrialBanner 
              subscriptionExpiry={doctor?.subscriptionExpiry || null} 
              hasPaymentMethod={hasPaymentMethod} 
            />
            <Header />
            
            {/* Main content with bottom padding for mobile navigation bar */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6 print:overflow-visible print:p-0">
              {children}
            </main>

            {/* Mobile Bottom Navigation & Slide Drawer */}
            <MobileNav />
          </div>
        </div>
      </LocationProvider>
    </SessionProvider>
  );
}