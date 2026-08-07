"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AiSearchReadiness() {
  const { data: profileData } = useLocalSeoModule<any>("profile-health");

  if (!profileData) return null;

  const queries = [
    {
      question: "Can I book an appointment online with this clinic?",
      ready: !!profileData.appointmentUrl,
      source: profileData.appointmentUrl ? "Appointment Link verified" : "Missing Appointment URL",
      impact: "High AI Conversational Rank",
      tip: profileData.appointmentUrl
        ? "Google Gemini will directly present your booking link when patients ask to schedule."
        : "Add your online booking or WhatsApp link so AI search agents can convert patients instantly.",
    },
    {
      question: "What specialty treatments and clinical services are offered?",
      ready: !!(profileData.primaryCategory && profileData.categories && profileData.categories.length > 0),
      source: profileData.primaryCategory
        ? `${profileData.primaryCategory} + ${profileData.categories?.length || 0} sub-specialties`
        : "Categories incomplete",
      impact: "Broad Search Reach",
      tip: "AI search engines construct treatment maps using your primary and secondary categories.",
    },
    {
      question: "What are the clinic's operating hours and weekend availability?",
      ready: !!profileData.hours,
      source: profileData.hours ? "Structured Hours Verified" : "Hours not specified",
      impact: "Emergency & Urgent Discovery",
      tip: "Google AI relies on structured hours to answer queries like 'Is Dr. Maanvvi open right now?'.",
    },
    {
      question: "Where is the clinic located and how can I reach them?",
      ready: !!(profileData.phone && profileData.address),
      source: profileData.phone && profileData.address ? "Direct Phone & Geocoded Address" : "Incomplete Contact Data",
      impact: "Maps Route Generation",
      tip: "Complete contact info allows Google Maps AI to generate 1-tap navigation and direct call prompts.",
    },
  ];

  const readyCount = queries.filter((q) => q.ready).length;
  const aiReadinessScore = Math.round((readyCount / queries.length) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Google AI & Ask Maps Search Readiness</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> AI Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Google has shifted from static Q&A to conversational AI search (Ask Maps & Gemini). This tool checks how accurately Google AI agents can synthesize and answer patient queries for your clinic.
          </p>
        </div>

        {/* Readiness Badge Score */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-sm shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">AI Search Score</p>
            <p className="text-2xl font-black text-white">{aiReadinessScore}%</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
            {aiReadinessScore >= 75 ? "A+" : aiReadinessScore >= 50 ? "B" : "C"}
          </div>
        </div>
      </div>

      {/* Simulated Conversational Queries */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
          Simulated Google AI Patient Queries
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queries.map((q, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                q.ready
                  ? "bg-gray-50/60 border-gray-100 hover:border-gray-200"
                  : "bg-amber-50/40 border-amber-200/60 hover:border-amber-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-gray-900 leading-snug">&ldquo;{q.question}&rdquo;</p>
                  </div>
                  {q.ready ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AI Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Action Needed
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed pl-6">{q.tip}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 text-[11px] pl-6">
                <span className="text-gray-400 font-medium">Source: {q.source}</span>
                {!q.ready && (
                  <Button asChild variant="ghost" size="sm" className="h-6 text-[11px] text-indigo-600 hover:bg-indigo-50 px-2 font-bold">
                    <Link href="/gbp">
                      Fix <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
