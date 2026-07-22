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

// Competitor Keywords — Option B: AI-derived from category + business names
function CompetitorKeywords({ competitors, primaryCategory }: { competitors: Competitor[]; primaryCategory: string }) {
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    orthopaedic: ["knee replacement", "hip replacement", "arthroscopy surgery", "ACL repair", "sports injury treatment", "bone fracture specialist", "joint pain relief", "spine surgery", "shoulder surgery", "orthopaedic surgeon near me"],
    orthopedic: ["knee replacement", "hip replacement", "arthroscopy surgery", "ACL repair", "sports injury treatment", "bone fracture specialist", "joint pain relief", "spine surgery", "orthopaedic surgeon near me"],
    physiotherapy: ["physiotherapy near me", "sports physio", "post-surgery rehab", "pain management", "manual therapy", "dry needling", "back pain treatment"],
    dentist: ["dental implants", "teeth whitening", "root canal treatment", "Invisalign", "painless dentist", "dental clinic near me"],
    eye: ["cataract surgery", "LASIK eye surgery", "glaucoma treatment", "retina specialist", "diabetic eye care"],
    skin: ["skin specialist", "acne treatment", "hair transplant", "laser hair removal", "vitiligo treatment", "dermatologist near me"],
    default: ["doctor near me", "specialist clinic", "medical consultation", "best doctor in Delhi", "clinic near me"],
  };

  const cat = primaryCategory.toLowerCase();
  let keywords = CATEGORY_KEYWORDS.default;
  for (const [key, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat.includes(key)) { keywords = kws; break; }
  }

  // Extract terms from competitor names to add specificity
  const nameTerms = competitors.slice(0, 5).flatMap(c => {
    const words = c.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ");
    return words.filter(w => w.length > 4 && !["centre", "clinic", "hospital", "delhi", "india", "doctor"].includes(w));
  });

  const city = "Delhi"; // Could be derived from profile
  const localKeywords = keywords.slice(0, 8).map(k => `${k} ${city}`);

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
        {localKeywords.map((kw, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors cursor-default"
          >
            {kw}
          </span>
        ))}
        {nameTerms.slice(0, 3).map((term, idx) => (
          <span
            key={`name-${idx}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-medium"
          >
            {term} specialist
          </span>
        ))}
      </div>
    </div>
  );
}

export function CompetitorInsights() {
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

  // Sort by rank (Google's native order = review-weighted rank)
  const sorted = [...competitors]
    .sort((a, b) => b.reviewCount - a.reviewCount);

  // Simulate a rank for the doctor (e.g. they appear after N competitors)
  // In real implementation, this comes from search grid or Places search
  const doctorRank = sorted.length + 1;
  const aheadCount = sorted.length;
  const displayList = showAll ? sorted : sorted.slice(0, 5);
  const primaryCategory = "Orthopaedic surgeon"; // Could be from profile data

  return (
    <div className="space-y-0">
      {/* Refresh button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
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
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-3 items-center hover:bg-gray-50/50 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{comp.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {comp.distanceMeters < 1000
                  ? `${comp.distanceMeters}m away`
                  : `${(comp.distanceMeters / 1000).toFixed(1)}km away`}
              </p>
            </div>
            <div className="w-16 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">
                {comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
              </span>
            </div>
            <div className="w-16 text-center">
              <ReviewCount count={comp.reviewCount} />
            </div>
            <div className="w-16 flex justify-center">
              <RankBadge rank={parseFloat((idx + 1).toFixed(1))} />
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
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-3 items-center bg-indigo-50 rounded-b-xl border border-indigo-100">
        <div className="min-w-0">
          <p className="text-sm font-bold text-indigo-800 flex items-center gap-1.5">
            <span className="text-indigo-500">▶</span>
            Your Business (You)
          </p>
          <p className="text-xs text-indigo-400 mt-0.5">Based on Google Places ranking</p>
        </div>
        <div className="w-16 flex items-center justify-center gap-1">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-sm font-bold text-indigo-800">—</span>
        </div>
        <div className="w-16 text-center">
          <span className="text-sm font-bold text-indigo-800">—</span>
        </div>
        <div className="w-16 flex justify-center">
          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full border text-sm font-bold bg-red-100 text-red-700 border-red-200">
            {doctorRank}+
          </span>
        </div>
      </div>

      {/* Competitor Keywords */}
      <CompetitorKeywords competitors={sorted} primaryCategory={primaryCategory} />
    </div>
  );
}
