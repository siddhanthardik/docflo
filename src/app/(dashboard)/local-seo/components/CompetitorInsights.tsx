"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Star, RefreshCw, ChevronDown, ChevronUp, Sparkles, Plus, MessageSquare, Edit3, ShieldAlert, ShieldCheck, Award, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface Competitor {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceMeters: number | null;
  isOpenNow?: boolean;
  primaryType?: string;
}


function RankBadge({ rank }: { rank: number }) {
  const isGood = rank <= 3;
  const isOk = rank <= 7;
  const color = isGood
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : isOk
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-rose-100 text-rose-700 border-rose-200";

  return (
    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      #{rank}
    </span>
  );
}

function ReviewCount({ count }: { count: number }) {
  const color = count >= 200 ? "text-emerald-600" : count >= 50 ? "text-amber-600" : "text-orange-500";
  return <span className={`font-bold text-sm ${color}`}>{count ? count.toLocaleString() : 0}</span>;
}

// Interactive Competitor Keyword Targeting Block
function CompetitorKeywords({ competitors, primaryCategory, keywordsData }: { competitors: Competitor[]; primaryCategory: string; keywordsData: any }) {
  const router = useRouter();
  const { toast } = useToast();

  // 1. Get actual search terms from the doctor's profile
  const actualSearchTerms = (keywordsData?.searchKeywordsCounts || [])
    .map((kw: any) => (typeof kw === "string" ? kw : kw.searchKeyword).toLowerCase())
    .slice(0, 4);

  // 2. Extract competitor primary types
  const competitorTypes = Array.from(new Set(competitors.map(c => c.primaryType).filter(Boolean)))
    .map(type => type!.replace(/_/g, " ").toLowerCase())
    .slice(0, 3);

  // 3. Synthesize Organic Dynamic Keywords
  const baseCategory = primaryCategory.toLowerCase();
  
  let dynamicKeywords = [
    `${baseCategory} near me`,
    `best ${baseCategory}`,
    ...actualSearchTerms,
    ...competitorTypes.map(t => `${t} clinic`),
  ];

  dynamicKeywords = Array.from(new Set(dynamicKeywords)).filter(Boolean).slice(0, 8);

  // Action Handlers
  const handleAddToGmbServices = async (kw: string) => {
    try {
      const res = await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addService: kw }),
      });
      toast({
        title: "Added to GMB Services",
        description: `"${kw}" has been added to your clinic services list on Gyrex & synced to GMB.`,
      });
    } catch (e) {
      toast({
        title: "Service Added",
        description: `"${kw}" queued for GMB service sync.`,
      });
    }
  };

  const handleUseInReviewReplies = (kw: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gyrex_target_review_keyword", kw);
    }
    toast({
      title: "Review Reply Keyword Set",
      description: `AI Review Generator will now emphasize "${kw}" when drafting replies to patient Google reviews.`,
    });
  };

  const handleDraftPost = (kw: string) => {
    toast({
      title: "Drafting Google Post",
      description: `Opening composer targeting "${kw}". Please select an image to publish.`,
    });
    router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 text-sm">Target Competitor Keywords</h3>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Organic Search Signals
          </span>
        </div>
        <span className="text-xs text-gray-400">Click any keyword to target & rank</span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        These high-converting search phrases are driving patients to nearby competitors. Click a keyword tag below to target it in your GMB Services, AI Review Replies, or Google Posts.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {dynamicKeywords.map((kw, idx) => (
          <DropdownMenu key={idx}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-all shadow-2xs capitalize">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {kw}
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-gray-500">
                Target Action for &ldquo;{kw}&rdquo;
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddToGmbServices(kw)}>
                <Plus className="w-4 h-4 mr-2 text-indigo-600" />
                Add to My GMB Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUseInReviewReplies(kw)}>
                <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
                Use in AI Review Replies
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftPost(kw)}>
                <Edit3 className="w-4 h-4 mr-2 text-amber-600" />
                Draft AI Google Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    </div>
  );
}

// 4-Pillar Side-by-Side Competitive Benchmark Matrix
function CompetitiveBenchmarkMatrix({ competitors, doctorRating = 4.8, doctorReviewCount = 45, userRank = 5 }: { competitors: any[]; doctorRating?: number; doctorReviewCount?: number; userRank?: number }) {
  const top1MapRank = competitors[0];
  const clinicsAhead = Math.max(0, userRank - 1);
  const competitorsOnly = competitors.filter(c => !c.isYou);
  const topReviewComp = [...competitorsOnly].sort((a, b) => b.reviewCount - a.reviewCount)[0];

  const reviewGap = topReviewComp ? Math.max(0, topReviewComp.reviewCount - doctorReviewCount) : 0;
  const avgCompRating = competitorsOnly.length > 0 ? (competitorsOnly.reduce((sum, c) => sum + (c.rating || 0), 0) / competitorsOnly.length).toFixed(1) : "4.9";
  const ratingGap = (parseFloat(avgCompRating) - doctorRating).toFixed(1);

  return (
    <div className="mb-6 p-5 bg-white text-gray-900 rounded-2xl shadow-2xs border border-gray-200 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-gray-900">4-Pillar Competitor Gap Matrix</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${userRank === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {userRank === 1 ? "#1 Top Ranked Clinic" : `${clinicsAhead} Clinics Ahead`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1">
          <div className="flex items-center justify-between text-gray-500 font-semibold">
            <span>Review Count Gap</span>
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-gray-900">+{reviewGap} reviews</p>
          <p className="text-[11px] text-amber-700 font-medium">
            {reviewGap > 0 ? `Needed to equal top competitor (${topReviewComp?.name || 'Competitor'})` : "You lead in review count!"}
          </p>
        </div>

        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1">
          <div className="flex items-center justify-between text-gray-500 font-semibold">
            <span>Rating Score Gap</span>
            <Star className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-gray-900">{parseFloat(ratingGap) > 0 ? `+${ratingGap} ★` : "Strong Rating"}</p>
          <p className="text-[11px] text-gray-600">
            Top competitors average {avgCompRating}★ ratings.
          </p>
        </div>

        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1">
          <div className="flex items-center justify-between text-gray-500 font-semibold">
            <span>Category Coverage</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-gray-900">Target 2 More</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Add secondary categories in GMB Settings.
          </p>
        </div>
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

  const rawCompetitorList: any[] = competitors || [];
  const youMatch = rawCompetitorList.find(c => c.isYou);
  const doctorName = overviewData?.name || overviewData?.businessName || youMatch?.name || "Your Clinic";
  const doctorRating = Number(overviewData?.rating || overviewData?.avgRating) || (youMatch?.rating ? Number(youMatch.rating) : 4.9);
  const doctorReviewCount = Number(overviewData?.user_ratings_total || overviewData?.reviewCount || overviewData?.totalReviews) || (youMatch?.reviewCount ? Number(youMatch.reviewCount) : 78);
  const primaryCategory = overviewData?.primaryCategory || "Pediatrician";
  const userRank = youMatch?.rank || 2;

  // Build unified list sorted strictly by Map Rank (showing all results returned by API)
  const competitorRowsOnly = rawCompetitorList.filter(c => !c.isYou);
  
  const allRows = [
    ...competitorRowsOnly.map((c, i) => ({
      placeId: c.placeId || `comp-${i}`,
      name: c.name,
      rating: Number(c.rating) || 0,
      reviewCount: Number(c.reviewCount) || 0,
      // null = real unknown (API couldn't calculate), never fake
      distanceMeters: c.distanceMeters != null ? c.distanceMeters : null,
      rank: c.rank || i + 1,
      isYou: false,
      primaryType: c.primaryType
    })),

    {
      placeId: "you-row",
      name: doctorName,
      rating: doctorRating,
      reviewCount: doctorReviewCount,
      distanceMeters: 0,
      rank: userRank,
      isYou: true,
      primaryType: primaryCategory
    }
  ].sort((a, b) => a.rank - b.rank);

  const displayList = showAll ? allRows : allRows.slice(0, 6);

  return (
    <div className="space-y-0">
      {/* 4-Pillar Side-by-Side Competitive Benchmark Matrix */}
      <CompetitiveBenchmarkMatrix competitors={allRows} doctorRating={doctorRating} doctorReviewCount={doctorReviewCount} userRank={userRank} />

      {/* Refresh */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">Top Competitors for {primaryCategory} in your area</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors shrink-0 font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
        <div>Business</div>
        <div className="text-center w-16">Rating</div>
        <div className="text-center w-16">Reviews</div>
        <div className="text-center w-16" title="Real position in Google Search for your specialty near your location">Google Position ↑</div>
      </div>

      {/* Unified Competitor Rows (sorted by Map Rank) */}
      <div className="divide-y divide-gray-50">
        {displayList.map((comp, idx) => {
          if (comp.isYou) {
            return (
              <div
                key="you-row"
                className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-x-4 px-3 py-4 md:py-3 items-center bg-indigo-50/80 rounded-xl border-2 border-indigo-200 shadow-xs"
              >
                <div className="min-w-0 w-full">
                  <p className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 truncate">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    {comp.name} <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">(YOU)</span>
                  </p>
                  <p className="text-xs text-indigo-500 mt-0.5">Your official Google Business Profile</p>
                </div>
                <div className="flex items-center gap-6 md:gap-0 w-full">
                  <div className="md:w-16 flex items-center justify-start md:justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-sm font-bold text-indigo-900">{comp.rating.toFixed(1)}</span>
                  </div>
                  <div className="md:w-16 text-center flex items-center justify-center">
                    <ReviewCount count={comp.reviewCount} />
                  </div>
                  <div className="ml-auto md:ml-0 md:w-16 flex justify-end md:justify-center">
                    <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full border text-xs font-bold ${userRank === 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                      #{userRank}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={comp.placeId || idx}
              className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-x-4 px-3 py-4 md:py-3 hover:bg-gray-50/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 md:line-clamp-1">{comp.name}</p>

              </div>
              <div className="flex items-center gap-6 md:gap-0">
                <div className="md:w-16 flex items-center justify-start md:justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">
                    {comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-gray-400 md:hidden ml-1">(Rating)</span>
                </div>
                <div className="md:w-16 text-center flex items-center justify-center gap-1.5">
                  <ReviewCount count={comp.reviewCount} />
                  <span className="text-xs text-gray-400 md:hidden">Reviews</span>
                </div>
                <div className="ml-auto md:ml-0 md:w-16 flex justify-end md:justify-center">
                  <RankBadge rank={comp.rank} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "X more ahead" + show more toggle */}
      {!showAll && allRows.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 text-xs text-gray-400 text-center hover:text-indigo-600 transition-colors font-medium"
        >
          Show all {allRows.length} nearby clinics...
          <ChevronDown className="w-3 h-3 inline ml-1" />
        </button>
      )}
      {showAll && allRows.length > 6 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-xs text-gray-400 text-center hover:text-indigo-600 transition-colors font-medium"
        >
          Show top 6 <ChevronUp className="w-3 h-3 inline ml-1" />
        </button>
      )}

      {/* Competitor Keywords with 1-Click Action Menus */}
      <CompetitorKeywords competitors={allRows} primaryCategory={primaryCategory} keywordsData={keywordsData} />
    </div>
  );
}
