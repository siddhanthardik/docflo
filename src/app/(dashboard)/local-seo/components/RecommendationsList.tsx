"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocationContext } from "@/contexts/LocationContext";
import {
  CheckCircle2, XCircle, RefreshCcw, ShieldCheck,
  MessageSquare, Edit3, Settings, AlertCircle, RotateCcw,
  Check, FileText
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
          title: "Profile Checked",
          description: count > 0 ? `Identified ${count} new optimization suggestion${count > 1 ? 's' : ''}.` : "Your recommendations are currently up to date.",
        });
        fetchRecommendations();
      } else {
        throw new Error("Scan failed");
      }
    } catch (error) {
      toast({ title: "Failed to check profile", variant: "destructive" });
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
        toast({ title: "Task completed", description: "Marked as done." });
      } else if (newStatus === "DISMISSED") {
        toast({ title: "Task dismissed" });
      } else if (newStatus === "PENDING") {
        toast({ title: "Task restored to pending list" });
      }
    } catch (e) {
      fetchRecommendations();
      toast({ title: "Could not update task status", variant: "destructive" });
    }
  };

  const handleExecuteAction = (rec: Recommendation) => {
    const cat = rec.category?.toUpperCase() || "PROFILE";
    const title = rec.title?.toLowerCase() || "";

    if (cat === "REVIEWS" || title.includes("review")) {
      router.push("/reviews");
    } else if (cat === "CONTENT" || title.includes("post") || title.includes("update") || title.includes("gmb")) {
      const match = rec.title.match(/"([^"]+)"/);
      const kw = match ? match[1] : "";
      const targetUrl = kw ? `/gbp/posts?draftKeyword=${encodeURIComponent(kw)}` : "/gbp/posts";
      router.push(targetUrl);
    } else {
      router.push("/gbp");
    }
  };

  const getActionBtnLabel = (rec: Recommendation) => {
    const cat = rec.category?.toUpperCase() || "PROFILE";
    const title = rec.title?.toLowerCase() || "";

    if (cat === "REVIEWS" || title.includes("review")) {
      return {
        label: "Open Reviews",
        icon: <MessageSquare className="h-3.5 w-3.5 mr-1.5" />,
        className: "bg-emerald-600 hover:bg-emerald-700 text-white",
      };
    }
    if (cat === "CONTENT" || title.includes("post") || title.includes("update") || title.includes("gmb")) {
      return {
        label: "Create Update",
        icon: <Edit3 className="h-3.5 w-3.5 mr-1.5" />,
        className: "bg-blue-600 hover:bg-blue-700 text-white",
      };
    }
    return {
      label: "Edit Profile Details",
      icon: <Settings className="h-3.5 w-3.5 mr-1.5" />,
      className: "bg-gray-900 hover:bg-black text-white",
    };
  };

  const getCategoryBadge = (category: string) => {
    switch (category?.toUpperCase()) {
      case "PROFILE":
        return { label: "Profile Info", icon: <ShieldCheck className="h-3 w-3 text-blue-600" />, color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "REVIEWS":
        return { label: "Reviews", icon: <MessageSquare className="h-3 w-3 text-emerald-600" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "CONTENT":
        return { label: "Google Update", icon: <FileText className="h-3 w-3 text-amber-600" />, color: "bg-amber-50 text-amber-700 border-amber-100" };
      default:
        return { label: "Optimization", icon: <ShieldCheck className="h-3 w-3 text-indigo-600" />, color: "bg-indigo-50 text-indigo-700 border-indigo-100" };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const pendingRecs = recommendations.filter(r => r.status === "PENDING");
  const completedRecs = recommendations.filter(r => r.status === "COMPLETED");
  const dismissedRecs = recommendations.filter(r => r.status === "DISMISSED");

  const totalTracked = pendingRecs.length + completedRecs.length;
  const completionPct = totalTracked > 0 ? Math.round((completedRecs.length / totalTracked) * 100) : 100;

  // Filter recommendations based on active tab
  let displayRecs: Recommendation[] = [];
  if (activeFilter === "ALL") {
    displayRecs = pendingRecs;
  } else if (activeFilter === "HIGH") {
    displayRecs = pendingRecs.filter(r => r.priority === "HIGH" || r.priority === "CRITICAL");
  } else if (activeFilter === "REVIEWS") {
    displayRecs = pendingRecs.filter(r => r.category === "REVIEWS");
  } else if (activeFilter === "PROFILE") {
    displayRecs = pendingRecs.filter(r => r.category === "PROFILE");
  } else if (activeFilter === "CONTENT") {
    displayRecs = pendingRecs.filter(r => r.category === "CONTENT");
  } else if (activeFilter === "COMPLETED") {
    displayRecs = completedRecs;
  } else if (activeFilter === "DISMISSED") {
    displayRecs = dismissedRecs;
  }

  const filterTabs = [
    { id: "ALL", label: "Pending", count: pendingRecs.length },
    { id: "HIGH", label: "High Priority", count: pendingRecs.filter(r => r.priority === "HIGH" || r.priority === "CRITICAL").length },
    { id: "REVIEWS", label: "Reviews", count: pendingRecs.filter(r => r.category === "REVIEWS").length },
    { id: "PROFILE", label: "Profile Details", count: pendingRecs.filter(r => r.category === "PROFILE").length },
    { id: "CONTENT", label: "Updates", count: pendingRecs.filter(r => r.category === "CONTENT").length },
    { id: "COMPLETED", label: "Completed", count: completedRecs.length },
    ...(dismissedRecs.length > 0 ? [{ id: "DISMISSED", label: "Dismissed", count: dismissedRecs.length }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Google Profile Optimization
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recommended Actions</h2>
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
            Actionable suggestions based on your live Google profile, patient reviews, and local search visibility.
          </p>
        </div>

        <div className="flex items-center gap-5 bg-gray-50/90 p-4 rounded-xl border border-gray-200/80 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="space-y-1 min-w-[130px]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-900">{completedRecs.length}</span>
              <span className="text-xs text-gray-500 font-medium">/ {totalTracked} completed</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">{completionPct}% completed</p>
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
              <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 text-gray-500" /> Check Profile</>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === tab.id
                ? "bg-gray-900 text-white shadow-2xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeFilter === tab.id ? "bg-white/20 text-white font-bold" : "bg-gray-100 text-gray-600 font-medium"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      {displayRecs.length === 0 && !scanning ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {activeFilter === "COMPLETED" ? "No completed tasks yet" : activeFilter === "DISMISSED" ? "No dismissed tasks" : "No pending suggestions in this category"}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto text-xs leading-relaxed">
            {activeFilter === "COMPLETED"
              ? "Completed tasks will appear here as you optimize your profile."
              : "Your Google profile is aligned with recommended best practices. Click 'Check Profile' to run an audit."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {displayRecs.map((rec) => {
            const btn = getActionBtnLabel(rec);
            const badge = getCategoryBadge(rec.category);
            const isHighPriority = rec.priority === "HIGH" || rec.priority === "CRITICAL";
            const isCompleted = rec.status === "COMPLETED";
            const isDismissed = rec.status === "DISMISSED";

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center ${
                  isCompleted ? "border-gray-200/60 bg-gray-50/40 opacity-75" : "border-gray-200 shadow-2xs hover:border-gray-300"
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.icon}
                      {badge.label}
                    </span>

                    {isHighPriority && !isCompleted && !isDismissed && (
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> High Priority
                      </span>
                    )}

                    {isCompleted && (
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    )}

                    {isDismissed && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200">
                        Dismissed
                      </span>
                    )}
                  </div>

                  <h4 className={`text-sm font-bold text-gray-900 ${isCompleted ? "line-through text-gray-600" : ""}`}>
                    {rec.title}
                  </h4>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-2xl">
                    {rec.description}
                  </p>

                  {rec.impact && (
                    <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-100/80 rounded-md px-2.5 py-1 w-fit flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {rec.impact}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:border-gray-100 md:pl-5">
                  {!isCompleted && !isDismissed && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleExecuteAction(rec)}
                        className={`font-semibold text-xs h-9 px-4 w-full sm:w-auto shadow-2xs ${btn.className}`}
                      >
                        {btn.icon}
                        {btn.label}
                      </Button>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(rec.id, "COMPLETED")}
                          className="text-xs h-8 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium border-gray-200 flex-1 sm:flex-initial"
                        >
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Mark Done
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(rec.id, "DISMISSED")}
                          className="text-xs h-8 text-gray-400 hover:text-gray-600 px-2"
                          title="Dismiss task"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}

                  {isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(rec.id, "PENDING")}
                      className="text-xs h-8 text-gray-600 hover:text-gray-900 border-gray-200"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5 text-gray-500" /> Move to Pending
                    </Button>
                  )}

                  {isDismissed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(rec.id, "PENDING")}
                      className="text-xs h-8 text-gray-600 hover:text-gray-900 border-gray-200"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5 text-gray-500" /> Restore Task
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
