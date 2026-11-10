"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, RefreshCw, Star, MessageSquare, 
  ExternalLink, ChevronDown, ChevronUp, AlertCircle, 
  Activity, Phone, Globe, ShieldAlert, CheckCircle2,
  TrendingUp, Users, ArrowUpRight
} from "lucide-react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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

export function CompetitorInsights() {
  const router = useRouter();
  const [forceRefresh, setForceRefresh] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const competitorParams = useMemo<Record<string, string> | undefined>(() => {
    return forceRefresh ? { refresh: "true" } : undefined;
  }, [forceRefresh]);

  const { data: overviewData } = useLocalSeoModule<any>('overview');
  const { 
    data: rawCompetitorList, 
    isLoading, 
    isFetching,
    error,
    refetch,
    lastUpdated,
  } = useLocalSeoModule<Competitor[]>('competitors', competitorParams);

  const handleRefresh = async () => {
    setRefreshing(true);
    setForceRefresh(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
      // Reset force refresh flag after a short delay so normal renders use cache
      setTimeout(() => setForceRefresh(false), 2000);
    }
  };

  const rawList: Competitor[] = Array.isArray(rawCompetitorList) ? rawCompetitorList : [];

  // Identify clinic's own record
  const youMatch = rawList.find(c => c && c.isYou);
  const doctorName = overviewData?.name || overviewData?.businessName || youMatch?.name || "Your Clinic";
  const doctorRating = Number(overviewData?.rating || overviewData?.avgRating) || (youMatch?.rating ? Number(youMatch.rating) : 0);
  const doctorReviewCount = Number(overviewData?.user_ratings_total || overviewData?.reviewCount || overviewData?.totalReviews) || (youMatch?.reviewCount ? Number(youMatch.reviewCount) : 0);
  const primaryCategory = overviewData?.primaryCategory || youMatch?.category || youMatch?.primaryCategory || "Healthcare Practice";

  // Filter out the clinic's own profile so it NEVER appears as a competitor
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

    // Sort strictly by distance (closest first)
    return list.sort((a, b) => (a.distanceMeters ?? 99999) - (b.distanceMeters ?? 99999));
  }, [rawList]);

  // Derived Factual Statistics (calculated from actual returned data)
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

  // Visible rows: 8 default or all if showAll is toggled
  const displayedCompetitors = useMemo(() => {
    return showAll ? nearbyCompetitors : nearbyCompetitors.slice(0, 8);
  }, [nearbyCompetitors, showAll]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
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
          Verified coordinates are missing from your Google Business Profile. Please complete or verify your clinic address and location in Google Business Profile to discover nearby competitors within 5 km.
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
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Nearby Healthcare Competitors
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Within 5 km
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Healthcare practices discovered within a fixed 5,000-metre radius of your verified Google Business Profile location.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden md:inline">
                Updated {formatDate(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Refresh nearby competitor discovery from Google Places"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing || isFetching ? "animate-spin" : ""}`} />
              <span>{refreshing || isFetching ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ── Factual Metric Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Total Nearby Clinics */}
          <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Nearby Clinics
            </span>
            <p className="text-xl font-bold text-gray-900">
              {stats.total}
            </p>
            <p className="text-[11px] text-gray-400">within 5 km radius</p>
          </div>

          {/* Average Rating */}
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

          {/* Average Reviews */}
          <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              Average Reviews
            </span>
            <p className="text-xl font-bold text-gray-900">
              {stats.avgReviews}
            </p>
            <p className="text-[11px] text-gray-400">
              Your reviews: <strong>{doctorReviewCount}</strong>
            </p>
          </div>

          {/* Higher-Reviewed Clinics Comparison */}
          <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              More Reviews Than You
            </span>
            <p className="text-xl font-bold text-gray-900">
              {stats.higherReviewedCount} <span className="text-xs font-normal text-gray-500">of {stats.total}</span>
            </p>
            <p className="text-[11px] text-gray-400">
              {stats.higherReviewedCount === 0 ? "You lead in nearby reviews" : "Clinics with review volume advantage"}
            </p>
          </div>
        </div>

        {/* ── Factual Clinic Comparison Banner ── */}
        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {doctorName}
                <span className="ml-2 text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  YOUR CLINIC
                </span>
              </p>
              <p className="text-gray-500 text-[11px]">
                {primaryCategory} · {doctorRating > 0 ? `${doctorRating.toFixed(1)}★` : "Unrated"} · {doctorReviewCount} total reviews
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/reviews")}
              className="text-xs h-7.5 border-indigo-200 text-indigo-700 hover:bg-indigo-100/60 font-semibold rounded-lg"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Collect Reviews
            </Button>
          </div>
        </div>
      </div>

      {/* ── Nearby Competitors List ── */}
      {nearbyCompetitors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800">No Nearby Competitors Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No healthcare practices or clinics were returned within 5 km of your verified coordinates.
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Search
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Nearby Healthcare Clinics ({nearbyCompetitors.length}) · Sorted by Distance
            </p>
            {isFetching && (
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing...
              </span>
            )}
          </div>

          {/* Table Header (Desktop) */}
          <div className="hidden md:grid md:grid-cols-[1fr_110px_90px_100px_130px] gap-x-4 px-4 py-2.5 bg-gray-50/90 rounded-xl border border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <div>Clinic / Practice</div>
            <div className="text-center">Distance</div>
            <div className="text-center">Google Rating</div>
            <div className="text-center">Reviews</div>
            <div className="text-right">Directions & Links</div>
          </div>

          {/* Competitor Cards / Rows */}
          <div className={`space-y-2 transition-opacity duration-200 ${isFetching ? "opacity-70" : "opacity-100"}`}>
            {displayedCompetitors.map((comp, idx) => {
              const reviewDiff = (comp.reviewCount || 0) - doctorReviewCount;
              const hasMapsLink = Boolean(comp.googleMapsUri || comp.placeId);
              const mapsUrl = comp.googleMapsUri || (comp.placeId ? `https://www.google.com/maps/place/?q=place_id:${comp.placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.name)}`);

              return (
                <div
                  key={comp.placeId || `comp-${idx}`}
                  className="bg-white rounded-xl border border-gray-200/90 hover:border-indigo-200 p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col md:grid md:grid-cols-[1fr_110px_90px_100px_130px] gap-3 md:gap-x-4 items-start md:items-center"
                >
                  {/* Clinic Info */}
                  <div className="min-w-0 w-full space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {comp.name}
                      </p>
                      {comp.category && comp.category !== "Healthcare Practice" && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200/70">
                          {comp.category}
                        </span>
                      )}
                    </div>
                    {comp.formattedAddress && (
                      <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                        <span>{comp.formattedAddress.replace(/, India$/i, "")}</span>
                      </p>
                    )}
                  </div>

                  {/* Distance from Clinic */}
                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Distance:</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      {formatDistance(comp.distanceMeters)}
                    </span>
                  </div>

                  {/* Google Rating */}
                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-gray-800">
                        {comp.rating > 0 ? comp.rating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Reviews Count & Comparison */}
                  <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
                    <span className="text-xs text-gray-400 md:hidden font-medium">Reviews:</span>
                    <div className="text-right md:text-center">
                      <span className="text-sm font-bold text-gray-900 block">
                        {comp.reviewCount || 0}
                      </span>
                      {reviewDiff > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70">
                          +{reviewDiff} vs you
                        </span>
                      ) : reviewDiff < 0 ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/70">
                          {reviewDiff} vs you
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Links & Contact Actions */}
                  <div className="flex items-center justify-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {comp.phone && (
                      <a
                        href={`tel:${comp.phone}`}
                        className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200/80 transition-colors"
                        title={`Call ${comp.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {comp.website && (
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200/80 transition-colors"
                        title="Visit Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {hasMapsLink && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200/80 transition-colors"
                        title="View on Google Maps"
                      >
                        <span>Maps</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More / Show Less Toggle */}
          {nearbyCompetitors.length > 8 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAll(prev => !prev)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-100 transition-all cursor-pointer shadow-2xs"
              >
                {showAll ? (
                  <>
                    <span>Show top 8 closest clinics</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show all {nearbyCompetitors.length} nearby clinics</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
