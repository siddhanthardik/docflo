"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, Star, RefreshCw, ChevronDown, ChevronUp, Sparkles, Plus, 
  MessageSquare, Edit3, MapPin, Target, ExternalLink, Activity, Search,
  Building2, X, Loader2
} from "lucide-react";
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
  category?: string;
  formattedAddress?: string;
  isYou?: boolean;
  rank?: number;
}

function RankBadge({ rank = 1 }: { rank?: number }) {
  const isGood = rank <= 3;
  const isOk = rank <= 7;
  const color = isGood
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isOk
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={`inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      #{rank}
    </span>
  );
}

function ReviewCount({ count }: { count: number }) {
  const color = count >= 200 ? "text-emerald-600" : count >= 50 ? "text-amber-600" : "text-red-500";
  return <span className={`font-bold text-sm ${color}`}>{count ? count.toLocaleString() : 0}</span>;
}

function formatDistance(meters: number | null) {
  if (meters == null || meters === 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
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
  const name = comp.name || "";
  const cat = comp.category || primaryCategory || "Specialist Clinic";

  // 1. Extract medical practice keywords from competitor's name dynamically (No hardcoded specialties)
  const detectedKeywords: string[] = [];
  const rawSegments = name.split(/[|\-–,/·:]/).map(s => s.trim()).filter(Boolean);

  for (const seg of rawSegments) {
    const l = seg.toLowerCase();
    // Exclude basic doctor name segments (e.g. "Dr. Vinod Kumar")
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

  // Determine Primary Counter Keyword
  let primaryCounterKeyword = detectedKeywords[0] || `${primaryCategory} near me`;
  if (primaryCounterKeyword.length > 30) {
    const subParts = primaryCounterKeyword.split(/[,|\-]/);
    primaryCounterKeyword = subParts[0].trim();
  }

  const reviewGap = Math.max(0, comp.reviewCount - doctorReviewCount);
  const hasKeywordInTitle = detectedKeywords.length > 0;
  const isHighVolumeLeader = comp.reviewCount >= 450;
  const isHighRatingLeader = comp.rating >= 4.9 && comp.reviewCount >= 100;

  if (hasKeywordInTitle && comp.name.toLowerCase().includes(primaryCategory.toLowerCase())) {
    return {
      signalBadge: {
        label: "Title Keyword & Speciality Match",
        color: "bg-purple-50 text-purple-700 border-purple-200",
      },
      explanation: `This clinic directly includes the specialty in its Google listing title (${detectedKeywords.slice(0, 2).join(", ")}), giving it algorithmic prominence in Map Pack results.`,
      detectedKeywords,
      primaryCounterKeyword,
      counterActionNote: `Strengthen your search prominence by drafting Google Updates focused on "${primaryCounterKeyword}" and requesting reviews highlighting your clinical care.`,
      reviewGap
    };
  }

  if (isHighVolumeLeader) {
    return {
      signalBadge: {
        label: "Review Volume Authority Leader",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      },
      explanation: `Ranks high due to an accumulated base of ${comp.reviewCount} patient reviews (+${reviewGap} ahead of your clinic), establishing long-term authority on Google.`,
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [`${cat}`, `${primaryCategory} Care`],
      primaryCounterKeyword: detectedKeywords[0] || primaryCategory,
      counterActionNote: `Close their review lead by sending automated WhatsApp review requests to your recent patients. Consistent weekly reviews beat older static volumes.`,
      reviewGap
    };
  }

  if (isHighRatingLeader) {
    return {
      signalBadge: {
        label: "High Sentiment & Quality Trust",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      explanation: `Maintains a strong ${comp.rating.toFixed(1)}★ rating across ${comp.reviewCount} reviews, earning high algorithmic trust for positive patient outcomes.`,
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [`Top Rated ${primaryCategory}`, "5 Star Care"],
      primaryCounterKeyword: detectedKeywords[0] || `Top ${primaryCategory}`,
      counterActionNote: `Showcase your patient success stories in Google Updates and keep collecting 5-star feedback to rival their sentiment score.`,
      reviewGap
    };
  }

  return {
    signalBadge: {
      label: "Verified Specialty Competitor",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    explanation: `Verified provider of ${cat} within your local search radius (${formatDistance(comp.distanceMeters)} away).`,
    detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [primaryCategory, `${primaryCategory} near me`],
    primaryCounterKeyword: detectedKeywords[0] || primaryCategory,
    counterActionNote: `Target nearby patient searches by publishing weekly updates highlighting your clinic's services and location.`,
    reviewGap
  };
}

// Interactive Competitor Keyword Targeting Block (Fully Dynamic)
function CompetitorKeywords({ 
  competitors, 
  primaryCategory, 
  keywordsData,
  activeKeyword,
  city = "Patna",
  onSelectKeyword,
}: { 
  competitors: Competitor[]; 
  primaryCategory: string; 
  keywordsData: any;
  activeKeyword?: string | null;
  city?: string;
  onSelectKeyword?: (kw: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // 1. Extract genuine medical search phrases from competitor titles (EXCLUDE hospital and doctor brand names)
  const competitorTitleKeywords: string[] = [];
  const baseCategory = primaryCategory || "Specialist Clinic";
  const cityStr = city || "your city";

  competitors
    .filter(c => !c.isYou)
    .slice(0, 10)
    .forEach(c => {
      const parts = (c.name || "").split(/[,|–-]/).map((p: string) => p.trim());
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
          lower.includes("cloud nine") ||
          lower.includes("cloudnine") ||
          lower.includes("apollo") ||
          lower.includes("max ") ||
          lower.includes("fortis") ||
          lower.includes("paras") ||
          lower.includes("saroj") ||
          lower.includes("madan") ||
          lower.includes("chandra") ||
          part.length <= 3
        ) {
          continue;
        }

        // Must represent clinical intent matching this doctor's specialty
        if (
          lower.includes("specialist") ||
          lower.includes("doctor") ||
          lower.includes("physician") ||
          lower.includes("care") ||
          lower.includes("surgeon") ||
          lower.includes("gynae") ||
          lower.includes("gynec") ||
          lower.includes("obstet") ||
          lower.includes("nephro") ||
          lower.includes("kidney") ||
          lower.includes(baseCategory.toLowerCase())
        ) {
          competitorTitleKeywords.push(part);
        }
      }
    });

  // 2. High-Intent Patient Search Phrases for this specialty
  const actualSearchTerms = (keywordsData?.searchKeywordsCounts || [])
    .map((kw: any) => (typeof kw === "string" ? kw : kw.searchKeyword).toLowerCase().trim())
    .filter((k: string) => k.length > 3 && !k.startsWith("dr ") && !k.includes("clinic") && !k.includes("hospital"));

  let dynamicKeywords = [
    `Best ${baseCategory} in ${cityStr}`,
    `${baseCategory} in ${cityStr}`,
    `${baseCategory} near me`,
    `Best ${baseCategory} Doctor in ${cityStr}`,
    `Top ${baseCategory} in ${cityStr}`,
    ...competitorTitleKeywords.slice(0, 2),
    ...actualSearchTerms,
  ];

  dynamicKeywords = Array.from(new Set(dynamicKeywords.map(k => k.trim()))).filter(Boolean).slice(0, 8);

  // Action Handlers
  const handleAddToGmbServices = async (kw: string) => {
    try {
      await fetch("/api/settings/clinic", {
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
    <div className="p-5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Competitor Search Term Intercept</h3>
        </div>
        <span className="text-xs text-gray-400 font-medium">Click any term to check rankings or counter-target</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
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
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer hover:opacity-90"
                    title={isActive ? "Click to clear filter and reset" : `Click to view competitor rankings for "${kw}"`}
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
                      className={`pr-2.5 pl-1 py-1.5 cursor-pointer transition-colors ${
                        isActive ? "hover:bg-indigo-700 text-indigo-200" : "hover:bg-indigo-100 text-indigo-400"
                      }`}
                    >
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                </div>

                <DropdownMenuContent align="start" className="w-64 bg-white border border-gray-100 shadow-lg rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-2 py-1">
                    Target Action for &ldquo;{kw}&rdquo;
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
                    className="text-xs rounded-lg cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50 text-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2 text-indigo-600" />
                    Add to Clinic GMB Services
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
  const [scope, setScope] = useState<"city" | "local">("city");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const competitorParams = useMemo(() => {
    const params: Record<string, string> = { scope };
    if (selectedKeyword) {
      params.keyword = selectedKeyword;
    }
    return params;
  }, [scope, selectedKeyword]);

  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { data: keywordsData } = useLocalSeoModule<any>('keywords');
  const { 
    data: competitors, 
    isLoading, 
    isFetching,
    refetch,
    queryUsed,
    city,
    neighborhood,
  } = useLocalSeoModule<any[]>('competitors', competitorParams);

  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

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
  const doctorRating = Number(overviewData?.rating || overviewData?.avgRating) || (youMatch?.rating ? Number(youMatch.rating) : 0);
  const doctorReviewCount = Number(overviewData?.user_ratings_total || overviewData?.reviewCount || overviewData?.totalReviews) || (youMatch?.reviewCount ? Number(youMatch.reviewCount) : 0);
  const primaryCategory = overviewData?.primaryCategory || youMatch?.category || "Specialist Clinic";

  // Build unified list without duplicates
  const rawRows: Competitor[] = rawCompetitorList.map((c, i) => ({
    placeId: c.placeId || `comp-${i}`,
    name: c.name,
    rating: Number(c.rating) || 0,
    reviewCount: Number(c.reviewCount) || 0,
    distanceMeters: c.isYou ? 0 : (c.distanceMeters != null ? c.distanceMeters : null),
    rank: c.rank || i + 1,
    isYou: Boolean(c.isYou),
    primaryType: c.primaryType,
    category: c.category || c.primaryType,
    formattedAddress: c.formattedAddress || "",
  })).sort((a, b) => (a.rank || 0) - (b.rank || 0));

  // Deduplicate: ensure strictly 1 row per unique clinic name or placeId, and strictly 1 isYou row
  const seenPlaceIds = new Set<string>();
  const seenNames = new Set<string>();
  let hasYou = false;

  const allRows: Competitor[] = [];
  for (const row of rawRows) {
    const cleanName = (row.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const placeId = row.placeId || "";

    if (row.isYou) {
      if (hasYou) continue;
      hasYou = true;
    }

    if (placeId && placeId !== "you" && seenPlaceIds.has(placeId)) continue;
    if (cleanName && seenNames.has(cleanName)) continue;

    if (placeId && placeId !== "you") seenPlaceIds.add(placeId);
    if (cleanName) seenNames.add(cleanName);
    allRows.push(row);
  }

  // Determine user's clinic and competitor immediately ahead
  const youIndex = allRows.findIndex(r => r.isYou);
  const youRow = youIndex !== -1 ? allRows[youIndex] : null;
  const competitorAhead = youIndex > 0 ? allRows[youIndex - 1] : null;
  const reviewsNeededToOvertake = competitorAhead && youRow
    ? Math.max(0, (competitorAhead.reviewCount || 0) - (youRow.reviewCount || 0))
    : 0;

  const displayQuery = queryUsed || (
    scope === "local" 
      ? `${primaryCategory} near ${neighborhood || city || "your location"}`
      : `Best ${primaryCategory} in ${city || "your city"}`
  );
  const googleMapsVerifyUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayQuery)}`;

  const displayList = showAll ? allRows : allRows.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ── Search Query & Geo-Scope Verification Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Ranking for: <span className="text-indigo-600">&ldquo;{displayQuery}&rdquo;</span>
            </h3>
            <p className="text-xs text-gray-500">
              Showing direct doctor peers in {scope === "local" ? (neighborhood ? `${neighborhood}, ${city}` : `${city} (Within 5 km)`) : `${city} (City-Wide)`}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <a
              href={googleMapsVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50/60 border border-gray-200/80 transition-all shadow-2xs"
            >
              <span>Verify on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Modern Scope Switcher Controls ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
          <div className="inline-flex p-1 bg-gray-100/90 rounded-2xl border border-gray-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setScope("city")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                scope === "city"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/70"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                scope === "city" ? "bg-indigo-50 text-indigo-600" : "bg-gray-200/60 text-gray-500"
              }`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold leading-tight">Entire City ({city || "Patna"})</span>
                <span className="text-[10px] text-gray-400 font-normal">Municipal-wide map pack</span>
              </div>
              {scope === "city" && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setScope("local")}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                scope === "local"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/70"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                scope === "local" ? "bg-rose-50 text-rose-600" : "bg-gray-200/60 text-gray-500"
              }`}>
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold leading-tight">Near Clinic</span>
                <span className="text-[10px] text-gray-400 font-normal">Within 5 km radius</span>
              </div>
              {scope === "local" && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-600 ring-4 ring-rose-50" />
              )}
            </button>
          </div>

          {selectedKeyword && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs">
              <span className="text-gray-500 font-medium">Filtered by:</span>
              <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-indigo-200/70">
                &ldquo;{selectedKeyword}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSelectedKeyword(null)}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 hover:underline cursor-pointer flex items-center gap-1"
                title="Reset back to default specialty ranking"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Competitor Search Term Intercept (Directly below Local Competitor Analysis header) */}
      <CompetitorKeywords 
        competitors={allRows} 
        primaryCategory={primaryCategory} 
        keywordsData={keywordsData} 
        activeKeyword={selectedKeyword}
        city={city || "Patna"}
        onSelectKeyword={(kw) => setSelectedKeyword(prev => prev?.toLowerCase() === kw.toLowerCase() ? null : kw)}
      />

      {/* Top Competitors Header & Live Update Status */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Top Competitors for{" "}
              <strong className="text-gray-900 font-bold">
                {selectedKeyword ? `"${selectedKeyword}"` : primaryCategory}
              </strong>{" "}
              in {scope === "local" ? (neighborhood ? `${neighborhood}, ${city}` : "your immediate neighborhood (within 5 km)") : (city || "your city")} (click to inspect)
            </p>
            {isFetching && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/70 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                <span>Fetching live rankings...</span>
              </span>
            )}
          </div>
        </div>



        {/* Table column headers */}
        <div className="hidden md:grid md:grid-cols-[1fr_75px_75px_175px_135px] gap-x-4 px-3.5 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <div>Business</div>
          <div className="text-center">Rating</div>
          <div className="text-center">Reviews</div>
          <div className="text-center">Distance from Clinic (Approx)</div>
          <div className="text-center">Position</div>
        </div>

        {/* Unified Competitor Rows */}
        <div className={`space-y-1.5 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}>
          {displayList.map((comp, idx) => {
            if (comp.isYou) {
              return (
                <div
                  key={comp.placeId || "you-row"}
                  className="flex flex-col md:grid md:grid-cols-[1fr_75px_75px_175px_135px] gap-2 md:gap-x-4 px-3.5 py-3.5 items-center bg-gradient-to-r from-indigo-50/90 via-emerald-50/40 to-indigo-50/70 rounded-xl border border-indigo-200/90 shadow-2xs my-1.5"
                >
                  <div className="min-w-0 w-full flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2 truncate">
                        {comp.name}
                        <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-2xs">
                          YOU
                        </span>
                      </p>
                      {competitorAhead && reviewsNeededToOvertake > 0 ? (
                        <p className="text-[11px] text-indigo-700 font-medium truncate mt-0.5 flex items-center gap-1">
                          <span>🎯 Target: Needs <strong>{reviewsNeededToOvertake} reviews</strong> to catch up with #{competitorAhead.rank} ({competitorAhead.name})</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                          Your official Google Business Profile
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-gray-900">{comp.rating ? comp.rating.toFixed(1) : "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Reviews</span>
                    <span className="text-sm font-bold text-gray-900">{comp.reviewCount || 0}</span>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Distance</span>
                    <span className="text-xs text-gray-400 font-medium">—</span>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Position</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100/90 border border-indigo-200 text-indigo-700 text-xs font-bold">
                        #{comp.rank}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            const isExpanded = expandedPlaceId === comp.placeId;

            return (
              <div key={comp.placeId || idx} className="rounded-xl transition-all">
                <div
                  onClick={() => setExpandedPlaceId(prev => prev === comp.placeId ? null : comp.placeId)}
                  className={`flex flex-col md:grid md:grid-cols-[1fr_75px_75px_175px_135px] gap-2 md:gap-x-4 px-3.5 py-3 rounded-xl hover:bg-gray-50/80 transition-all cursor-pointer group items-center ${isExpanded ? "bg-gray-50/90 border border-gray-200/80" : "border border-transparent"}`}
                >
                  <div className="min-w-0 w-full flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50/70 flex items-center justify-center text-indigo-500 shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {comp.name}
                        </p>
                      </div>
                      {comp.formattedAddress && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {comp.formattedAddress.replace(/, India$/i, "")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">
                        {comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Reviews</span>
                    <ReviewCount count={comp.reviewCount} />
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Distance</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDistance(comp.distanceMeters)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Position</span>
                    <div className="flex items-center gap-3">
                      <RankBadge rank={comp.rank} />
                      <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Strategy & Details Drawer */}
                {isExpanded && (() => {
                  const intel = getCompetitorIntelligence(comp, doctorReviewCount, doctorRating, primaryCategory);

                  return (
                    <div className="mt-2 mx-1 p-4 bg-white rounded-2xl border border-gray-200/90 shadow-xs space-y-3.5 animate-in fade-in duration-200">
                      {/* Top Bar: Clinic Name + Verified Details + Google Maps Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{comp.name}</p>
                            {comp.category && !["doctor", "physician", "health"].includes(comp.category.toLowerCase()) && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {comp.category}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{comp.reviewCount} patient reviews</span>
                            <span>·</span>
                            <span>{comp.rating > 0 ? `${comp.rating.toFixed(1)}★ rating` : "Unrated"}</span>
                            {comp.distanceMeters != null && (
                              <>
                                <span>·</span>
                                <span>{formatDistance(comp.distanceMeters)} away</span>
                              </>
                            )}
                            {comp.formattedAddress && (
                              <>
                                <span>·</span>
                                <span className="text-gray-400">{comp.formattedAddress.replace(/, India$/i, "")}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.name)}&query_place_id=${encodeURIComponent(comp.placeId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-indigo-700 shadow-2xs transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          View on Google Maps
                        </a>
                      </div>

                      {/* Identified Ranking Signal */}
                      <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${intel.signalBadge.color}`}>
                            <Sparkles className="w-3 h-3" />
                            {intel.signalBadge.label}
                          </span>
                          {intel.reviewGap > 0 && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              +{intel.reviewGap} reviews ahead
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {intel.explanation}
                        </p>
                      </div>

                      {/* Extracted Search Keywords for THIS Competitor */}
                      {intel.detectedKeywords.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Detected Search Terms in Listing
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {intel.detectedKeywords.map((kw, kIdx) => (
                              <button
                                key={kIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(kw)}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-medium border border-indigo-100 transition-colors"
                                title={`Draft Google Post targeting "${kw}"`}
                              >
                                <Target className="w-3 h-3 text-indigo-500" />
                                {kw}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Plan & Targeted Buttons */}
                      <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs text-gray-700">
                          <p className="font-semibold text-indigo-950">Recommended Counter-Action:</p>
                          <p className="text-gray-600 mt-0.5">{intel.counterActionNote}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(intel.primaryCounterKeyword)}`);
                            }}
                            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-2xs flex-1 sm:flex-initial"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Draft Post ({intel.primaryCounterKeyword.slice(0, 16)}...)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/reviews?targetKeyword=${encodeURIComponent(intel.primaryCounterKeyword)}`);
                            }}
                            className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl flex-1 sm:flex-initial"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Target in Reviews
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* "X more ahead" + show more toggle */}
        {!showAll && allRows.length > 8 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-4 text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-semibold flex items-center justify-center gap-1 mt-2 cursor-pointer"
          >
            Show all {allRows.length} nearby clinics <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
        {showAll && allRows.length > 8 && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full py-4 text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-semibold flex items-center justify-center gap-1 mt-2 cursor-pointer"
          >
            Show top 8 <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
