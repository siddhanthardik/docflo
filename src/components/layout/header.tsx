"use client";

import { useSession } from "next-auth/react";
import { useLocationContext } from "@/contexts/LocationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Bell, ChevronDown } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const { locations, activeLocationId, setActiveLocationId, isLoading } = useLocationContext();

  const name = session?.user?.name || "Doctor";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6 shadow-sm">
      {/* Left: welcome + location picker */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-900">Welcome back, {name} 👋</p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {!isLoading && locations.length > 0 && (
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />
        )}

        {!isLoading && locations.length > 0 && (
          <Select value={activeLocationId || ""} onValueChange={setActiveLocationId}>
            <SelectTrigger className="h-9 w-[240px] bg-indigo-50 border-indigo-100 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 transition-colors">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500 flex-shrink-0" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-medium text-gray-900 text-sm">{loc.locationName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-100 transition-colors">
          <Bell className="h-4 w-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">{name}</p>
            <p className="text-[10px] text-gray-400 leading-tight">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}