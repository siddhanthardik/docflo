"use client";

import { useState } from "react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Zap, RefreshCw, Search,
  LayoutDashboard, MapPin, Users, ShieldCheck, ChevronRight,
  Eye, Globe, Phone, Navigation, CalendarCheck2, Info, ArrowUpRight,
  CheckCircle2, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { ProfileHealth } from "./ProfileHealth";
import { Reputation } from "./Reputation";
import { PostingActivity } from "./PostingActivity";
import { KeywordInsights } from "./KeywordInsights";
import { CompetitorInsights } from "./CompetitorInsights";
import { GoogleQA } from "./GoogleQA";
import ServiceInsights from "./ServiceInsights";
import { SearchGrid } from "./SearchGrid";
import { RecommendationsList } from "./RecommendationsList";

type Tab = "overview" | "rank-tracker" | "competitors" | "profile-health" | "recommendations";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "rank-tracker", label: "Rank Tracker", icon: <MapPin className="w-4 h-4" /> },
  { id: "competitors", label: "Competitors", icon: <Users className="w-4 h-4" /> },
  { id: "profile-health", label: "Profile Health", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "recommendations", label: "Recommendations", icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
];

// ── Compact Local Visibility Score (Half Gauge Arc) ─────────────────────────
function CompactVisibilityScore({ score, status }: { score: number; status: string }) {
  const R = 60;
  const circumference = Math.PI * R;
  const strokeColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const bgColor = score >= 80 ? "#d1fae5" : score >= 50 ? "#fef3c7" : "#fee2e2";
  const badgeTextColor = score >= 80 ? "#047857" : score >= 50 ? "#b45309" : "#b91c1c";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Visibility Score</h3>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
          <div className="absolute right-0 top-6 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-10">
            Calculated from your Google search rankings, review strength, and profile completeness.
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center my-2">
        <div className="relative">
          <svg width="170" height="95" viewBox="0 0 170 95">
            <path
              d="M 15 85 A 70 70 0 0 1 155 85"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 15 85 A 70 70 0 0 1 155 85"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * Math.min(score, 100)) / 100}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <text x="85" y="72" textAnchor="middle" fontSize="32" fontWeight="800" fill="#111827">
              {score}
            </text>
            <text x="85" y="88" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9ca3af">
              / 100
            </text>
          </svg>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-1"
          style={{ backgroundColor: bgColor, color: badgeTextColor }}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-gray-500">
        <span>Benchmark rank</span>
        <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
          Top 30% Local Clinics
        </span>
      </div>
    </div>
  );
}

// ── Google Performance Compact Card ───────────────────────────────────────
function GooglePerformanceCompact({ performanceData }: { performanceData: any }) {
  let desktopSearch = 0, mobileSearch = 0, desktopMaps = 0, mobileMaps = 0;
  let websiteClicks = 0, callClicks = 0, directionRequests = 0, bookings = 0;

  if (performanceData?.multiDailyMetricTimeSeries) {
    for (const multiSeries of performanceData.multiDailyMetricTimeSeries) {
      if (!multiSeries.dailyMetricTimeSeries) continue;
      for (const series of multiSeries.dailyMetricTimeSeries) {
        let sum = 0;
        if (series.timeSeries?.datedValues) {
          for (const val of series.timeSeries.datedValues) {
            sum += parseInt(val.value || "0", 10);
          }
        }
        switch (series.dailyMetric) {
        case "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH": desktopSearch = sum; break;
        case "BUSINESS_IMPRESSIONS_MOBILE_SEARCH": mobileSearch = sum; break;
        case "BUSINESS_IMPRESSIONS_DESKTOP_MAPS": desktopMaps = sum; break;
        case "BUSINESS_IMPRESSIONS_MOBILE_MAPS": mobileMaps = sum; break;
        case "WEBSITE_CLICKS": websiteClicks = sum; break;
        case "CALL_CLICKS": callClicks = sum; break;
        case "BUSINESS_DIRECTION_REQUESTS": directionRequests = sum; break;
        case "BUSINESS_BOOKINGS": bookings = sum; break;
        }
      }
    }
  }

  const totalViews = desktopSearch + mobileSearch + desktopMaps + mobileMaps;
  const pieData = [
    { name: "Search Mobile", value: mobileSearch, color: "#f59e0b" },
    { name: "Search Desktop", value: desktopSearch, color: "#3b82f6" },
    { name: "Maps Mobile", value: mobileMaps, color: "#ef4444" },
    { name: "Maps Desktop", value: desktopMaps, color: "#10b981" },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-gray-900">Google Performance</h3>
        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium">Last 30 Days</span>
      </div>

      <div className="flex items-center gap-4 my-2">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalViews.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> views
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/50">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" />Web</span>
              <span className="text-xs font-bold text-gray-900">{websiteClicks}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/50">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Navigation className="w-3 h-3 text-emerald-500" />Maps</span>
              <span className="text-xs font-bold text-gray-900">{directionRequests}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/50">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3 text-amber-500" />Calls</span>
              <span className="text-xs font-bold text-gray-900">{callClicks}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/50">
              <span className="text-xs text-gray-500 flex items-center gap-1"><CalendarCheck2 className="w-3 h-3 text-purple-500" />Book</span>
              <span className="text-xs font-bold text-gray-900">{bookings}</span>
            </div>
          </div>
        </div>

        {pieData.length > 0 && (
          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" stroke="none" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => v?.toLocaleString()} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Mobile Search</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Desktop</span>
      </div>
    </div>
  );
}

// ── Profile Completeness Sidebar Card ──────────────────────────────────────
function ProfileCompletenessMini({ profileData }: { profileData: any }) {
  if (!profileData) return null;

  const fields = [
    profileData.name,
    profileData.primaryCategory,
    profileData.description,
    profileData.phone,
    profileData.website,
    profileData.hours,
    profileData.hasPhotos,
    profileData.appointmentUrl,
  ];
  const completed = fields.filter(Boolean).length;
  const pct = Math.round((completed / fields.length) * 100);

  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Profile Completeness</h3>
        <span className="text-sm font-extrabold text-indigo-600">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>{completed} of {fields.length} fields completed</span>
        {pct < 100 && <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Complete profile →</span>}
      </div>
    </div>
  );
}

// ── Sync Status Sidebar Card ──────────────────────────────────────────────
function SyncStatus({ lastSynced }: { lastSynced: string | null }) {
  const timeAgo = lastSynced
    ? (() => {
        const diff = Date.now() - new Date(lastSynced).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return h > 0 ? `${h}h ago` : `${m}m ago`;
      })()
    : "Never";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Sync Status</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm font-bold text-emerald-700">Connected</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
          Last synced {timeAgo}
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export function LocalSeoDashboard() {
  const { connected, activeLocationId, isLoading: contextLoading } = useLocationContext();
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview, lastUpdated } = useLocalSeoModule<any>("overview");
  const { data: visibilityScoreData } = useLocalSeoModule<any>("visibility-score");
  const { data: profileHealthData } = useLocalSeoModule<any>("profile-health");
  const { data: reputationData } = useLocalSeoModule<any>("reputation");
  const { data: performanceData } = useLocalSeoModule<any>("performance");
  const { data: keywordData } = useLocalSeoModule<any>("keywords");
  const { data: postData } = useLocalSeoModule<any>("posts");

  const loading = contextLoading || overviewLoading;

  const runAnalysis = async () => {
    if (!activeLocationId) return;
    setRunningAnalysis(true);
    try {
      const res = await fetch(`/api/local-seo/sync`, { method: "POST" });
      if (res.ok) await refetchOverview();
    } catch (e) {
      console.error(e);
    } finally {
      setRunningAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <TrendingUp className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Google Local Search</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Connect your Google Business Profile to unlock real patient discovery metrics, actionable recommendations, and performance tracking.
        </p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          <a href="/gbp">Connect Profile</a>
        </Button>
      </div>
    );
  }

  if (!activeLocationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Select a Location</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Please select a location from the dropdown in the navigation bar to view its local search intelligence.
        </p>
      </div>
    );
  }

  if (!overviewData || !overviewData.businessName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to analyze your Local SEO?</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Our engine will sync your Google Business Profile data to generate a personalized action plan and performance dashboard.
        </p>
        <Button onClick={runAnalysis} disabled={runningAnalysis} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          {runningAnalysis
            ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />Syncing Data...</>
            : <><Zap className="mr-2 h-5 w-5" />Run First Analysis</>}
        </Button>
      </div>
    );
  }

  const lastSyncedStr = lastUpdated ? String(lastUpdated) : null;

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Local SEO Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span className="font-semibold text-gray-800">{overviewData.businessName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span>{overviewData.primaryCategory || "Medical Clinic"}</span>
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={runningAnalysis}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold"
        >
          {runningAnalysis
            ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
            : <><RefreshCw className="mr-2 h-4 w-4" />Sync Data</>}
        </Button>
      </div>

      {/* Tab Navigation Segmented Control */}
      <div className="flex gap-1 bg-gray-100/80 p-1.5 rounded-2xl mb-6 overflow-x-auto border border-gray-200/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center
              ${activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Row: Score (1/3) + Google Performance (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CompactVisibilityScore
                score={visibilityScoreData?.score || 0}
                status={visibilityScoreData?.status || "Calculating..."}
              />
            </div>
            <div className="lg:col-span-2">
              <GooglePerformanceCompact performanceData={performanceData} />
            </div>
          </div>

          {/* Middle Row: Completeness & Sync (1/3) + Posting Activity (2/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <ProfileCompletenessMini profileData={profileHealthData} />
              <SyncStatus lastSynced={lastSyncedStr} />
            </div>
            <div className="lg:col-span-2">
              <PostingActivity />
            </div>
          </div>

          {/* Third Row: Reputation (1/2) + Keywords (1/2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reputation />
            <KeywordInsights />
          </div>

          {/* Bottom Row: Full width Services */}
          <div className="w-full mt-6">
            <ServiceInsights />
          </div>
        </div>
      )}

      {/* ── RANK TRACKER TAB ── */}
      {activeTab === "rank-tracker" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <SearchGrid />
          </div>
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl border border-indigo-100 p-6">
            <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> How Search Grid Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-800">
              {[
                "We place 25 virtual searchers in a 5×5 grid around your clinic, spaced 500m apart.",
                "Each point queries Google for your category to discover your exact position.",
                "Results are color-coded: Green = top 3, Yellow = 4-7, Orange = 8-15, Red = not found.",
              ].map((text, i) => (
                <div key={i} className="flex gap-3 bg-white/60 rounded-xl p-3 border border-indigo-100/50">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <p className="leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPETITORS TAB ── */}
      {activeTab === "competitors" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">Local Competitor Analysis</h2>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {overviewData.primaryCategory || "Medical Clinic"} · Sorted by patient engagement
              </p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
              From Google Places API
            </div>
          </div>
          <div className="p-6">
            <CompetitorInsights />
          </div>
        </div>
      )}

      {/* ── PROFILE HEALTH TAB ── */}
      {activeTab === "profile-health" && (
        <div className="space-y-6">
          <ProfileHealth />
          <GoogleQA />
        </div>
      )}

      {/* ── RECOMMENDATIONS TAB ── */}
      {activeTab === "recommendations" && (
        <RecommendationsList />
      )}
    </div>
  );
}
