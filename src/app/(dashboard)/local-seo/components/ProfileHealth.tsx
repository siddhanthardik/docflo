"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, FileCheck2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ProfileHealth() {
  const { data: profileData, isLoading } = useLocalSeoModule<any>('profile-health');

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!profileData) return null;

  const fields = [
    { label: "Business Name", status: profileData.name ? "Complete" : "Missing" },
    { label: "Primary Category", status: profileData.primaryCategory ? "Complete" : "Missing" },
    { label: "Secondary Categories", status: (profileData.categories && profileData.categories.length > 0) ? "Complete" : "Missing" },
    { label: "Business Description", status: profileData.description ? "Complete" : "Missing" },
    { label: "Opening Hours", status: profileData.hours ? "Complete" : "Missing" },
    { label: "Phone Number", status: profileData.phone ? "Complete" : "Missing" },
    { label: "Website", status: profileData.website ? "Complete" : "Missing" },
    { label: "Attributes", status: (profileData.attributes && profileData.attributes.length > 0) ? "Complete" : "Missing" },
    { label: "Photos", status: profileData.hasPhotos ? "Complete" : "Missing" },
    { label: "Appointment URL", status: profileData.appointmentUrl ? "Complete" : "Missing" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <FileCheck2 className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Profile Completeness</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              {field.status === "Complete" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium text-gray-900">{field.label}</span>
            </div>
            
            {field.status === "Missing" && (
              <Button asChild variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Link href="/gbp">
                  Fix <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
