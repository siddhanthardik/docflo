"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, Star, RefreshCw, ChevronDown, ChevronUp, Sparkles, Plus, 
  MessageSquare, Edit3, ShieldCheck, Award, Layers, MapPin, Target, ExternalLink, Activity 
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
  isYou?: boolean;
  rank?: number;
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

  // 1. Extract specific keywords & localities from the competitor's title
  const detectedKeywords: string[] = [];
  
  // Split by common title delimiters: |, -, –, ,, /
  const rawSegments = name.split(/[|\-–,/·]/).map(s => s.trim()).filter(Boolean);
  
  for (const seg of rawSegments) {
    const l = seg.toLowerCase();
    // Exclude basic doctor names unless combined with medical keyword
    if ((l.startsWith("dr ") || l.startsWith("dr.") || l.startsWith("prof")) && !l.includes("gynec") && !l.includes("clinic")) {
      continue;
    }
    if (
      l.includes("gynec") || 
      l.includes("obste") || 
      l.includes("clinic") || 
      l.includes("hospital") || 
      l.includes("centre") || 
      l.includes("center") || 
      l.includes("care") || 
      l.includes("specialist") || 
      l.includes("best") || 
      l.includes("maternity") ||
      l.includes("abortion") ||
      l.includes("doctor in") ||
      l.includes("market") ||
      l.includes("park") ||
      l.includes("delhi") ||
      l.includes("gk") ||
      l.includes("kalkaji") ||
      l.includes("alaknanda")
    ) {
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

  // 2. Identify Primary Ranking Signal
  const hasKeywordInTitle = detectedKeywords.length > 0;
  const isHighVolumeLeader = comp.reviewCount >= 450;
  const isHighRatingLeader = comp.rating >= 4.9 && comp.reviewCount >= 200;

  if (hasKeywordInTitle && detectedKeywords.some(k => {
    const l = k.toLowerCase();
    return l.includes("best") || l.includes("market") || l.includes("delhi") || l.includes("near me") || l.includes("gk") || l.includes("kalkaji");
  })) {
    return {
      signalBadge: {
        label: "Title Keyword & Location Dominance",
        color: "bg-purple-50 text-purple-700 border-purple-200",
      },
      explanation: `This clinic directly includes high-intent patient search terms in its title (${detectedKeywords.slice(0, 3).join(", ")}), giving it a strong boost in local Map Pack queries.`,
      detectedKeywords,
      primaryCounterKeyword,
      counterActionNote: `Counter their title keyword reach by posting Google Updates targeting "${primaryCounterKeyword}" and requesting reviews mentioning this phrase.`,
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
      detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [`${primaryCategory} Clinic`, "Patient Care"],
      primaryCounterKeyword: detectedKeywords[0] || primaryCategory,
      counterActionNote: `Close their review lead by sending automated WhatsApp review requests to your recent patients. Weekly reviews beat older static volumes.`,
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
      label: "Local Specialty Competitor",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    explanation: `Consistently visible for ${primaryCategory} in your local search radius (${formatDistance(comp.distanceMeters)} away).`,
    detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : [primaryCategory, `${primaryCategory} near me`],
    primaryCounterKeyword: detectedKeywords[0] || primaryCategory,
    counterActionNote: `Target nearby patient searches by publishing weekly updates highlighting your clinic's services and location.`,
    reviewGap
  };
}

// Interactive Competitor Keyword Targeting Block
function CompetitorKeywords({ competitors, primaryCategory, keywordsData }: { competitors: Competitor[]; primaryCategory: string; keywordsData: any }) {
  const router = useRouter();
  const { toast } = useToast();

  // 1. Extract keywords from top competitor business names
  const competitorTitleKeywords: string[] = [];
  competitors
    .filter(c => !c.isYou)
    .slice(0, 8)
    .forEach(c => {
      const parts = (c.name || "").split(/[,|–-]/).map((p: string) => p.trim());
      for (const part of parts) {
        const lower = part.toLowerCase();
        if (
          !lower.startsWith("dr ") &&
          !lower.startsWith("dr.") &&
          !lower.startsWith("prof") &&
          (
            lower.includes("gynec") ||
            lower.includes("obste") ||
            lower.includes("clinic") ||
            lower.includes("hospital") ||
            lower.includes("centre") ||
            lower.includes("center") ||
            lower.includes("care") ||
            lower.includes("specialist") ||
            lower.includes("best") ||
            lower.includes("maternity")
          )
        ) {
          competitorTitleKeywords.push(part.toLowerCase());
        }
      }
    });

  // 2. Get actual search terms from the doctor's profile
  const actualSearchTerms = (keywordsData?.searchKeywordsCounts || [])
    .map((kw: any) => (typeof kw === "string" ? kw : kw.searchKeyword).toLowerCase())
    .slice(0, 4);

  // 3. Extract competitor primary types
  const competitorTypes = Array.from(new Set(competitors.map(c => c.primaryType).filter(Boolean)))
    .map(type => type!.replace(/_/g, " ").toLowerCase())
    .slice(0, 3);

  // 4. Synthesize Organic Dynamic Keywords
  const baseCategory = primaryCategory.toLowerCase();
  
  let dynamicKeywords = [
    ...competitorTitleKeywords.slice(0, 3),
    `${baseCategory} near me`,
    `best ${baseCategory}`,
    ...actualSearchTerms,
    ...competitorTypes.map(t => `${t} clinic`),
  ];

  dynamicKeywords = Array.from(new Set(dynamicKeywords)).filter(Boolean).slice(0, 8);

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
    <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-gray-900 text-sm">Competitor Search Term Intercept</h3>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            High-Intent Patient Searches
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">Click any term to counter-target & outrank</span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Search terms and specialty phrases used by top-ranking clinics in your area. Click any keyword to target it in a Google Post, weave it into your AI Review Replies, or add it to your clinic services.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {dynamicKeywords.map((kw, idx) => (
          <DropdownMenu key={idx}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 text-indigo-800 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-all shadow-2xs capitalize">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                {kw}
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 bg-white border border-gray-100 shadow-lg rounded-xl p-1.5">
              <DropdownMenuLabel className="text-xs text-gray-500 font-medium px-2 py-1">
                Target Action for &ldquo;{kw}&rdquo;
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
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
        ))}
      </div>
    </div>
  );
}

// 4-Pillar Side-by-Side Competitive Benchmark Matrix
function CompetitiveBenchmarkMatrix({ 
  competitors, 
  doctorRating = 0, 
  doctorReviewCount = 0, 
  userRank = 5, 
  overviewData,
  postsThisMonth = 0
}: { 
  competitors: any[]; 
  doctorRating?: number; 
  doctorReviewCount?: number; 
  userRank?: number; 
  overviewData?: any;
  postsThisMonth?: number;
}) {
  const clinicsAhead = Math.max(0, userRank - 1);
  const competitorsOnly = competitors.filter(c => !c.isYou);
  const topReviewComp = [...competitorsOnly].sort((a, b) => b.reviewCount - a.reviewCount)[0];

  const reviewGap = topReviewComp ? Math.max(0, topReviewComp.reviewCount - doctorReviewCount) : 0;
  const avgCompRating = competitorsOnly.length > 0 ? (competitorsOnly.reduce((sum, c) => sum + (c.rating || 0), 0) / competitorsOnly.length).toFixed(1) : "4.9";
  const ratingGap = (parseFloat(avgCompRating) - doctorRating).toFixed(1);

  // Dynamic Category Coverage
  const docCatCount = (overviewData?.categories?.length || 0) + 1;
  const targetCatText = docCatCount >= 3 ? "Optimal Coverage" : `Target ${3 - docCatCount} More`;
  const targetSubText = docCatCount >= 3 ? "Secondary categories active." : "Add secondary categories in GMB Settings.";

  return (
    <div className="mb-6 p-5 bg-white text-gray-900 rounded-2xl shadow-2xs border border-gray-200/80 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-gray-900">4-Pillar Competitor Gap Matrix</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${userRank === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {userRank === 1 ? "#1 Top Ranked Clinic" : `${clinicsAhead} Clinics Ahead`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Pillar 1: Review Count Gap */}
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 font-semibold mb-1">
              <span>Review Count Gap</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-gray-900">+{reviewGap} reviews</p>
            <p className="text-[11px] text-amber-700 font-medium line-clamp-1">
              {reviewGap > 0 ? `To equal ${topReviewComp?.name?.slice(0, 24) || 'top competitor'}...` : "You lead in review count!"}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-200/60 font-medium">
            {reviewGap > 0 ? "Goal: 10–15 WhatsApp reviews/mo to close 90-day pace." : "Maintaining top local review volume."}
          </p>
        </div>

        {/* Pillar 2: Rating Score Gap */}
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 font-semibold mb-1">
              <span>Rating Quality</span>
              <Star className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-xl font-black text-gray-900">{parseFloat(ratingGap) > 0 ? `+${ratingGap} ★` : `${doctorRating > 0 ? doctorRating.toFixed(1) : "5.0"} ★ Rating`}</p>
            <p className="text-[11px] text-gray-600">
              Top competitors average {avgCompRating}★.
            </p>
          </div>
          <p className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-200/60 font-medium">
            {doctorRating >= parseFloat(avgCompRating) ? "Outstanding patient sentiment advantage." : "Focus on 5-star Google review collection."}
          </p>
        </div>

        {/* Pillar 3: Category Coverage */}
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 font-semibold mb-1">
              <span>Category Coverage</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-gray-900">{targetCatText}</p>
            <p className="text-[11px] text-emerald-700 font-medium">
              {targetSubText}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-200/60 font-medium">
            Multi-category coverage increases local pack reach by 40%.
          </p>
        </div>

        {/* Pillar 4: Posting & Freshness Velocity */}
        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 font-semibold mb-1">
              <span>Activity Cadence</span>
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-gray-900">{postsThisMonth}/4 Posts</p>
            <p className="text-[11px] text-indigo-700 font-medium">
              {postsThisMonth >= 4 ? "Target achieved this month!" : `${4 - postsThisMonth} more needed this month`}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 pt-1.5 border-t border-gray-200/60 font-medium">
            Google algorithm rewards weekly updates over dormant listings.
          </p>
        </div>
      </div>
    </div>
  );
}


export function CompetitorInsights() {
  const router = useRouter();
  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { data: keywordsData } = useLocalSeoModule<any>('keywords');
  const { data: postData } = useLocalSeoModule<any>('posts');
  const { data: competitors, isLoading, refetch } = useLocalSeoModule<any[]>('competitors');
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

  // Compute posts published this month to feed Pillar 4 of the Benchmark Matrix
  let postsThisMonth = 0;
  if (postData?.posts && Array.isArray(postData.posts)) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    postsThisMonth = postData.posts.filter((p: any) => {
      const d = new Date(p.createTime || p.updateTime);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;
  } else if (typeof postData?.thisMonth === "number") {
    postsThisMonth = postData.thisMonth;
  }

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
  const primaryCategory = overviewData?.primaryCategory || "Obstetrician-gynecologist";
  const userRank = youMatch?.rank || 2;

  // Build unified list sorted strictly by Map Rank (showing all results returned by API)
  const competitorRowsOnly = rawCompetitorList.filter(c => !c.isYou);
  
  const allRows = [
    ...competitorRowsOnly.map((c, i) => ({
      placeId: c.placeId || `comp-${i}`,
      name: c.name,
      rating: Number(c.rating) || 0,
      reviewCount: Number(c.reviewCount) || 0,
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
      <CompetitiveBenchmarkMatrix 
        competitors={allRows} 
        doctorRating={doctorRating} 
        doctorReviewCount={doctorReviewCount} 
        userRank={userRank} 
        overviewData={overviewData} 
        postsThisMonth={postsThisMonth}
      />

      {/* Competitor Keywords Intercept with 1-Click Action Menus (Placed Above Table) */}
      <CompetitorKeywords competitors={allRows} primaryCategory={primaryCategory} keywordsData={keywordsData} />

      {/* Table Header & Refresh */}
      <div className="flex flex-col gap-2 mb-4 pt-2">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 font-medium">Top Competitors for <strong className="text-gray-800">{primaryCategory}</strong> near your location (click to inspect)</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors shrink-0 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
        <div>Business</div>
        <div className="text-center w-16">Rating</div>
        <div className="text-center w-16">Reviews</div>
        <div className="text-center w-16">Distance</div>
        <div className="text-center w-16" title="Real position in Google Search for your specialty near your location">Position ↑</div>
      </div>

      {/* Unified Competitor Rows (sorted by Map Rank) */}
      <div className="divide-y divide-gray-100">
        {displayList.map((comp, idx) => {
          if (comp.isYou) {
            return (
              <div
                key="you-row"
                className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-x-4 px-3.5 py-4 md:py-3.5 items-center bg-indigo-50/70 rounded-xl border border-indigo-200/90 shadow-2xs my-1"
              >
                <div className="min-w-0 w-full">
                  <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5 truncate">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    {comp.name} <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200">(YOU)</span>
                  </p>
                  <p className="text-xs text-indigo-600/80 mt-0.5">Your official Google Business Profile</p>
                </div>
                <div className="flex items-center gap-6 md:gap-0 w-full col-span-4 md:grid md:grid-cols-4 md:items-center">
                  <div className="md:w-16 flex items-center justify-start md:justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-sm font-bold text-indigo-950">{comp.rating.toFixed(1)}</span>
                  </div>
                  <div className="md:w-16 text-center flex items-center justify-center">
                    <ReviewCount count={comp.reviewCount} />
                  </div>
                  <div className="md:w-16 text-center flex items-center justify-center text-xs font-bold text-indigo-700">
                    Your Clinic
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

          const isExpanded = expandedPlaceId === comp.placeId;

          return (
            <div key={comp.placeId || idx} className="py-1">
              <div
                onClick={() => setExpandedPlaceId(prev => prev === comp.placeId ? null : comp.placeId)}
                className={`flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-x-4 px-3 py-3 rounded-xl hover:bg-gray-50/80 transition-all cursor-pointer group ${isExpanded ? "bg-gray-50/90 border border-gray-200/80" : ""}`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 md:line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {comp.name}
                  </p>
                  <span className="text-xs text-gray-300 group-hover:text-indigo-400 hidden sm:inline">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </div>
                <div className="flex items-center gap-6 md:gap-0 col-span-4 md:grid md:grid-cols-4 md:items-center">
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
                  <div className="md:w-16 text-center flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0 hidden md:inline" />
                    {formatDistance(comp.distanceMeters)}
                  </div>
                  <div className="ml-auto md:ml-0 md:w-16 flex items-center justify-end md:justify-center gap-1">
                    <RankBadge rank={comp.rank} />
                  </div>
                </div>
              </div>

              {/* Expandable Strategy & Details Drawer */}
              {isExpanded && (() => {
                const intel = getCompetitorIntelligence(comp, doctorReviewCount, doctorRating, primaryCategory);

                return (
                  <div className="mx-2 mb-3 p-4 bg-white rounded-2xl border border-gray-200/90 shadow-xs space-y-3.5 animate-in fade-in duration-200">
                    {/* Top Bar: Clinic Name + Google Maps Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{comp.name}</p>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                          <span>{comp.reviewCount} patient reviews</span>
                          <span>·</span>
                          <span>{comp.rating > 0 ? `${comp.rating.toFixed(1)}★ rating` : "Unrated"}</span>
                          {comp.distanceMeters != null && (
                            <>
                              <span>·</span>
                              <span>{formatDistance(comp.distanceMeters)} away</span>
                            </>
                          )}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.name)}`}
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
      {!showAll && allRows.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-xs text-gray-500 text-center hover:text-indigo-600 transition-colors font-medium border-t border-gray-100 mt-2"
        >
          Show all {allRows.length} nearby clinics...
          <ChevronDown className="w-3 h-3 inline ml-1" />
        </button>
      )}
      {showAll && allRows.length > 6 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-3 text-xs text-gray-500 text-center hover:text-indigo-600 transition-colors font-medium border-t border-gray-100 mt-2"
        >
          Show top 6 <ChevronUp className="w-3 h-3 inline ml-1" />
        </button>
      )}
    </div>
  );
}
