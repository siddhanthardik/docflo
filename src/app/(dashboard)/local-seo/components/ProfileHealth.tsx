"use client";

import { useState } from "react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, Layers, PhoneCall, CalendarCheck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickFixModal } from "./QuickFixModal";

interface AuditField {
  key: string;
  label: string;
  category: "foundation" | "seo" | "conversion";
  impact: "High Impact" | "Medium Impact" | "Core Requirement";
  isComplete: boolean;
  valueDisplay?: string;
  currentValue: any;
  advice: string;
}

export function ProfileHealth() {
  const { data: profileData, isLoading, refetch } = useLocalSeoModule<any>("profile-health");
  const { data: overviewData } = useLocalSeoModule<any>("overview");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFix, setActiveFix] = useState<{
    key: string;
    label: string;
    value: any;
  } | null>(null);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (!profileData) return null;

  const secondaryCount = profileData.categories ? profileData.categories.length : 0;
  const descLength = profileData.description ? profileData.description.length : 0;
  const primaryCat = profileData.primaryCategory || overviewData?.primaryCategory || "Doctor";

  const fields: AuditField[] = [
    {
      key: "name",
      label: "Business Name",
      category: "foundation",
      impact: "Core Requirement",
      isComplete: !!profileData.name,
      valueDisplay: profileData.name || "Missing",
      currentValue: profileData.name || "",
      advice: "Your official practice or clinic title registered with Google.",
    },
    {
      key: "primaryCategory",
      label: "Primary Business Category",
      category: "seo",
      impact: "High Impact",
      isComplete: !!profileData.primaryCategory,
      valueDisplay: profileData.primaryCategory || "Not Set",
      currentValue: profileData.primaryCategory || "",
      advice: "Primary factor used by Google algorithm to index your clinic for local searches.",
    },
    {
      key: "categories",
      label: "Secondary Categories",
      category: "seo",
      impact: "High Impact",
      isComplete: secondaryCount >= 1,
      valueDisplay: secondaryCount > 0 ? `${secondaryCount} Added` : "None Added",
      currentValue: profileData.categories || [],
      advice: secondaryCount >= 2
        ? "Great coverage! Secondary categories increase local keyword visibility by up to 35%."
        : "Add at least 2 secondary categories (e.g. Gynecologist, Women's Health Clinic) to expand keyword reach.",
    },
    {
      key: "description",
      label: "Business Description",
      category: "seo",
      impact: "High Impact",
      isComplete: descLength >= 100,
      valueDisplay: descLength > 0 ? `${descLength} characters` : "Missing",
      currentValue: profileData.description || "",
      advice: descLength >= 250
        ? "Comprehensive description loaded with specialty keywords."
        : "A rich 250+ character description containing specialty & neighborhood keywords boosts local AI indexing.",
    },
    {
      key: "appointmentUrl",
      label: "Appointment Booking URL",
      category: "conversion",
      impact: "High Impact",
      isComplete: !!profileData.appointmentUrl,
      valueDisplay: profileData.appointmentUrl ? "Configured" : "Missing Link",
      currentValue: profileData.appointmentUrl || "",
      advice: "Direct appointment links increase patient conversion rates by 40% on Google Maps.",
    },
    {
      key: "hours",
      label: "Opening Hours & Timings",
      category: "conversion",
      impact: "High Impact",
      isComplete: !!profileData.hours,
      valueDisplay: profileData.hours ? "Active Schedule" : "Missing Hours",
      currentValue: profileData.hours || "",
      advice: "Accurate operating hours prevent lost bookings and improve Google's 'Open Now' filter ranking.",
    },
    {
      key: "phone",
      label: "Direct Phone Number",
      category: "foundation",
      impact: "Core Requirement",
      isComplete: !!profileData.phone,
      valueDisplay: profileData.phone || "Missing",
      currentValue: profileData.phone || "",
      advice: "Enables 1-click patient call actions directly from Google Search & Maps results.",
    },
    {
      key: "website",
      label: "Official Website Link",
      category: "foundation",
      impact: "Core Requirement",
      isComplete: !!profileData.website,
      valueDisplay: profileData.website || "Missing",
      currentValue: profileData.website || "",
      advice: "Connects your GBP listing to your domain authority for higher Google Maps ranking.",
    },
    {
      key: "attributes",
      label: "Profile Attributes & Amenities",
      category: "conversion",
      impact: "Medium Impact",
      isComplete: !!(profileData.attributes && (Array.isArray(profileData.attributes) ? profileData.attributes.length > 0 : Object.keys(profileData.attributes).length > 0)),
      valueDisplay: profileData.attributes ? "Attributes Configured" : "None Set",
      currentValue: profileData.attributes || [],
      advice: "Highlights accessibility (wheelchair accessible, care types) for filtering patients.",
    },
  ];

  // Calculate Health Score
  const completedCount = fields.filter((f) => f.isComplete).length;
  const healthScore = Math.round((completedCount / fields.length) * 100);

  const foundationScore = Math.round(
    (fields.filter((f) => f.category === "foundation" && f.isComplete).length /
      fields.filter((f) => f.category === "foundation").length) *
      100
  );

  const seoScore = Math.round(
    (fields.filter((f) => f.category === "seo" && f.isComplete).length /
      fields.filter((f) => f.category === "seo").length) *
      100
  );

  const conversionScore = Math.round(
    (fields.filter((f) => f.category === "conversion" && f.isComplete).length /
      fields.filter((f) => f.category === "conversion").length) *
      100
  );

  const handleOpenFixModal = (field: AuditField) => {
    setActiveFix({
      key: field.key,
      label: field.label,
      value: field.currentValue,
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Overview Score Dashboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Profile Health & Completeness Audit</h2>
            </div>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              Google algorithms favor complete profiles with high information density. Maintaining a 90%+ health score directly correlates with top 3 Google Map Pack rankings.
            </p>
          </div>

          {/* Radial / Score Badge */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 shrink-0">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={healthScore >= 80 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="6"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * healthScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-gray-900">{healthScore}%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {healthScore >= 85 ? "Excellent Health" : healthScore >= 60 ? "Good — Needs Tweak" : "Critical Fixes Needed"}
              </p>
              <p className="text-xs text-gray-500">{completedCount} of {fields.length} pillars verified</p>
            </div>
          </div>
        </div>

        {/* 3 Core Pillar Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Foundation & Contact</span>
              <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-gray-900">{foundationScore}%</span>
              <span className="text-[11px] font-semibold text-emerald-600">Verified</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${foundationScore}%` }} />
            </div>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Search Reach & Categories</span>
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-gray-900">{seoScore}%</span>
              <span className="text-[11px] font-semibold text-indigo-600">Keyword Index</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${seoScore}%` }} />
            </div>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Patient Booking Readiness</span>
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-gray-900">{conversionScore}%</span>
              <span className="text-[11px] font-semibold text-emerald-600">Conversion</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${conversionScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Audit List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-2">
          Detailed Profile Audit & Optimization Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.key}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                field.isComplete
                  ? "bg-white border-gray-100 hover:border-gray-200"
                  : "bg-amber-50/30 border-amber-200/80 hover:border-amber-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    {field.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-gray-900">{field.label}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      field.impact === "High Impact"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : field.impact === "Core Requirement"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {field.impact}
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed pl-7">{field.advice}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs pl-7">
                <span className="text-gray-400 font-medium">Status: <strong className="text-gray-700">{field.valueDisplay}</strong></span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenFixModal(field)}
                  className={`h-7 text-xs font-bold px-2.5 rounded-lg transition-all ${
                    field.isComplete
                      ? "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                      : "text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-2xs"
                  }`}
                >
                  <Edit3 className="mr-1 h-3.5 w-3.5 text-indigo-500" />
                  {field.isComplete ? "Edit" : "Optimize"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Fix Popover Modal */}
      {activeFix && (
        <QuickFixModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          fieldKey={activeFix.key}
          fieldLabel={activeFix.label}
          currentValue={activeFix.value}
          primaryCategory={primaryCat}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}
