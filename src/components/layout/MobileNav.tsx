"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { isPlatformRole } from "@/lib/permissions";
import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  Users,
  Menu,
  X,
  FileText,
  Megaphone,
  Star,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Bot,
  Settings,
  ShieldAlert,
  LogOut
} from "lucide-react";

const mainTabs = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/whatsapp", icon: MessageCircle },
  { name: "Bookings", href: "/appointments", icon: Calendar },
  { name: "Patients", href: "/patients", icon: Users },
];

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Inbox", href: "/whatsapp", icon: MessageCircle },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Billing & Invoices", href: "/billing", icon: FileText },
  { name: "Announcements", href: "/campaigns", icon: Megaphone },
  { name: "GBP Profile", href: "/gbp", icon: Star },
  { name: "Local SEO", href: "/local-seo", icon: TrendingUp },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Scheduled Posts", href: "/gbp/posts", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Agents", href: "/chatbot", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Mobile Bottom Navigation Bar (App Design) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around py-1.5 px-2 safe-area-pb print:hidden">
        {mainTabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 relative min-w-[64px]",
                isActive
                  ? "text-blue-600 font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
            >
              <tab.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110 text-blue-600")} />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.name}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Menu Drawer Button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 min-w-[64px]",
            drawerOpen ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </nav>

      {/* ── Mobile Slide-Over Drawer Menu ───────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <GyrexLogo size="md" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {session?.user?.role && isPlatformRole(session.user.role) && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold border border-purple-200 bg-purple-50 text-purple-700 mb-3",
                    pathname === "/admin" && "bg-purple-600 text-white border-purple-600"
                  )}
                >
                  <ShieldAlert className="h-5 w-5 text-purple-600" />
                  <span>Superadmin Portal</span>
                </Link>
              )}

              {allNavItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User profile & Sign Out footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{session?.user?.name || "Clinic User"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{session?.user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
