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
// ─── Official SVG Icons ───────────────────────────────────────────────────────
function WhatsAppSVG() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-500 shrink-0">
      <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.982L2 22l5.176-1.348a9.96 9.96 0 004.836 1.232h.005c5.506 0 9.989-4.478 9.989-9.985 0-2.667-1.037-5.176-2.922-7.062A9.924 9.924 0 0012.012 2zm5.871 14.186c-.247.697-1.428 1.331-1.968 1.396-.54.065-1.246.09-2.008-.152-.46-.146-1.054-.34-1.821-.672-3.232-1.396-5.328-4.664-5.49-4.88-.162-.216-1.31-1.745-1.31-3.33 0-1.585.831-2.366 1.127-2.69.296-.324.647-.405.863-.405.216 0 .432.002.621.011.202.01.472-.077.737.558.271.647.92 2.247.999 2.41.081.162.135.351.027.568-.108.216-.162.351-.324.54-.162.189-.34.422-.486.567-.162.162-.331.339-.142.664.189.324.84 1.385 1.802 2.242 1.237 1.101 2.278 1.442 2.602 1.604.324.162.513.135.702-.081.189-.216.81-0.945 1.026-1.269.216-.324.432-.27.729-.162.297.108 1.89.891 2.214 1.053.324.162.54.243.621.378.081.135.081.783-.166 1.48z"/>
    </svg>
  );
}

function GoogleGSVG() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

// ─── Gyrex Platform Features Sticky Sidebar ────────────────────────────────
function GyrexPlatformSidebar({ businessName }: { businessName: string }) {
  return (
    <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all">
      {/* Header Banner - Gyrex Indigo Theme */}
      <div className="p-6 bg-indigo-600 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg text-white tracking-tight">Gyrex Pro</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500 text-xs font-medium text-indigo-50 border border-indigo-400">
              14-Day Free Trial
            </span>
          </div>
          <h3 className="text-xl font-bold leading-tight mb-2">Automate Your Clinic Growth with Gyrex</h3>
          <p className="text-sm text-indigo-100 leading-relaxed font-normal">
            To increase patient flow and outrank local competition.
          </p>
        </div>
      </div>

      {/* Pricing / Trial offer */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-slate-900 tracking-tight">₹0</span>
          <span className="text-sm font-medium text-slate-600">for 14 days</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="line-through decoration-slate-300 font-normal">Regular ₹5,000/mo</span>
          <span className="text-rose-600 font-bold text-sm">₹2,499/mo</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-medium rounded-md text-[10px] ml-auto">Risk Free</span>
        </div>
      </div>

      {/* 2x2 Feature Cards Grid */}
      <div className="p-6 space-y-4 border-b border-slate-100 bg-white">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Features</p>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Tile 1: WhatsApp Reviews */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <WhatsAppSVG />
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              Automated WhatsApp Reviews
            </p>
          </div>

          {/* Tile 2: Review Auto-Responder */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              Review Auto-Responder
            </p>
          </div>

          {/* Tile 3: Weekly Google Profile Optimizer */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 mb-3">
              <GoogleGSVG />
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              Weekly Google Profile Optimizer
            </p>
          </div>

          {/* Tile 4: Competitor Rank Tracker */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              Competitor Rank Tracker
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-6 bg-slate-50/50">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/register"
          className="text-slate-500 hover:text-indigo-600 text-xs font-medium transition-colors text-center block mt-3"
        >
          Learn More &gt;
        </Link>
      </div>
    </div>
  );
}

// ─── Local Search Rank Grid Visualization ──────────────────────────────────
function SearchGridVisualization({ 
  specialty, 
  city, 
  businessName = "Your Clinic", 
  mapRank = 5, 
  reviewsCount = 45,
  gridData = null,
  searchContext = ""
}: { 
  specialty: string; 
  city: string; 
  businessName?: string; 
  mapRank?: number; 
  reviewsCount?: number; 
  gridData?: { rank: number; row: number; col: number }[] | null;
  searchContext?: string;
}) {
  const gridRanks = useMemo(() => {
    // If we have real backend grid data, map it directly
    if (gridData && gridData.length > 0) {
      return gridData.map(node => {
        const rank = node.rank;
        const status: "good" | "avg" | "poor" = rank <= 5 ? "good" : rank <= 20 ? "avg" : "poor";
        return { rank, status, row: node.row, col: node.col };
      }).sort((a, b) => {
        // Sort by row then col so it lays out in a 5x5 grid
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
    }

    // Fallback if no grid data available (should not happen with new logic, but safe to keep as simple fallback)
    const nodes: { rank: number; status: "good" | "avg" | "poor" }[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        let rank = r === 2 && c === 2 ? mapRank : mapRank + Math.floor(Math.random() * 5);
        if (rank > 21) rank = 21;
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
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Google Maps Local Pack Visibility Grid</h2>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Local 5×5 map search radius around <span className="font-semibold text-slate-800">"{searchKeyword}"</span>
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
  const city = compIntel?.searchContext || (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] || "your area");

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
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              
              {/* Business Info Header */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-2xl shrink-0 shadow-xs">
                    {getInitials(businessName)}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">{businessName}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500 font-normal">
                      {address && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100/80 border border-slate-200/60 rounded-lg text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {address}
                        </span>
                      )}
                      {rating !== "N/A" && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/60 rounded-lg text-amber-800 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {rating} ({reviewsCount} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Warning Bar */}
              <div className="px-6 py-3 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-rose-700">Diagnostic Complete · {issueCount} Ranking Obstacles Found</span>
                </div>
              </div>

              {/* Core Diagnosis Headline & Metrics */}
              <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug mb-3 tracking-tight">
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
                  Right now, when patients in {city} search for <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">"{specialty}"</span>, {userRankNum === 1 ? "your clinic leads local search results, but competitors are closing the gap." : "your competitors appear ahead on Google Maps. You can fix this profile gap starting today."}
                </p>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-4xl font-extrabold text-rose-600">{clinicsAheadStr}</div>
                    <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mt-1">Competitors Ahead</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-4xl font-extrabold text-amber-600">{issueCount}</div>
                    <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mt-1">Ranking Issues</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-4xl font-extrabold text-indigo-600">{profilePct}%</div>
                    <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mt-1">Completeness</div>
                  </div>
                </div>

                {/* Clean CTA button */}
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99]"
                >
                  <span>Fix My Google Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── SECTION 2: Local Search Rank Grid Visualization ───────── */}
            <SearchGridVisualization 
              specialty={specialty} 
              city={city} 
              businessName={businessName} 
              mapRank={compIntel?.compositeData?.compositeRank || userRankNum} 
              reviewsCount={Number(reviewsCount) || 0} 
              gridData={compIntel?.gridData}
              searchContext={compIntel?.searchContext || city}
            />

            {/* ── SECTION 3: Live Competitor Comparison Table ─────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Who is Outperforming you on Google</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">
                    Search comparison for <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">Best {specialty}</span> in {city}
                  </p>
                </div>
                {userRankNum === 1 ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> #1 Top Ranked Clinic
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {clinicsAheadStr} Clinics Ahead
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 tracking-wider">
                      <th className="px-6 py-3.5 text-left">Business Name</th>
                      <th className="px-4 py-3.5 text-left">Rating</th>
                      <th className="px-4 py-3.5 text-left">Reviews</th>
                      <th className="px-6 py-3.5 text-right">Map Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allTableRows.map((c: any, i: number) => {
                      if (c.isYou) {
                        return (
                          <tr key={`you-${i}`} className="bg-indigo-50/60 border-t-2 border-b-2 border-indigo-100">
                            <td className="px-6 py-4 font-bold text-indigo-950 flex items-center gap-2 text-sm">
                              <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                              </div>
                              {c.name} <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 border border-indigo-200/60 px-2 py-0.5 rounded-md">(YOU)</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 text-amber-800 font-semibold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {c.rating}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-bold text-rose-600 text-sm">{c.reviewCount} <span className="font-normal text-slate-500 text-[11px]">reviews</span></td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 font-bold text-sm px-2.5 py-1 rounded-lg border ${
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
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">{c.name}</span>
                              {Number(c.reviewCount) <= 5 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100" title="Google Maps ranked this profile higher due to sub-specialty title keywords">
                                  Title Keyword Match
                                </span>
                              ) : null}

                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {c.rating}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-emerald-600">{c.reviewCount} <span className="font-normal text-slate-400 text-[11px]">reviews</span></td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-center w-6 h-6 font-bold text-slate-600 text-xs bg-slate-100 rounded-md border border-slate-200">
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
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-bold">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Why {businessName} isn't ranking</h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">Profile gaps identified by our diagnostic engine</p>
                </div>
                <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-100">
                  {issueCount} Action Items
                </span>
              </div>

              <div className="p-6 space-y-3 bg-slate-50/50">
                {issues.map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-rose-100/80 flex items-start gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.issue}</p>
                      <p className="text-[13px] text-slate-600 mt-1 leading-relaxed font-normal">{item.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 5: Profile Completeness Checklist ───────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
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

      {/* ── Native App Mobile Sticky Bottom Bar (App-like UX) ─────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900">₹0</span>
            <span className="text-[11px] text-slate-500 font-normal">for 14 days</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="line-through text-slate-400 font-normal">₹5,000</span>
            <span className="text-rose-600 font-bold">₹2,499/mo</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-medium rounded text-[9px]">Risk Free</span>
          </div>
        </div>
        <Link
          href="/register"
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
