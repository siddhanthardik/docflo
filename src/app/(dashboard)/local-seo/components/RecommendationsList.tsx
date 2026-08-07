"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocationContext } from "@/contexts/LocationContext";
import {
  Sparkles, CheckCircle2, XCircle, RefreshCcw, ArrowRight, ShieldCheck,
  TrendingUp, Search, MessageSquare, Plus, Edit3, Settings, Zap, Award, AlertTriangle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  impact?: string;
  status: string;
  createdAt: string;
}

export function RecommendationsList() {
  const router = useRouter();
  const { activeLocationId } = useLocationContext();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
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
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load recommendations", variant: "destructive" });
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
        toast({
          title: "Scan Complete!",
          description: count > 0 ? `Discovered ${count} new growth recommendations.` : "Your recommendations are fully up-to-date.",
        });
        fetchRecommendations();
      } else {
        throw new Error("Scan failed");
      }
    } catch (error) {
      toast({ title: "Failed to run scan", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

      const res = await fetch(`/api/local-seo/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      if (newStatus === "COMPLETED") {
        toast({ title: "Task Completed! 🎉", description: "Local Growth Velocity Score updated." });
      } else {
        toast({ title: "Task dismissed." });
      }
    } catch (e) {
      fetchRecommendations();
    }
  };

  // Fixed 1-Click Action Handlers
  const handleExecuteAction = async (rec: Recommendation) => {
    const cat = rec.category?.toUpperCase() || "PROFILE";
    const title = rec.title?.toLowerCase() || "";

    if (cat === "REVIEWS" || title.includes("review")) {
      toast({
        title: "Opening Reviews Inbox",
        description: "Navigating to AI Review Assistant to draft patient responses.",
      });
      router.push("/reviews");
    } else if (cat === "CONTENT" || title.includes("post") || title.includes("update") || title.includes("gmb")) {
      // Extract target keyword in quotes if present (e.g. Publish GMB Post for "Obstetrician")
      const match = rec.title.match(/"([^"]+)"/);
      const kw = match ? match[1] : "";
      const targetUrl = kw ? `/gbp/posts?draftKeyword=${encodeURIComponent(kw)}` : "/gbp/posts";
      toast({
        title: "Opening Google Post Scheduler",
        description: kw ? `Pre-filling draft targeting "${kw}".` : "Drafting new Google update.",
      });
      router.push(targetUrl);
    } else if (title.includes("phone") || title.includes("website") || title.includes("hours") || title.includes("category") || title.includes("description") || title.includes("appointment")) {
      toast({
        title: "Opening Profile Management",
        description: "Navigating to Google Business Profile settings to update details.",
      });
      router.push("/gbp");
    } else {
      updateStatus(rec.id, "COMPLETED");
    }
  };

  const getActionBtnLabel = (rec: Recommendation) => {
    const cat = rec.category?.toUpperCase() || "PROFILE";
    const title = rec.title?.toLowerCase() || "";

    if (cat === "REVIEWS" || title.includes("review")) {
      return {
        label: "⚡ AI Reply in Reviews",
        icon: <MessageSquare className="h-4 w-4 mr-2" />,
        color: "bg-emerald-600 hover:bg-emerald-700 text-white",
      };
    }
    if (cat === "CONTENT" || title.includes("post") || title.includes("gmb")) {
      return {
        label: "✍️ Draft AI Post",
        icon: <Edit3 className="h-4 w-4 mr-2" />,
        color: "bg-amber-600 hover:bg-amber-700 text-white",
      };
    }
    if (title.includes("category") || title.includes("service")) {
      return {
        label: "📍 Update GMB Categories",
        icon: <Plus className="h-4 w-4 mr-2" />,
        color: "bg-indigo-600 hover:bg-indigo-700 text-white",
      };
    }
    if (title.includes("hours") || title.includes("phone") || title.includes("website") || title.includes("contact") || title.includes("appointment")) {
      return {
        label: "⚙️ Edit Profile Info",
        icon: <Settings className="h-4 w-4 mr-2" />,
        color: "bg-blue-600 hover:bg-blue-700 text-white",
      };
    }
    return {
      label: "⚡ Execute Task",
      icon: <Zap className="h-4 w-4 mr-2" />,
      color: "bg-indigo-600 hover:bg-indigo-700 text-white",
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PROFILE": return <ShieldCheck className="h-5 w-5 text-blue-500" />;
      case "REVIEWS": return <MessageSquare className="h-5 w-5 text-emerald-500" />;
      case "CITATIONS": return <Search className="h-5 w-5 text-purple-500" />;
      case "CONTENT": return <TrendingUp className="h-5 w-5 text-amber-500" />;
      default: return <Sparkles className="h-5 w-5 text-indigo-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const pendingRecs = recommendations.filter(r => r.status === "PENDING");
  const completedRecs = recommendations.filter(r => r.status === "COMPLETED");

  // Authentic Growth Velocity Score
  const totalCount = recommendations.length;
  const completedCount = completedRecs.length;
  const criticalPending = pendingRecs.filter(r => r.priority === "CRITICAL" || r.priority === "HIGH").length;
  
  let growthScore = 100;
  if (totalCount > 0) {
    growthScore = Math.round((completedCount / totalCount) * 100);
    if (criticalPending === 0) growthScore = Math.max(85, growthScore);
  }

  // Filter pending recs
  const filteredRecs = pendingRecs.filter(r => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "QUICK_WINS") return r.priority === "MEDIUM" || r.priority === "LOW" || r.category === "REVIEWS";
    if (activeFilter === "HIGH") return r.priority === "CRITICAL" || r.priority === "HIGH";
    if (activeFilter === "REVIEWS") return r.category === "REVIEWS";
    if (activeFilter === "PROFILE") return r.category === "PROFILE";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Growth Velocity & Header Banner */}
      <div className="bg-white text-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xs border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              1-Click Growth & Rank Elevation
            </span>
            <span className="text-xs text-gray-400">Live GBP Audit</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Growth Recommendations Engine</h2>
          <p className="text-sm text-gray-600 max-w-xl leading-relaxed">
            Algorithmic action items generated from your live Google profile, patient reviews, and competitor gaps to push your clinic into the Top 3 Map Pack.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-center">
            <span className="text-4xl font-black text-indigo-600">{growthScore}%</span>
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Growth Velocity</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <Button
            onClick={runScan}
            disabled={scanning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold text-xs h-10"
          >
            {scanning ? (
              <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Auditing...</>
            ) : (
              <><RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Scan Profile</>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100">
        {[
          { id: "ALL", label: "All Tasks", count: pendingRecs.length },
          { id: "QUICK_WINS", label: "⚡ 2-Min Quick Wins", count: pendingRecs.filter(r => r.priority === "MEDIUM" || r.priority === "LOW" || r.category === "REVIEWS").length },
          { id: "HIGH", label: "🚨 High Priority", count: pendingRecs.filter(r => r.priority === "CRITICAL" || r.priority === "HIGH").length },
          { id: "REVIEWS", label: "⭐️ Reviews & Reputation", count: pendingRecs.filter(r => r.category === "REVIEWS").length },
          { id: "PROFILE", label: "📍 Profile & Categories", count: pendingRecs.filter(r => r.category === "PROFILE").length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === f.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === f.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pending Recommendations */}
      {filteredRecs.length === 0 && !scanning ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No pending growth tasks in this view</h3>
          <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed">
            Your Google Business Profile is fully optimized. Click "Scan Profile" to run a fresh audit against local competitors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecs.map((rec) => {
            const btn = getActionBtnLabel(rec);
            const isQuickWin = rec.priority === "MEDIUM" || rec.priority === "LOW" || rec.category === "REVIEWS";

            return (
              <div key={rec.id} className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all group">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryIcon(rec.category)}
                    <span className="text-xs font-extrabold tracking-wider text-gray-500 uppercase">{rec.category}</span>
                    
                    {rec.priority === "CRITICAL" && (
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Critical Priority
                      </span>
                    )}
                    {rec.priority === "HIGH" && (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> High Priority
                      </span>
                    )}
                    {isQuickWin && (
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> 2-Min Quick Win
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{rec.title}</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">{rec.description}</p>

                  {rec.impact && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 w-fit">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Estimated Impact: {rec.impact}</span>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2.5 justify-center md:justify-center pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 shrink-0 min-w-[210px]">
                  <Button
                    onClick={() => handleExecuteAction(rec)}
                    className={`w-full font-bold text-xs shadow-sm ${btn.color}`}
                  >
                    {btn.icon}
                    {btn.label}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(rec.id, "COMPLETED")}
                      className="flex-1 text-xs text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Done
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(rec.id, "DISMISSED")}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks History */}
      {completedRecs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 opacity-80">
          <h3 className="font-bold text-gray-700 text-xs flex items-center gap-2">
            Completed Optimization Tasks <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">{completedRecs.length} Done</span>
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {completedRecs.slice(0, 5).map(rec => (
              <div key={rec.id} className="bg-gray-50/80 rounded-xl border border-gray-100 p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-700 line-through">{rec.title}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded border border-gray-100">{rec.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
