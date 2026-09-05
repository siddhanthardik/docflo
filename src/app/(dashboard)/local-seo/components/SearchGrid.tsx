"use client";

import { useState } from "react";
import { MapPin, RefreshCw, Clock, Info, Sparkles, SlidersHorizontal, Trophy, Target, TrendingUp, Map, LayoutGrid, Compass } from "lucide-react";
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
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const grid: GridCell[] = gridData?.grid || [];
  const gridSize: number = gridData?.gridSize || 5;
  const businessName = gridData?.businessName || "Your Clinic";
  const cached = gridData?.cached;
  const cacheAge = gridData?.cacheAge || 0;
  const requiresRefresh = !gridData || gridData.requiresRefresh;

  // Stats & Share of Local Voice (SoLV)
  const found = grid.filter(c => c.found && c.rank > 0);
  const avgRank = found.length > 0 ? Math.round(found.reduce((s, c) => s + c.rank, 0) / found.length) : 0;
  const top3Count = found.filter(c => c.rank <= 3).length;
  const solvPercentage = Math.round((top3Count / 25) * 100);

  return (
    <div className="space-y-4">
      {/* Top Header & Action Bar with Redesigned Radius Spacing */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Local Rank Tracker
            </h3>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100/80">
              5×5 Google Maps Grid
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time neighborhood visibility and Google 3-Pack rank around your clinic
          </p>
          {cached && cacheAge < 99 && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Scanned {cacheAge}h ago · Refreshes every 24h</span>
            </div>
          )}
        </div>

        {/* Controls: Redesigned Radius Spacing Next to Refresh Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Radius Selector */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 hidden sm:inline">
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
                onClick={() => setGridRadiusStep(r.val)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  gridRadiusStep === r.val
                    ? "bg-white text-indigo-700 shadow-xs border border-gray-200/70"
                    : "text-gray-500 hover:text-gray-800"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs h-9 px-4 rounded-xl"
          >
            {refreshing ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Scanning...</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh Grid</>
            )}
          </Button>
        </div>
      </div>

      {/* Slim Performance Metrics Strip */}
      {found.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Top 3 Map Pack</div>
              <div className="text-sm font-extrabold text-gray-900">
                {solvPercentage}% <span className="text-[11px] font-normal text-gray-500">({top3Count}/25 areas)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:border-l sm:border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average Rank</div>
              <div className="text-sm font-extrabold text-gray-900">
                {avgRank ? `#${avgRank}` : '—'} <span className="text-[11px] font-normal text-gray-500">overall</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:border-l sm:border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Coverage Radius</div>
              <div className="text-sm font-extrabold text-gray-900">
                {(gridRadiusStep * 2) / 1000} km <span className="text-[11px] font-normal text-gray-500">({(gridRadiusStep * 4) / 1000} km span)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 sm:border-l sm:border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Indexed Nodes</div>
              <div className="text-sm font-extrabold text-gray-900">
                {found.length} / 25 <span className="text-[11px] font-normal text-gray-500">points</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Keywords & Search */}
      <div className="bg-white border border-gray-200/80 p-4 rounded-2xl shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Track Keyword Grid</label>
              {gridData?.keyword && (
                <span className="text-[11px] text-gray-500 font-medium">
                  Active Query: <strong className="text-indigo-700 font-semibold">{gridData.keyword}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={overviewData?.primaryCategory ? `e.g. ${overviewData.primaryCategory}, Best ${overviewData.primaryCategory} near me...` : "e.g. Pediatrician, Child Specialist, Best Pediatrician near me..."}
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:bg-white flex-1"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <Button type="submit" size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-xl shadow-xs">
                Track
              </Button>
            </div>
          </div>
        </form>

        {/* Dynamic Suggested Keywords */}
        {dynamicSuggestedKeywords.length > 0 && (
          <div className="pt-0.5">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1.5">Target Keywords:</span>
            <div className="flex flex-wrap gap-1.5">
              {dynamicSuggestedKeywords.map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPill(kw)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${
                    activeKeyword.toLowerCase() === kw.toLowerCase()
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {requiresRefresh && !refreshing && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-indigo-400" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">No Grid Data Yet</h4>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Click "Refresh Grid" to scan 25 points around your clinic and see where you rank on Google Maps across each neighborhood.
          </p>
          <Button onClick={() => handleRefresh()} disabled={refreshing} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold">
            {refreshing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning 25 points...</> : "Generate Search Grid"}
          </Button>
        </div>
      )}

      {/* Interactive Google Map Only */}
      {grid.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Center: <strong className="text-gray-900">{businessName}</strong></span>
            </div>
            <div className="text-[11px] text-gray-400">
              Coverage: {(gridRadiusStep * 2) / 1000}km radius ({gridRadiusStep}m node interval)
            </div>
          </div>

          <RankTrackerMap
            grid={grid}
            centerLat={gridData?.centerLat}
            centerLng={gridData?.centerLng}
            businessName={businessName}
            spacingMeters={gridRadiusStep}
            keyword={gridData?.keyword || activeKeyword}
          />

          {/* Clean Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
              Rank 1–3 (Top 3 Pack)
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 inline-block" />
              Rank 4–7 (Page 1)
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600 inline-block" />
              Rank 8–15
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600 inline-block" />
              &gt;15 / Unranked
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              Clinic Center
            </div>
            <div className="flex items-center gap-1 ml-auto text-gray-400 font-normal text-[11px]">
              <Info className="w-3 h-3" />
              Click any node on the map to inspect rank & distance
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
