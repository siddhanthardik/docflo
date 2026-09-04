"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Building,
  Stethoscope,
  UserPlus,
  Star,
  MessageCircle,
  CreditCard,
  Puzzle,
  Shield,
  ChevronDown,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  key: string;
  label: string;
  description: string;
  icon: any;
  href: string;
  roles?: string[];
}

export function SettingsTabs() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activePillRef = useRef<HTMLAnchorElement>(null);

  const userRole = ((session?.user as any)?.role || "DOCTOR").toUpperCase();

  const allTabs: TabItem[] = [
    {
      key: "clinic",
      label: "Clinic Profile",
      description: "Clinic branding, address, timings & currency",
      icon: Building,
      href: "/settings/clinic",
      roles: ["DOCTOR", "ADMIN", "MANAGER"],
    },
    {
      key: "doctors",
      label: "Doctors & OPD",
      description: "Practitioners, clinical specialties, OPD timings & fees",
      icon: Stethoscope,
      href: "/settings/practitioners",
      roles: ["DOCTOR", "ADMIN", "MANAGER"],
    },
    {
      key: "staff",
      label: "Staff",
      description: "Team members & receptionist access",
      icon: UserPlus,
      href: "/staff",
      roles: ["DOCTOR", "ADMIN", "MANAGER"],
    },
    {
      key: "whatsapp",
      label: "WhatsApp Settings",
      description: "QR connection, device status & AI message triggers",
      icon: MessageCircle,
      href: "/settings/whatsapp",
      roles: ["DOCTOR", "ADMIN", "MANAGER"],
    },
    {
      key: "subscription",
      label: "Subscription & Plan",
      description: "Current plan, usage limits & billing invoices",
      icon: CreditCard,
      href: "/subscription",
      roles: ["DOCTOR", "ADMIN"],
    },
    {
      key: "integrations",
      label: "Integrations",
      description: "Google Business Profile, calendar & external APIs",
      icon: Puzzle,
      href: "/settings/integrations",
      roles: ["DOCTOR", "ADMIN"],
    },
    {
      key: "reviews",
      label: "Reviews & Messages",
      description: "Patient review automations & Google review alerts",
      icon: Star,
      href: "/settings/reviews",
      roles: ["DOCTOR", "ADMIN", "MANAGER"],
    },
    {
      key: "account",
      label: "Account & Security",
      description: "Login credentials, recovery phone, password & sessions",
      icon: Shield,
      href: "/settings",
      roles: ["DOCTOR", "ADMIN"],
    },
  ];

  const visibleTabs = allTabs.filter(
    (tab) => !tab.roles || tab.roles.includes(userRole)
  );

  // Match active tab precisely or by sub-path (excluding root /settings from prefix matching other settings)
  const activeTab =
    visibleTabs.find((t) => {
      if (t.href === "/settings") return pathname === "/settings";
      return pathname === t.href || pathname?.startsWith(t.href + "/");
    }) || visibleTabs[0] || allTabs[0];

  const ActiveIcon = activeTab.icon;

  // Auto-close sheet when pathname changes
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  // Scroll active tab pill into view on mobile
  useEffect(() => {
    if (activePillRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [pathname]);

  return (
    <div className="mb-6 space-y-3">
      {/* ── MOBILE APP-STYLE SELECTOR (< 768px) ── */}
      <div className="block md:hidden space-y-2.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Settings Section</span>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Mobile App View
            </span>
          </div>

          {/* Trigger Button that opens Mobile Action Sheet */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200/70 border border-slate-200 rounded-xl px-3 flex items-center justify-between text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center shrink-0">
                <ActiveIcon className="h-4 w-4 text-indigo-600 shrink-0" />
              </div>
              <div className="truncate">
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {activeTab.label}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  Tap to switch section
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Change
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200 text-slate-500",
                  sheetOpen && "rotate-180"
                )}
              />
            </div>
          </button>
        </div>

        {/* Horizontal Quick-Scroll Tabs for 1-Tap Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-0.5 scrollbar-none no-scrollbar">
          {visibleTabs.map(({ key, label, icon: Icon, href }) => {
            const isActive =
              href === "/settings"
                ? pathname === "/settings"
                : pathname === href || pathname?.startsWith(href + "/");

            return (
              <Link
                key={key}
                href={href}
                ref={isActive ? activePillRef : null}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all border",
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs shadow-indigo-600/20"
                    : "bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE BOTTOM SHEET MODAL (< 768px) ── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSheetOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col animate-in slide-in-from-bottom duration-250 border-t border-slate-100">
            {/* Grab handle indicator */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 shrink-0" />

            {/* Sheet Header */}
            <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Settings Sections
                </h3>
                <p className="text-xs text-slate-500">
                  Select a section to manage configuration
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of Settings Tabs */}
            <div className="overflow-y-auto p-3 space-y-1.5 max-h-[calc(85vh-100px)] pb-8">
              {visibleTabs.map(({ key, label, description, icon: Icon, href }) => {
                const isActive =
                  href === "/settings"
                    ? pathname === "/settings"
                    : pathname === href || pathname?.startsWith(href + "/");

                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left",
                      isActive
                        ? "bg-indigo-50/90 border border-indigo-200/80 text-indigo-950 shadow-xs"
                        : "bg-slate-50/60 hover:bg-slate-100/80 border border-transparent text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                            : "bg-white border border-slate-200 text-slate-500"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-bold block truncate",
                              isActive ? "text-indigo-950" : "text-slate-900"
                            )}
                          >
                            {label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-1">
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP & TABLET GRID (≥ 768px) ── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        {visibleTabs.map(({ key, label, icon: Icon, href }) => {
          const isActive =
            href === "/settings"
              ? pathname === "/settings"
              : pathname === href || pathname?.startsWith(href + "/");

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-indigo-600"
                )}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
