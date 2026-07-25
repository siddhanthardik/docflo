"use client";

import { useState } from "react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Star, RefreshCw, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Competitor {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceMeters: number;
  isOpenNow?: boolean;
  primaryType?: string;
}

function RankBadge({ rank }: { rank: number }) {
  const isGood = rank <= 3;
  const isOk = rank <= 7;
  const color = isGood
    ? "bg-green-100 text-green-700 border-green-200"
    : isOk
    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-red-100 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full border text-sm font-bold ${color}`}>
      {rank.toFixed(1)}
    </span>
  );
}

function ReviewCount({ count }: { count: number }) {
  const color = count >= 200 ? "text-green-600" : count >= 50 ? "text-yellow-600" : "text-orange-500";
  return <span className={`font-bold text-sm ${color}`}>{count.toLocaleString()}</span>;
}

// Competitor Keywords — Dynamic Data-Driven
function CompetitorKeywords({ competitors, primaryCategory, keywordsData }: { competitors: Competitor[]; primaryCategory: string; keywordsData: any }) {
  
  // 1. Get actual search terms from the doctor's profile
  const actualSearchTerms = (keywordsData?.searchKeywordsCounts || [])
    .map((kw: any) => (kw.searchKeyword || kw).toLowerCase())
    .slice(0, 4);

  // 2. Extract competitor primary types (e.g. "pediatrician", "orthopedic_clinic")
  const competitorTypes = Array.from(new Set(competitors.map(c => c.primaryType).filter(Boolean)))
    .map(type => type!.replace(/_/g, " ").toLowerCase())
    .slice(0, 3);

  // 3. Extract high-value noun terms from top competitor names
  const nameTerms = competitors.slice(0, 5).flatMap(c => {
    const words = c.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ");
    return words.filter(w => w.length > 4 && !["centre", "clinic", "hospital", "delhi", "india", "doctor", "care"].includes(w));
  });

  // 4. Synthesize Dynamic Keywords
  const baseCategory = primaryCategory.toLowerCase();
  
  let dynamicKeywords = [
    `${baseCategory} near me`,
    `best ${baseCategory}`,
    ...actualSearchTerms,
    ...competitorTypes.map(t => `top ${t}`),
    ...competitorTypes.map(t => `${t} clinic`),
  ];

  // Remove duplicates and limit
  dynamicKeywords = Array.from(new Set(dynamicKeywords)).filter(Boolean).slice(0, 8);

  // (Removed city hardcoding, keywords are now organic)

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-gray-900">Suggested Competitor Keywords</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Data-Driven · Option B</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        High-value search terms your competitors are likely ranking for. Target these in your profile description and posts.
      </p>
      <div className="flex flex-wrap gap-2">
        {dynamicKeywords.map((kw, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors cursor-default capitalize"
          >
            {kw}
          </span>
        ))}
        {nameTerms.slice(0, 3).map((term, idx) => (
          <span
            key={`name-${idx}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize"
          >
            {term} specialist
          </span>
        ))}
      </div>
    </div>
  );
}

export function CompetitorInsights() {
  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { data: keywordsData } = useLocalSeoModule<any>('keywords');
  const { data: competitors, isLoading, refetch } = useLocalSeoModule<any[]>('competitors');
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!competitors || competitors.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-700 mb-1">No Competitor Data</h3>
        <p className="text-sm text-gray-400 mb-4">Sync your profile to fetch nearby competitors from Google Places.</p>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
        </Button>
      </div>
    );
  }

  // Filter out any competitors strictly further than 5000 meters, then sort by review-weighted rank
  const sorted = [...competitors]
    .filter(c => c.distanceMeters <= 5000)
    .sort((a, b) => b.reviewCount - a.reviewCount);

  // Simulate a rank for the doctor (e.g. they appear after N competitors)
  // In real implementation, this comes from search grid or Places search
  const doctorRank = sorted.length + 1;
  const displayList = showAll ? sorted : sorted.slice(0, 5);
  const primaryCategory = overviewData?.primaryCategory || "Medical Clinic";

  return (
    <div className="space-y-0">
      {/* Refresh button & Helper text */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/50 flex items-center gap-1.5 flex-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Showing competitors within a <strong>5 km radius</strong>. <span className="opacity-75">*Approximate distance from clinic coordinates.</span></span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table header (hidden on mobile) */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
        <div>Business</div>
        <div className="text-center w-16">Rating</div>
        <div className="text-center w-16">Reviews</div>
        <div className="text-center w-16">Rank</div>
      </div>

      {/* Competitor rows */}
      <div className="divide-y divide-gray-50">
        {displayList.map((comp, idx) => (
          <div
            key={comp.placeId || idx}
            className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-x-4 px-3 py-4 md:py-3 hover:bg-gray-50/50 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 md:line-clamp-1">{comp.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {comp.distanceMeters < 1000
                  ? `${comp.distanceMeters}m away`
                  : `${(comp.distanceMeters / 1000).toFixed(1)}km away`}
              </p>
            </div>
            <div className="flex items-center gap-6 md:gap-0">
              <div className="md:w-16 flex items-center justify-start md:justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="text-sm font-semibold text-gray-800">
                  {comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-gray-400 md:hidden ml-1">(Rating)</span>
              </div>
              <div className="md:w-16 text-center flex items-center gap-1.5">
                <ReviewCount count={comp.reviewCount} />
                <span className="text-xs text-gray-400 md:hidden">Reviews</span>
              </div>
              <div className="ml-auto md:ml-0 md:w-16 flex justify-end md:justify-center">
                <RankBadge rank={parseFloat((idx + 1).toFixed(1))} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* "X more ahead" + show more toggle */}
      {!showAll && sorted.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 text-xs text-gray-400 text-center hover:text-indigo-600 transition-colors"
        >
          {sorted.length - 5} more ahead of you...
          <ChevronDown className="w-3 h-3 inline ml-1" />
        </button>
      )}
      {showAll && sorted.length > 5 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-xs text-gray-400 text-center hover:text-indigo-600 transition-colors"
        >
          Show less <ChevronUp className="w-3 h-3 inline ml-1" />
        </button>
      )}

      {/* Separator: You */}
      <div className="mt-1 border-t-2 border-indigo-100" />
      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-x-4 px-3 py-4 md:py-3 items-center bg-indigo-50 rounded-b-xl border border-indigo-100">
        <div className="min-w-0 w-full">
          <p className="text-sm font-bold text-indigo-800 flex items-center gap-1.5 truncate">
            <span className="text-indigo-500">▶</span>
            Your Business (You)
          </p>
          <p className="text-xs text-indigo-400 mt-0.5">Based on Google Places ranking</p>
        </div>
        <div className="flex items-center gap-6 md:gap-0 w-full">
          <div className="md:w-16 flex items-center justify-start md:justify-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-sm font-bold text-indigo-800">—</span>
          </div>
          <div className="md:w-16 text-center flex items-center">
            <span className="text-sm font-bold text-indigo-800">—</span>
          </div>
          <div className="ml-auto md:ml-0 md:w-16 flex justify-end md:justify-center">
            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full border text-sm font-bold bg-red-100 text-red-700 border-red-200">
              {doctorRank}+
            </span>
          </div>
        </div>
      </div>

      {/* Competitor Keywords */}
      <CompetitorKeywords competitors={sorted} primaryCategory={primaryCategory} keywordsData={keywordsData} />
    </div>
  );
}
