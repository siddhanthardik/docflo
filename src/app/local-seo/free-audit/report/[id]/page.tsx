"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, XCircle, Star, MapPin, Phone, Globe,
  AlertTriangle, Trophy, ChevronDown, ChevronUp, ArrowRight, X,
  Building2, TrendingUp, Search
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CompetitorRow { name: string; isYou?: boolean; rating: number | string; reviewCount: number | string; rank?: number; }
interface Issue { issue: string; evidence: string; impact: string; }
interface CheckItem { name: string; present: boolean | null; }
interface SnapshotMetric { id: string; label: string; observed: string | number; benchmark: string | number; }

const FAQ_ITEMS = [
  {
    q: "Why does my competitor rank higher even with fewer reviews?",
    a: "Google's ranking algorithm weighs category relevance, profile completeness, and posting frequency equally alongside review count. A competitor with a complete profile and active weekly posts can outrank a clinic with more reviews."
  },
  {
    q: "How long does it take to see ranking improvements after fixing my profile?",
    a: "Profile changes like adding categories, description, and services are typically reflected within 1–2 weeks. Review velocity improvements take 4–8 weeks to show measurable ranking gains."
  },
  {
    q: "What is the single most impactful change I can make today?",
    a: "Adding a keyword-rich business description and 2–3 additional categories aligned with patient search terms delivers the fastest visibility improvement with zero cost."
  },
  {
    q: "Do Google Posts actually affect local rankings?",
    a: "Yes. Weekly Google Posts signal profile activity to Google's local algorithm, which favors businesses that update their profile regularly. Clinics with active posting show up to 32% more map pack appearances."
  },
  {
    q: "Why is my Google Business Profile not showing up in nearby searches?",
    a: "The most common reasons are: an incomplete profile (missing description, services, categories), low review velocity compared to competitors, and no recent Google Posts signalling activity."
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function countIssues(visibility: any, completeness: any): number {
  const visIssues = visibility?.issues?.length || 0;
  const missing = completeness?.items?.filter((i: CheckItem) => i.present === false).length || 0;
  return visIssues + missing;
}

function completenessPercent(items: CheckItem[]): number {
  if (!items?.length) return 0;
  const known = items.filter(i => i.present !== null);
  if (!known.length) return 0;
  return Math.round((known.filter(i => i.present === true).length / known.length) * 100);
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-semibold text-slate-700 leading-snug">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <p className="pb-4 text-sm text-slate-500 leading-relaxed">{a}</p>}
    </div>
  );
}

function CtaSidebar({ businessName }: { businessName: string }) {
  return (
    <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 bg-indigo-600 text-white">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1.5">Limited Offer</div>
        <h3 className="text-base font-bold leading-snug">Fix these issues automatically — every week.</h3>
      </div>

      {/* Pricing */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-end gap-2 mb-1">
          <span className="text-3xl font-black text-indigo-600">₹0</span>
          <span className="text-sm font-semibold text-slate-500 pb-1">for 14 days</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="line-through">₹2,999/month</span>
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">FREE TRIAL</span>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Create your free DocFlo account, connect your GBP, and let our AI engine fix your profile automatically.
        </p>
      </div>

      {/* Features */}
      <div className="px-5 py-4 space-y-2 border-b border-slate-100">
        {[
          "Auto-optimise your GBP profile",
          "Weekly Google Posts published",
          "Review collection on WhatsApp",
          "Competitor tracking dashboard",
          "Keyword ranking alerts",
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-5">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-indigo-300/30"
        >
          Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-[11px] text-slate-400 mt-2.5">No credit card · Cancel anytime</p>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Activity className="w-7 h-7 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Loading your diagnostic report…</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Report not found.
      </div>
    );
  }

  // ── parse sections ────────────────────────────────────────────────────────
  const overview      = (reportData.businessOverview       || {}) as any;
  const snapshot      = (reportData.businessSnapshot       || {}) as any;
  const visibility    = (reportData.visibilityIssues       || {}) as any;
  const compIntel     = (reportData.competitorIntelligence || {}) as any;
  const completeness  = (reportData.profileCompleteness    || {}) as any;
  const healthIntel   = (reportData.healthcareIntelligence || {}) as any;
  const priorityPlan  = (reportData.priorityActionPlan     || {}) as any;

  const businessName    = overview.businessName || reportData.businessName || "Your Clinic";
  const issueCount      = countIssues(visibility, completeness);
  const compCount       = compIntel?.competitors?.filter((c: any) => !c.isYou).length || 0;
  const profilePct      = completenessPercent(completeness?.items || []);
  const completenessItems: CheckItem[] = completeness?.items || [];
  const competitors: CompetitorRow[] = compIntel?.competitors || [];
  const issues: Issue[] = visibility?.issues || [];
  const keywords: string[] = healthIntel?.expectedServices || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-700 font-black text-base tracking-tight">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            DocFlo
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GBP Diagnostic Report</span>
          <Link href="/local-seo/free-audit" className="text-xs font-semibold text-indigo-600 hover:underline hidden sm:block">
            Change business
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ════ LEFT COLUMN ════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── SCREEN 1: Hero Diagnosis ───────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Business header */}
              <div className="p-5 flex items-start gap-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-indigo-700">{getInitials(businessName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-slate-800 truncate">{businessName}</h1>
                  {overview.address && overview.address !== "Not Available" && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{overview.address}</span>
                    </div>
                  )}
                  {overview.rating && overview.rating !== "Not Available" && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-600">{overview.rating} ({overview.reviews} reviews)</span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-500 capitalize">
                  {overview.businessStatus === "OPERATIONAL" ? "✓ Active" : overview.businessStatus || "Active"}
                </span>
              </div>

              {/* Issue alert */}
              <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-semibold text-rose-600">Report ready · {issueCount} issues found</span>
              </div>

              {/* Main message */}
              <div className="p-5">
                <p className="text-lg font-bold text-slate-800 leading-snug mb-1">
                  <span className="text-slate-900">{businessName}</span> is losing patients to{" "}
                  <span className="text-rose-600 font-black">{compCount} competitors</span> on Google.
                </p>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Right now — when patients search for your specialty in your area, your competitors appear first.{" "}
                  <a href="#issues" className="text-indigo-600 font-semibold hover:underline">You can start fixing this today.</a>
                </p>

                {/* 3 KPI stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="text-2xl font-black text-rose-600">{compCount}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Competitors<br />Ranking Higher</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-2xl font-black text-amber-600">{issueCount}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Issues Hurting<br />Your Ranking</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-2xl font-black text-indigo-600">{profilePct}%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Profile<br />Complete</div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md shadow-indigo-300/30"
                >
                  Start Free 14-Day Trial — ₹0 Today <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── SCREEN 2: Who's Beating You ───────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-800">Who's beating you on Google</h2>
                </div>
              </div>

              {compCount > 0 && (
                <div className="mx-5 mt-4 mb-2 flex items-center gap-3 p-3.5 bg-rose-600 rounded-xl">
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{compCount} businesses near you</p>
                    <p className="text-xs text-rose-200">rank higher on Google — and they're getting your patients.</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.filter((c: any) => !c.isYou).map((c: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">{c.name}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{c.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">{c.reviewCount}</td>
                      </tr>
                    ))}
                    {/* "You" row */}
                    {competitors.filter((c: any) => c.isYou).map((c: any, i: number) => (
                      <tr key={`you-${i}`} className="bg-indigo-50 border border-indigo-200 rounded-xl">
                        <td className="px-5 py-3 font-bold text-indigo-800 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                          {c.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{c.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-rose-600 font-black">{c.reviewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 text-center text-[11px] text-slate-400 border-t border-slate-100">
                Based on live Google data for your specialty and city
              </div>
            </div>

            {/* ── SCREEN 3: Why You're Not Ranking ──────────────────── */}
            <div id="issues" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800">Why {businessName} isn't ranking</h2>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-600 text-[11px] font-black rounded-full">
                    {issueCount} issues
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {issues.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{item.issue}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.evidence}</p>
                    </div>
                  </div>
                ))}
                {/* Profile-based issues from completeness */}
                {completenessItems.filter(i => i.present === false).slice(0, 4).map((item, i) => (
                  <div key={`ci-${i}`} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">{item.name} not found on profile</p>
                      <p className="text-xs text-slate-500 mt-0.5">Missing {item.name.toLowerCase()} reduces your profile completeness and visibility.</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtle CTA below issues */}
              <div className="mx-5 mb-5 p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-indigo-800">Want us to fix all {issueCount} issues automatically?</p>
                  <p className="text-xs text-indigo-600 mt-0.5">14-day free trial · No credit card needed.</p>
                </div>
                <Link
                  href="/register"
                  className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                >
                  Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* ── SCREEN 4: Keyword Grid ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-base font-bold text-slate-800">Keywords patients search for you</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Searching for: <span className="font-semibold text-slate-700">"{healthIntel?.specialty}"</span> in your area
                </p>
              </div>
              <div className="p-5">
                {keywords.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {keywords.map((kw: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">{kw}</span>
                          <span className="text-[10px] text-rose-500 font-bold">Not Ranking</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Good — Top 5</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Average — 6–20</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Poor — Beyond 20</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">Keyword data unavailable for this specialty.</p>
                )}
              </div>
            </div>

            {/* ── SCREEN 5: Profile Completeness ────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-base font-bold text-slate-800">Profile completeness</h2>
                </div>
              </div>
              <div className="p-5">
                {/* Percentage display */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-black text-indigo-600">{profilePct}%</div>
                  <p className="text-xs text-slate-500 mt-1">{businessName}'s profile is filled in</p>
                  <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden max-w-sm mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${profilePct}%` }}
                    />
                  </div>
                </div>
                {/* Two-column checklist */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                  {completenessItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.present === true ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : item.present === false ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                      )}
                      <span className={`text-sm ${item.present === true ? "text-slate-600" : item.present === false ? "text-slate-500" : "text-slate-400"}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── FAQ Section ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-800">Common questions</h2>
              </div>
              <div className="px-5">
                {FAQ_ITEMS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
              </div>
            </div>

          </div>

          {/* ════ RIGHT COLUMN — Sticky Sidebar ═════════════════════════ */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0">
            <CtaSidebar businessName={businessName} />
          </div>

        </div>
      </div>

    </div>
  );
}
