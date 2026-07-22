"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Phone, MapPin, Eye, MousePointerClick } from "lucide-react";

import { useLocalSeoModule } from "@/hooks/use-local-seo";

export function LocalSearchOverview() {
  const { data, isLoading } = useLocalSeoModule<any>('overview');

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!data) return null;

  // We'll calculate a generic health status based on comparisons (e.g. if calls or views are down)
  const isHealthy = (data.calls > 0 && data.views > 0);
  const StatusIcon = isHealthy ? CheckCircle2 : AlertCircle;
  const statusColorClass = isHealthy ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.businessName}</h2>
          <p className="text-gray-500 font-medium">{data.primaryCategory}</p>
        </div>
        
        <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${statusColorClass}`}>
          <div className="flex-shrink-0">
            <StatusIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-80">Google Presence</div>
            <div className="text-lg font-bold">{isHealthy ? "Healthy" : "Needs Attention"}</div>
          </div>
          <div className="hidden md:block w-px h-10 bg-current opacity-20 mx-2"></div>
          <div className="hidden md:block max-w-[200px] text-sm font-medium leading-snug opacity-90">
            {isHealthy ? "Your profile is active and receiving patient traffic." : "Your profile metrics are lower than expected."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Profile Views
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.views.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
            <Phone className="h-4 w-4" /> Phone Calls
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.calls.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> Directions
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.directionRequests.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
            <MousePointerClick className="h-4 w-4" /> Web Clicks
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.websiteClicks.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
