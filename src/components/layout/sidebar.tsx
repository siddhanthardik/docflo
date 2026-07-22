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
  PanelLeft
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Inbox", href: "/whatsapp", icon: MessageCircle },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Billing", href: "/billing", icon: FileText },
  { name: "Announcements", href: "/campaigns", icon: Megaphone },
  { name: "GBP Profile", href: "/gbp", icon: Star },
  { name: "Local SEO", href: "/local-seo", icon: TrendingUp },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Scheduled Posts", href: "/gbp/posts", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Agents", href: "/chatbot", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
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
    <div className={cn("flex h-full flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 print:hidden", isCollapsed ? "w-[68px]" : "w-60")}>
      {/* Logo and Toggle */}
      <div className={cn("flex h-16 items-center px-4 border-b border-gray-100 relative", isCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex items-center">
          {isCollapsed ? (
            <GyrexLogo iconOnly size="md" />
          ) : (
            <GyrexLogo size="md" />
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Toggle Sidebar (Ctrl+B)"}
        >
          <PanelLeft className="h-5 w-5" />
        </button>
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
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-gray-100 flex justify-center">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}