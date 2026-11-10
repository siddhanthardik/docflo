"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, RefreshCw, Star, MessageSquare, 
  ExternalLink, ChevronDown, ChevronUp, AlertCircle, 
  Activity, Phone, Globe, ShieldAlert, CheckCircle2,
  TrendingUp, Users, ArrowUpRight, Search, Plus, Edit3, X,
  Compass, Award
} from "lucide-react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
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
  id?: string;
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceMeters: number | null;
  rank?: number;
  isYou?: boolean;
  primaryCategory?: string;
  category?: string;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  formattedAddress?: string;
}

function formatDistance(meters: number | null | undefined): string {
  if (meters == null || isNaN(meters)) return "—";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function RankBadge({ rank = 1 }: { rank?: number | null }) {
  if (rank == null || isNaN(Number(rank)) || Number(rank) > 20) {
    return (
      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-full border text-xs font-bold bg-gray-100 text-gray-600 border-gray-200">
        &gt;20
      </span>
    );
  }
  const safeRank = Number(rank);
  const color = safeRank <= 3
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : safeRank <= 7
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={`inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      #{safeRank}
    </span>
  );
}

interface CompetitorAnalysis {
  signalBadge: {
    label: string;
    color: string;
  };
  explanation: string;
  detectedKeywords: string[];
  primaryCounterKeyword: string;
  counterActionNote: string;
  reviewGap: number;
}

function getCompetitorIntelligence(
  comp: Competitor,
  doctorReviewCount: number,
  doctorRating: number,
  primaryCategory: string
): CompetitorAnalysis {
  const name = String(comp?.name || "Clinic");
  const cat = String(comp?.category || primaryCategory || "Specialist Clinic");
  const baseCategory = String(primaryCategory || "Specialist Clinic");

  // Extract medical practice keywords from competitor's name
  const detectedKeywords: string[] = [];
  const rawSegments = name.split(/[|\-–,/·:]/).map(s => s.trim()).filter(Boolean);

  for (const seg of rawSegments) {
    const l = seg.toLowerCase();
    if (
      (l.startsWith("dr ") || l.startsWith("dr.") || l.startsWith("prof")) &&
      !l.includes("clinic") &&
      !l.includes("care") &&
      !l.includes("hospital") &&
      !l.includes("centre") &&
      !l.includes("center")
    ) {
      continue;
    }

    if (seg.length > 2) {
      const cleaned = seg.replace(/^[-|–,.\s]+|[-|–,.\s]+$/g, "").trim();
      if (cleaned.length > 2 && !detectedKeywords.includes(cleaned)) {
        detectedKeywords.push(cleaned);
      }
    }
  }

  let primaryCounterKeyword = detectedKeywords[0] || `${baseCategory} near me`;
  if (primaryCounterKeyword.length > 30) {
    const subParts = primaryCounterKeyword.split(/[,|\-]/);
    primaryCounterKeyword = (subParts[0] || baseCategory).trim();
  }

  const compReviewCount = Math.max(0, Number(comp?.reviewCount) || 0);
  const compRating = Math.max(0, Number(comp?.rating) || 0);
  const reviewGap = Math.max(0, compReviewCount - (Number(doctorReviewCount) || 0));
  const hasKeywordInTitle = detectedKeywords.length > 0;
  const isHighVolumeLeader = compReviewCount >= 400;
  const isHighRatingLeader = compRating >= 4.8 && compReviewCount >= 80;
  const catLower = baseCategory.toLowerCase();

  if (hasKeywordInTitle && (catLower ? name.toLowerCase().includes(catLower) : false)) {
    return {
      signalBadge: {
        label: "Title Keyword Match",
        color: "bg-purple-50 text-purple-700 border-purple-200",
      },
      explanation: `Listing title includes medical specialty terms (${detectedKeywords.slice(0, 2).join(", ")}), directly matching patient search intent.`,
      detectedKeywords,
      primaryCounterKeyword,
      counterActionNote: `Publish clinic updates focusing on "${primaryCounterKeyword}" and request patient reviews highlighting this care.`,
      reviewGap,
    };
  }

  if (isHighVolumeLeader) {
    return {
      signalBadge: {
        label: "Review Volume Leader",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      },
      explanation: `Has accumulated ${compReviewCount} patient reviews (+${reviewGap} review difference vs your clinic).`,
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [`${cat}`, `${baseCategory} Care`],
      primaryCounterKeyword: detectedKeywords[0] || baseCategory,
      counterActionNote: `Close their review volume gap by requesting reviews via WhatsApp from recent consultations.`,
      reviewGap,
    };
  }

  if (isHighRatingLeader) {
    return {
      signalBadge: {
        label: "High Rating Benchmark",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      explanation: `Maintains a ${compRating > 0 ? compRating.toFixed(1) : "5.0"}★ rating across ${compReviewCount} verified reviews.`,
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [`Top Rated ${baseCategory}`, "Patient Care"],
      primaryCounterKeyword: detectedKeywords[0] || `Top ${baseCategory}`,
      counterActionNote: `Highlight clinical treatment specializations in updates and collect patient reviews regularly.`,
      reviewGap,
    };
  }

  return {
    signalBadge: {
      label: "Verified Healthcare Practice",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    explanation: `Verified provider of ${cat} located ${formatDistance(comp?.distanceMeters ?? null)} from your clinic.`,
    detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [baseCategory, `${baseCategory} near me`],
    primaryCounterKeyword: detectedKeywords[0] || baseCategory,
    counterActionNote: `Keep patient updates active with your clinic's services and consulting schedule.`,
    reviewGap,
  };
}

function CompetitorKeywords({ 
  competitors, 
  primaryCategory, 
  keywordsData,
  activeKeyword,
  onSelectKeyword,
}: { 
  competitors: Competitor[]; 
  primaryCategory: string; 
  keywordsData: any;
  activeKeyword?: string | null;
  onSelectKeyword?: (kw: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const competitorTitleKeywords: string[] = [];
  const baseCategory = String(primaryCategory || "Specialist Clinic");

  (Array.isArray(competitors) ? competitors : [])
    .filter(c => c && !c.isYou)
    .slice(0, 10)
    .forEach(c => {
      const parts = (c?.name || "").split(/[,|–-]/).map((p: string) => p.trim());
      for (const part of parts) {
        const lower = part.toLowerCase();
        if (
          lower.startsWith("dr ") ||
          lower.startsWith("dr.") ||
          lower.startsWith("prof") ||
          lower.includes("clinic") ||
          lower.includes("hospital") ||
          lower.includes("centre") ||
          lower.includes("center") ||
          lower.includes("nursing") ||
          part.length <= 3
        ) {
          continue;
        }

        if (
          lower.includes("specialist") ||
          lower.includes("doctor") ||
          lower.includes("physician") ||
          lower.includes("care") ||
          lower.includes("surgeon") ||
          lower.includes("pediatric") ||
          lower.includes("dent") ||
          lower.includes("cardio") ||
          lower.includes("gynae") ||
          (baseCategory && lower.includes(baseCategory.toLowerCase()))
        ) {
          competitorTitleKeywords.push(part);
        }
      }
    });

  const rawKeywordsArray = Array.isArray(keywordsData?.searchKeywordsCounts)
    ? keywordsData.searchKeywordsCounts
    : Array.isArray(keywordsData)
    ? keywordsData
    : [];

  const actualSearchTerms = rawKeywordsArray
    .map((kw: any) => {
      const term = typeof kw === "string" ? kw : (kw?.searchKeyword || kw?.keyword || "");
      return typeof term === "string" ? term.trim() : "";
    })
    .filter((k: string) => k.length > 3 && !k.toLowerCase().startsWith("dr ") && !k.toLowerCase().includes("clinic"));

  let dynamicKeywords = [
    `Best ${baseCategory}`,
    `${baseCategory} near me`,
    ...competitorTitleKeywords.slice(0, 3),
    ...actualSearchTerms,
  ];

  dynamicKeywords = Array.from(new Set(dynamicKeywords.map(k => String(k || "").trim()))).filter(Boolean).slice(0, 8);

  const handleAddToGmbServices = async (kw: string) => {
    try {
      await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addService: kw }),
      });
      toast({
        title: "Added to GMB Services",
        description: `"${kw}" has been added to your clinic services list and queued for GMB sync.`,
      });
    } catch {
      toast({
        title: "Service Added",
        description: `"${kw}" queued for GMB service sync.`,
      });
    }
  };

  const handleUseInReviewReplies = (kw: string) => {
    toast({
      title: "Opening Reviews Inbox",
      description: `Targeting "${kw}" in AI Review Assistant. Navigating to reviews...`,
    });
    router.push(`/reviews?targetKeyword=${encodeURIComponent(kw)}`);
  };

  const handleDraftPost = (kw: string) => {
    toast({
      title: "Drafting Google Post",
      description: `Opening composer targeting "${kw}".`,
    });
    router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Search className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Patient Search Term Intercept</h3>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">Click any term to check observed rankings</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {dynamicKeywords.map((kw, idx) => {
          const isActive = activeKeyword?.toLowerCase() === kw.toLowerCase();

          return (
            <div key={idx} className="inline-flex items-center">
              <DropdownMenu>
                <div className={`inline-flex items-center rounded-full border text-xs font-medium transition-all shadow-2xs overflow-hidden ${
                  isActive 
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xs" 
                    : "bg-indigo-50/60 border-indigo-100/80 text-indigo-900 hover:bg-indigo-100/70 hover:border-indigo-200"
                }`}>
                  <button
                    type="button"
                    onClick={() => onSelectKeyword?.(kw)}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 cursor-pointer hover:opacity-90"
                    title={isActive ? "Click to clear filter and reset" : `Click to view rankings for "${kw}"`}
                  >
                    <span className={isActive ? "text-indigo-200 font-bold" : "text-indigo-400 font-semibold"}>#</span>
                    <span>{kw}</span>
                    {isActive && (
                      <X className="w-3 h-3 ml-1 text-indigo-200 hover:text-white" />
                    )}
                  </button>

                  <DropdownMenuTrigger asChild>
                    <button 
                      type="button"
                      className={`pr-2 pl-1 py-1 cursor-pointer transition-colors ${
                        isActive ? "hover:bg-indigo-700 text-indigo-200" : "hover:bg-indigo-100 text-indigo-400"
                      }`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                </div>

                <DropdownMenuContent align="start" className="w-64 bg-white border border-gray-100 shadow-lg rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-2 py-1">
                    Action for &ldquo;{kw}&rdquo;
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  <DropdownMenuItem 
                    onClick={() => onSelectKeyword?.(kw)}
                    className="text-xs rounded-lg cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50 text-indigo-900 font-semibold"
                  >
                    <Search className="w-4 h-4 mr-2 text-indigo-600" />
                    View Rankings for &ldquo;{kw}&rdquo;
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDraftPost(kw)}
                    className="text-xs rounded-lg cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-gray-800"
                  >
                    <Edit3 className="w-4 h-4 mr-2 text-amber-600" />
                    Draft Google Update
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleUseInReviewReplies(kw)}
                    className="text-xs rounded-lg cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 text-gray-800"
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
                    Target in Google Review Replies
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAddToGmbServices(kw)}
                    className="text-xs rounded-lg cursor-pointer hover:bg-purple-50 focus:bg-purple-50 text-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2 text-purple-600" />
                    Add to GMB Services List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompetitorInsights() {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"ranking" | "nearby">("ranking");
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [scope, setScope] = useState<"city" | "local">("city");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

  const competitorParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (activeTab === "nearby") {
      params.mode = "nearby";
    } else {
      params.mode = "ranking";
      if (selectedKeyword) params.keyword = selectedKeyword;
      if (scope) params.scope = scope;
    }
    if (forceRefresh) params.refresh = "true";
    return params;
  }, [activeTab, selectedKeyword, scope, forceRefresh]);

  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { data: keywordsData } = useLocalSeoModule<any>('keywords');
  const { 
    data: rawCompetitorList, 
    isLoading, 
    isFetching,
    error,
    refetch,
    lastUpdated,
    queryUsed,
  } = useLocalSeoModule<Competitor[]>('competitors', competitorParams);

  const handleRefresh = async () => {
    setRefreshing(true);
    setForceRefresh(true);
    try {
      await refetch();
    } catch (err: any) {
      toast({
        title: "Refresh Limited",
        description: err?.message || "Please wait before requesting fresh data.",
      });
    } finally {
      setRefreshing(false);
      setTimeout(() => setForceRefresh(false), 2000);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      setSelectedKeyword(keywordInput.trim());
    }
  };

  const handleClearKeyword = () => {
    setSelectedKeyword("");
    setKeywordInput("");
  };

  const rawList: Competitor[] = Array.isArray(rawCompetitorList) ? rawCompetitorList : [];

  // Identify clinic's own record
  const youMatch = rawList.find(c => c && c.isYou);
  const doctorName = overviewData?.name || overviewData?.businessName || youMatch?.name || "Your Clinic";
  const doctorRating = Number(overviewData?.rating || overviewData?.avgRating) || (youMatch?.rating ? Number(youMatch.rating) : 0);
  const doctorReviewCount = Number(overviewData?.user_ratings_total || overviewData?.reviewCount || overviewData?.totalReviews) || (youMatch?.reviewCount ? Number(youMatch.reviewCount) : 0);
  const primaryCategory = overviewData?.primaryCategory || youMatch?.category || youMatch?.primaryCategory || "Healthcare Practice";

  // Check observed ranking for ranking view
  const inTop20 = Boolean(youMatch && youMatch.rank && youMatch.rank <= 20);
  const observedUserRank = inTop20 ? youMatch?.rank : null;

  // Filter out the clinic's own profile so it does not appear as a competitor card
  const nearbyCompetitors = useMemo(() => {
    const seen = new Set<string>();
    const list: Competitor[] = [];

    for (const c of rawList) {
      if (!c || c.isYou) continue;
      const cleanKey = (c.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const placeId = c.placeId || "";
      if (placeId && seen.has(placeId)) continue;
      if (cleanKey && seen.has(cleanKey)) continue;

      if (placeId) seen.add(placeId);
      if (cleanKey) seen.add(cleanKey);

      list.push(c);
    }

    return list;
  }, [rawList]);

  // Competitor immediately ahead for competitive review benchmark
  const competitorAhead = useMemo(() => {
    if (observedUserRank && observedUserRank > 1) {
      return nearbyCompetitors.find(c => c.rank === observedUserRank - 1);
    }
    return nearbyCompetitors[0] || null;
  }, [nearbyCompetitors, observedUserRank]);

  const reviewVolumeBenchmark = competitorAhead
    ? Math.max(0, (competitorAhead.reviewCount || 0) - doctorReviewCount)
    : 0;

  // Summary statistics for 5 km Directory mode
  const stats = useMemo(() => {
    if (nearbyCompetitors.length === 0) {
      return { total: 0, avgRating: 0, avgReviews: 0, higherReviewedCount: 0, higherRatedCount: 0 };
    }

    const total = nearbyCompetitors.length;
    const ratedCompetitors = nearbyCompetitors.filter(c => typeof c.rating === "number" && c.rating > 0);
    const avgRating = ratedCompetitors.length > 0
      ? ratedCompetitors.reduce((acc, c) => acc + c.rating, 0) / ratedCompetitors.length
      : 0;

    const avgReviews = Math.round(
      nearbyCompetitors.reduce((acc, c) => acc + (c.reviewCount || 0), 0) / total
    );

    const higherReviewedCount = nearbyCompetitors.filter(c => (c.reviewCount || 0) > doctorReviewCount).length;
    const higherRatedCount = nearbyCompetitors.filter(c => (c.rating || 0) > doctorRating).length;

    return { total, avgRating, avgReviews, higherReviewedCount, higherRatedCount };
  }, [nearbyCompetitors, doctorReviewCount, doctorRating]);

  // Active query for Google Maps live verification
  const activeQueryToVerify = queryUsed || selectedKeyword || primaryCategory;
  const googleMapsVerifyUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeQueryToVerify)}`;

  const displayedCompetitors = useMemo(() => {
    return showAll ? nearbyCompetitors : nearbyCompetitors.slice(0, 8);
  }, [nearbyCompetitors, showAll]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state: Missing clinic coordinates
  if (error && error.message?.includes("NO_COORDINATES")) {
    return (
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-amber-900">Clinic Location Verification Required</h3>
        <p className="text-sm text-amber-700 max-w-lg mx-auto">
          Verified coordinates are missing from your Google Business Profile. Please complete or verify your clinic address and location in Google Business Profile.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-amber-300 text-amber-900 hover:bg-amber-100">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Retry After Verifying
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Tab Switcher Header ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Navigation */}
          <div className="inline-flex p-1 bg-gray-100/90 rounded-xl border border-gray-200/70 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("ranking")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "ranking"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Keyword Search Rankings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nearby")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "nearby"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>5 km Nearby Directory</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden lg:inline">
                Updated {formatDate(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Refresh search from Google Places"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing || isFetching ? "animate-spin" : ""}`} />
              <span>{refreshing || isFetching ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {error && !error.message?.includes("NO_COORDINATES") && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error.message === "COOLDOWN_ACTIVE" ? "Refresh is limited to once every 60 seconds. Please wait before refreshing again." : error.message}</span>
          </div>
        )}

        {/* ── View 1: Keyword Ranking & Intelligence (Primary) ── */}
        {activeTab === "ranking" && (
          <div className="space-y-4 pt-1">
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder={`Search clinical keyword (e.g., best ${primaryCategory.toLowerCase()} in your locality)...`}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-400"
                />
                {keywordInput && (
                  <button
                    type="button"
                    onClick={() => setKeywordInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-9 px-4">
                  Check Rankings
                </Button>
                {selectedKeyword && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearKeyword}
                    className="rounded-xl text-xs h-9 text-gray-600 border-gray-200"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>

            {/* Keyword Intercept Pills */}
            <CompetitorKeywords
              competitors={nearbyCompetitors}
              primaryCategory={primaryCategory}
              keywordsData={keywordsData}
              activeKeyword={selectedKeyword}
              onSelectKeyword={(kw) => {
                if (selectedKeyword.toLowerCase() === kw.toLowerCase()) {
                  handleClearKeyword();
                } else {
                  setSelectedKeyword(kw);
                  setKeywordInput(kw);
                }
              }}
            />

            {/* Observed Position & Review Benchmark Banner */}
            <div className="p-4 bg-linear-to-r from-indigo-50/80 via-white to-indigo-50/40 rounded-2xl border border-indigo-100/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Query Analyzed:</span>
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                      &ldquo;{activeQueryToVerify}&rdquo;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    {inTop20 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Observed Search Position: #{observedUserRank} in Google Places results
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                        Not found in first 20 results
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={googleMapsVerifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Verify live on Google Maps</span>
                </a>
              </div>

              {/* Factual Review Volume Benchmark Note */}
              {competitorAhead && reviewVolumeBenchmark > 0 && (
                <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 text-xs text-gray-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Competitive Review Volume Benchmark</span>
                  </div>
                  <p className="text-gray-600">
                    Practice immediately ahead (<strong>{competitorAhead.name}</strong>) has <strong>{competitorAhead.reviewCount}</strong> patient reviews (+{reviewVolumeBenchmark} difference vs your {doctorReviewCount} reviews). Reaching {competitorAhead.reviewCount} reviews represents your nearest review volume benchmark.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Disclaimer: Review volume is a competitive benchmark; Google search rankings also depend on profile relevance, category alignment, and searcher proximity.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── View 2: 5 km Nearby Directory Summary Cards (Secondary) ── */}
        {activeTab === "nearby" && (
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Nearby Healthcare Practices Directory</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  Within 5 km
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Healthcare practices discovered within a fixed 5,000-metre radius of your verified Google Business Profile location, ordered by physical distance.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Nearby Practices
                </span>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[11px] text-gray-400">within 5 km radius</p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Average Rating
                </span>
                <p className="text-xl font-bold text-gray-900">
                  {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : "—"}
                </p>
                <p className="text-[11px] text-gray-400">
                  Your rating: <strong>{doctorRating > 0 ? `${doctorRating.toFixed(1)}★` : "Unrated"}</strong>
                </p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  Average Reviews
                </span>
                <p className="text-xl font-bold text-gray-900">{stats.avgReviews}</p>
                <p className="text-[11px] text-gray-400">
                  Your reviews: <strong>{doctorReviewCount}</strong>
                </p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  More Reviews Than You
                </span>
                <p className="text-xl font-bold text-gray-900">
                  {stats.higherReviewedCount} <span className="text-xs font-normal text-gray-500">of {stats.total}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  {stats.higherReviewedCount === 0 ? "You lead in nearby reviews" : "Practices with higher volume"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Competitors List Section ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm">
              {activeTab === "ranking" ? "Observed Search Results" : "Discovered Nearby Practices"}
            </h3>
            <span className="text-xs text-gray-400">({nearbyCompetitors.length} listed)</span>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            {activeTab === "ranking" ? "Rank order observed from Google Places" : "Sorted by physical distance"}
          </span>
        </div>

        {nearbyCompetitors.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">No competing practices found</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No matching healthcare practices were returned for this query. Try searching with a broader specialty term or switching to the 5 km Nearby Directory.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedCompetitors.map((comp, idx) => {
              const placeId = comp.placeId || `comp-${idx}`;
              const isExpanded = expandedPlaceId === placeId;
              const intelligence = getCompetitorIntelligence(comp, doctorReviewCount, doctorRating, primaryCategory);
              const rankVal = comp.rank ?? idx + 1;

              return (
                <div key={placeId} className="p-4 hover:bg-gray-50/60 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Rank badge */}
                      <div className="pt-0.5 shrink-0">
                        {activeTab === "ranking" ? (
                          <RankBadge rank={rankVal} />
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full border text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200">
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {comp.name}
                          </h4>
                          {activeTab === "ranking" && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${intelligence.signalBadge.color}`}>
                              {intelligence.signalBadge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="text-gray-600 font-medium">
                            {comp.category || comp.primaryCategory || "Healthcare Practice"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {typeof comp.rating === "number" && comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
                            <span className="font-normal text-gray-400">({comp.reviewCount || 0} reviews)</span>
                          </span>
                          <span>•</span>
                          <span className="text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {formatDistance(comp.distanceMeters)} away
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {comp.googleMapsUri && (
                        <a
                          href={comp.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border border-gray-200 transition-colors"
                          title="Visit Website"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {comp.phone && (
                        <a
                          href={`tel:${comp.phone}`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
                          title={`Call ${comp.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {activeTab === "ranking" && (
                        <button
                          type="button"
                          onClick={() => setExpandedPlaceId(isExpanded ? null : placeId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <span>Analysis</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Competitor Intelligence Card (Ranking mode) */}
                  {activeTab === "ranking" && isExpanded && (
                    <div className="p-3.5 bg-gray-50/90 rounded-xl border border-gray-200/80 text-xs space-y-2.5 pt-3">
                      <div className="space-y-1">
                        <span className="font-semibold text-gray-700">Observation:</span>
                        <p className="text-gray-600">{intelligence.explanation}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-gray-700">Recommended Countermeasure:</span>
                        <p className="text-indigo-950 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                          {intelligence.counterActionNote}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(intelligence.primaryCounterKeyword)}`)}
                          className="text-xs h-7 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                          <Edit3 className="w-3 h-3 mr-1 text-indigo-600" />
                          Draft Update for &ldquo;{intelligence.primaryCounterKeyword}&rdquo;
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/reviews?targetKeyword=${encodeURIComponent(intelligence.primaryCounterKeyword)}`)}
                          className="text-xs h-7 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <MessageSquare className="w-3 h-3 mr-1 text-emerald-600" />
                          Target in Review Replies
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {nearbyCompetitors.length > 8 && (
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <span>{showAll ? "Show Top 8 Only" : `Show All ${nearbyCompetitors.length} Practices`}</span>
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
