"use client";

import { useQuery } from "@tanstack/react-query";

interface LocalSeoResponse<T> {
  data: T;
  source: string;
  lastUpdated: string | null;
  error?: string;
}

export function useLocalSeoModule<T>(moduleName: string, params?: Record<string, string>) {
  const queryKey = ["local-seo", moduleName, params];

  const { data, isLoading, error, refetch } = useQuery<LocalSeoResponse<T>>({
    queryKey,
    queryFn: async () => {
      const url = new URL(`/api/local-seo/${moduleName}`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch ${moduleName}`);
      }
      return res.json();
    },
    // Keep data relatively fresh but don't spam the API
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: data?.data,
    source: data?.source,
    lastUpdated: data?.lastUpdated,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
