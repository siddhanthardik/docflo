"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
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
  PanelLeft,
  Download
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Zap } from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Inbox", href: "/whatsapp", icon: MessageCircle },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Billing", href: "/billing", icon: FileText },
  { name: "Announcements", href: "/campaigns", icon: Megaphone },
  { name: "Google Profile", href: "/gbp", icon: Star },
  { name: "Local SEO", href: "/local-seo", icon: TrendingUp },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Scheduled Posts", href: "/gbp/posts", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Smart Automation", href: "/ai-agents", icon: Zap },
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
    const saved = localStorage.getItem("gyrex_sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  // Keyboard shortcut for Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("gyrex_sidebar_collapsed", String(newState));
  };

  if (!mounted) return <div className="w-60 bg-white border-r border-gray-100 shadow-sm flex-shrink-0" />; // skeleton

  return (
    <div className={cn("flex h-full flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 print:hidden relative", isCollapsed ? "w-[68px]" : "w-60")}>
      
      {/* Floating Toggle Button on Edge */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-5 z-30 bg-white border border-slate-200 shadow-md rounded-full p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Logo and Toggle Header */}
      <div className={cn("flex h-16 items-center border-b border-gray-100 shrink-0", isCollapsed ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/dashboard" className="flex items-center justify-center">
          {isCollapsed ? (
            <GyrexLogo iconOnly size="md" />
          ) : (
            <GyrexLogo size="md" />
          )}
        </Link>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto overflow-x-hidden">
        {session?.user?.role && isPlatformRole(session.user.role) && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 mb-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
              isCollapsed ? "justify-center" : "gap-3",
              pathname === "/admin" && "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
            )}
            title="Superadmin"
          >
            <ShieldAlert className={cn("h-4 w-4 flex-shrink-0", pathname === "/admin" ? "text-white" : "text-purple-500")} />
            {!isCollapsed && <span>Superadmin</span>}
          </Link>
        )}
        
        {navigationItems.map((item) => {
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
                "flex items-center rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 mb-0.5",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={item.name}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-slate-400")} />
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Anchored Bottom Footer: Download App, Settings & Sign Out */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/50 space-y-0.5 shrink-0">
        <a
          href="/download/Gyrex-Clinic-Setup.bat"
          download="Gyrex-Clinic-Setup.bat"
          className={cn(
            "flex items-center rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-slate-200 transition-all duration-150",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title="Download Desktop App"
        >
          <Download className="h-4 w-4 shrink-0 text-slate-400" />
          {!isCollapsed && <span>Download App</span>}
        </a>

        <Link
          href="/settings"
          className={cn(
            "flex items-center rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150",
            isCollapsed ? "justify-center" : "gap-3",
            pathname.startsWith("/settings")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
          )}
          title="Settings"
        >
          <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") ? "text-white" : "text-slate-400")} />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-150",
            isCollapsed ? "justify-center" : "gap-3"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}