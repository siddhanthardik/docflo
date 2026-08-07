"use client";

import { MessageSquare, Edit3, ShieldCheck, Users, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function OverviewQuickActions({ onSwitchTab }: { onSwitchTab?: (tab: any) => void }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Zap className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Local Growth Shortcuts</h2>
        </div>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          1-Click Action Hub
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => router.push("/reviews")}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">Reply to Reviews</p>
              <p className="text-[11px] text-gray-500">Draft AI patient responses</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => router.push("/gbp/posts")}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-amber-50/60 hover:border-amber-200 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-amber-800">Create Google Post</p>
              <p className="text-[11px] text-gray-500">Publish weekly health updates</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => onSwitchTab ? onSwitchTab("competitors") : router.push("/local-seo")}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-800">Analyze Competitors</p>
              <p className="text-[11px] text-gray-500">Check local Map Pack rank</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
