"use client";

import { useState } from "react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, Bot, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickFixModal } from "./QuickFixModal";

export function AiSearchReadiness() {
  const { data: profileData, refetch } = useLocalSeoModule<any>("profile-health");
  const { data: overviewData } = useLocalSeoModule<any>("overview");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeFix, setActiveFix] = useState<{
    key: string;
    label: string;
    value: any;
  } | null>(null);

  if (!profileData) return null;

  const primaryCat = profileData.primaryCategory || overviewData?.primaryCategory || "Doctor";
  const doctorName = profileData.doctorName || overviewData?.doctorName || "your clinic";

  const queries = [
    {
      fieldKey: "appointmentUrl",
      fieldLabel: "Appointment Booking URL",
      fieldValue: profileData.appointmentUrl || "",
      question: "Can I book an appointment online with this clinic?",
      ready: !!profileData.appointmentUrl,
      source: profileData.appointmentUrl ? "Appointment Link verified" : "Missing Appointment URL",
      impact: "High Booking Conversion",
      tip: profileData.appointmentUrl
        ? "Google Search & Maps presents your booking link when patients ask to schedule."
        : "Add your online booking or WhatsApp link so patients can book appointments directly.",
    },
    {
      fieldKey: "categories",
      fieldLabel: "Secondary Business Categories",
      fieldValue: profileData.categories || [],
      question: "What specialty treatments and clinical services are offered?",
      ready: !!(profileData.primaryCategory && profileData.categories && profileData.categories.length > 0),
      source: profileData.primaryCategory
        ? `${profileData.primaryCategory} + ${profileData.categories?.length || 0} sub-specialties`
        : "Categories incomplete",
      impact: "Broad Search Reach",
      tip: "Search engines match patient symptom queries against your primary and secondary clinical categories.",
    },
    {
      fieldKey: "hours",
      fieldLabel: "Opening Hours & Timings",
      fieldValue: profileData.hours || "",
      question: "What are the clinic's operating hours and weekend availability?",
      ready: !!profileData.hours,
      source: profileData.hours ? "Structured Hours Verified" : "Hours not specified",
      impact: "Open Now Discovery",
      tip: `Google relies on verified hours to answer patient queries like "Is ${doctorName} open right now?".`,
    },
    {
      fieldKey: "phone",
      fieldLabel: "Direct Phone Number & Contact",
      fieldValue: profileData.phone || "",
      question: "Where is the clinic located and how can I reach them?",
      ready: !!(profileData.phone && profileData.address),
      source: profileData.phone && profileData.address ? "Direct Phone & Clinic Address" : "Incomplete Contact Data",
      impact: "Directions & Direct Calls",
      tip: "Complete contact info allows Google Maps to provide 1-tap calling and accurate driving directions.",
    },
  ];

  const readyCount = queries.filter((q) => q.ready).length;
  const aiReadinessScore = Math.round((readyCount / queries.length) * 100);

  const handleOpenFix = (q: any) => {
    setActiveFix({
      key: q.fieldKey,
      label: q.fieldLabel,
      value: q.fieldValue,
    });
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Patient Search Queries</h2>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Search Readiness
            </span>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            How search engines and conversational voice assistants answer common patient inquiries using your profile data.
          </p>
        </div>

        {/* Readiness Badge Score */}
        <div className="flex items-center gap-4 bg-gray-50/90 p-4 rounded-xl border border-gray-200/80 shrink-0">
          <div className="text-right">
            <p className="text-[11px] font-semibold text-gray-500">Query Readiness</p>
            <p className="text-2xl font-bold text-gray-900">{aiReadinessScore}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
            {readyCount}/{queries.length}
          </div>
        </div>
      </div>

      {/* Simulated Conversational Queries */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Common Patient Queries & Coverage
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queries.map((q, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                q.ready
                  ? "bg-gray-50/50 border-gray-200/70 hover:border-gray-300"
                  : "bg-amber-50/30 border-amber-200/70 hover:border-amber-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-gray-900 leading-snug">&ldquo;{q.question}&rdquo;</p>
                  </div>
                  {q.ready ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Incomplete
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed pl-6">{q.tip}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 text-[11px] pl-6">
                <span className="text-gray-400 font-medium">Status: {q.source}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenFix(q)}
                  className={`h-6 text-[11px] font-semibold px-2.5 rounded-lg transition-all ${
                    q.ready
                      ? "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                      : "text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                  }`}
                >
                  <Edit3 className="w-3 h-3 mr-1 text-indigo-500" />
                  {q.ready ? "Edit" : "Update"}
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
