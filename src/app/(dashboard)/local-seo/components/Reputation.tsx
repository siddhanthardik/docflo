"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Reputation() {
  const { data: reputationData, isLoading } = useLocalSeoModule<any>('reputation');

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!reputationData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Review Data</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          We couldn't load your review data. Please try again later.
        </p>
      </div>
    );
  }

  const { averageRating = 0, totalReviewCount = 0, reviews = [] } = reputationData;
  const unanswered = reviews.filter((r: any) => !r.reviewReply).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Reviews & Reputation</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/reviews">Manage Reviews</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-gray-900 mb-1">{averageRating.toFixed(1)}</div>
          <div className="flex text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4" fill={s <= Math.round(averageRating) ? "currentColor" : "none"} />
            ))}
          </div>
          <div className="text-sm font-medium text-gray-500">Average Rating</div>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">{totalReviewCount.toLocaleString()}</div>
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
            <Star className="h-4 w-4" /> Total Reviews
          </div>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">{unanswered}</div>
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Unanswered Reviews
          </div>
          {unanswered > 0 && (
            <div className="mt-2 text-xs text-red-600 font-medium">Needs Attention</div>
          )}
        </div>
      </div>
    </div>
  );
}
