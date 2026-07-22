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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Packages", href: "/admin/packages", icon: Package },
  { name: "Features", href: "/admin/features", icon: Layers },
  { name: "Promotions", href: "/admin/promotions", icon: Tag },
  { name: "Clinics", href: "/admin/clinics", icon: Building },
  { name: "Leads", href: "/admin/leads", icon: UserPlus },
  { name: "Team", href: "/admin/team", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-60 flex-col bg-slate-900 border-r border-slate-800 shadow-sm text-slate-300">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Gyrex Admin</span>
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.role}</p>
            </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/team/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group"
        >
          <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
