"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationContext } from "@/contexts/LocationContext";
import {
  CheckCircle2, XCircle, RefreshCcw, ShieldCheck,
  MessageSquare, Edit3, Settings, AlertCircle, RotateCcw,
  Check, FileText, TrendingUp, MapPin, Users, Calendar,
  ArrowRight, Sparkles, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  RawRecommendation,
  NormalizedOpportunity,
  OpportunityAction,
  OpportunityDisplayCategory,
  normalizeOpportunity,
  executeOpportunityAction
} from "./opportunity-ui";

interface RecommendationsListProps {
  onNavigateTab?: (tab: "overview" | "rank-tracker" | "competitors" | "profile-health" | "recommendations") => void;
}

export function RecommendationsList({ onNavigateTab }: RecommendationsListProps) {
  const router = useRouter();
  const { activeLocationId } = useLocationContext();
  const { toast } = useToast();

  const [rawRecommendations, setRawRecommendations] = useState<RawRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const url = activeLocationId
        ? `/api/local-seo/recommendations?locationId=${activeLocationId}`
        : "/api/local-seo/recommendations";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRawRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load opportunities", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeLocationId]);

  const runScan = async () => {
    try {
      setScanning(true);
      const res = await fetch("/api/local-seo/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: activeLocationId }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.newTasksCount || 0;
        setHasScanned(true);
        toast({
          title: "Opportunity Scan Complete",
          description: count > 0
            ? `Identified ${count} new growth opportunit${count > 1 ? "ies" : "y"}.`
            : "All local search signals are up to date.",
        });
        fetchRecommendations();
      } else {
        throw new Error("Scan failed");
      }
    } catch (error) {
      toast({ title: "Failed to check opportunities", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setRawRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
      );

      const res = await fetch(`/api/local-seo/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      if (newStatus === "COMPLETED") {
        toast({ title: "Opportunity marked addressed", description: "Saved to completed opportunities." });
      } else if (newStatus === "DISMISSED") {
        toast({ title: "Opportunity dismissed" });
      } else if (newStatus === "PENDING") {
        toast({ title: "Opportunity restored to active list" });
      }
    } catch (e) {
      fetchRecommendations();
      toast({ title: "Could not update opportunity status", variant: "destructive" });
    }
  };

  const handleActionClick = (action: OpportunityAction) => {
    executeOpportunityAction(action, router, onNavigateTab);
  };

  // Normalize all raw recommendations into structured opportunities
  const opportunities = useMemo(() => {
    return rawRecommendations.map(r => normalizeOpportunity(r));
  }, [rawRecommendations]);

  const pendingOpps = useMemo(() => opportunities.filter(o => o.status === "PENDING"), [opportunities]);
  const completedOpps = useMemo(() => opportunities.filter(o => o.status === "COMPLETED"), [opportunities]);
  const dismissedOpps = useMemo(() => opportunities.filter(o => o.status === "DISMISSED"), [opportunities]);

  // Category counts for pending opportunities
  const rankingCount = pendingOpps.filter(o => o.displayCategory === "RANKING").length;
  const geographicCount = pendingOpps.filter(o => o.displayCategory === "GEOGRAPHIC").length;
  const competitorCount = pendingOpps.filter(o => o.displayCategory === "COMPETITORS").length;
  const reputationCount = pendingOpps.filter(o => o.displayCategory === "REPUTATION").length;
  const contentCount = pendingOpps.filter(o => o.displayCategory === "CONTENT").length;

  // Filter opportunities based on active filter
  const displayOpps = useMemo(() => {
    if (activeFilter === "ALL") return pendingOpps;
    if (activeFilter === "RANKING") return pendingOpps.filter(o => o.displayCategory === "RANKING");
    if (activeFilter === "GEOGRAPHIC") return pendingOpps.filter(o => o.displayCategory === "GEOGRAPHIC");
    if (activeFilter === "COMPETITORS") return pendingOpps.filter(o => o.displayCategory === "COMPETITORS");
    if (activeFilter === "REPUTATION") return pendingOpps.filter(o => o.displayCategory === "REPUTATION");
    if (activeFilter === "CONTENT") return pendingOpps.filter(o => o.displayCategory === "CONTENT");
    if (activeFilter === "COMPLETED") return completedOpps;
    if (activeFilter === "DISMISSED") return dismissedOpps;
    return pendingOpps;
  }, [activeFilter, pendingOpps, completedOpps, dismissedOpps]);

  const filterTabs = [
    { id: "ALL", label: "All Opportunities", count: pendingOpps.length },
    ...(rankingCount > 0 ? [{ id: "RANKING", label: "Ranking", count: rankingCount }] : []),
    ...(geographicCount > 0 ? [{ id: "GEOGRAPHIC", label: "Geographic", count: geographicCount }] : []),
    ...(competitorCount > 0 ? [{ id: "COMPETITORS", label: "Competitors", count: competitorCount }] : []),
    ...(reputationCount > 0 ? [{ id: "REPUTATION", label: "Reputation", count: reputationCount }] : []),
    ...(contentCount > 0 ? [{ id: "CONTENT", label: "Content", count: contentCount }] : []),
    { id: "COMPLETED", label: "Completed", count: completedOpps.length },
    ...(dismissedOpps.length > 0 ? [{ id: "DISMISSED", label: "Dismissed", count: dismissedOpps.length }] : []),
  ];

  const getCategoryVisuals = (displayCategory: OpportunityDisplayCategory) => {
    switch (displayCategory) {
      case "RANKING":
        return {
          label: "Ranking Opportunity",
          icon: <TrendingUp className="h-3 w-3 text-indigo-600" />,
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
        };
      case "GEOGRAPHIC":
        return {
          label: "Geographic Visibility",
          icon: <MapPin className="h-3 w-3 text-sky-600" />,
          badgeColor: "bg-sky-50 text-sky-700 border-sky-100",
        };
      case "COMPETITORS":
        return {
          label: "Competitor Intelligence",
          icon: <Users className="h-3 w-3 text-amber-600" />,
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "REPUTATION":
        return {
          label: "Patient Reviews",
          icon: <MessageSquare className="h-3 w-3 text-emerald-600" />,
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };
      case "CONTENT":
        return {
          label: "Google Update Cadence",
          icon: <Calendar className="h-3 w-3 text-blue-600" />,
          badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
        };
      default:
        return {
          label: "Profile Optimization",
          icon: <ShieldCheck className="h-3 w-3 text-gray-600" />,
          badgeColor: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  };

  const getActionBtnVisuals = (action: OpportunityAction) => {
    switch (action.actionType) {
      case "OPEN_RANK_TRACKER":
        return {
          icon: <TrendingUp className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-indigo-600 hover:bg-indigo-700 text-white",
        };
      case "OPEN_SEARCH_GRID":
        return {
          icon: <Compass className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-sky-600 hover:bg-sky-700 text-white",
        };
      case "OPEN_COMPETITORS":
        return {
          icon: <Users className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "OPEN_REVIEWS":
        return {
          icon: <MessageSquare className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "OPEN_POSTS":
        return {
          icon: <Edit3 className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: <ArrowRight className="h-3.5 w-3.5 mr-1.5" />,
          className: "bg-gray-900 hover:bg-black text-white",
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Local SEO Opportunity Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Local Growth Opportunities</h2>
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
            Evidence-based opportunities to improve your local visibility across search grid, reviews, competitors, and updates.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50/90 p-4 rounded-xl border border-gray-200/80 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="space-y-0.5 min-w-[140px]">
            {pendingOpps.length > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">{pendingOpps.length}</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {pendingOpps.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {completedOpps.length > 0 ? `${completedOpps.length} addressed` : "Awaiting review"}
                </p>
              </>
            ) : completedOpps.length > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-emerald-700">All Addressed</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {completedOpps.length} completed
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">0</span>
                  <span className="text-xs text-gray-500 font-medium">opportunities</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Profile up to date</p>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <Button
            onClick={runScan}
            disabled={scanning}
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium text-xs h-9 shadow-2xs"
          >
            {scanning ? (
              <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin text-gray-500" /> Checking...</>
            ) : (
              <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 text-gray-500" /> Check Opportunities</>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === tab.id
                ? "bg-gray-900 text-white shadow-2xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === tab.id
                ? "bg-white/20 text-white font-bold"
                : "bg-gray-100 text-gray-600 font-medium"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Opportunity List / Empty States */}
      {displayOpps.length === 0 && !scanning ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-2xs">
          {activeFilter === "COMPLETED" ? (
            <>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <CheckCircle2 className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No completed opportunities yet</h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed">
                Opportunities marked as done will appear here for reference.
              </p>
            </>
          ) : activeFilter === "DISMISSED" ? (
            <>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <XCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No dismissed opportunities</h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed">
                Dismissed opportunities will appear here if you decide to hide them temporarily.
              </p>
            </>
          ) : pendingOpps.length === 0 && completedOpps.length > 0 ? (
            /* STATE D: ALL CURRENT OPPORTUNITIES ADDRESSED */
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">All current opportunities addressed.</h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed mb-4">
                You have addressed all active local growth recommendations. Run a new scan whenever you want to re-evaluate your local search signals.
              </p>
              <Button
                onClick={runScan}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Check for New Opportunities
              </Button>
            </>
          ) : hasScanned || rawRecommendations.length > 0 ? (
            /* STATE B: SCAN COMPLETE, NO OPPORTUNITIES DETECTED */
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No new growth opportunities detected.</h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed mb-4">
                Your local ranking signals, patient reviews, and Google updates meet all current opportunity benchmarks.
              </p>
              <Button
                onClick={runScan}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Re-check Opportunities
              </Button>
            </>
          ) : (
            /* STATE A: SCAN NOT RUN (INITIAL) */
            <>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                <Compass className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Opportunity scan has not been run.</h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed mb-4">
                Evaluate ranking positions, geographic visibility, competitor review gaps, and post cadence.
              </p>
              <Button
                onClick={runScan}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Check Opportunities
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayOpps.map((opp) => {
            const visual = getCategoryVisuals(opp.displayCategory);
            const isCompleted = opp.status === "COMPLETED";
            const isDismissed = opp.status === "DISMISSED";

            return (
              <div
                key={opp.id}
                className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 space-y-4 ${
                  isCompleted
                    ? "border-gray-200/60 bg-gray-50/40 opacity-80"
                    : "border-gray-200 shadow-2xs hover:border-gray-300"
                }`}
              >
                {/* Card Top: Badges & Status */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${visual.badgeColor}`}>
                      {visual.icon}
                      {visual.label}
                    </span>

                    {opp.priority === "HIGH" && !isCompleted && !isDismissed && (
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> High Priority
                      </span>
                    )}

                    {opp.priority === "MEDIUM" && !isCompleted && !isDismissed && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-100">
                        Medium Priority
                      </span>
                    )}

                    {opp.priority === "LOW" && !isCompleted && !isDismissed && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200">
                        Low Priority
                      </span>
                    )}

                    {isCompleted && (
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Addressed
                      </span>
                    )}

                    {isDismissed && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200">
                        Dismissed
                      </span>
                    )}
                  </div>

                  {opp.impact && (
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-md border border-gray-100">
                      {opp.impact}
                    </span>
                  )}
                </div>

                {/* Opportunity Title & Summary */}
                <div className="space-y-1">
                  <h3 className={`text-base font-bold text-gray-900 tracking-tight ${isCompleted ? "line-through text-gray-500" : ""}`}>
                    {opp.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                    {opp.summary}
                  </p>
                </div>

                {/* Structured Evidence Section */}
                {opp.isStructured && opp.evidence && (
                  <div className="bg-gray-50/80 rounded-xl p-3.5 sm:p-4 border border-gray-100 text-xs space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Observed Evidence
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Metric</span>
                        <span className="font-semibold text-gray-800">{opp.evidence.metric}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Observed Value</span>
                        <span className="font-semibold text-gray-900">{opp.evidence.observedValue}</span>
                      </div>
                      {opp.evidence.benchmark && (
                        <div>
                          <span className="text-gray-400 block text-[11px]">Benchmark</span>
                          <span className="font-medium text-gray-700">{opp.evidence.benchmark}</span>
                        </div>
                      )}
                    </div>
                    {opp.evidence.context && (
                      <p className="text-gray-600 text-[11px] pt-1 border-t border-gray-200/60 leading-relaxed">
                        {opp.evidence.context}
                      </p>
                    )}
                    {opp.evidence.source && (
                      <p className="text-[10px] text-gray-400">
                        Source: {opp.evidence.source}
                      </p>
                    )}
                  </div>
                )}

                {/* Legacy Description if Not Structured */}
                {!opp.isStructured && opp.legacyDescription && (
                  <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                    {opp.legacyDescription}
                  </div>
                )}

                {/* Bottom Row: Actions & Status Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  {/* Contextual Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isCompleted && !isDismissed && opp.actions.map((act, idx) => {
                      const btnVisual = getActionBtnVisuals(act);
                      return (
                        <Button
                          key={idx}
                          size="sm"
                          onClick={() => handleActionClick(act)}
                          className={`font-semibold text-xs h-8.5 px-3.5 shadow-2xs cursor-pointer ${btnVisual.className}`}
                        >
                          {btnVisual.icon}
                          {act.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Status Mutation Controls */}
                  <div className="flex items-center gap-2 justify-end shrink-0">
                    {!isCompleted && !isDismissed && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(opp.id, "COMPLETED")}
                          className="text-xs h-8 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium border-gray-200"
                        >
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Mark Done
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(opp.id, "DISMISSED")}
                          className="text-xs h-8 text-gray-400 hover:text-gray-600 px-2"
                          title="Dismiss opportunity"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(opp.id, "PENDING")}
                        className="text-xs h-8 text-gray-600 hover:text-gray-900 border-gray-200"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5 text-gray-500" /> Move to Pending
                      </Button>
                    )}

                    {isDismissed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(opp.id, "PENDING")}
                        className="text-xs h-8 text-gray-600 hover:text-gray-900 border-gray-200"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5 text-gray-500" /> Restore Opportunity
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
