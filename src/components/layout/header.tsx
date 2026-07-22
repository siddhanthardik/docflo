"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Bell } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  const name = session?.user?.name || "Doctor";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 shadow-sm print:hidden shrink-0">
      {/* Left: Mobile Brand Logo or Welcome text */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="md:hidden flex items-center shrink-0">
          <GyrexLogo size="sm" />
        </Link>

        <div className="hidden sm:block font-[family-name:var(--font-poppins)]">
          <p className="text-base sm:text-lg md:text-[20px] text-gray-900 font-medium leading-tight truncate">
            {greeting}, <span className="font-semibold">{name}</span> 👋
          </p>
          <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-100 transition-colors">
          <Bell className="h-4 w-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
            {initials}
          </div>
          <div className="hidden lg:block truncate">
            <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{name}</p>
            <p className="text-[10px] text-gray-400 leading-tight">Clinic Dashboard</p>
          </div>
        </div>
      </div>
    </header>
  );
}