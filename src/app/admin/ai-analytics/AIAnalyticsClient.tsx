"use client";

import { useState } from "react";
import { 
  Zap, 
  Cpu, 
  Search, 
  ArrowUpRight, 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AIAnalyticsClientProps {
  initialData: {
    summary: {
      totalTokensLifetime: number;
      totalCostLifetime: number;
      totalRequestsLifetime: number;
      totalTokensThisMonth: number;
      totalCostThisMonth: number;
      totalRequestsThisMonth: number;
      activeClinicsThisMonth: number;
    };
    clinicLeaderboard: Array<{
      doctorId: string;
      clinicName: string;
      doctorName: string;
      email: string;
      packageName: string;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      estimatedCostInr: number;
      requestCount: number;
    }>;
    featureBreakdown: Array<{
      feature: string;
      totalTokens: number;
      estimatedCostInr: number;
      count: number;
      percentage: number;
    }>;
    recentLogs: Array<{
      id: string;
      feature: string;
      provider: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCostInr: number;
      createdAt: string;
      doctor?: {
        name: string;
        clinicName: string;
        email: string;
      };
    }>;
  };
}

const FEATURE_LABELS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  WHATSAPP_REPLY: { label: "WhatsApp AI Assistant", icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
  GBP_POST: { label: "Google Updates Assistant", icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50" },
  REVIEW_REPLY: { label: "AI Review Responder", icon: Bot, color: "text-violet-600", bg: "bg-violet-50" },
  CLINIC_AUDIT: { label: "Clinical Audit & SEO", icon: Layers, color: "text-amber-600", bg: "bg-amber-50" },
  SEO_OPTIMIZATION: { label: "SEO Optimization", icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
  BLOG_GENERATION: { label: "Blog Publishing", icon: Cpu, color: "text-rose-600", bg: "bg-rose-50" },
};

export function AIAnalyticsClient({ initialData }: AIAnalyticsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { summary, clinicLeaderboard, featureBreakdown, recentLogs } = initialData;

  const filteredClinics = clinicLeaderboard.filter((c) =>
    c.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-600" />
            AI & LLM Token Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time LLM token consumption, provider analytics, and raw API costs per clinic.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tokens (Lifetime) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tokens</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-xl text-blue-600">
              <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalTokensLifetime > 1000000 
              ? `${(summary.totalTokensLifetime / 1000000).toFixed(2)}M` 
              : summary.totalTokensLifetime.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            This Month: {summary.totalTokensThisMonth.toLocaleString("en-IN")} tokens
          </p>
        </div>

        {/* Estimated Raw Cost */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-xl text-emerald-700 font-extrabold text-xs">
              ₹
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{summary.totalCostLifetime.toFixed(2)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            This Month: ₹{summary.totalCostThisMonth.toFixed(2)}
          </p>
        </div>

        {/* Total AI Generations */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">AI Generations</span>
            <div className="p-1.5 sm:p-2 bg-violet-50 rounded-xl text-violet-600">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalRequestsLifetime.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            This Month: {summary.totalRequestsThisMonth.toLocaleString("en-IN")} requests
          </p>
        </div>

        {/* Active AI Clinics */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clinics</span>
            <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.activeClinicsThisMonth}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Consuming tokens this month
          </p>
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Consumption by Feature
        </h3>

        {featureBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No feature token consumption recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureBreakdown.map((item) => {
              const meta = FEATURE_LABELS[item.feature] || {
                label: item.feature.replace(/_/g, " "),
                icon: Bot,
                color: "text-slate-600",
                bg: "bg-slate-50",
              };
              const Icon = meta.icon;

              return (
                <div key={item.feature} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${meta.bg} ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{meta.label}</h4>
                        <p className="text-[10px] text-slate-500">{item.count} requests</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">{item.percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200/50">
                    <span className="font-semibold">{item.totalTokens.toLocaleString("en-IN")} tokens</span>
                    <span className="font-bold text-slate-900">₹{item.estimatedCostInr.toFixed(3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinic Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinic AI Consumption Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-0.5">Clinics ranked by highest token usage and cost incurred.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clinic or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Rank & Clinic</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4 text-right">Prompt Tokens</th>
                <th className="py-3.5 px-4 text-right">Completion Tokens</th>
                <th className="py-3.5 px-4 text-right">Total Tokens</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Raw Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No token consumption recorded for any clinic matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClinics.map((clinic, i) => (
                  <tr key={clinic.doctorId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          i === 0 ? "bg-amber-100 text-amber-800" :
                          i === 1 ? "bg-slate-200 text-slate-700" :
                          i === 2 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{clinic.clinicName}</p>
                          <p className="text-[11px] text-slate-400">{clinic.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">
                        {clinic.packageName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {clinic.promptTokens.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {clinic.completionTokens.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {clinic.totalTokens.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-extrabold text-emerald-700">
                      ₹{clinic.estimatedCostInr.toFixed(3)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Recent AI Telemetry Events */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Live AI Generation Stream (Last 10 Events)
        </h3>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No AI calls recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {log.doctor?.clinicName || log.doctor?.name || "Clinic"} • <span className="font-semibold text-slate-500">{log.feature}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">{log.model}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900 font-mono">{log.totalTokens} tokens</p>
                  <p className="text-[11px] font-semibold text-emerald-600">₹{log.estimatedCostInr.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
