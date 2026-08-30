"use client";

import { useSession } from "next-auth/react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { data: session } = useSession();

  const isImpersonating = !!(session?.user as any)?.originalAdminId;

  if (!isImpersonating) return null;

  const handleStopImpersonating = async () => {
    try {
      const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.redirectUrl || "/admin/clinics";
      }
    } catch (e) {
      console.error("Failed to stop impersonating", e);
    }
  };

  return (
    <div className="bg-amber-100 text-amber-900 px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium sticky top-0 z-[100] border-b border-amber-200/80 shadow-2xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <div className="min-w-0 leading-tight">
          <span>You are impersonating </span>
          <strong className="font-bold text-amber-950">{session?.user?.name}</strong>
          {session?.user?.email && (
            <span className="text-amber-800 text-[11px] sm:text-xs"> ({session.user.email})</span>
          )}
          <span className="hidden md:inline text-amber-800">. Actions taken will be logged under this user.</span>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleStopImpersonating}
        className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 h-7 sm:h-8 text-xs font-bold shrink-0 self-end sm:self-center shadow-2xs transition-all active:scale-95"
      >
        <UserX className="h-3.5 w-3.5 mr-1.5 text-amber-700" /> Stop Impersonating
      </Button>
    </div>
  );
}
