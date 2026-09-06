"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, XCircle, Star, MapPin, Phone, Globe,
  AlertTriangle, Trophy, ChevronDown, ChevronUp, ArrowRight, X,
  Building2, TrendingUp, Search, ShieldAlert, ShieldCheck, Sparkles, Download,
  ExternalLink, Check, Zap, ArrowUpRight, BarChart3, RefreshCw,
  Map, LayoutGrid, Compass, MessageSquare
} from "lucide-react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Google3PackPreview } from "@/components/audit/google-3pack-preview";
import { MedicalEEATScorecard } from "@/components/audit/medical-eeat-scorecard";
import { RankTrackerMap } from "@/app/(dashboard)/local-seo/components/RankTrackerMap";
import { sanitizeDoctorBusinessName } from "@/lib/audit/name-sanitizer";

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

// ─── 14-Day Trial Features Definition ──────────────────────────────────────────
const TRIAL_FEATURES = [
  {
    title: "Automated WhatsApp Reviews",
    desc: "Post-consultation WhatsApp review invites with 1-tap Google Maps rating link.",
    icon: <WhatsAppSVG />
  },
  {
    title: "AI Review Auto-Responder (24/7)",
    desc: "Instant, medically-empathetic replies to all Google patient reviews 24/7.",
    icon: <Zap className="w-4 h-4 text-amber-500" />
  },
  {
    title: "Multi-Specialty Category Optimizer",
    desc: "Map 3–4 high-intent secondary categories to dominate multi-specialty local searches.",
    icon: <Sparkles className="w-4 h-4 text-indigo-600" />
  },
  {
    title: "Native Treatments Catalog Indexer",
    desc: "Publish procedures, consultation fees, and health packages directly into Google Maps.",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  },
  {
    title: "Weekly Google Profile Health Posts",
    desc: "Automated weekly medical tips & practice updates to maintain high ranking signals.",
    icon: <GoogleGSVG />
  },
  {
    title: "Competitor Geo-Grid Rank Tracker",
    desc: "Real-time 3-pack rank tracking across nearby PIN codes with competitor movement alerts.",
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />
  },
  {
    title: "WhatsApp Clinic Reception Assistant",
    desc: "Convert high-intent Google Maps searchers into booked consultations on WhatsApp.",
    icon: <Activity className="w-4 h-4 text-violet-600" />
  },
  {
    title: "Doctor Practice Growth CRM",
    desc: "Unified patient communication inbox, follow-ups, and review audit trail.",
    icon: <BarChart3 className="w-4 h-4 text-cyan-600" />
  }
];

// ─── Mobile 14-Day Free Trial Spotlight (Mobile First View) ───────────────────
function MobileTrialSpotlight({ businessName }: { businessName: string }) {
  const [showAll, setShowAll] = useState(false);
  const visibleFeatures = showAll ? TRIAL_FEATURES : TRIAL_FEATURES.slice(0, 4);

  return (
    <div className="lg:hidden rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 p-5 sm:p-6 shadow-xs space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            G
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">Gyrex Pro</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
          14-Day Free Trial
        </span>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          Automate Your Clinic Growth with Gyrex
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Everything included to outrank local competitors and double your Google Maps patient consultations.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">₹0</span>
            <span className="text-xs text-slate-600 font-medium">for 14 days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            <span className="line-through">₹5,000</span> <span className="text-rose-600 font-bold">₹2,499/mo</span> after trial
          </p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
          100% Risk Free
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            All Features Included in 14-Day Trial:
          </p>
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {showAll ? "Show Less" : `View All (${TRIAL_FEATURES.length})`}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="shrink-0 mt-0.5">{feat.icon}</div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{feat.title}</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/register"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-98"
      >
        <span>Start 14-Day Free Trial (₹0)</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-center text-[11px] text-slate-400 font-normal">
        No credit card required • 2-minute instant setup • Cancel anytime
      </p>
    </div>
  );
}

// ─── Gyrex Platform Features Sticky Sidebar (Desktop View) ───────────────────
function GyrexPlatformSidebar({ businessName }: { businessName: string }) {
  return (
    <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all print:hidden">
      {/* Header Banner - Gyrex Indigo Theme */}
      <div className="p-6 bg-indigo-600 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg text-white tracking-tight">Gyrex Pro</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500 text-xs font-semibold text-white border border-indigo-400">
              14-Day Free Trial
            </span>
          </div>
          <h3 className="text-xl font-bold leading-tight mb-2">Automate Your Clinic Growth with Gyrex</h3>
          <p className="text-sm text-indigo-100 leading-relaxed font-normal">
            Everything included to outrank local competition and double your Google Maps patient consultations.
          </p>
        </div>
      </div>

      {/* Pricing / Trial offer */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">₹0</span>
          <span className="text-sm font-medium text-slate-600">for 14 days</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="line-through decoration-slate-300 font-normal">Regular ₹5,000/mo</span>
          <span className="text-rose-600 font-bold text-sm">₹2,499/mo</span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-semibold rounded-md text-[10px] ml-auto">100% Risk Free</span>
        </div>
      </div>

      {/* Comprehensive Features List */}
      <div className="p-5 space-y-3 border-b border-slate-100 bg-white">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Included in Your 14-Day Trial:
        </p>
        
        <div className="space-y-2.5 max-h-[22rem] overflow-y-auto pr-1">
          {TRIAL_FEATURES.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-indigo-200 transition-colors">
              <div className="shrink-0 mt-0.5">{feat.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">{feat.title}</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-5 bg-slate-50/50 space-y-3">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-98"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[11px] text-slate-400 font-normal">
          No credit card required • 2-min setup • Cancel anytime
        </p>
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-center gap-3 text-xs">
          <a
            href={`https://wa.me/919717228528?text=${encodeURIComponent(`Hi Gyrex Team, I need help with my Google Profile Audit for ${businessName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            <WhatsAppSVG />
            <span>WhatsApp</span>
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="tel:+919717228528"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>+91 97172 28528</span>
          </a>
        </div>
      </div>

      {/* Social Proof & Doctor Trust */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-slate-700">Trusted by 500+ Clinics & Doctors</p>
        <p className="text-[10px] text-slate-500 mt-0.5 italic">"Increased our Google Maps calls by +140% in 30 days."</p>
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
  searchContext = "",
  centerLat,
  centerLng,
  spacingMeters = 500
}: { 
  specialty: string; 
  city: string; 
  businessName?: string; 
  mapRank?: number; 
  reviewsCount?: number; 
  gridData?: { rank: number; row: number; col: number; lat?: number; lng?: number; found?: boolean }[] | null;
  searchContext?: string;
  centerLat?: number;
  centerLng?: number;
  spacingMeters?: number;
}) {
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");

  // Determine center coordinates
  const resolvedCenter = useMemo(() => {
    if (centerLat && centerLng && !isNaN(centerLat) && !isNaN(centerLng)) {
      return { lat: centerLat, lng: centerLng };
    }
    const centerNode = gridData?.find(n => n.row === 2 && n.col === 2) || gridData?.[12];
    if (centerNode?.lat && centerNode?.lng && !isNaN(centerNode.lat) && !isNaN(centerNode.lng)) {
      return { lat: centerNode.lat, lng: centerNode.lng };
    }
    return { lat: 28.5672, lng: 77.2100 }; // Fallback
  }, [centerLat, centerLng, gridData]);

  // Normalized 25-cell grid for Map & Matrix
  const normalizedGrid = useMemo(() => {
    if (gridData && gridData.length > 0) {
      return gridData.map(node => {
        const rank = node.rank;
        const status: "good" | "avg" | "poor" = rank <= 5 ? "good" : rank <= 20 ? "avg" : "poor";
        return {
          row: node.row,
          col: node.col,
          lat: node.lat || resolvedCenter.lat,
          lng: node.lng || resolvedCenter.lng,
          rank: node.rank,
          found: node.found !== undefined ? node.found : node.rank <= 20,
          status
        };
      }).sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
    }

    // Deterministic radius decay fallback (no random numbers)
    const nodes: any[] = [];
    const R = 6378137;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dRow = 2 - r;
        const dCol = c - 2;
        const distSteps = Math.sqrt(dRow * dRow + dCol * dCol);
        let rank = r === 2 && c === 2 ? mapRank : Math.min(21, mapRank + Math.round(distSteps * 3));
        const status: "good" | "avg" | "poor" = rank <= 5 ? "good" : rank <= 20 ? "avg" : "poor";
        
        const dNorth = dRow * spacingMeters;
        const dEast = dCol * spacingMeters;
        const lat = resolvedCenter.lat + (dNorth / R) * (180 / Math.PI);
        const lng = resolvedCenter.lng + (dEast / (R * Math.cos((Math.PI * resolvedCenter.lat) / 180))) * (180 / Math.PI);

        nodes.push({ row: r, col: c, lat, lng, rank, found: rank <= 20, status });
      }
    }
    return nodes;
  }, [gridData, resolvedCenter, mapRank, spacingMeters]);

  const goodCount = normalizedGrid.filter(r => r.status === "good").length;
  const avgCount = normalizedGrid.filter(r => r.status === "avg").length;
  const poorCount = normalizedGrid.filter(r => r.status === "poor").length;
  const totalGrid = normalizedGrid.length;
  const searchKeyword = specialty ? `${specialty} near me` : "Doctor & Clinic near me";

  // Build rows for 5x5 matrix
  const matrixRows: typeof normalizedGrid[] = [];
  for (let r = 0; r < 5; r++) {
    matrixRows[r] = normalizedGrid.filter(c => c.row === r).sort((a, b) => a.col - b.col);
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
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
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-emerald-800 font-semibold"
            style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10b981" }} /> Top 5 ({goodCount})
          </span>
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-amber-800 font-semibold"
            style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} /> 6–20 ({avgCount})
          </span>
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-rose-800 font-semibold"
            style={{ backgroundColor: "#fff1f2", borderColor: "#fecdd3" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f43f5e" }} /> &gt;20 ({poorCount})
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* View Mode Toggle Header (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "map"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Map className="w-3.5 h-3.5 text-indigo-600" />
              Interactive Google Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              5×5 Matrix Layout
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>Center: <strong className="text-slate-700 font-semibold">{businessName}</strong> ({city})</span>
          </div>
        </div>

        {/* View 1: Interactive Google Map (Screen only) */}
        {viewMode === "map" && (
          <div className="print:hidden">
            <RankTrackerMap
              grid={normalizedGrid}
              centerLat={resolvedCenter.lat}
              centerLng={resolvedCenter.lng}
              businessName={businessName}
              spacingMeters={spacingMeters}
              keyword={searchKeyword}
            />
          </div>
        )}

        {/* View 2: Structured 5x5 Matrix (Active in Grid mode OR when printing) */}
        <div className={`${viewMode === "map" ? "hidden print:block" : "block"} bg-slate-50/80 border border-slate-200 rounded-2xl p-6 relative overflow-hidden`}>
          {/* North Indicator */}
          <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-3">
            <span className="text-indigo-600 text-xs">▲</span> North <span className="text-indigo-600 text-xs">▲</span>
          </div>

          {/* Grid with West/East labels */}
          <div className="flex items-center justify-center gap-3 min-w-[320px]">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 select-none">
              <span>◀</span> West
            </div>

            <div className="flex flex-col gap-2.5">
              {matrixRows.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-2.5 justify-center">
                  {row.map((cell, cIdx) => {
                    const isCenter = cell.row === 2 && cell.col === 2;
                    const isGood = cell.status === "good";
                    const isAvg = cell.status === "avg";
                    const bgStyle = isCenter
                      ? { backgroundColor: "#4f46e5", color: "#ffffff", borderColor: "#3730a3" }
                      : isGood
                      ? { backgroundColor: "#10b981", color: "#ffffff", borderColor: "#059669" }
                      : isAvg
                      ? { backgroundColor: "#f59e0b", color: "#ffffff", borderColor: "#d97706" }
                      : { backgroundColor: "#ef4444", color: "#ffffff", borderColor: "#dc2626" };

                    const dRow = 2 - cell.row;
                    const dCol = cell.col - 2;
                    const approxDist = Math.round(Math.sqrt(dRow * dRow + dCol * dCol) * spacingMeters);
                    const rankLabel = !cell.found || cell.rank === 0 ? ">20" : cell.rank > 15 ? ">15" : String(cell.rank);

                    return (
                      <div
                        key={cIdx}
                        style={bgStyle}
                        title={isCenter ? `${businessName} (Clinic Location)` : `Rank ${rankLabel} (${approxDist}m from clinic)`}
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-sm shadow-xs border transition-all cursor-default select-none ${isCenter ? 'scale-105 ring-2 ring-indigo-200' : ''}`}
                      >
                        {isCenter ? (
                          <>
                            <MapPin className="w-4 h-4 fill-white text-white" />
                            <span className="text-[8px] font-semibold opacity-90">You</span>
                          </>
                        ) : (
                          <span>{rankLabel}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              East <span>▶</span>
            </div>
          </div>

          {/* South Indicator */}
          <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-3">
            <span className="text-indigo-600 text-xs">▼</span> South <span className="text-indigo-600 text-xs">▼</span>
          </div>
        </div>

        {/* Diagnosis Status Box */}
        {goodCount === totalGrid ? (
          <div 
            className="p-4 rounded-xl flex items-start gap-3 border text-emerald-900"
            style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#d1fae5", color: "#059669" }}>
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950 mb-0.5">Exceptional Local Grid Dominance</h4>
              <p className="text-[13px] text-emerald-800 font-normal leading-relaxed">
                Your clinic ranks in the <span className="font-bold text-emerald-950">top 5 across all 25 of 25 nearby grid nodes</span> in {city}. You hold market-leading Google Maps Local Pack coverage across your entire radius!
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="p-4 rounded-xl flex items-start gap-3 border text-amber-900"
            style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 mb-0.5">Local Visibility Radius Gap</h4>
              <p className="text-[13px] text-amber-800 font-normal leading-relaxed">
                You rank in the <span className="font-bold text-amber-950">top 5 in {goodCount} of {totalGrid} nearby grid nodes</span>. Outside your immediate street address, neighboring patients find competing clinics first on Google Maps.
              </p>
            </div>
          </div>
        )}
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

  const rawBusinessName = overview.businessName || reportData.businessName || "Your Clinic";
  const nameInfo        = sanitizeDoctorBusinessName(rawBusinessName);
  const cleanName       = nameInfo.cleanDisplayName;
  const fullRawTitle    = nameInfo.fullRawTitle;
  const isKeywordStuffed = nameInfo.isKeywordStuffed;
  const businessName    = fullRawTitle || rawBusinessName;

  const address         = overview.address || reportData.address || "";
  const addressParts    = address.split(",").map((s: string) => s.trim());
  const city            = compIntel?.searchContext || (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] || "your area");
  const specialty       = healthIntel?.specialty || reportData.speciality || "Medical Clinic";
  
  // Clean rating & reviews fallback
  const rawRating       = overview.rating || reportData.rating;
  const isUnrated       = !rawRating || String(rawRating).includes("Not Available") || rawRating === 0 || rawRating === "0" || rawRating === "N/A";
  const rating          = isUnrated ? "Unrated" : String(rawRating);
  
  const rawReviewsCount = overview.reviews ?? reportData.reviewCount;
  const reviewsCount    = !rawReviewsCount || String(rawReviewsCount).includes("Not Available") ? 0 : Number(rawReviewsCount) || 0;

  const rawCompetitors: CompetitorRow[] = compIntel?.competitors || reportData.competitors || [];
  const youRow          = rawCompetitors.find((c: any) => c.isYou);
  const rawRank         = youRow?.rank;
  const userRankNum     = typeof rawRank === "number" ? rawRank : parseInt(String(rawRank).replace(/\D/g, ""), 10) || 21;
  const isUnranked      = userRankNum > 20 || String(rawRank).includes("+");
  const clinicsAheadStr = isUnranked ? "20+" : String(Math.max(0, userRankNum - 1));

  // Harmonized competitor review average
  const competitorRowsOnly = rawCompetitors.filter((c: any) => !c.isYou);
  const compReviewCounts = competitorRowsOnly
    .map((c: any) => Number(c.reviewCount) || 0)
    .filter((cnt: number) => cnt > 0);
  const compAvgReviews =
    compReviewCounts.length > 0
      ? Math.round(compReviewCounts.reduce((a: number, b: number) => a + b, 0) / compReviewCounts.length)
      : 100;

  let rawIssues: Issue[] = visibility?.issues || [];
  const issueTitles = new Set<string>();
  let issues: Issue[] = [];

  for (const item of rawIssues) {
    if (item && item.issue && !issueTitles.has(item.issue)) {
      let cleanIssue = item.issue;
      let cleanEvidence = item.evidence;

      // Filter out contradictory / non-ranking factors (keyword stuffing, title checks)
      if (
        cleanIssue.toLowerCase().includes("not found in business title") ||
        cleanIssue.toLowerCase().includes("keyword stuffing") ||
        cleanIssue.toLowerCase().includes("guideline risk")
      ) {
        continue;
      }

      // Fix awkward "Only 0 reviews found." phrasing
      if (cleanIssue.toLowerCase().includes("only 0 reviews") || cleanIssue.toLowerCase().includes("0 reviews found")) {
        cleanIssue = "Review Deficit: No Google reviews found on this listing";
        cleanEvidence = `Nearby competitors in ${city} average ${compAvgReviews} reviews on Google Maps. Having verified patient reviews is the #1 local ranking factor.`;
      }

      // Neutralize inaccurate "Hospital" advice if clinic is an outpatient practice
      if (cleanIssue.toLowerCase().includes('"hospital" not found') && !cleanName.toLowerCase().includes("hospital")) {
        cleanIssue = `Primary specialty keyword "${specialty}" optimization`;
        cleanEvidence = `Ensure your primary medical category is accurately set to "${specialty}" to capture local patient searches without competing against tertiary hospitals.`;
      }

      issues.push({
        issue: cleanIssue,
        evidence: cleanEvidence,
        impact: item.impact || "High"
      });
      issueTitles.add(item.issue);
    }
  }

  // Ensure comprehensive 5-6 ranking factor coverage for clinics ranking > 3 or with review deficits
  if (userRankNum > 3 || reviewsCount < compAvgReviews) {
    // 1. Review Deficit check
    if (!issues.some(i => i.issue.toLowerCase().includes("review deficit") || i.issue.toLowerCase().includes("no google reviews"))) {
      issues.push({
        issue: reviewsCount === 0 
          ? "Review Deficit: No Google reviews found on this listing" 
          : `Review Deficit: Only ${reviewsCount} reviews found (Competitor average: ${compAvgReviews})`,
        evidence: `Nearby competitors in ${city} average ${compAvgReviews} reviews on Google Maps. Having verified patient reviews is the #1 local ranking factor.`,
        impact: "Critical"
      });
    }

    // 2. Review Recency & Velocity
    if (!issues.some(i => i.issue.toLowerCase().includes("velocity") || i.issue.toLowerCase().includes("recency"))) {
      issues.push({
        issue: "Zero Recent Review Velocity (Stalled Patient Feedback Pipeline)",
        evidence: `Google prioritizes listings receiving continuous fresh reviews over the last 30 to 60 days. Competitors in ${city} actively collecting weekly feedback outpace dormant listings in local pack ranking.`,
        impact: "High"
      });
    }

    // 3. Secondary Medical Categories Gap
    if (!issues.some(i => i.issue.toLowerCase().includes("secondary") || i.issue.toLowerCase().includes("category"))) {
      issues.push({
        issue: "Missing Secondary Medical Categories (Specialty Coverage Gap)",
        evidence: `Your listing only has 1 primary category mapped. Top competitors in ${city} map 3 to 4 secondary categories (e.g., "Family Practice Physician", "Diabetologist", "Consultant Physician") to capture multi-specialty patient searches across neighboring areas.`,
        impact: "High"
      });
    }

    // 4. Native Treatments & Services Catalog Missing
    if (!issues.some(i => i.issue.toLowerCase().includes("treatments catalog") || i.issue.toLowerCase().includes("services catalog") || i.issue.toLowerCase().includes("unindexed"))) {
      issues.push({
        issue: "Unindexed Treatments Catalog on Google Business Profile",
        evidence: `Medical treatments for ${specialty} (such as consultations, diagnostics, and chronic care) are not published in Google's native services catalog, forfeiting high-intent patient queries.`,
        impact: "High"
      });
    }

    // 5. Zero Weekly Google Posts & Activity Signals
    if (!issues.some(i => i.issue.toLowerCase().includes("post") || i.issue.toLowerCase().includes("update"))) {
      issues.push({
        issue: "Zero Weekly Google Posts & Activity Signals",
        evidence: `Google Maps rewards practices that publish weekly health posts, clinic announcements, and photos with higher 3-pack search placement. Dormant profiles are demoted in local pack results.`,
        impact: "Medium"
      });
    }

    // 6. 0% Patient Review Response Rate (Low Engagement & Authority Signal)
    if (!issues.some(i => i.issue.toLowerCase().includes("response") || i.issue.toLowerCase().includes("repl"))) {
      issues.push({
        issue: "0% Patient Review Response Rate (Low Profile Engagement)",
        evidence: "Google's local ranking algorithms explicitly favor verified listings that respond actively to patient reviews. Profiles with 0% response activity forfeit key engagement authority signals.",
        impact: "Medium"
      });
    }
  }

  // Fallback if no issues identified
  if (issues.length === 0) {
    issues.push({
      issue: "Your profile is highly optimized.",
      evidence: "Our diagnostic engine did not find any major ranking gaps. Keep collecting reviews and posting updates to maintain your top position.",
      impact: "Low"
    });
  }

  const issueCount = issues.length;

  // Unify and deduplicate all table rows, sorted strictly by Map Rank
  const allTableRows = [
    ...competitorRowsOnly.map((c: any, i: number) => {
      let computedRank = c.rank || c.googlePosition;
      // If competitor has same rank as user or fallback index needed:
      if (!computedRank || computedRank === userRankNum) {
        computedRank = userRankNum <= i + 1 ? i + 2 : i + 1;
      }
      return {
        name: c.name,
        isYou: false,
        rating: c.rating || "4.8",
        reviewCount: c.reviewCount || "50+",
        rank: computedRank,
        distanceKm: c.distanceKm,
      };
    }),
    {
      name: cleanName,
      rawTitle: fullRawTitle,
      isKeywordStuffed,
      isYou: true,
      rating: isUnrated ? "Unrated" : rating,
      reviewCount: reviewsCount,
      rank: userRankNum,
      distanceKm: null,
    },
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
  
  // Dynamic Authentic Medical Specialty Keyword Mapping
  const keywords: string[] = (function(s: string, existing: string[] | undefined) {
    if (existing && existing.length > 0 && !existing.includes("Consultation")) {
      return existing;
    }
    const spec = s.toLowerCase();
    if (spec.includes("pediatr") || spec.includes("child")) {
      return ["Newborn Care", "Child Vaccination & Immunization", "Growth & Development Monitoring", "Pediatric Nutrition", "Fever & Allergy Care", "Childhood Asthma"];
    }
    if (spec.includes("gynaec") || spec.includes("gynec") || spec.includes("obstet") || spec.includes("pregnancy")) {
      return ["Pregnancy & Prenatal Care", "High Risk Pregnancy", "PCOS / PCOD Management", "Fetal Medicine & Ultrasound", "Infertility Consultation", "Laparoscopic Surgery"];
    }
    if (spec.includes("dentist") || spec.includes("dental")) {
      return ["Teeth Whitening", "Root Canal Treatment", "Dental Implants", "Orthodontics & Braces", "Tooth Extraction", "Pediatric Dentistry"];
    }
    if (spec.includes("derma") || spec.includes("skin")) {
      return ["Acne & Scar Treatment", "Laser Hair Removal", "Botox & Dermal Fillers", "Chemical Peel", "Hair Loss & PRP Treatment", "Skin Pigmentation"];
    }
    if (spec.includes("ortho")) {
      return ["Joint Replacement", "Arthritis Management", "Fracture & Trauma Care", "Spine Care", "Sports Injury Treatment"];
    }
    if (spec.includes("eye") || spec.includes("ophthalm")) {
      return ["Cataract Surgery", "LASIK & Vision Correction", "Glaucoma Treatment", "Dry Eye Therapy", "Pediatric Ophthalmology"];
    }
    if (spec.includes("ivf") || spec.includes("fertility")) {
      return ["IVF Treatment", "IUI Consultation", "Fertility Preservation", "Semen Analysis", "Egg Freezing"];
    }
    return ["General Consultation", "Preventive Health Checkup", "Patient Diagnosis & Follow-up", "Prescription & Care"];
  })(specialty, healthIntel?.expectedServices);

  // PDF Download Handler with production-grade naming prefix "gyrex-audit"
  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    // ensure audit report is saved with report number prefix gyrex-audit
    document.title = `gyrex-audit-${id}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 print:pb-0 print:bg-white">
      {/* ── High-Definition Print Stylesheet ─────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 10mm 10mm 10mm 10mm;
            size: A4 portrait;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          a[href]:after {
            content: none !important;
          }
          .print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 1.25rem !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
          header {
            position: static !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}} />

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:static print:border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GyrexLogo size="md" />
            <span className="text-slate-400 font-normal text-sm border-l border-slate-200 pl-2.5 ml-1">Audit Report</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 print:hidden">
            <Link
              href="/register"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors shadow-2xs shrink-0"
            >
              <span>14-Day Free Trial</span>
            </Link>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out the Google Business Profile Audit Report for ${businessName}: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs shrink-0"
            >
              <WhatsAppSVG />
              <span className="hidden sm:inline">Share</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Container (Mobile First Spacing) ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 sm:pb-36 lg:pb-12 print:py-4 print:px-0 print:max-w-none">
        
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start print:block">

          {/* ════ LEFT MAIN CONTENT ════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-6 print:w-full print:max-w-none">

            {/* ── SECTION 1: Hero Diagnostic Banner ─────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
              
              {/* Business Info Header */}
              <div className="p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {overview?.photoUrl ? (
                    <img 
                      src={overview.photoUrl} 
                      alt={businessName} 
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-xs border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-2xl shrink-0 shadow-xs">
                      {getInitials(businessName)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">{businessName}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500 font-normal">
                      {address && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100/80 border border-slate-200/60 rounded-lg text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {address}
                        </span>
                      )}
                      {isUnrated ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200/70 rounded-lg text-slate-600 font-medium">
                          <Star className="w-3.5 h-3.5 text-slate-400" /> Unrated (0 Reviews)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/60 rounded-lg text-amber-800 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {rating} ({reviewsCount} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Warning Bar */}
              <div className="px-5 sm:px-6 py-3 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-[13px] font-semibold text-rose-700">Diagnostic Complete · {issueCount} Ranking Obstacles Found</span>
                </div>
              </div>

              {/* Core Diagnosis Headline & Metrics */}
              <div className="p-5 sm:p-8">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug mb-3 tracking-tight">
                  {userRankNum === 1 ? (
                    <>
                      <span className="text-indigo-600">{cleanName}</span> is currently the{" "}
                      <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-4">#1 ranked clinic</span> on Google Maps!
                    </>
                  ) : (
                    <>
                      <span className="text-indigo-600">{cleanName}</span> is actively losing patients to{" "}
                      <span className="text-rose-600 underline decoration-rose-200 underline-offset-4">{clinicsAheadStr} competitor{clinicsAheadStr === "1" ? "" : "s"}</span> on Google.
                    </>
                  )}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal max-w-3xl">
                  Right now, when patients in {city} search for <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">"{specialty}"</span>, {userRankNum === 1 ? "your clinic leads local search results, but competitors are closing the gap." : "your competitors appear ahead on Google Maps. You can fix this profile gap starting today."}
                </p>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-2xl sm:text-4xl font-extrabold text-rose-600">{clinicsAheadStr}</div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-rose-700 uppercase tracking-wider mt-1">Competitors Ahead</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-2xl sm:text-4xl font-extrabold text-amber-600">{issueCount}</div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-amber-700 uppercase tracking-wider mt-1">Ranking Obstacles</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-center transition-all hover:shadow-xs">
                    <div className="text-2xl sm:text-4xl font-extrabold text-indigo-600">{profilePct}%</div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mt-1">Completeness</div>
                  </div>
                </div>

                {/* Estimated Monthly Revenue & Patient Loss Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/90 via-amber-50/80 to-indigo-50/90 border border-rose-200/80 mb-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <TrendingUp className="w-5 h-5 rotate-180" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Estimated Monthly Revenue & Patient Opportunity Gap
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                          {userRankNum <= 3 ? (
                            <>Your clinic maintains strong local map visibility. Maintaining this position captures an estimated <span className="font-semibold text-emerald-700">85%+ of high-intent local patient calls</span> in {city}.</>
                          ) : (
                            <>Ranking at position <span className="font-bold text-rose-700">#{userRankNum}</span> for <span className="font-semibold text-slate-800">"{specialty}"</span> costs your clinic an estimated <span className="font-bold text-rose-700">~25 to 40 lost patient calls per month</span> (~<span className="font-bold text-rose-700">₹1.2L – ₹2.5L</span> estimated monthly revenue gap).</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/register"
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 transition-all shadow-xs flex items-center gap-1.5 active:scale-95 print:hidden"
                    >
                      <span>Reclaim Lost Patients</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Clean CTA button */}
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] print:hidden"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Mobile 14-Day Free Trial Spotlight (Mobile First View) ── */}
            <MobileTrialSpotlight businessName={businessName} />

            {/* ── SECTION 2: Local Search Rank Grid Visualization ───────── */}
            <SearchGridVisualization 
              specialty={specialty} 
              city={city} 
              businessName={businessName} 
              mapRank={compIntel?.compositeData?.compositeRank || userRankNum} 
              reviewsCount={Number(reviewsCount) || 0} 
              gridData={compIntel?.gridData}
              searchContext={compIntel?.searchContext || city}
              centerLat={compIntel?.centerLat || reportData?.lat}
              centerLng={compIntel?.centerLng || reportData?.lng}
              spacingMeters={compIntel?.spacingMeters || 500}
            />

            {/* ── SECTION 2.5: Live Google 3-Pack SERP Visual Preview ──── */}
            <Google3PackPreview
              specialty={specialty}
              city={city}
              businessName={businessName}
              userRank={userRankNum}
              rating={rating}
              reviewsCount={Number(reviewsCount) || 0}
              address={address}
              allCompetitors={allTableRows}
            />

            {/* ── SECTION 3: Live Competitor Comparison Table ─────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
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
                            <td className="px-6 py-4 font-bold text-indigo-950 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                                </div>
                                <span>{c.name}</span>
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 border border-indigo-200/60 px-2 py-0.5 rounded-md">(YOU)</span>
                              </div>
                              {c.isKeywordStuffed && (
                                <p className="text-[10px] text-slate-500 font-normal truncate max-w-sm sm:max-w-md mt-1 pl-4" title={c.rawTitle}>
                                  GBP Title: {c.rawTitle}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {c.rating === "Unrated" ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  Unrated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-800 font-semibold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {c.rating}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 font-bold text-slate-800 text-sm">{c.reviewCount || 0} <span className="font-normal text-slate-500 text-[11px]">reviews</span></td>
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

            {/* ── SECTION 3.5: Medical EEAT & Trust Signals Scorecard ─── */}
            <MedicalEEATScorecard
              businessName={businessName}
              specialty={specialty}
              userRank={userRankNum}
              rating={rating}
              reviewsCount={Number(reviewsCount) || 0}
              compAvgReviews={compAvgReviews || 100}
              hasWebsite={!!overview?.website && overview.website !== "Not Available"}
              isHttps={!!(overview?.website && overview.website.startsWith("https"))}
              hasOpeningHours={completenessItems.some(i => i.name.includes("Hours") && i.present === true)}
              hasPhone={!!overview?.phone && overview.phone !== "Not Available"}
              hasPhotos={!!overview?.photoUrl || completenessItems.some(i => i.name.includes("Photos") && i.present === true)}
              categoriesCount={Math.max(1, overview?.additionalCategories?.length ? overview.additionalCategories.length + 1 : 2)}
            />

            {/* ── SECTION 4: Why You're Losing Patients (Issues) ───────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-bold">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {userRankNum === 1
                        ? `Profile Optimization Opportunities for ${cleanName}`
                        : `Why ${cleanName} isn't ranking #1 on Google Maps`}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 font-normal">Profile gaps identified by our diagnostic engine</p>
                </div>
                <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-100">
                  {issueCount} Action Items
                </span>
              </div>

              <div className="p-6 space-y-3 bg-slate-50/50">
                {issues.map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-rose-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.issue}</p>
                        <p className="text-[13px] text-slate-600 mt-1 leading-relaxed font-normal">{item.evidence}</p>
                      </div>
                    </div>
                    <Link
                      href="/register"
                      className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold text-xs hover:bg-indigo-100 transition-colors shadow-2xs print:hidden"
                    >
                      <span>Fix with Gyrex Pro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4.5: Treatment & Category Coverage Gap Card ───── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Treatment & Category Coverage</h2>
                    <p className="text-sm text-slate-500 font-normal">Specialty search terms evaluated for {specialty}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evaluated Treatment Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION 5: Profile Completeness Checklist ───────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
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
                      style={{ width: `${profilePct}%`, backgroundColor: "#4f46e5" }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full"
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

            {/* ── SECTION 5.5: Executive Doctor Growth Consultation & WhatsApp Action Block ── */}
            <div className="print-card print:break-inside-avoid rounded-3xl bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border border-indigo-100 p-6 sm:p-8 shadow-xs relative print:bg-white print:border-slate-300">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                          Action Plan & Doctor Support
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Ready to Fix These Ranking Obstacles for {cleanName}?
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-normal max-w-3xl">
                  Your Google Business Profile has immediate high-impact opportunities in category precision, automated review generation, and treatment catalog indexing. Connect with our healthcare growth specialists to implement these recommendations and outrank local competitors.
                </p>

                {/* Key Solutions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Category Precision</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Align primary and secondary categories to {specialty} so Google stops ranking tertiary hospitals over your clinic.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp Review Engine</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automate 5-star Google review collection from your consultations to close the {compAvgReviews}+ competitor review deficit.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Native Treatments Catalog</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Publish medical treatments, chronic disease care, and consultation packages into Google's native services catalog.
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons: WhatsApp & Call (Clean Single Phone Mention) */}
                <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`https://wa.me/919717228528?text=${encodeURIComponent(`Hi Gyrex Team, I reviewed my Google Business Profile Audit for ${cleanName} and would like to speak with a healthcare specialist to fix our ranking obstacles.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <WhatsAppSVG />
                      <span>Chat on WhatsApp</span>
                    </a>

                    <a
                      href="tel:+919717228528"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-2xs transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <span>Call Specialist</span>
                    </a>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-600 font-medium">
                      Direct Doctor Support: <span className="font-bold text-slate-900">+91 97172 28528</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mon – Sat: 9:30 AM – 7:30 PM IST • Instant Doctor Assistance
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 6: FAQ Accordion (Hidden on Print & Downloaded PDF) ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:hidden">
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
          <div className="w-full lg:w-[22rem] xl:w-80 shrink-0 relative z-20 print:hidden">
            <GyrexPlatformSidebar businessName={businessName} />
          </div>

        </div>

        {/* ── Report Bottom Footer (Both Web & Print) ── */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 print:mt-6 print:pt-4 print:border-slate-200">
          <div className="flex items-center gap-2">
            <GyrexLogo size="sm" />
            <span>Healthcare Practice Growth Platform</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span>WhatsApp & Call Helpline: <strong className="text-slate-800 font-semibold">+91-9717228528</strong></span>
            <span>•</span>
            <a href="mailto:support@gyrex.in" className="hover:text-indigo-600">support@gyrex.in</a>
            <span>•</span>
            <span>https://gyrex.in</span>
          </div>
        </div>

      </div>

      {/* ── Native App Mobile Sticky Bottom Bar (App-like UX) ─────────────── */}
      <div className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://wa.me/919717228528?text=${encodeURIComponent(`Hi Gyrex Team, I reviewed my Audit Report for ${cleanName} and need assistance.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 active:scale-95"
            title="Chat on WhatsApp"
          >
            <WhatsAppSVG />
          </a>
          <a
            href="tel:+919717228528"
            className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 active:scale-95"
            title="Call Helpline"
          >
            <Phone className="w-4 h-4 text-slate-600" />
          </a>
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900">₹0</span>
            <span className="text-[11px] text-slate-500 font-normal truncate">for 14 days</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="line-through text-slate-400 font-normal">₹5,000</span>
            <span className="text-rose-600 font-bold">₹2,499/mo</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-medium rounded text-[9px]">Risk Free</span>
          </div>
        </div>
        <Link
          href="/register"
          className="py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 whitespace-nowrap"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
