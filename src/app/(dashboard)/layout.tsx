import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LocationProvider } from "@/contexts/LocationContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <LocationProvider>
        <div className="flex h-screen bg-gray-50 print:h-auto print:block print:bg-white overflow-hidden">
          
          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden md:flex h-full shrink-0">
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block">
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