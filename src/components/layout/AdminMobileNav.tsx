"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Building,
  UserPlus,
  MoreHorizontal,
  Package,
  Layers,
  Tag,
  Bot,
  Users,
  DollarSign,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ShieldAlert,
  Cpu,
  LifeBuoy,
  FileSpreadsheet,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

const primaryMobileTabs = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Clinics", href: "/admin/clinics", icon: Building },
  { name: "Leads", href: "/admin/leads", icon: UserPlus },
];

const secondaryMobileMenu = [
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Features", href: "/admin/features", icon: Layers },
  { name: "AI Analytics", href: "/admin/ai-analytics", icon: Cpu },
  { name: "Promotions", href: "/admin/promotions", icon: Tag },
  { name: "SEO Audits", href: "/admin/audits", icon: FileSpreadsheet },
  { name: "Support Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { name: "Sales Prospector", href: "/admin/prospector", icon: Bot },
  { name: "Team", href: "/admin/team", icon: Users },
  { name: "Affiliates", href: "/admin/affiliates", icon: DollarSign },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "System Errors", href: "/admin/system-errors", icon: ShieldAlert },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── Native Mobile Bottom App Bar (Fixed) ─────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        {primaryMobileTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/admin" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 min-w-[64px]",
                isActive
                  ? "text-indigo-600 font-bold"
                  : "text-slate-500 font-medium hover:text-slate-800"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                isActive ? "bg-indigo-50 border border-indigo-100/80 shadow-xs" : ""
              )}>
                <tab.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-500")} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.name}</span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 min-w-[64px]",
            isOpen ? "text-indigo-600 font-bold" : "text-slate-500 font-medium"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
            isOpen ? "bg-indigo-50 border border-indigo-100/80 shadow-xs" : ""
          )}>
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>

      {/* ── Slide-up Mobile Navigation Drawer / Sheet ────────────────────── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          {/* Backdrop Click to Close */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          {/* Sheet Body */}
          <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <GyrexLogo size="sm" />
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  Super Admin
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {secondaryMobileMenu.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-95 text-left",
                      isActive
                        ? "bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold shadow-xs"
                        : "bg-slate-50/70 border-slate-200/60 text-slate-700 font-medium hover:bg-slate-100"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Profile Card & Sign Out */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                    {session?.user?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate">{session?.user?.name || "Admin User"}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{session?.user?.role || "SUPERADMIN"}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors active:scale-98"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out of Admin Panel</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
