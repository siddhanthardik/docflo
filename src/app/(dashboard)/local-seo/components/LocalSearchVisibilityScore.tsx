"use client";

import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, TrendingUp, Search, FileText, Star, Edit3, MessageSquare, MousePointerClick, Eye } from "lucide-react";


export function LocalSearchVisibilityScore() {
  const { data, isLoading } = useLocalSeoModule<any>('visibility-score');

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-2xl" />;
  }

  if (!data) return null;

  const score = data.score || 0;
  let strokeColor = "text-emerald-500";
  let bgStroke = "text-emerald-100";
  let labelColor = "text-emerald-600";
  
  if (score < 50) {
    strokeColor = "text-amber-500";
    bgStroke = "text-amber-100";
    labelColor = "text-amber-600";
  } else if (score < 80) {
    strokeColor = "text-emerald-500";
    bgStroke = "text-emerald-100";
    labelColor = "text-emerald-600";
  }

  const subScores = data.subScores || {};
  const metrics = [
    { label: "Keyword Rankings", icon: Search, value: subScores.keywordRankings || 0, bg: "bg-indigo-100", color: "text-indigo-600" },
    { label: "Profile Completeness", icon: FileText, value: subScores.profileCompleteness || 0, bg: "bg-orange-100", color: "text-orange-600" },
    { label: "Review & Reputation", icon: Star, value: subScores.reviewReputation || 0, bg: "bg-emerald-100", color: "text-emerald-600" },
    { label: "Posting Frequency", icon: Edit3, value: subScores.postingFrequency || 0, bg: "bg-amber-100", color: "text-amber-600" },
    { label: "Q&A Activity", icon: MessageSquare, value: subScores.qaActivity || 0, bg: "bg-blue-100", color: "text-blue-600" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Score Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 lg:col-span-2">
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-gray-900">Local Search Visibility Score</h2>
          <button className="text-gray-400 hover:text-gray-600" title="This score is calculated from your real Google data including completeness, reviews, and search performance.">
            <Info className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Circular Gauge */}
          <div className="relative flex flex-col items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className={bgStroke}
              />
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="527.7"
                strokeDashoffset={527.7 - (527.7 * score) / 100}
                className={`${strokeColor} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-extrabold text-gray-900">{score}</span>
              <span className={`text-lg font-semibold mt-1 ${labelColor}`}>{data.status}</span>
            </div>
            
            <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span>{data.trend}</span>
              <span className="text-gray-500 font-normal ml-1">vs last month</span>
            </div>
          </div>

          {/* Metrics List */}
          <div className="flex-1 w-full space-y-5">
            {metrics.map((metric, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full ${metric.bg} flex items-center justify-center flex-shrink-0`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div className="flex-1 font-medium text-gray-700 text-sm">{metric.label}</div>
                <div className="flex items-center gap-3 w-32">
                  <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                      style={{ width: `${metric.value}%` }} 
                    />
                  </div>
                  <div className="text-sm font-bold text-gray-900 w-6 text-right">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column Cards */}
      <div className="flex flex-col gap-6">
        {/* You're doing great Card */}
        <div className="bg-[#EEF2FF] rounded-2xl p-6 border border-indigo-50 shadow-sm flex-1">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Star className="h-6 w-6 text-white fill-white" />
          </div>
          <h3 className="text-xl font-bold text-indigo-900 mb-2">You're doing great!</h3>
          <p className="text-indigo-700/80 text-sm leading-relaxed mb-4">
            Your visibility is higher than <span className="font-bold text-indigo-900">72%</span> of similar clinics in your area.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors">
            How is this calculated? <Info className="h-3 w-3" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">Total Clicks</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.performance.totalClicks.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1.5">
                  <TrendingUp className="h-3 w-3" /> {data.performance.clicksTrend}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <MousePointerClick className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">Total Views</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.performance.totalViews.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1.5">
                  <TrendingUp className="h-3 w-3" /> {data.performance.viewsTrend}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
