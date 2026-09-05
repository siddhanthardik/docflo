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

function getRankColor(rank: number, found: boolean): { bg: string; text: string; border: string } {
  if (!found || rank === 0) return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
  if (rank <= 3) return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
  if (rank <= 7) return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" };
  if (rank <= 15) return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" };
  return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
}

function getRankLabel(rank: number, found: boolean): string {
  if (!found || rank === 0) return ">20";
  if (rank > 15) return ">15";
  return String(rank);
}

export function SearchGrid() {
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [gridRadiusStep, setGridRadiusStep] = useState<number>(1000); // 200m, 500m, 1km, 2km
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  
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
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);

  // Build 2D grid array
  const rows: GridCell[][] = [];
  for (let r = 0; r < gridSize; r++) {
    rows[r] = [];
    for (let c = 0; c < gridSize; c++) {
      const cell = grid.find(g => g.row === r && g.col === c);
      rows[r][c] = cell || { row: r, col: c, lat: 0, lng: 0, rank: 0, found: false };
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Search Rank Grid
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
              5×5 Grid · {gridRadiusStep}m Spacing
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Geographic local rank heat map around your clinic location
          </p>
          {cached && cacheAge < 99 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Cached {cacheAge}h ago · refreshes every 24h
            </div>
          )}
        </div>
        <Button
          onClick={() => handleRefresh()}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
        >
          {refreshing ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Scanning...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh Grid</>
          )}
        </Button>
      </div>

      {/* Share of Local Voice (SoLV) KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Share of Local Voice</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-gray-900">{solvPercentage}%</span>
            <span className="text-xs text-blue-700 font-semibold ml-2">Top 3 Map Pack Share</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Ranked #1–#3 in {top3Count} out of 25 neighborhood nodes.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Rank</span>
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${avgRank <= 3 ? 'text-emerald-600' : avgRank <= 7 ? 'text-amber-600' : 'text-orange-600'}`}>
              {avgRank ? `#${avgRank}` : '—'}
            </span>
            <span className="text-xs text-gray-400">across ranked areas</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {found.length} of 25 grid areas currently index your clinic.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grid Radius Spacing</span>
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex gap-1.5 my-2">
            {[
              { label: "200m", val: 200 },
              { label: "500m", val: 500 },
              { label: "1km", val: 1000 },
              { label: "2km", val: 2000 },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => {
                  setGridRadiusStep(r.val);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  gridRadiusStep === r.val
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500">
            Coverage: {(gridRadiusStep * 2) / 1000}km radius ({(gridRadiusStep * 4) / 1000}km total span)
          </p>
        </div>
      </div>

      {/* Dynamic Keyword Pills & Search Bar */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Track Keyword Grid</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={overviewData?.primaryCategory ? `e.g. ${overviewData.primaryCategory}, Best ${overviewData.primaryCategory} near me...` : "e.g. Pediatrician, Child Specialist, Best Pediatrician near me..."}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <Button type="submit" size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 font-semibold">Track</Button>
            </div>
          </div>
        </form>

        {/* Organic Dynamic Keyword Pills */}
        {dynamicSuggestedKeywords.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-500 block mb-1.5">Target Keywords to Track:</span>
            <div className="flex flex-wrap gap-2">
              {dynamicSuggestedKeywords.map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPill(kw)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                    activeKeyword.toLowerCase() === kw.toLowerCase()
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-indigo-50/50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {gridData?.keyword && (
          <div className="pt-2 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Active Grid Query</span>
            <strong className="text-indigo-900">{gridData.keyword}</strong>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {requiresRefresh && !refreshing && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-indigo-400" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">No Grid Data Yet</h4>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Click "Refresh Grid" to scan 25 points around your clinic and see where you rank on Google Maps in each area.
          </p>
          <Button onClick={() => handleRefresh()} disabled={refreshing} className="bg-indigo-600 hover:bg-indigo-700">
            {refreshing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning 25 points...</> : "Generate Search Grid"}
          </Button>
        </div>
      )}

      {/* Grid and Map Section */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-indigo-700 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Map className="w-3.5 h-3.5 text-indigo-600" />
                Google Map View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-700 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                5×5 Matrix View
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Center: <strong className="text-gray-700 font-semibold">{businessName}</strong></span>
            </div>
          </div>

          {/* Conditional Rendering: Google Map or Matrix */}
          {viewMode === "map" ? (
            <RankTrackerMap
              grid={grid}
              centerLat={gridData?.centerLat}
              centerLng={gridData?.centerLng}
              businessName={businessName}
              spacingMeters={gridRadiusStep}
              keyword={gridData?.keyword || activeKeyword}
            />
          ) : (
            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 overflow-x-auto">
              {/* North Cardinal Indicator */}
              <div className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-3">
                <span className="text-indigo-600 text-xs">▲</span> North <span className="text-indigo-600 text-xs">▲</span>
              </div>

              {/* Grid with West/East labels */}
              <div className="flex items-center justify-center gap-3 min-w-[340px]">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest writing-mode-vertical rotate-180 flex items-center gap-1">
                  <span>◀</span> West
                </div>

                <div className="flex flex-col gap-2">
                  {rows.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-2 justify-center">
                      {row.map((cell, cIdx) => {
                        const isCenter = rIdx === centerRow && cIdx === centerCol;
                        const colors = getRankColor(cell.rank, cell.found);
                        const label = getRankLabel(cell.rank, cell.found);

                        const dRow = centerRow - cell.row;
                        const dCol = cell.col - centerCol;
                        let dir = "";
                        if (dRow > 0) dir += "North";
                        else if (dRow < 0) dir += "South";
                        if (dCol > 0) dir += (dir ? "-East" : "East");
                        else if (dCol < 0) dir += (dir ? "-West" : "West");
                        const approxDist = Math.round(Math.sqrt(dRow * dRow + dCol * dCol) * gridRadiusStep);

                        const titleText = isCenter
                          ? `${businessName} (Clinic Origin Point)`
                          : `Rank ${label} · ${dir || 'Center'} (~${approxDist}m from clinic)`;

                        return (
                          <div
                            key={cIdx}
                            title={titleText}
                            className={`
                              relative w-14 h-14 rounded-xl flex flex-col items-center justify-center
                              border-2 font-bold transition-all cursor-pointer hover:shadow-md
                              ${isCenter
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-200 scale-105'
                                : `${colors.bg} ${colors.border} ${colors.text}`
                              }
                            `}
                          >
                            {isCenter ? (
                              <>
                                <MapPin className="w-5 h-5 fill-white text-white" />
                                <span className="text-[9px] font-medium mt-0.5 opacity-90">You</span>
                              </>
                            ) : (
                              <>
                                <span className="text-base leading-none">{label}</span>
                                {dir && (
                                  <span className="text-[8px] font-medium opacity-70 mt-0.5">
                                    {dir.split("-").map(d => d[0]).join("")}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  East <span>▶</span>
                </div>
              </div>

              {/* South Cardinal Indicator */}
              <div className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-3">
                <span className="text-indigo-600 text-xs">▼</span> South <span className="text-indigo-600 text-xs">▼</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
              Rank 1–3 (Top Pack)
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
              Your clinic (center)
            </div>
            <div className="flex items-center gap-1 ml-auto text-gray-400 font-normal">
              <Info className="w-3 h-3" />
              Each node = {gridRadiusStep}m step from clinic center
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
