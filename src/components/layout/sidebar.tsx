"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPlatformRole } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Star,
  Settings,
  LogOut,
  MessageCircle,
  Clock,
  UserPlus,
  FileText,
  Lightbulb,
  Bot,
  BarChart3,
  Stethoscope,
  Megaphone,
  MessageSquare,
  TrendingUp,
  ShieldAlert,
  PieChart,
  CreditCard
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navigationGroups = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Business Insights", href: "/insights", icon: PieChart },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ]
  },
  {
    group: "Patient Care",
    items: [
      { name: "WhatsApp Inbox", href: "/whatsapp", icon: MessageCircle },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Billing", href: "/billing", icon: FileText },
    ]
  },
  {
    group: "Growth & SEO",
    items: [
      { name: "GBP Profile", href: "/gbp", icon: Star },
      { name: "Local SEO", href: "/local-seo", icon: TrendingUp },
      { name: "Reviews", href: "/reviews", icon: MessageSquare },
      { name: "Scheduled Posts", href: "/gbp/posts", icon: FileText },
      { name: "Announcements", href: "/campaigns", icon: Megaphone },
    ]
  },
  {
    group: "Management",
    items: [
      { name: "AI Agents", href: "/chatbot", icon: Bot },
      { name: "Staff", href: "/staff", icon: UserPlus },
      { name: "Subscription", href: "/subscription", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration fix for localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("docflo_sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("docflo_sidebar_collapsed", String(newState));
  };

  if (!mounted) return <div className="w-60 bg-white border-r border-gray-100 shadow-sm flex-shrink-0" />; // skeleton

  return (
    <div className={cn("flex h-full flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0", isCollapsed ? "w-[68px]" : "w-60")}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4 border-b border-gray-100 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && <span className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">Docflo</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto overflow-x-hidden no-scrollbar">
        {session?.user?.role && isPlatformRole(session.user.role) && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
              isCollapsed ? "justify-center" : "gap-3",
              pathname === "/admin" && "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
            )}
            title="Superadmin"
          >
            <ShieldAlert className={cn("h-4 w-4 flex-shrink-0", pathname === "/admin" ? "text-white" : "text-purple-500")} />
            {!isCollapsed && <span>Superadmin</span>}
          </Link>
        )}
        
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.group} className={cn("flex flex-col", groupIdx !== 0 && "mt-4")}>
            {!isCollapsed && (
              <div className="px-4 py-1.5 text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1">
                {group.group}
              </div>
            )}
            {isCollapsed && groupIdx !== 0 && (
              <div className="h-px bg-gray-100 mx-3 my-2" />
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href === "/gbp"
                  ? pathname === "/gbp"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5",
                    isCollapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={item.name}
                >
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-gray-400")} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Toggle & Sign Out */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 group",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> : <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />}
          {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 text-gray-400 group-hover:text-red-500 flex-shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}