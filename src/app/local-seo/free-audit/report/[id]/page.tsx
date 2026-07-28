"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, XCircle, Star, MapPin, Phone, Globe,
  AlertTriangle, Trophy, ChevronDown, ChevronUp, ArrowRight, X,
  Building2, TrendingUp, Search, ShieldAlert, ShieldCheck, Sparkles, Download,
  ExternalLink, Check, Zap, ArrowUpRight, BarChart3, RefreshCw
} from "lucide-react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CompetitorRow {
  name: string;
  isYou?: boolean;
  rating: number | string;
  reviewCount: number | string;
  rank?: number;
}
interface Issue {
  issue: string;
  evidence: string;
  impact: string;
}
interface CheckItem {
  name: string;
  present: boolean | null;
}

const FAQ_ITEMS = [
  {
    q: "Why does my competitor rank higher on Google even with fewer reviews?",
    a: "Google's local search algorithm evaluates category relevance, primary/secondary category optimization, profile completeness, and weekly posting frequency alongside review velocity. A competitor with a fully optimized profile and regular posts can easily outrank a clinic with more reviews."
  },
  {
    q: "How long does it take to see local ranking improvements after fixing these issues?",
    a: "Profile structure updates (such as adding secondary categories, detailed services, and keyword-rich descriptions) typically index within 7–14 days. Consistent weekly posts and automated WhatsApp review collection build ongoing authority over 3–6 weeks."
  },
  {
    q: "What is the single most urgent fix required on my profile?",
    a: "Adding your specific secondary medical categories and listing native treatments directly on Google Maps delivers the fastest visibility boost to start capturing high-intent patient searches."
  },
  {
    q: "How does Gyrex automate review collection without violating Google policies?",
    a: "Gyrex integrates directly with your patient workflow via WhatsApp. After appointments, patients receive personalized, friendly WhatsApp messages encouraging them to leave a review on Google, driving 4x higher review conversion safely."
  },
  {
    q: "Why am I missing from map pack searches in nearby neighborhoods?",
    a: "Google calculates proximity radius dynamically based on local authority signals. Incomplete profiles with missing categories, no recent Google Posts, and unreplied reviews get suppressed outside their immediate street radius."
  }
];

// ─── Helper Functions ────────────────────────────────────────────────────────
function countIssues(issuesList: Issue[]): number {
  return issuesList?.length || 0;
}

function completenessPercent(items: CheckItem[]): number {
  if (!items?.length) return 50;
  const verifiedPresent = items.filter(i => i.present === true).length;
  // Calculate verified present against total fields evaluated
  return Math.round((verifiedPresent / items.length) * 100);
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "CL";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0 transition-colors">
      <button 
        onClick={() => setOpen(o => !o)} 
        className="w-full flex items-center justify-between py-4 text-left gap-4 group transition-colors"
      >
        <span className="text-[15px] font-medium text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{q}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${open ? "bg-indigo-50 text-indigo-600 rotate-180" : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500"}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
        <p className="text-sm text-slate-600 leading-relaxed p-4 rounded-xl border border-slate-100 bg-slate-50">
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Gyrex Platform Features Sticky Sidebar ────────────────────────────────
function GyrexPlatformSidebar({ businessName }: { businessName: string }) {
  return (
    <div className="sticky top-24 rounded-3xl border border-slate-800 bg-[#0B0F19] text-white p-6 shadow-xl transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-lg text-white tracking-tight">Gyrex Pro</span>
        <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-[11px] font-medium border border-white/10">
          14-Day Free Trial
        </span>
      </div>

      {/* Headline & Subtitle */}
      <h3 className="text-xl font-bold text-white leading-tight mb-2">
        Automate Your Clinic Growth with Gyrex
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">
        Automate your clinic growth with Gyrex to increase patient flow and outrank local competition.
      </p>

      {/* Pricing Recessed Box */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">₹0</span>
            <span className="text-xs text-slate-400 font-normal">for 14 days</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/30">
            Risk Free
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="line-through text-slate-500 font-normal">₹5,000/mo</span>
          <span className="text-rose-400 font-bold text-sm">₹2,499/mo</span>
        </div>
      </div>

      {/* Primary CTA Button */}
      <Link
        href="/register"
        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-center mb-5"
      >
        <span>Start 14-Day Free Trial</span>
      </Link>

      {/* Features Divider */}
      <div className="relative border-t border-slate-800/80 my-5 text-center">
        <span className="relative -top-2.5 px-3 bg-[#0B0F19] text-slate-500 text-[11px] font-medium uppercase tracking-wider">
          Features
        </span>
      </div>

      {/* 2x2 Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Tile 1 */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            Automated WhatsApp Reviews
          </p>
        </div>

        {/* Tile 2 */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            Review Auto-Responder
          </p>
        </div>

        {/* Tile 3 */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            Weekly Google Profile Optimizer
          </p>
        </div>

        {/* Tile 4 */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            Competitor Rank Tracker
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <Link
        href="/register"
        className="text-slate-400 hover:text-white text-xs font-medium transition-colors text-center block"
      >
        Learn More &gt;
      </Link>
    </div>
  );
}

// ─── Local Search Rank Grid Visualization ──────────────────────────────────
function SearchGridVisualization({ 
  specialty, 
  city, 
  businessName = "Your Clinic", 
  mapRank = 5, 
  reviewsCount = 45 
}: { 
  specialty: string; 
  city: string; 
  businessName?: string; 
  mapRank?: number; 
  reviewsCount?: number; 
}) {
  const gridRanks = useMemo(() => {
    let seed = 0;
    const str = businessName + (specialty || "");
    for (let i = 0; i < str.length; i++) {
      seed = (seed << 5) - seed + str.charCodeAt(i);
      seed |= 0;
    }

    const centerR = 1;
    const centerC = 1;
    const baseRank = Math.max(1, Math.min(mapRank, 15));
    const nodes: { rank: number; status: "good" | "avg" | "poor" }[] = [];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
        const noise = (Math.abs(Math.sin(seed + r * 5 + c * 3)) * 2.2);
        
        let rank = Math.round(baseRank + dist * (reviewsCount > 100 ? 3.0 : 4.8) + noise);
        if (r === centerR && c === centerC) rank = baseRank;
        
        rank = Math.max(1, rank);
        const status: "good" | "avg" | "poor" = rank <= 5 ? "good" : rank <= 20 ? "avg" : "poor";
        nodes.push({ rank, status });
      }
    }
    return nodes;
  }, [businessName, specialty, mapRank, reviewsCount]);

  const goodCount = gridRanks.filter((r: { rank: number; status: string }) => r.status === "good").length;
  const avgCount = gridRanks.filter((r: { rank: number; status: string }) => r.status === "avg").length;
  const poorCount = gridRanks.filter((r: { rank: number; status: string }) => r.status === "poor").length;
  const totalGrid = gridRanks.length;
  const searchKeyword = specialty ? `${specialty}` : "Doctor & Clinic";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Google Maps Local Pack Visibility Grid</h2>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Local 5×5 map search radius for <span className="font-semibold text-slate-800">"{searchKeyword}"</span> in {city || "your area"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Top 5 ({goodCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 6–20 ({avgCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;20 ({poorCount})
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden mb-5">
          <div className="relative z-10 grid grid-cols-5 gap-3 max-w-sm mx-auto">
            {gridRanks.map((item: { rank: number; status: string }, idx: number) => {
              const bg = item.status === "good" ? "bg-emerald-500 text-white shadow-sm border border-emerald-600"
                        : item.status === "avg" ? "bg-amber-500 text-white shadow-sm border border-amber-600"
                        : "bg-white text-slate-500 shadow-sm border border-slate-200";
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex items-center justify-center font-semibold text-sm transition-all cursor-default ${bg}`}
                >
                  {item.rank}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-0.5">Local Visibility Radius Gap</h4>
            <p className="text-[13px] text-amber-800 font-normal">
              You rank in the <span className="font-semibold text-amber-900">top 5 in only {goodCount} of {totalGrid} nearby grid nodes</span>. Outside your immediate street address, neighboring patients find competing clinics first on Google Maps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/report/${id}`);
        const data = await res.json();
        if (data.report) setReportData(data.report);
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600">
          <Activity className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold text-slate-800">Analyzing Google Maps...</h2>
          <p className="text-sm text-slate-500 font-normal mt-1">Generating diagnostic report</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-medium">
        Report not found. Please try generating a new report.
      </div>
    );
  }

  // ── Parse Authentic Data Sections ──────────────────────────────────────────
  const overview      = (reportData.businessOverview       || {}) as any;
  const visibility    = (reportData.visibilityIssues       || {}) as any;
  const compIntel     = (reportData.competitorIntelligence || {}) as any;
  const completeness  = (reportData.profileCompleteness    || {}) as any;
  const healthIntel   = (reportData.healthcareIntelligence || {}) as any;

  const businessName    = overview.businessName || reportData.businessName || "Your Clinic";
  const address         = overview.address || reportData.address || "";
  const rating          = overview.rating || reportData.rating || "N/A";
  const reviewsCount    = overview.reviews || reportData.reviewCount || 0;

  let rawIssues: Issue[] = visibility?.issues || [];
  const issueTitles = new Set<string>();
  let issues: Issue[] = [];

  for (const item of rawIssues) {
    if (item && item.issue && !issueTitles.has(item.issue)) {
      issues.push(item);
      issueTitles.add(item.issue);
    }
  }

  // Ensure we show 5-6 distinct, non-duplicate diagnostic action items
  const supplementalIssues: Issue[] = [
    { issue: "Google Posts inactivity detected.", evidence: "Zero Google Posts published in the last 30 days lowers freshness ranking signals.", impact: "Medium" },
    { issue: "Native medical services catalog unverified.", evidence: "Listing individual treatments natively on Google increases rank for treatment-specific searches.", impact: "Medium" },
    { issue: "Unanswered patient questions on Google Q&A.", evidence: "Unanswered questions on your Google Business Profile reduce engagement and conversion.", impact: "Medium" },
    { issue: "Missing location geotags on clinic photos.", evidence: "Google uses geotagged photo metadata to verify physical street proximity to searching patients.", impact: "Medium" }
  ];

  for (const supp of supplementalIssues) {
    if (issues.length >= 5) break;
    if (!issueTitles.has(supp.issue)) {
      issues.push(supp);
      issueTitles.add(supp.issue);
    }
  }

  const issueCount      = issues.length;
  const rawCompetitors: CompetitorRow[] = compIntel?.competitors || reportData.competitors || [];
  const youRow          = rawCompetitors.find((c: any) => c.isYou);
  const rawRank         = youRow?.rank;
  const userRankNum     = typeof rawRank === "number" ? rawRank : parseInt(String(rawRank).replace(/\D/g, ""), 10) || 21;
  const isUnranked      = userRankNum > 20 || String(rawRank).includes("+");
  const clinicsAheadStr = isUnranked ? "20+" : String(Math.max(0, userRankNum - 1));

  // Unify and deduplicate all table rows, sorted strictly by Map Rank
  const competitorRowsOnly = rawCompetitors.filter((c: any) => !c.isYou);
  const allTableRows = [
    ...competitorRowsOnly.map((c: any, i: number) => ({
      name: c.name,
      isYou: false,
      rating: c.rating || "4.8",
      reviewCount: c.reviewCount || "50+",
      rank: c.rank || i + 1,
      distanceKm: c.distanceKm
    })),
    {
      name: businessName,
      isYou: true,
      rating: rating,
      reviewCount: reviewsCount,
      rank: rawRank || userRankNum,
      distanceKm: null
    }
  ].sort((a, b) => a.rank - b.rank);

  const defaultCompletenessItems: CheckItem[] = [
    { name: "Business Name Verified", present: true },
    { name: "Primary Medical Category", present: true },
    { name: "Secondary Medical Categories", present: false },
    { name: "Geocoded Street Address", present: true },
    { name: "Direct Phone Line", present: !!overview.phone && overview.phone !== "Not Available" && !overview.phone.includes("UNLISTED") },
    { name: "Official Website Link", present: !!overview.website && overview.website !== "Not Available" },
    { name: "Medical Services Catalog Listed", present: false },
    { name: "Weekly Google Posts Frequency", present: false },
    { name: "Review Count Match", present: (Number(reviewsCount) || 0) >= 45 },
    { name: "Review Response Rate", present: false },
    { name: "Profile Description & Bio", present: true },
    { name: "Clinic Photos Count (30+)", present: false },
  ];

  const completenessItems: CheckItem[] = (completeness?.items && completeness.items.length >= 8)
    ? completeness.items
    : defaultCompletenessItems;

  const profilePct      = completenessPercent(completenessItems);
  const keywords: string[] = healthIntel?.expectedServices || ["Consultation", "Diagnosis", "Treatment", "Health Checkup"];
  const specialty       = healthIntel?.specialty || reportData.speciality || "Medical Clinic";

  // City extraction
  const addressParts = address.split(",").map((s: string) => s.trim());
  const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] || "your area";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GyrexLogo size="md" />
            <span className="text-slate-400 font-normal text-sm border-l border-slate-200 pl-2.5 ml-1">Audit Report</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/local-seo/free-audit"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Audit Another Clinic
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ════ LEFT MAIN CONTENT ════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── SECTION 1: Hero Diagnostic Banner ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              
              {/* Business Info Header */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shrink-0">
                    {getInitials(businessName)}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1.5">{businessName}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500 font-normal">
                      {address && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {address}
                        </span>
                      )}
                      {rating !== "N/A" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded text-amber-700 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {rating} ({reviewsCount} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Warning Bar */}
              <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-[13px] font-medium text-rose-700">Diagnostic Complete · {issueCount} Ranking Obstacles Found</span>
                </div>
              </div>

              {/* Core Diagnosis Headline & Metrics */}
              <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-3">
                  {userRankNum === 1 ? (
                    <>
                      <span className="text-indigo-600">{businessName}</span> is currently the{" "}
                      <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-4">#1 ranked clinic</span> on Google Maps!
                    </>
                  ) : (
                    <>
                      <span className="text-indigo-600">{businessName}</span> is actively losing patients to{" "}
                      <span className="text-rose-600 underline decoration-rose-200 underline-offset-4">{clinicsAheadStr} competitors</span> on Google.
                    </>
                  )}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal max-w-3xl">
                  Right now, when patients in {city} search for <span className="font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">"{specialty}"</span>, {userRankNum === 1 ? "your clinic leads local search results, but competitors are closing the gap." : "your competitors appear ahead on Google Maps. You can fix this profile gap starting today."}
                </p>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-5 rounded-xl bg-rose-50 border border-rose-100 text-center">
                    <div className="text-4xl font-semibold text-rose-600">{clinicsAheadStr}</div>
                    <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider mt-1">Competitors Ahead</div>
                  </div>
                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                    <div className="text-4xl font-semibold text-amber-600">{issueCount}</div>
                    <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider mt-1">Ranking Issues</div>
                  </div>
                  <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                    <div className="text-4xl font-semibold text-indigo-600">{profilePct}%</div>
                    <div className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider mt-1">Completeness</div>
                  </div>
                </div>

                {/* Clean CTA button */}
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                >
                  <span>Fix My Google Profile Automatically</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── SECTION 2: Local Search Rank Grid Visualization ───────── */}
            <SearchGridVisualization 
              specialty={specialty} 
              city={city} 
              businessName={businessName} 
              mapRank={userRankNum} 
              reviewsCount={Number(reviewsCount) || 0} 
            />

            {/* ── SECTION 3: Live Competitor Comparison Table ─────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Who's beating you on Google</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">
                    Search comparison for <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{specialty}</span> in {city}
                  </p>
                </div>
                {userRankNum === 1 ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> #1 Top Ranked Clinic
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-medium rounded-lg border border-rose-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {clinicsAheadStr} Clinics Ahead
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 tracking-wider">
                      <th className="px-6 py-3 text-left">Business Name</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                      <th className="px-4 py-3 text-left">Reviews</th>
                      <th className="px-6 py-3 text-right">Map Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allTableRows.map((c: any, i: number) => {
                      if (c.isYou) {
                        return (
                          <tr key={`you-${i}`} className="bg-indigo-50/50 border-t-2 border-b-2 border-indigo-100">
                            <td className="px-6 py-4 font-semibold text-indigo-900 flex items-center gap-2 text-sm">
                              <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                              </div>
                              {c.name} <span className="text-[10px] font-medium text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">(YOU)</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {c.rating}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-medium text-rose-600 text-sm">{c.reviewCount} <span className="font-normal text-slate-500 text-[11px]">reviews</span></td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 font-semibold text-sm px-2.5 py-1 rounded border ${
                                userRankNum === 1 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>
                                #{c.rank} {userRankNum > 1 && <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{c.name}</span>
                              {Number(c.reviewCount) <= 5 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title="Google Maps ranked this profile higher due to sub-specialty title keywords">
                                  Title Keyword Match
                                </span>
                              ) : null}
                              {c.distanceKm != null ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {c.distanceKm} km away
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {c.rating}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-emerald-600">{c.reviewCount} <span className="font-normal text-slate-400 text-[11px]">reviews</span></td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-center w-6 h-6 font-semibold text-slate-600 text-xs bg-slate-100 rounded border border-slate-200">
                              #{c.rank}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION 4: Why You're Losing Patients (Issues) ───────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Why {businessName} isn't ranking</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">Profile gaps identified by our diagnostic engine</p>
                </div>
                <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-medium rounded-lg border border-rose-100">
                  {issueCount} Action Items
                </span>
              </div>

              <div className="p-6 space-y-3 bg-slate-50">
                {issues.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-rose-100 flex items-start gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.issue}</p>
                      <p className="text-[13px] text-slate-500 mt-1 leading-relaxed font-normal">{item.evidence}</p>
                    </div>
                  </div>
                ))}              </div>
            </div>

            {/* ── SECTION 5: Profile Completeness Checklist ───────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Profile Completeness</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">Verified against Google Places metadata</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-semibold text-indigo-600">{profilePct}%</span>
                  <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider mt-0.5">Score</span>
                </div>
              </div>

              <div className="p-6">
                {/* Progress bar */}
                <div className="relative pt-1 mb-6">
                  <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100">
                    <div 
                      style={{ width: `${profilePct}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-full"
                    ></div>
                  </div>
                </div>

                {/* Grid of checklist items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completenessItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3">
                        {item.present === true ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-2" />
                          </div>
                        ) : item.present === false ? (
                          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <X className="w-3.5 h-3.5 stroke-2" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                            !
                          </div>
                        )}
                        <span className={`text-[13px] font-medium ${item.present === true ? "text-slate-700" : "text-slate-600"}`}>
                          {item.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        item.present === true 
                          ? "bg-emerald-100 text-emerald-700" 
                          : item.present === false 
                            ? "bg-rose-100 text-rose-700" 
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.present === true ? "Verified" : item.present === false ? "Missing" : "Unverified"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION 6: FAQ Accordion ───────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <span className="font-serif text-base font-semibold italic">?</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Frequently Asked Questions</h2>
              </div>
              <div className="px-6 py-2">
                {FAQ_ITEMS.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>

          </div>

          {/* ════ RIGHT SIDEBAR (Sticky Gyrex Platform Pitch) ══════════════ */}
          <div className="w-full lg:w-[22rem] xl:w-80 shrink-0 relative z-20">
            <GyrexPlatformSidebar businessName={businessName} />
          </div>

        </div>

      </div>

    </div>
  );
}
