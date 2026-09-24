"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocationContext } from "@/contexts/LocationContext";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Zap, RefreshCw, Search,
  LayoutDashboard, Users, ShieldCheck,
  Sparkles, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { OverviewTab } from "./OverviewTab";
import { ProfileHealth } from "./ProfileHealth";
import { CompetitorInsights } from "./CompetitorInsights";
import { AiSearchReadiness } from "./AiSearchReadiness";
import { SearchGrid } from "./SearchGrid";
import { RecommendationsList } from "./RecommendationsList";

type Tab = "overview" | "rank-tracker" | "competitors" | "profile-health" | "recommendations";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "rank-tracker", label: "Rank Tracker", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "competitors", label: "Competitors", icon: <Users className="w-4 h-4" /> },
  { id: "profile-health", label: "Profile Health", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "recommendations", label: "Recommendations", icon: <Sparkles className="w-4 h-4" /> },
];

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
  const { data: servicesData } = useLocalSeoModule<any>("services");

  const queryClient = useQueryClient();
  const loading = contextLoading || overviewLoading;

  const runAnalysis = async () => {
    if (!activeLocationId) return;
    setRunningAnalysis(true);
    try {
      const res = await fetch(`/api/local-seo/sync`, { method: "POST" });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["local-seo"] });
      }
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
        <Button asChild size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA]">
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
        <Button onClick={runAnalysis} disabled={runningAnalysis} size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA]">
          {runningAnalysis
            ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" />Syncing Data...</>
            : <><Zap className="mr-2 h-5 w-5" />Run First Analysis</>}
        </Button>
      </div>
    );
  }

  const lastSyncedStr = lastUpdated ? String(lastUpdated) : null;

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Local Presence</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-semibold text-gray-800">{overviewData.businessName}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{overviewData.primaryCategory || "Medical Clinic"}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Your Google visibility, profile performance and patient discovery.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50/90 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Connected {lastSyncedStr ? (() => {
              const diff = Date.now() - new Date(lastSyncedStr).getTime();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              return h > 0 ? `· ${h}h ago` : m > 0 ? `· ${m}m ago` : "· 2 months ago";
            })() : "· 2 months ago"}</span>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={runningAnalysis}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer h-9"
          >
            {runningAnalysis
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Syncing...</>
              : <><RefreshCw className="w-3.5 h-3.5" />Sync Data</>}
          </Button>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer border
              ${activeTab === tab.id
                ? "bg-[#4F46E5] text-white border-transparent shadow-xs font-semibold"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 border-gray-200/80 shadow-2xs"
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
        <OverviewTab
          overviewData={overviewData}
          visibilityScoreData={visibilityScoreData}
          profileHealthData={profileHealthData}
          reputationData={reputationData}
          performanceData={performanceData}
          keywordData={keywordData}
          postData={postData}
          servicesData={servicesData}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* ── RANK TRACKER TAB ── */}
      {activeTab === "rank-tracker" && (
        <div className="w-full">
          <SearchGrid />
        </div>
      )}

      {/* ── COMPETITORS TAB ── */}
      {activeTab === "competitors" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Local Competitor Analysis</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {overviewData.primaryCategory || "Medical Clinic"} · Sorted by patient engagement
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50/80 rounded-xl px-3 py-1.5 border border-gray-100 font-medium">
              From Google Places API
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <CompetitorInsights />
          </div>
        </div>
      )}

      {/* ── PROFILE HEALTH TAB ── */}
      {activeTab === "profile-health" && (
        <div className="space-y-6">
          <ProfileHealth />
          <AiSearchReadiness />
        </div>
      )}

      {/* ── RECOMMENDATIONS TAB ── */}
      {activeTab === "recommendations" && (
        <RecommendationsList />
      )}
    </div>
  );
}
