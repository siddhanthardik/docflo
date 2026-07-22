"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Target, ArrowRight, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

import { useLocalSeoModule } from "@/hooks/use-local-seo";

export function ActionCenter() {
  const { data: tasks, isLoading } = useLocalSeoModule<any[]>('recommendations');

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!tasks) return null;

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Caught Up!</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Your Google Business Profile is fully optimized. We're continuously monitoring your local presence for any new opportunities.
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-700 bg-red-50 border-red-200";
      case "HIGH": return "text-orange-700 bg-orange-50 border-orange-200";
      case "MEDIUM": return "text-amber-700 bg-amber-50 border-amber-200";
      default: return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const getModuleLink = (fixLink: string) => {
    return fixLink || "/gbp";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Priority Action Center</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                  {task.priority} PRIORITY
                </span>
                <span className="text-sm font-medium text-gray-400 flex items-center gap-1">
                  Evidence: {task.evidence}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{task.recommendation}</h3>
              <p className="text-gray-600 mb-4">{task.expectedImpact}</p>
              
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-medium">
                  <TrendingUp className="h-4 w-4" /> Expected Impact: {task.expectedImpact}
                </div>
              </div>
            </div>
            <div className="flex items-center lg:justify-end border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
              <Button asChild className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                <Link href={getModuleLink(task.fixLink)}>
                  Fix Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
