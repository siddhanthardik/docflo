"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface KeywordData {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number; // click-through rate
  avgPosition: number;
  trend: "up" | "down" | "stable";
}

export function KeywordTracker() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/keywords")
      .then((res) => res.json())
      .then((data) => {
        setKeywords(data.keywords || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Top Search Queries (Last 30 Days)
        </h2>
        <p className="text-sm text-gray-500">
          Keywords that people used to find your practice on Google
        </p>
      </div>

      {keywords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No keyword data available yet.</p>
          <p className="text-sm mt-2">
            Connect your Google Business Profile and sync data to see search
            queries.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Search Query</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Avg. Position</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw) => (
              <TableRow key={kw.query}>
                <TableCell className="font-medium">{kw.query}</TableCell>
                <TableCell className="text-right">
                  {kw.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {kw.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {(kw.ctr * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {kw.avgPosition.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {kw.trend === "up" ? (
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" /> Up
                    </Badge>
                  ) : kw.trend === "down" ? (
                    <Badge className="bg-red-100 text-red-700">
                      <TrendingDown className="h-3 w-3 mr-1" /> Down
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Stable</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}