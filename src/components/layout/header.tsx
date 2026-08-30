"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Bell } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { OPDStatusControl } from "@/components/dashboard/OPDStatusControl";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const name = session?.user?.name || "Doctor";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const hour = mounted ? new Date().getHours() : 12;
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-xs print:hidden shrink-0">
      {/* Left: Mobile Brand Logo or Welcome text */}
      <div className="flex items-center gap-2.5">
        <Link href="/admin" className="lg:hidden flex items-center gap-2 shrink-0">
          <GyrexLogo size="sm" />
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            Admin
          </span>
        </Link>

        <div className="hidden sm:block">
          <p className="text-base sm:text-lg text-slate-900 font-bold leading-tight truncate tracking-tight">
            {mounted ? greeting : "Welcome"}, <span className="text-indigo-600">{name}</span> 👋
          </p>
          <p className="text-xs text-slate-500 mt-0.5 font-normal hidden md:block">
            {mounted ? new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : "Loading date..."}
          </p>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN" && (
          <OPDStatusControl />
        )}
        <NotificationBell />

        <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
            {initials}
          </div>
          <div className="hidden lg:block truncate">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate">{name}</p>
            <p className="text-[10px] font-medium text-slate-500 leading-tight">{session?.user?.role || "SUPERADMIN"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}