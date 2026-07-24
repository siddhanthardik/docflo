"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Package,
  Tag,
  ShieldAlert,
  Building,
  UserPlus,
  Layers,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Features", href: "/admin/features", icon: Layers },
  { name: "Promotions", href: "/admin/promotions", icon: Tag },
  { name: "Clinics", href: "/admin/clinics", icon: Building },
  { name: "Leads", href: "/admin/leads", icon: UserPlus },
  { name: "Team", href: "/admin/team", icon: Users },
  { name: "Payouts", href: "/admin/payouts", icon: DollarSign },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-60 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-gray-100">
        <GyrexLogo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.role}</p>
            </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/team/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
