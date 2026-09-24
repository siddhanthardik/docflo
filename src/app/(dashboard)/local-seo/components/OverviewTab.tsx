"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Info,
  ArrowUpRight,
  Globe,
  Phone,
  Navigation,
  CalendarCheck2,
  Star,
  MessageSquare,
  History,
  CalendarPlus,
  Clock,
  Megaphone,
  AlertCircle,
  Search,
  TrendingUp,
  Edit3,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ServiceInsights from "./ServiceInsights";

interface OverviewTabProps {
  overviewData: any;
  visibilityScoreData: any;
  profileHealthData: any;
  reputationData: any;
  performanceData: any;
  keywordData: any;
  postData: any;
  servicesData?: any;
  onNavigateTab: (tab: "rank-tracker" | "competitors" | "profile-health" | "recommendations") => void;
}

export function OverviewTab({
  overviewData,
  visibilityScoreData,
  profileHealthData,
  reputationData,
  performanceData,
  keywordData,
  postData,
  servicesData,
  onNavigateTab,
}: OverviewTabProps) {
  const router = useRouter();
  const [servicesModalOpen, setServicesModalOpen] = useState(false);

  // ── 1. Local Visibility Score Calculation ───────────────────────────────────
  const score = visibilityScoreData?.score || 0;
  const status = visibilityScoreData?.status || (score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Needs Work");

  const R = 60;
  const circumference = Math.PI * R;
  const bgColor = score >= 80 ? "#d1fae5" : score >= 50 ? "#fef3c7" : "#fee2e2";
  const badgeTextColor = score >= 80 ? "#047857" : score >= 50 ? "#b45309" : "#b91c1c";

  // ── 2. Profile Health Summary ──────────────────────────────────────────────
  const pData = profileHealthData || {};
  const secondaryCount = pData.categories ? pData.categories.length : 0;
  const descLength = pData.description ? pData.description.length : 0;

  const healthChecks = [
    { key: "name", label: "Business Name", isComplete: !!pData.name },
    { key: "primaryCategory", label: "Primary Category", isComplete: !!pData.primaryCategory },
    { key: "categories", label: "Secondary Categories", isComplete: secondaryCount >= 1 },
    { key: "description", label: "Description", isComplete: descLength >= 100 },
    { key: "appointmentUrl", label: "Appointment Link", isComplete: !!pData.appointmentUrl },
    { key: "hours", label: "Hours", isComplete: !!pData.hours },
    { key: "phone", label: "Phone", isComplete: !!pData.phone },
    { key: "website", label: "Website", isComplete: !!pData.website },
    {
      key: "attributes",
      label: "Amenities",
      isComplete: !!(
        pData.attributes &&
        (Array.isArray(pData.attributes)
          ? pData.attributes.length > 0
          : Object.keys(pData.attributes).length > 0)
      ),
    },
  ];
  const completedChecksCount = healthChecks.filter((c) => c.isComplete).length;

  // ── 3. Google Performance Metrics ──────────────────────────────────────────
  let desktopSearch = 0;
  let mobileSearch = 0;
  let desktopMaps = 0;
  let mobileMaps = 0;
  let websiteClicks = 0;
  let callClicks = 0;
  let directionRequests = 0;
  let bookings = 0;

  if (performanceData?.multiDailyMetricTimeSeries) {
    for (const multiSeries of performanceData.multiDailyMetricTimeSeries) {
      if (!multiSeries.dailyMetricTimeSeries) continue;
      for (const series of multiSeries.dailyMetricTimeSeries) {
        let sum = 0;
        if (series.timeSeries?.datedValues) {
          for (const val of series.timeSeries.datedValues) {
            sum += parseInt(val.value || "0", 10);
          }
        }
        switch (series.dailyMetric) {
          case "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH":
            desktopSearch = sum;
            break;
          case "BUSINESS_IMPRESSIONS_MOBILE_SEARCH":
            mobileSearch = sum;
            break;
          case "BUSINESS_IMPRESSIONS_DESKTOP_MAPS":
            desktopMaps = sum;
            break;
          case "BUSINESS_IMPRESSIONS_MOBILE_MAPS":
            mobileMaps = sum;
            break;
          case "WEBSITE_CLICKS":
            websiteClicks = sum;
            break;
          case "CALL_CLICKS":
            callClicks = sum;
            break;
          case "BUSINESS_DIRECTION_REQUESTS":
            directionRequests = sum;
            break;
          case "BUSINESS_BOOKINGS":
            bookings = sum;
            break;
        }
      }
    }
  }

  const rawViews = desktopSearch + mobileSearch + desktopMaps + mobileMaps;
  const totalViews = rawViews || overviewData?.views || 0;
  const finalCalls = callClicks || overviewData?.calls || 0;
  const finalWeb = websiteClicks || overviewData?.websiteClicks || 0;
  const finalDirections = directionRequests || overviewData?.directionRequests || 0;

  const searchViews = desktopSearch + mobileSearch;
  const mapsViews = desktopMaps + mobileMaps;

  const pieData = [
    { name: "Search Mobile", value: mobileSearch, color: "#f59e0b" },
    { name: "Search Desktop", value: desktopSearch, color: "#3b82f6" },
    { name: "Maps Mobile", value: mobileMaps, color: "#ef4444" },
    { name: "Maps Desktop", value: desktopMaps, color: "#10b981" },
  ].filter((d) => d.value > 0);

  // ── 4. Reviews & Reputation ────────────────────────────────────────────────
  const { averageRating = 0, totalReviewCount = 0, reviews = [] } = reputationData || {};
  const unanswered = reviews.filter((r: any) => !r.reviewReply).length;

  // ── 5. Google Posts Activity ───────────────────────────────────────────────
  const rawPosts: any[] = postData?.localPosts || [];
  const posts = [...rawPosts].sort((a: any, b: any) => {
    const timeA = new Date(a.createTime || a.updateTime || 0).getTime();
    const timeB = new Date(b.createTime || b.updateTime || 0).getTime();
    return timeB - timeA;
  });

  const recentPost = posts[0];
  const lastPostDate = recentPost
    ? new Date(recentPost.createTime || recentPost.updateTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Never";

  const now = new Date();
  const thisMonth = posts.filter((p: any) => {
    const ts = p.createTime || p.updateTime;
    if (!ts) return false;
    const d = new Date(ts);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── 6. Patient Search Keywords ─────────────────────────────────────────────
  const keywords = keywordData?.searchKeywordsCounts || [];

  const handleTargetInPost = (kw: string) => {
    router.push(`/gbp/posts?draftKeyword=${encodeURIComponent(kw)}`);
  };

  const handleTargetInReview = (kw: string) => {
    router.push(`/reviews?targetKeyword=${encodeURIComponent(kw)}`);
  };

  // ── 7. Services Count ──────────────────────────────────────────────────────
  const servicesList = servicesData?.services || overviewData?.services || [];
  const activeServicesCount = servicesList.length;

  // ── 8. Needs Attention Engine (Derived from Live Incomplete Data) ───────────
  const attentionItems: { text: string; action: "profile-health" | "recommendations" | "reviews" | "posts" }[] = [];

  if (pData) {
    if (!pData.appointmentUrl) {
      attentionItems.push({ text: "Appointment booking link is missing from your Google listing", action: "profile-health" });
    }
    if (descLength < 100) {
      attentionItems.push({ text: "Clinic description is incomplete or under 100 characters", action: "profile-health" });
    }
    if (secondaryCount === 0) {
      attentionItems.push({ text: "No secondary medical categories configured to expand search reach", action: "profile-health" });
    }
  }

  if (unanswered > 0) {
    attentionItems.push({
      text: `${unanswered} patient review${unanswered > 1 ? "s" : ""} awaiting your response`,
      action: "reviews",
    });
  }

  if (thisMonth === 0) {
    attentionItems.push({
      text: "No Google posts published this month to keep your profile active",
      action: "posts",
    });
  }

  // Display max top 3 priority items
  const displayAttentionItems = attentionItems.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────────────────────
          PRIMARY SUMMARY ROW (2 Columns)
          Card 1: Local Visibility
          Card 2: Google Business Profile Performance
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1 — LOCAL VISIBILITY */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Local Visibility</h3>
                  <p className="text-[11px] text-gray-500">Google search rank & profile authority</p>
                </div>
              </div>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                <div className="absolute right-0 top-6 hidden group-hover:block w-52 bg-gray-900 text-white text-[11px] rounded-lg p-2.5 shadow-lg z-10 leading-relaxed">
                  Calculated from your Google search rankings, review strength, and profile completeness.
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center my-3">
              <div className="relative">
                <svg width="170" height="95" viewBox="0 0 170 95">
                  <path
                    d="M 15 85 A 70 70 0 0 1 155 85"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 85 A 70 70 0 0 1 155 85"
                    fill="none"
                    stroke="url(#overviewScoreGrad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * Math.min(score, 100)) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="overviewScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <text x="85" y="72" textAnchor="middle" fontSize="32" fontWeight="800" fill="#111827">
                    {score}
                  </text>
                  <text x="85" y="88" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9ca3af">
                    / 100
                  </text>
                </svg>
              </div>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-1"
                style={{ backgroundColor: bgColor, color: badgeTextColor }}
              >
                {status}
              </span>
              <p className="text-[11px] font-semibold text-emerald-600 mt-2">
                Top 30% of tracked clinics
              </p>
            </div>
          </div>

          {/* Secondary Summary: Profile Health */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-gray-600 font-medium">Profile Health:</span>
              <strong className="text-gray-900 font-bold">{completedChecksCount} / 9 complete</strong>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("profile-health")}
              className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              View Profile Health <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2 — GOOGLE BUSINESS PROFILE PERFORMANCE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Google Business Profile</h3>
                <p className="text-[11px] text-gray-500">Live patient views and interactions</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full font-medium border border-gray-100">
                Last 30 days
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 my-2">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{totalViews.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Profile views
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {searchViews > 0 && (
                    <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-amber-500 shrink-0" /> Search views
                      </span>
                      <span className="text-xs font-bold text-gray-900">{searchViews.toLocaleString()}</span>
                    </div>
                  )}

                  {mapsViews > 0 && (
                    <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Navigation className="w-3 h-3 text-emerald-500 shrink-0" /> Maps views
                      </span>
                      <span className="text-xs font-bold text-gray-900">{mapsViews.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-blue-500 shrink-0" /> Website clicks
                    </span>
                    <span className="text-xs font-bold text-gray-900">{finalWeb.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-amber-600 shrink-0" /> Calls
                    </span>
                    <span className="text-xs font-bold text-gray-900">{finalCalls.toLocaleString()}</span>
                  </div>

                  {finalDirections > 0 && (
                    <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Navigation className="w-3 h-3 text-teal-600 shrink-0" /> Directions
                      </span>
                      <span className="text-xs font-bold text-gray-900">{finalDirections.toLocaleString()}</span>
                    </div>
                  )}

                  {bookings > 0 && (
                    <div className="flex items-center justify-between bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-100/70">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <CalendarCheck2 className="w-3 h-3 text-purple-500 shrink-0" /> Appointment actions
                      </span>
                      <span className="text-xs font-bold text-gray-900">{bookings.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {pieData.length > 0 && (
                <div className="w-24 h-24 shrink-0 hidden sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={3}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => v?.toLocaleString()}
                        contentStyle={{
                          borderRadius: 8,
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Mobile Search
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Desktop Search
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Maps
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          NEEDS ATTENTION STRIP (Upper-Middle Part)
      ────────────────────────────────────────────────────────────────────────── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        displayAttentionItems.length > 0
          ? "bg-amber-50/50 border-amber-200/70"
          : "bg-emerald-50/40 border-emerald-200/70"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {displayAttentionItems.length > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h4 className="text-sm font-bold text-gray-900">
                    {displayAttentionItems.length} {displayAttentionItems.length === 1 ? "item needs" : "items need"} your attention
                  </h4>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Your Google profile is in good shape.
                  </h4>
                </>
              )}
            </div>

            {displayAttentionItems.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1 pl-6 list-disc">
                {displayAttentionItems.map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 pl-6">
                All core profile information, reviews, and activity indicators are currently performing well.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {displayAttentionItems.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab("profile-health")}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg border border-amber-300/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                View Profile Health <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab("recommendations")}
              className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              View Recommendations <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECONDARY ROW (2 Columns)
          Card 3: Reviews & Reputation
          Card 4: Google Posts / Activity
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 3 — REVIEWS & REPUTATION */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="text-base font-bold text-gray-900">Reviews & Reputation</h3>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg">
                <Link href="/reviews">
                  Manage Reviews <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{averageRating.toFixed(1)}</div>
                <div className="flex text-amber-400 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3 w-3"
                      fill={s <= Math.round(averageRating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-medium text-gray-500">Average Rating</div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{totalReviewCount.toLocaleString()}</div>
                <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Total Reviews
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{unanswered}</div>
                <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Unanswered
                </div>
                {unanswered > 0 && (
                  <span className="text-[10px] text-red-600 font-semibold mt-1">Needs reply</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Patient sentiment status</span>
            <span className="font-semibold text-emerald-600">
              {averageRating >= 4.5 ? "Excellent Reputation" : "Good Standing"}
            </span>
          </div>
        </div>

        {/* CARD 4 — GOOGLE POSTS / ACTIVITY */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Google Posts</h3>
              </div>
              <Button asChild size="sm" className="h-8 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href="/gbp/posts">
                  Create Post <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                  <History className="h-3 w-3 text-indigo-500" /> Last Post
                </div>
                <div className="text-sm font-bold text-gray-900">{lastPostDate}</div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                  <CalendarPlus className="h-3 w-3 text-emerald-500" /> This Month
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {thisMonth} {thisMonth === 1 ? "post" : "posts"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-amber-500" /> Target
                </div>
                <div className="text-sm font-bold text-gray-900">4 / month</div>
              </div>
            </div>

            {thisMonth === 0 && (
              <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>No posts published this month. Keep your clinic active on Google.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Monthly posting rhythm</span>
            <span className="font-semibold text-gray-700">
              {thisMonth >= 4 ? "Target achieved" : `${4 - thisMonth} more recommended`}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          PATIENT SEARCH TERMS ("What Patients Search on Google")
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">What Patients Search on Google</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Actual search queries that triggered your Google Business Profile.
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium border border-gray-100 hidden sm:inline-block">
            Live Google Impressions
          </span>
        </div>

        {keywords.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-gray-100">
            <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">No Search Keyword Impressions Yet</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              Google has not returned any patient search queries for this profile in the current reporting period.
            </p>
          </div>
        ) : (
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
                {keywords.slice(0, 8).map((kw: any, idx: number) => {
                  const term = typeof kw === "string" ? kw : kw.searchKeyword || kw.keyword || "";
                  if (!term) return null;

                  const isDiscovery =
                    !term.toLowerCase().includes("doc") &&
                    !term.toLowerCase().includes("clinic") &&
                    !term.toLowerCase().includes("dr");

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
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          GOOGLE PROFILE SNAPSHOT CARD
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Google Profile Snapshot</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configuration overview of your active Google listing</p>
          </div>
          <div className="flex items-center gap-2">
            {activeServicesCount > 0 && (
              <Dialog open={servicesModalOpen} onOpenChange={setServicesModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg">
                    View Full Services ({activeServicesCount})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
                  <DialogHeader className="p-4 border-b border-gray-100">
                    <DialogTitle className="text-base font-bold text-gray-900">
                      Clinic Services & Recommendations
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <ServiceInsights />
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab("profile-health")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              Manage Profile <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Services Row */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-gray-500 block">Services</span>
              <span className="text-sm font-bold text-gray-900">
                {activeServicesCount > 0 ? `${activeServicesCount} active` : "None configured"}
              </span>
            </div>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>

          {/* Profile Health Row */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-gray-500 block">Profile Health</span>
              <span className="text-sm font-bold text-gray-900">
                {completedChecksCount} / 9 complete
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>

          {/* Appointment Row */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-gray-500 block">Appointment</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {pData.appointmentUrl ? (
                  <span className="text-emerald-700 font-bold">Configured</span>
                ) : (
                  <span className="text-amber-700 font-bold">Not configured</span>
                )}
              </span>
            </div>
            <CalendarCheck2 className={`w-4 h-4 ${pData.appointmentUrl ? "text-emerald-500" : "text-amber-500"}`} />
          </div>

          {/* Website Row */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-gray-500 block">Website</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                {pData.website ? (
                  <span className="text-emerald-700 font-bold">Configured</span>
                ) : (
                  <span className="text-amber-700 font-bold">Not configured</span>
                )}
              </span>
            </div>
            <Globe className={`w-4 h-4 ${pData.website ? "text-emerald-500" : "text-amber-500"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
