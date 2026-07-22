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
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Doctors</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage doctors working in your clinic.</p>
      </div>

      <SettingsTabs />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <PractitionerList practitioners={practitioners} onRefresh={fetchPractitioners} />
      )}
    </div>
  );
}
