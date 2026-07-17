"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Eye,
  Search,
  Phone,
  Navigation,
  MousePointerClick,
  RefreshCw,
} from "lucide-react";

interface InsightsDisplayProps {
  insights: any;
  loading: boolean;
  syncing: boolean;
  onSync: () => Promise<void>;
}

export function InsightsDisplay({
  insights,
  loading,
  syncing,
  onSync,
}: InsightsDisplayProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const metrics = [
    {
      label: "Total Searches",
      value: insights.totalSearches || 0,
      icon: Search,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      breakdown: [
        { label: "Direct", value: insights.directSearches || 0 },
        { label: "Discovery", value: insights.discoverySearches || 0 },
      ],
    },
    {
      label: "Total Views",
      value: insights.totalViews || 0,
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-100",
      breakdown: [
        { label: "Search", value: insights.searchViews || 0 },
        { label: "Maps", value: insights.mapsViews || 0 },
      ],
    },
    {
      label: "Total Actions",
      value: insights.totalActions || 0,
      icon: MousePointerClick,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      breakdown: [
        { label: "Website", value: insights.websiteClicks || 0 },
        { label: "Calls", value: insights.phoneCalls || 0 },
        { label: "Directions", value: insights.directionRequests || 0 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance Insights</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">{metric.value}</div>
              <div className="space-y-2">
                {metric.breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}