"use client";

import { useState, useEffect } from "react";
import { useLocationContext } from "@/contexts/LocationContext";
import { Sparkles, CheckCircle2, XCircle, RefreshCcw, ArrowRight, ShieldCheck, TrendingUp, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export function RecommendationsList() {
  const { activeLocationId } = useLocationContext();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

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
        toast({ title: "Scan Complete! New recommendations added." });
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
      // Optimistic update
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      
      const res = await fetch(`/api/local-seo/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      if (newStatus === "COMPLETED") {
        toast({ title: "Great job! Task completed." });
      } else {
        toast({ title: "Task dismissed." });
      }
    } catch (e) {
      // Revert on failure
      fetchRecommendations();
    }
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
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const pendingRecs = recommendations.filter(r => r.status === "PENDING");
  const completedRecs = recommendations.filter(r => r.status === "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Performance Recommendations Engine
          </h2>
          <p className="text-gray-500 mt-1">Our Local SEO algorithmic scan analyzes your profile and suggests data-driven optimizations to rank higher.</p>
        </div>
        <Button 
          onClick={runScan} 
          disabled={scanning}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md"
        >
          {scanning ? (
            <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Scanning Profile...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Run Profile Scan Now</>
          )}
        </Button>
      </div>

      {pendingRecs.length === 0 && !scanning ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
            Your Local SEO profile is fully optimized. We recommend initiating a periodic algorithmic scan to proactively uncover new growth opportunities driven by evolving local search trends and ranking factors.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            Action Plan <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{pendingRecs.length} Pending</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {pendingRecs.map((rec) => (
              <div key={rec.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(rec.category)}
                    <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">{rec.category}</span>
                    {rec.priority === "HIGH" && (
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">High Priority</span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{rec.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{rec.description}</p>
                  
                  {rec.impact && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm text-emerald-800 flex items-start gap-2 w-fit">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-600" />
                      <span><strong>Impact:</strong> {rec.impact}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex md:flex-col gap-3 justify-center md:justify-start pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                  <Button 
                    onClick={() => updateStatus(rec.id, "COMPLETED")}
                    className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Done
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => updateStatus(rec.id, "DISMISSED")}
                    className="w-full text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedRecs.length > 0 && (
        <div className="mt-12 space-y-4 opacity-75">
          <h3 className="font-semibold text-gray-600 flex items-center gap-2">
            Recently Completed <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{completedRecs.length} Tasks</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {completedRecs.slice(0, 5).map(rec => (
              <div key={rec.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium text-gray-700 line-through">{rec.title}</span>
                </div>
                <span className="text-xs text-gray-400 uppercase">{rec.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
