"use client";

import { useEffect, useState } from "react";
import { PractitionerList } from "@/components/practitioners/practitioner-list";
import { Loader2 } from "lucide-react";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/practitioners");
      if (res.ok) {
        const data = await res.json();
        setPractitioners(data);
      }
    } catch (error) {
      console.error("Failed to fetch practitioners", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPractitioners();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-2xs space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Doctors</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Manage practicing doctors, consultation fees, and WhatsApp AI scheduling numbers</p>
      </div>

      <SettingsTabs />

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <PractitionerList practitioners={practitioners} onRefresh={fetchPractitioners} />
      )}
    </div>
  );
}
