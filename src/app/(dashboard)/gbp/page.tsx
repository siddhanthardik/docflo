"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Search,
  Plus,
  Eye,
  Phone,
  Navigation,
  TrendingUp,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import Link from "next/link";

// Tiny bar chart component
function MiniBarChart({ color }: { color: string }) {
  const bars = [40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95, 88, 100];
  return (
    <div className="flex items-end gap-0.5 h-10 mt-3">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm opacity-80"
          style={{ height: `${h}%`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ direct, discovery, maps }: { direct: number; discovery: number; maps: number }) {
  const total = direct + discovery + maps;
  const d = total ? Math.round((direct / total) * 100) : 52;
  const disc = total ? Math.round((discovery / total) * 100) : 31;
  const m = total ? 100 - d - disc : 17;

  // SVG donut segments
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const strokeWidth = 22;
  const circ = 2 * Math.PI * r;

  const segments = [
    { pct: d, color: "#3B82F6" },
    { pct: disc, color: "#22C55E" },
    { pct: m, color: "#F59E0B" },
  ];

  let offset = 0;
  const paths = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circ;
    const gap = circ - dash;
    const rotate = (offset / 100) * 360 - 90;
    offset += seg.pct;
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(${rotate} ${cx} ${cy})`}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        {paths}
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-gray-700" fontSize="13" fontWeight="700">
          {d}%
        </text>
      </svg>
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">Direct Search</span>
          </div>
          <span className="text-sm font-bold text-blue-600">{d}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Discovery Search</span>
          </div>
          <span className="text-sm font-bold text-green-600">{disc}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-600">Maps</span>
          </div>
          <span className="text-sm font-bold text-amber-600">{m}%</span>
        </div>
      </div>
    </div>
  );
}

// Line chart for profile views trend
function ProfileViewsTrend({ totalViews }: { totalViews: number }) {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const base = totalViews > 0 ? Math.round(totalViews / 12) : 8500;
  const viewsData = months.map((_, i) => Math.round(base * (0.6 + i * 0.035 + Math.random() * 0.1)));
  const callsData = months.map((_, i) => Math.round((base / 70) * (0.5 + i * 0.04 + Math.random() * 0.1)));

  const maxViews = Math.max(...viewsData);
  const w = 480;
  const h = 140;
  const pad = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const toX = (i: number) => pad.left + (i / (months.length - 1)) * chartW;
  const toYViews = (v: number) => pad.top + chartH - (v / maxViews) * chartH;

  const viewsPath = viewsData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toYViews(v)}`).join(" ");
  const viewsArea = `${viewsPath} L ${toX(months.length - 1)} ${pad.top + chartH} L ${toX(0)} ${pad.top + chartH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 300 }}>
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={viewsArea} fill="url(#viewsGrad)" />
        {/* Line */}
        <path d={viewsPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" />
        {/* X labels */}
        {months.map((m, i) => (
          <text key={m} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">{m}</text>
        ))}
      </svg>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-pink-500",
    "bg-indigo-500", "bg-emerald-500", "bg-orange-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Just now (Synced)";
  if (days === 1) return "1 Day ago";
  if (days < 30) return `${days} Days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 Month ago" : `${months} Months ago`;
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export default function GBPProfilePage() {
  const { connected, activeLocation: activeAccount, isLoading: contextLoading } = useLocationContext();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // We rely on LocationContext to load profiles automatically

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setConnectError(null);
      const response = await fetch("/api/gbp/connect");
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "Could not start Google connection");
      window.location.href = payload.url;
    } catch (error: any) {
      setConnectError(error.message || "Could not start Google connection");
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/gbp/sync", { method: "POST" });
      // If we need to refetch context, we would need to reload window or expose a fetch method on Context.
      // For now, reload window so context pulls fresh state
      window.location.reload();
    } catch (e) { /* silent */ }
    finally { setSyncing(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (contextLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Google Business Profile</h2>
        <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
          Sign in with the Gmail account that manages your Google Business Profile.
          Gyrex will sync your reviews, insights, and rankings automatically.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleConnect} disabled={connecting} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <GoogleIcon className="h-4 w-4 mr-2" />
            {connecting ? "Opening Google..." : "Connect with Google"}
          </Button>
        </div>
        {connectError && <p className="text-sm text-red-600 mt-4">{connectError}</p>}
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Select a Location</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          Please select a location from the dropdown in the navigation bar to view its GBP Profile details.
        </p>
      </div>
    );
  }

  const insights = activeAccount?.insights || {};
  const reviews = activeAccount?.recentReviews || [];
  const keywords: any[] = insights.searchKeywords || [];

  const totalViews = insights.totalViews || 0;
  const searchViews = insights.searchViews || 0;
  const mapsViews = insights.mapsViews || 0;
  const phoneCalls = insights.phoneCalls || 0;
  const directionRequests = insights.directionRequests || 0;
  const websiteClicks = insights.websiteClicks || 0;
  const rating = insights.rating ? Number(insights.rating).toFixed(1) : "N/A";
  const totalRatings = insights.user_ratings_total || 0;
  const category = insights.categories?.primaryCategory?.displayName || "";
  const needsReply = reviews.filter((r: any) => !r.replied).length;

  const metricCards = [
    {
      label: "Profile Views",
      value: formatNum(totalViews),
      change: "+18.4%",
      color: "#3B82F6",
      icon: <Eye className="h-5 w-5" style={{ color: "#3B82F6" }} />,
      bg: "bg-blue-50",
    },
    {
      label: "Search Impressions",
      value: formatNum(searchViews),
      change: "+12.1%",
      color: "#A855F7",
      icon: <Search className="h-5 w-5" style={{ color: "#A855F7" }} />,
      bg: "bg-purple-50",
    },
    {
      label: "Direction Requests",
      value: formatNum(directionRequests),
      change: "+7.3%",
      color: "#F59E0B",
      icon: <Navigation className="h-5 w-5" style={{ color: "#F59E0B" }} />,
      bg: "bg-amber-50",
    },
    {
      label: "Phone Calls",
      value: formatNum(phoneCalls),
      change: "+23.5%",
      color: "#EC4899",
      icon: <Phone className="h-5 w-5" style={{ color: "#EC4899" }} />,
      bg: "bg-pink-50",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* ── HERO BANNER ── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b5bdb 50%, #4c6ef5 100%)" }}
      >
        {/* Subtle circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
        <div className="absolute -bottom-8 right-32 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-blue-200 text-sm mb-1">{greeting} 👋</p>
            <h2 className="text-white text-2xl font-bold mb-0.5">{insights.name || "Your Clinic"}</h2>
            <p className="text-blue-200 text-sm mb-4">
              {insights.formattedAddress || ""}{category ? ` · ${category}` : ""}
            </p>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <p className="text-xs text-blue-200 mb-0.5">Profile Views (30d)</p>
                <p className="text-lg font-bold">{formatNum(totalViews)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <p className="text-xs text-blue-200 mb-0.5">Calls (30d)</p>
                <p className="text-lg font-bold">{formatNum(phoneCalls)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <p className="text-xs text-blue-200 mb-0.5">Response Rate</p>
                <p className="text-lg font-bold">
                  {totalRatings > 0 ? `${Math.round((reviews.filter((r: any) => r.replied).length / Math.max(reviews.length, 1)) * 100)}%` : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="bg-white/15 border-white/30 text-white hover:bg-white/25 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={true}
                title="Only one profile can be connected per plan"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Profile
              </Button>
            </div>
            <p className="text-blue-200 text-xs mb-2">Average Rating</p>
            <div className="flex items-end gap-2 justify-end">
              <Star className="h-6 w-6 fill-amber-300 text-amber-300 mb-1" />
              <span className="text-white text-5xl font-extrabold leading-none">{rating}</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">{totalRatings} total reviews</p>
            {insights.newReviewUri && (
              <a href={insights.newReviewUri} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-200 text-xs hover:text-white mt-2 transition-colors">
                <ExternalLink className="h-3 w-3" />
                Get Reviews Link
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTIONS & INFO ── */}
      <div className="grid grid-cols-1 gap-6">

        {/* Business Categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Business Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Primary Category</p>
                <p className="text-sm font-medium text-gray-900">{category || "Not set"}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50">Edit</Button>
            </div>
            
            {(insights.categories?.additionalCategories?.length ?? 0) > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Additional Services</p>
                <div className="flex flex-wrap gap-2">
                  {insights.categories?.additionalCategories?.slice(0, 6).map((cat, i) => (
                    <span key={i} className="text-xs font-medium bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md shadow-sm">
                      {cat.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
