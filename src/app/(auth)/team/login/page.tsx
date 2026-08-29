"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function TeamLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Activity className="w-5 h-5 animate-spin text-blue-600" />
        <span>Redirecting to unified sign in...</span>
      </div>
    </div>
  );
}
