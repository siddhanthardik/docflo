"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity, Star, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, TrendingUp,
  TrendingDown, MapPin, BarChart3, MessageSquare, Eye, Calendar, ArrowRight,
  Check, X, Users, Zap, Clock, ChevronRight, Phone, Globe, Camera, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

// ── Scoring helper ──────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">/100</span>
      </div>
    </div>
  );
}

// ── Metric Bar ──────────────────────────────────────────────────
function MetricBar({ label, yours, topCompetitor, unit = "" }: { label: string; yours: number | string; topCompetitor: number | string; unit?: string }) {
  const y = typeof yours === "number" ? yours : 0;
  const t = typeof topCompetitor === "number" ? topCompetitor : 100;
  const pct = Math.min(Math.round((y / (t || 1)) * 100), 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-500";

  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          <span className="font-bold text-slate-900">{yours}{unit}</span>
          <span className="text-slate-300 mx-1">vs</span>
          <span className="text-slate-500">Top: {topCompetitor}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Issue Item ─────────────────────────────────────────────────
function IssueItem({ title, desc, severity }: { title: string; desc: string; severity: "critical" | "warning" | "info" }) {
  const styles = {
    critical: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Critical" },
    warning: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Warning" },
    info: { dot: "bg-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Tip" },
  }[severity];

  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
      <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${styles.badge}`}>
            {styles.label}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Checklist Item ──────────────────────────────────────────────
function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100" : "bg-rose-50"}`}>
        {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-400" />}
      </div>
      <span className={`text-sm ${done ? "text-slate-700" : "text-slate-400 line-through decoration-rose-300"}`}>{label}</span>
    </div>
  );
}

// ── Main Report Content ─────────────────────────────────────────
function ReportPageContent() {
  const searchParams = useSearchParams();
  const rawQ = searchParams.get("q") || "Your Clinic";
  const clinicName = searchParams.get("name") || decodeURIComponent(rawQ).split(",")[0];
  const address = searchParams.get("address") || "New Delhi, India";

  const [profileScore, setProfileScore] = useState(0);
  const [reputationScore, setReputationScore] = useState(0);
  const [seoScore, setSeoScore] = useState(0);

  useEffect(() => {
    // Animate scores in
    const t = setTimeout(() => {
      setProfileScore(65);
      setReputationScore(42);
      setSeoScore(38);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const overallScore = Math.round((profileScore + reputationScore + seoScore) / 3);

  const competitors = [
    { rank: 1, name: "Dr. Sharma Multi-Specialty Clinic", specialty: "General Physician", rating: 4.9, reviews: 412, monthlyReviews: 18 },
    { rank: 2, name: "CityCare Healthcare Center", specialty: "Multi-Specialty", rating: 4.8, reviews: 284, monthlyReviews: 12 },
    { rank: 3, name: "Apex Medical Associates", specialty: "General Physician", rating: 4.7, reviews: 195, monthlyReviews: 9 },
    { rank: 5, name: "HealthFirst Clinic", specialty: "General Physician", rating: 4.6, reviews: 120, monthlyReviews: 5 },
    { rank: 11, name: clinicName, specialty: "General Physician", rating: 4.2, reviews: 34, monthlyReviews: 1.2, isYou: true },
  ];

  const issues = [
    { title: "Primary medical category is too generic", desc: `"Doctor" is a very broad category. Clinics ranking in top 3 use specific categories like "General Practitioner", "Family Medicine Physician", or their specialist type. This directly limits which patient searches surface your profile.`, severity: "critical" as const },
    { title: "Review velocity far below local average", desc: `You receive approximately 1.2 new reviews per month. The top 3 clinics average 13 reviews/month. Google's local ranking algorithm heavily weights this as an engagement signal, treating high-velocity profiles as "more active" businesses.`, severity: "critical" as const },
    { title: "Unanswered patient reviews detected", desc: "14 of your reviews have no reply. Research shows 89% of patients read business replies to reviews before choosing a healthcare provider. Every unanswered review is a lost potential patient.", severity: "critical" as const },
    { title: "Appointment booking link not configured", desc: "Google allows direct 'Book an Appointment' links in your GBP. This feature reduces patient friction by 60% and is a confirmed ranking signal. None of your competitors in the top 5 are missing this.", severity: "warning" as const },
    { title: "Medical services list is incomplete", desc: "You have 3 services listed. The top local clinics list 15-25 specific medical services (e.g., Telehealth, Vaccinations, Blood Tests, ECG). Each service term is an additional keyword that can surface your profile.", severity: "warning" as const },
  ];

  const profileItems = [
    { label: "Business Title with Specialty Keywords", done: false },
    { label: "Primary & Secondary Medical Categories", done: false },
    { label: "Detailed Business Description", done: true },
    { label: "Complete Address & Service Area", done: true },
    { label: "Phone Number & Website URL", done: true },
    { label: "Accurate Business Hours", done: true },
    { label: "Direct Appointment Booking Link", done: false },
    { label: "Medical Services Menu (15+ items)", done: false },
    { label: "Logo & Cover Photo (High Resolution)", done: true },
    { label: "Interior & Exterior Photos", done: false },
    { label: "Q&A Section Populated", done: false },
    { label: "Telehealth / Virtual Consultation Option", done: false },
  ];

  const completedCount = profileItems.filter((i) => i.done).length;
  const completionPct = Math.round((completedCount / profileItems.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GyrexLogo size="lg" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full font-mono">
              Report #DF-{Math.floor(Math.random() * 900000 + 100000)}
            </span>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 px-4 text-sm font-semibold shadow-sm shadow-blue-500/20">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Clinic Header Card ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0 text-2xl font-black text-teal-700">
            {clinicName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{clinicName}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" /> {address}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
                ))}
                <span className="text-sm text-slate-700 font-bold ml-1">4.2</span>
                <span className="text-sm text-slate-400 ml-1">(34 reviews)</span>
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-2 rounded-xl">
              <AlertTriangle className="h-4 w-4" /> 5 Issues Detected
            </div>
            <p className="text-xs text-slate-400 mt-2">Scanned on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main Content Column ─────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* ── Score Summary Cards ─────────────────── */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Profile Score", score: profileScore, icon: <Eye className="h-4 w-4" />, color: "text-amber-500" },
                { label: "Reputation Score", score: reputationScore, icon: <Star className="h-4 w-4" />, color: "text-rose-500" },
                { label: "SEO / Visibility", score: seoScore, icon: <Globe className="h-4 w-4" />, color: "text-rose-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4">{s.label}</p>
                  <ScoreRing score={s.score} size={100} />
                  <div className={`flex items-center justify-center gap-1 mt-4 text-xs font-bold ${s.color}`}>
                    <TrendingDown className="h-3.5 w-3.5" />
                    Needs Attention
                  </div>
                </div>
              ))}
            </div>

            {/* ── Opportunity Statement ───────────────── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
              <p className="text-teal-400 text-xs font-black uppercase tracking-widest mb-3">Patient Acquisition Analysis</p>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
                An estimated <span className="text-teal-400">45 patients</span> searched for a{" "}
                <span className="text-teal-400">clinic like yours</span> this month — and chose a competitor.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                You rank #11 locally for your specialty. Patients rarely scroll past position 5. The good news: our analysis shows you can reach the <strong className="text-white">Top 3 within 8 weeks</strong> by fixing the 5 issues below.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
                <div>
                  <p className="text-2xl font-black text-rose-400 mb-0.5">11th</p>
                  <p className="text-xs text-slate-400">Local Rank</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-400 mb-0.5">5</p>
                  <p className="text-xs text-slate-400">Issues Found</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-teal-400 mb-0.5">Top 3</p>
                  <p className="text-xs text-slate-400">Achievable Rank</p>
                </div>
              </div>
            </div>

            {/* ── Competitor Intelligence ─────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  Local Competitor Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-1">Clinics competing for the same patients in your area</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-3">Clinic</th>
                      <th className="text-center px-4 py-3">Rank</th>
                      <th className="text-center px-4 py-3">Rating</th>
                      <th className="text-center px-4 py-3">Reviews</th>
                      <th className="text-center px-4 py-3 hidden md:table-cell">Reviews/Mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c) => (
                      <tr key={c.name} className={c.isYou ? "bg-rose-50/60 border-y border-rose-100" : "hover:bg-slate-50 border-b border-slate-50"}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${c.isYou ? "bg-rose-200 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-semibold ${c.isYou ? "text-rose-700" : "text-slate-900"}`}>
                                {c.name} {c.isYou && <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-md ml-1">YOU</span>}
                              </p>
                              <p className="text-xs text-slate-400">{c.specialty}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-4 py-4">
                          <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black ${c.isYou ? "bg-rose-500 text-white" : c.rank <= 3 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {c.rank}
                          </span>
                        </td>
                        <td className="text-center px-4 py-4">
                          <span className="flex items-center justify-center gap-1 font-bold text-slate-900">
                            <Star className={`h-3.5 w-3.5 ${c.isYou ? "text-amber-400" : "text-amber-400"} fill-current`} />
                            {c.rating}
                          </span>
                        </td>
                        <td className="text-center px-4 py-4 font-semibold text-slate-700">{c.reviews}</td>
                        <td className="text-center px-4 py-4 hidden md:table-cell">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.isYou ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {c.monthlyReviews}/mo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Performance Benchmarks ──────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                Performance vs. Top Clinics in Your Area
              </h3>
              <MetricBar label="Monthly New Reviews" yours={1.2} topCompetitor={18} unit="" />
              <MetricBar label="Review Reply Rate (%)" yours={40} topCompetitor={95} unit="%" />
              <MetricBar label="GBP Services Listed" yours={3} topCompetitor={22} unit="" />
              <MetricBar label="Photos on Profile" yours={6} topCompetitor={45} unit="" />
              <MetricBar label="Q&A Responses" yours={0} topCompetitor={18} unit="" />
            </div>

            {/* ── Issues Breakdown ────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-rose-500" />
                    5 Issues Hurting Your Visibility
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Fix these to unlock significant ranking improvements</p>
                </div>
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full">5 Found</span>
              </div>
              <div className="px-6 py-2">
                {issues.map((issue, i) => <IssueItem key={i} {...issue} />)}
              </div>
            </div>

            {/* ── Profile Checklist ───────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    Google Business Profile Completeness
                  </h3>
                  <span className={`text-2xl font-black ${completionPct >= 75 ? "text-emerald-600" : completionPct >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${completionPct >= 75 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-400" : "bg-rose-500"}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">{completedCount} of {profileItems.length} fields complete</p>
              </div>
              <div className="px-6 py-4 grid sm:grid-cols-2 gap-x-8">
                {profileItems.map((item) => <CheckItem key={item.label} {...item} />)}
              </div>
            </div>

          </div>

          {/* ── Sidebar ─────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Pricing CTA */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden text-white shadow-xl">
                <div className="py-2.5 text-center text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  🚀 Start Your Free Trial
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-center mb-1">Gyrex AI</h3>
                  <p className="text-slate-400 text-center text-xs mb-5">Fix all 5 issues. Automate your growth.</p>

                  <div className="text-center mb-5">
                    <p className="text-slate-500 text-xs line-through">₹30,000 / year</p>
                    <p className="text-4xl font-black mt-1">Free<span className="text-lg font-medium text-slate-400"> for 14 days</span></p>
                    <div className="inline-block bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full mt-2">
                      Then just ₹833/mo
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {[
                      "Automated Review Collection (WhatsApp)",
                      "AI-Written Review Replies",
                      "Weekly Medical GBP Posts",
                      "Profile SEO Rewrite by Experts",
                      "Local Rank Tracker (Map View)",
                      "Competitor Monitoring Dashboard",
                      "Patient CRM & Appointment Manager",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-blue-400" />
                        </div>
                        <span className="text-xs text-slate-300">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/register">
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm shadow-lg shadow-blue-600/30">
                      Start 14-Day Free Trial <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-slate-600 mt-3">No contracts · Cancel anytime</p>
                </div>
              </div>

              {/* Urgency / Social Proof */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" /> Recent Results
                </h4>
                {[
                  { clinic: "HealthFirst Dental, Pune", result: "4.1 → 4.9 in 6 weeks" },
                  { clinic: "Sunrise Paediatrics, Delhi", result: "Rank 14 → Rank 2" },
                  { clinic: "Meenakshi Eye Care, Chennai", result: "+82 reviews in 60 days" },
                ].map((r) => (
                  <div key={r.clinic} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{r.clinic}</p>
                      <p className="text-xs text-emerald-600 font-bold">{r.result}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-teal-600 animate-spin" />
          <p className="text-slate-600 font-medium">Generating your practice report…</p>
        </div>
      </div>
    }>
      <ReportPageContent />
    </Suspense>
  );
}
