"use client";

import { usePathname, useRouter } from "next/navigation";
import { User, Building, Stethoscope, UserPlus, Star, MessageCircle, FileText, CreditCard, Puzzle, Shield } from "lucide-react";

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
    { key: "reviews", label: "Reviews Automation", icon: Star, href: "/settings/reviews" },
    { key: "security", label: "Security", icon: Shield, href: "/settings/security" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 bg-white border border-gray-100 rounded-xl p-2 shadow-sm w-full md:w-fit max-w-full">
      {tabs.map(({ key, label, icon: Icon, href }) => {
        // Active logic: if exact match, or if it's the root /settings
        const isActive = pathname === href;
        
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
