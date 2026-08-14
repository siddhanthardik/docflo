"use client";

import { usePathname, useRouter } from "next/navigation";
import { User, Building, Stethoscope, UserPlus, Star, MessageCircle, CreditCard, Puzzle, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function SettingsTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { key: "profile", label: "My Profile", icon: User, href: "/settings" },
    { key: "clinic", label: "Clinic Profile", icon: Building, href: "/settings/clinic" },
    { key: "doctors", label: "Doctors", icon: Stethoscope, href: "/settings/practitioners" },
    { key: "staff", label: "Staff", icon: UserPlus, href: "/staff" },
    { key: "whatsapp", label: "WhatsApp Settings", icon: MessageCircle, href: "/settings/whatsapp" },
    { key: "subscription", label: "Subscription & Plan", icon: CreditCard, href: "/subscription" },
    { key: "integrations", label: "Integrations", icon: Puzzle, href: "/settings/integrations" },
    { key: "reviews", label: "Reviews & Messages", icon: Star, href: "/settings/reviews" },
    { key: "security", label: "Security", icon: Shield, href: "/settings/security" },
  ];

  const activeTab = tabs.find(t => t.href === pathname) || tabs[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="mb-6 space-y-3">
      {/* ── MOBILE APP-STYLE SELECTOR (< 768px) ── */}
      <div className="block md:hidden">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1.5 flex items-center justify-between">
            <span>Settings Section</span>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Mobile App View</span>
          </div>
          <Select value={activeTab.href} onValueChange={(href) => router.push(href)}>
            <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20">
              <div className="flex items-center gap-2.5 truncate">
                <ActiveIcon className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="truncate">{activeTab.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border border-slate-200 shadow-xl">
              {tabs.map(({ key, label, icon: Icon, href }) => (
                <SelectItem key={key} value={href} className="py-2.5 text-sm font-medium">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── DESKTOP & TABLET 2-ROW GRID (≥ 768px) ── */}
      <div className="hidden md:grid grid-cols-5 gap-2 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        {tabs.map(({ key, label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <button
              key={key}
              onClick={() => router.push(href)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
