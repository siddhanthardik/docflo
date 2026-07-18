"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function AuditScanRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/audit/status/${id}`);
        const data = await res.json();

        if (data.status === "COMPLETED") {
          clearInterval(poll);
          router.replace(`/local-seo/free-audit/report/${id}`);
        } else if (data.status === "FAILED") {
          clearInterval(poll);
          router.replace(`/local-seo/free-audit`);
        }
      } catch {
        // keep polling silently
      }
    }, 1200);

    return () => clearInterval(poll);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <Activity className="w-7 h-7 text-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Preparing your report…</p>
    </div>
  );
}
