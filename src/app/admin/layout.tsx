import { AdminSidebar } from "@/components/layout/admin-sidebar";
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
    redirect("/team/login");
  }

  // Only allow staff roles
  const role = session.user?.role;
  if (!role || !["SUPERADMIN", "ADMIN", "SALES", "ACCOUNTS", "MARKETING"].includes(role)) {
    redirect("/");
  }

  return (
    <SessionProvider>
      <LocationProvider>
        <div className="flex h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </LocationProvider>
    </SessionProvider>
  );
}
