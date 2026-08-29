import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";
import { Header } from "@/components/layout/header";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LocationProvider } from "@/contexts/LocationContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Only allow staff roles
  const role = session.user?.role;
  if (!role || !["SUPERADMIN", "ADMIN", "SALES", "ACCOUNTS", "MARKETING"].includes(role)) {
    redirect("/");
  }

  return (
    <SessionProvider>
      <LocationProvider>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden lg:flex shrink-0 h-full">
            <AdminSidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">{children}</main>
            {/* Native Mobile Bottom Navigation Bar */}
            <AdminMobileNav />
          </div>
        </div>
      </LocationProvider>
    </SessionProvider>
  );
}
