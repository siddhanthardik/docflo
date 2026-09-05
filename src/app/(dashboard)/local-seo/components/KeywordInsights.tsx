"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, AlertCircle, Sparkles, Edit3, Star, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function KeywordInsights() {
  const router = useRouter();
  const { data: keywordsData, isLoading } = useLocalSeoModule<any>('keywords');

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const keywords = keywordsData?.searchKeywordsCounts || [];

  if (!keywords || keywords.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Keyword Data</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Google has not returned any search keyword impressions for this location in the current period.
        </p>
      </div>
    );
  }

  const handleTargetInPost = (kw: string) => {
    router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(kw)}`);
  };

  const handleTargetInReview = (kw: string) => {
    router.push(`/reviews?targetKeyword=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Patient Search Terms</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">Live Google Impressions</span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        These are the actual search queries patients typed into Google Search & Maps that triggered your clinic profile to appear.
      </p>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400">Search Keyword</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Intent</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Target Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.slice(0, 10).map((kw: any, idx: number) => {
              const term = typeof kw === "string" ? kw : kw.searchKeyword || kw.keyword || "";
              if (!term) return null;

              const isDiscovery = !term.toLowerCase().includes("doc") && !term.toLowerCase().includes("clinic") && !term.toLowerCase().includes("dr");

              return (
                <TableRow key={idx} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell className="font-semibold text-xs text-gray-900 capitalize py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {term}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {isDiscovery ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <Search className="h-3 w-3" /> Discovery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        <TrendingUp className="h-3 w-3" /> Branded
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold px-2 inline-flex items-center gap-1 border border-indigo-100/80 rounded-lg"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>Target</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg rounded-xl border border-gray-100 p-1">
                        <DropdownMenuItem
                          onClick={() => handleTargetInPost(term)}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg cursor-pointer px-2.5 py-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Target in Post</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTargetInReview(term)}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg cursor-pointer px-2.5 py-2"
                        >
                          <Star className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Target in Review</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
