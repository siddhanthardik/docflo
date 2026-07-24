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
    <div className="bg-amber-100 text-amber-900 px-4 py-2 flex items-center justify-between text-sm font-medium sticky top-0 z-[100]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        You are currently impersonating <span className="font-bold ml-1">{session?.user?.name} ({session?.user?.email})</span>. Actions taken will be logged under this user.
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleStopImpersonating}
        className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 h-8"
      >
        <UserX className="h-4 w-4 mr-2" /> Stop Impersonating
      </Button>
    </div>
  );
}
