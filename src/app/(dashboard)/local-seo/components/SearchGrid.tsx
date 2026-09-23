"use client";

import { useState } from "react";
import { MapPin, RefreshCw, Clock, Info, TrendingUp, Search, Crown, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { RankTrackerMap } from "./RankTrackerMap";

interface GridCell {
  row: number;
  col: number;
  lat: number;
  lng: number;
  rank: number;
  found: boolean;
}

export function SearchGrid() {
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [gridRadiusStep, setGridRadiusStep] = useState<number>(1000); // 200m, 500m, 1km, 2km
  
  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { data: keywordsData } = useLocalSeoModule<any>('keywords');
  const { data: gridData, isLoading, refetch } = useLocalSeoModule<any>(
    'search-grid', 
    activeKeyword ? { keyword: activeKeyword, radiusStep: String(gridRadiusStep) } : { radiusStep: String(gridRadiusStep) }
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Keyword Pill Generator with Strict Case-Insensitive Deduplication
  const dynamicSuggestedKeywords = (() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addWord = (w?: string) => {
      if (!w) return;
      const clean = w.trim();
      const lower = clean.toLowerCase();
      if (clean && !seen.has(lower)) {
        seen.add(lower);
        list.push(clean);
      }
    };

    addWord(overviewData?.primaryCategory);

    if (keywordsData?.searchKeywordsCounts && Array.isArray(keywordsData.searchKeywordsCounts)) {
      keywordsData.searchKeywordsCounts.forEach((kw: any) => {
        const word = typeof kw === "string" ? kw : kw.searchKeyword;
        addWord(word);
      });
    }
    return list.slice(0, 8);
  })();

  const handleRefresh = async (customKw?: string) => {
    const kwToScan = customKw !== undefined ? customKw : activeKeyword;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/local-seo/search-grid', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: kwToScan, radiusStep: gridRadiusStep })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to generate grid");
      } else {
        await refetch();
      }
    } catch (e: any) {
      setError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      const term = keywordInput.trim();
      setActiveKeyword(term);
      handleRefresh(term);
    }
  };

  const handleSelectPill = (kw: string) => {
    setKeywordInput(kw);
    setActiveKeyword(kw);
    handleRefresh(kw);
  };

  if (isLoading && !gridData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const grid: GridCell[] = gridData?.grid || [];
  const gridSize: number = gridData?.gridSize || 5;
  const businessName = gridData?.businessName || overviewData?.businessName || "Your Clinic";
  const cached = gridData?.cached;
  const cacheAge = gridData?.cacheAge || 0;
  const requiresRefresh = !gridData || gridData.requiresRefresh;

  // Stats & Share of Local Voice (SoLV)
  const found = grid.filter(c => c.found && c.rank > 0);
  const avgRank = found.length > 0 ? Math.round(found.reduce((s, c) => s + c.rank, 0) / found.length) : 0;
  const top3Count = found.filter(c => c.rank <= 3).length;
  const solvPercentage = Math.round((top3Count / 25) * 100);

  const activeDisplayQuery = gridData?.keyword || activeKeyword || overviewData?.primaryCategory || "Pediatrician";

  return (
    <div className="space-y-6">
      {/* ── CARD 1: LOCAL RANK TRACKER & 4 KPI CARDS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        {/* Header & Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Local Rank Tracker
              </h2>
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100/70">
                5×5 Google Maps Grid
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Real-time neighborhood visibility and Google 3-Pack rank around your clinic
            </p>
            {cached && cacheAge < 99 && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Scanned {cacheAge}h ago · Refreshes every 24h</span>
              </div>
            )}
          </div>

          {/* Controls: Radius Segmented Control + Refresh Grid Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Radius Selector */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/50" role="group" aria-label="Coverage Radius Selector">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 hidden sm:inline">
                Radius
              </span>
              {[
                { label: "200m", val: 200 },
                { label: "500m", val: 500 },
                { label: "1km", val: 1000 },
                { label: "2km", val: 2000 },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  aria-pressed={gridRadiusStep === r.val}
                  aria-label={`Select ${r.label} radius`}
                  onClick={() => setGridRadiusStep(r.val)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    gridRadiusStep === r.val
                      ? "bg-white text-indigo-700 shadow-xs border border-gray-200/60"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <Button
              onClick={() => handleRefresh()}
              disabled={refreshing}
              size="sm"
              aria-label="Refresh Search Grid"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold shadow-xs h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {refreshing ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Scanning...</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh Grid</>
              )}
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Top 3 Map Pack */}
          <div className="bg-white rounded-xl border border-gray-100/90 p-4 flex items-center gap-3.5 hover:border-gray-200 transition-colors shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0" aria-hidden="true">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top 3 Map Pack</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">
                {solvPercentage}% <span className="text-xs font-normal text-gray-400">({top3Count}/25 areas)</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Average Rank */}
          <div className="bg-white rounded-xl border border-gray-100/90 p-4 flex items-center gap-3.5 hover:border-gray-200 transition-colors shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0" aria-hidden="true">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Rank</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">
                {avgRank ? `#${avgRank}` : '—'} <span className="text-xs font-normal text-gray-400">overall</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Coverage Radius */}
          <div className="bg-white rounded-xl border border-gray-100/90 p-4 flex items-center gap-3.5 hover:border-gray-200 transition-colors shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden="true">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coverage Radius</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">
                {(gridRadiusStep * 2) / 1000} km <span className="text-xs font-normal text-gray-400">({(gridRadiusStep * 4) / 1000} km span)</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Indexed Nodes */}
          <div className="bg-white rounded-xl border border-gray-100/90 p-4 flex items-center gap-3.5 hover:border-gray-200 transition-colors shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0" aria-hidden="true">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Indexed Nodes</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">
                {found.length} / 25 <span className="text-xs font-normal text-gray-400">points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: TRACK KEYWORD GRID & INTERACTIVE GOOGLE MAP ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Track Keyword Grid</h3>
          <span className="text-xs text-gray-400">
            Active Query: <strong className="text-indigo-600 font-semibold">{activeDisplayQuery}</strong>
          </span>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2.5" role="search" aria-label="Search and track keyword">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              aria-label="Track Keyword Input"
              placeholder={overviewData?.primaryCategory ? `Q .g. ${overviewData.primaryCategory}, Best ${overviewData.primaryCategory} near me...` : "Q .g. Pediatrician, Best Pediatrician near me..."}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            aria-label="Track Keyword"
            className="h-10 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-6 rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
          >
            Track
          </Button>
        </form>

        {/* Target Keywords Chips */}
        {dynamicSuggestedKeywords.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-normal text-gray-400">Target Keywords:</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested target keywords">
              {dynamicSuggestedKeywords.map((kw, i) => {
                const isSelected = (activeKeyword || gridData?.keyword || "").toLowerCase() === kw.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`Select keyword ${kw}`}
                    onClick={() => handleSelectPill(kw)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold shadow-2xs"
                        : "bg-gray-50/80 hover:bg-gray-100 text-gray-700 border-gray-200/80 font-medium"
                    }`}
                  >
                    <span className="text-amber-500 font-bold text-xs" aria-hidden="true">#</span>
                    <span>{kw}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {requiresRefresh && !refreshing && grid.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/40">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            <h4 className="text-base font-semibold text-gray-800 mb-1">No Grid Data Yet</h4>
            <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">
              Click "Refresh Grid" to scan 25 points around your clinic and see where you rank on Google Maps across each neighborhood.
            </p>
            <Button onClick={() => handleRefresh()} disabled={refreshing} className="bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl font-semibold text-xs h-9 px-4">
              {refreshing ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Scanning...</> : "Generate Search Grid"}
            </Button>
          </div>
        )}

        {/* Map Header Info & Map Container */}
        {grid.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs px-1">
              <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                <MapPin className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                <span>Center: <strong className="text-gray-900">{businessName}</strong></span>
              </div>
              <div className="text-gray-400 text-[11px]">
                Coverage: {(gridRadiusStep * 2) / 1000}km radius ({gridRadiusStep}m node interval)
              </div>
            </div>

            {/* Interactive Leaflet Google Maps */}
            <RankTrackerMap
              grid={grid}
              centerLat={gridData?.centerLat}
              centerLng={gridData?.centerLng}
              businessName={businessName}
              spacingMeters={gridRadiusStep}
              keyword={gridData?.keyword || activeKeyword}
            />

            {/* Clean Accessible Map Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1 px-1">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Rank 1–3 (Top 3 Pack)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>Rank 4–8 (Page 1)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span>Rank 9+ / Unranked</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-[#4F46E5] inline-block" />
                <span>Your Clinic</span>
              </div>
              <div className="flex items-center gap-1 ml-auto text-gray-400 text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>Click any marker to inspect rank and distance</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
