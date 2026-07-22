"use client";

import { useState } from "react";
import { MapPin, RefreshCw, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSeoModule } from "@/hooks/use-local-seo";

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
  if (rank <= 3) return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
  if (rank <= 7) return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
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
  
  const { data: gridData, isLoading, refetch } = useLocalSeoModule<any>(
    'search-grid', 
    activeKeyword ? { keyword: activeKeyword } : undefined
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/local-seo/search-grid', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: activeKeyword })
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
      setActiveKeyword(keywordInput.trim());
    }
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

  // Stats
  const found = grid.filter(c => c.found && c.rank > 0);
  const avgRank = found.length > 0 ? Math.round(found.reduce((s, c) => s + c.rank, 0) / found.length) : 0;
  const top3Count = found.filter(c => c.rank <= 3).length;
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
          <h3 className="text-lg font-bold text-gray-900">Search Rank Grid</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            5×5 grid · 500m spacing · covers 2km radius around your clinic
          </p>
          {cached && cacheAge < 99 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Cached {cacheAge}h ago · refreshes every 24h
            </div>
          )}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          {refreshing ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Scanning...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh Grid</>
          )}
        </Button>
      </div>

      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tracked Keyword</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Orthopaedic surgeon, knee pain..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
              <Button type="submit" size="sm" className="h-9">Track</Button>
            </div>
          </div>
        </form>
        {gridData?.keyword && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Currently Tracking</span>
            <strong>{gridData.keyword}</strong>
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
          <Button onClick={handleRefresh} disabled={refreshing} className="bg-indigo-600 hover:bg-indigo-700">
            {refreshing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning 25 points...</> : "Generate Search Grid"}
          </Button>
        </div>
      )}

      {/* Grid */}
      {rows.length > 0 && (
        <>
          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="font-semibold text-gray-700">Avg Rank</span>
              <span className={`font-bold text-lg ${avgRank <= 3 ? 'text-green-600' : avgRank <= 7 ? 'text-yellow-600' : 'text-orange-600'}`}>
                {avgRank || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-gray-600">Top 3 in <strong>{top3Count}</strong>/25 areas</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-600">Not ranked in <strong>{25 - found.length}</strong> areas</span>
            </div>
          </div>

          {/* The grid */}
          <div className="bg-gray-50 rounded-2xl p-4 overflow-x-auto">
            <div className="flex flex-col gap-2 min-w-[300px]">
              {rows.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-2 justify-center">
                  {row.map((cell, cIdx) => {
                    const isCenter = rIdx === centerRow && cIdx === centerCol;
                    const colors = getRankColor(cell.rank, cell.found);
                    const label = getRankLabel(cell.rank, cell.found);

                    return (
                      <div
                        key={cIdx}
                        title={isCenter ? `${businessName} (You)` : `Rank ${label} at this location`}
                        className={`
                          relative w-14 h-14 rounded-xl flex flex-col items-center justify-center
                          border-2 font-bold transition-all cursor-default
                          ${isCenter
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-200 scale-110'
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
                          <span className="text-base leading-none">{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-300 inline-block" />
              Rank 1–3
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-300 inline-block" />
              Rank 4–7
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-200 border border-orange-300 inline-block" />
              Rank 8–15
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-200 border border-red-300 inline-block" />
              &gt;15 / Not found
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
              Your clinic (center)
            </div>
            <div className="flex items-center gap-1 ml-auto text-gray-400">
              <Info className="w-3 h-3" />
              Each cell = 500m from center
            </div>
          </div>
        </>
      )}
    </div>
  );
}
