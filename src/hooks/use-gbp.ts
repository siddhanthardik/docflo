"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface GBPInsights {
  locationName: string;
  totalSearches: number;
  directSearches: number;
  discoverySearches: number;
  totalViews: number;
  searchViews: number;
  mapsViews: number;
  totalActions: number;
  websiteClicks: number;
  phoneCalls: number;
  directionRequests: number;
}

interface GBPReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  reply?: string;
  reviewDate: string;
  responded: boolean;
  source: string;
}

export function useGBP() {
  const [insights, setInsights] = useState<GBPInsights | null>(null);
  const [reviews, setReviews] = useState<GBPReview[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/gbp/insights");
      if (response.ok) {
        setConnected(true);
        const data = await response.json();
        setInsights(data);
      } else {
        setConnected(false);
      }
    } catch (error) {
      setConnected(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/gbp/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, []);

  const connectGBP = async () => {
    try {
      const response = await fetch("/api/gbp/connect");
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error("Failed to initiate connection");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/gbp/sync", { method: "POST" });
      if (response.ok) {
        toast({
          title: "Success",
          description: "GBP data synced successfully",
        });
        await Promise.all([checkConnection(), fetchReviews()]);
      } else {
        throw new Error("Failed to sync data");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const replyToReview = async (reviewId: string, reply: string) => {
    try {
      const response = await fetch("/api/gbp/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reply posted successfully",
        });
        fetchReviews();
      } else {
        throw new Error("Failed to reply to review");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([checkConnection(), fetchReviews()]);
      setLoading(false);
    };
    initialize();
  }, [checkConnection, fetchReviews]);

  return {
    insights,
    reviews,
    connected,
    loading,
    syncing,
    connectGBP,
    syncData,
    replyToReview,
    refetch: async () => {
      await Promise.all([checkConnection(), fetchReviews()]);
    },
  };
}