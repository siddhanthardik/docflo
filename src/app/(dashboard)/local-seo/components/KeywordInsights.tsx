"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function KeywordInsights() {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Patient Search Terms</h2>
      </div>
      
      <p className="text-gray-500 mb-6">
        These are the actual search queries patients used on Google that triggered your profile to appear.
      </p>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Search Keyword</TableHead>
              <TableHead>Search Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.slice(0, 15).map((kw: any, idx: number) => {
              const term = kw.searchKeyword || kw;
              const isDiscovery = !term.toLowerCase().includes("doc") && !term.toLowerCase().includes("clinic");
              
              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{term}</TableCell>
                  <TableCell>
                    {isDiscovery ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium flex items-center w-fit gap-1">
                        <Search className="h-3 w-3" /> Discovery
                      </span>
                    ) : (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium flex items-center w-fit gap-1">
                        <TrendingUp className="h-3 w-3" /> Direct / Branded
                      </span>
                    )}
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
