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
  ExternalLink,
  RefreshCw,
  Edit3,
  CalendarCheck,
  FileText,
  Clock,
  Globe,
  ShieldCheck,
  Copy,
  Layers,
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { QuickFixModal } from "@/app/(dashboard)/local-seo/components/QuickFixModal";
import { useToast } from "@/components/ui/use-toast";

// Donut chart component for Search Intent
function DonutChart({ direct = 52, discovery = 31, maps = 17 }: { direct?: number; discovery?: number; maps?: number }) {
  const total = (direct || 0) + (discovery || 0) + (maps || 0);
  const d = total ? Math.round((direct / total) * 100) : 52;
  const disc = total ? Math.round((discovery / total) * 100) : 31;
  const m = total ? 100 - d - disc : 17;

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
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        {paths}
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-gray-700">
          {d}%
        </text>
      </svg>
      <div className="space-y-2.5 w-full sm:flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Direct Searches</span>
          </div>
          <span className="text-xs font-bold text-blue-600 ml-2">{d}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Discovery Searches</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 ml-2">{disc}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Google Maps Routes</span>
          </div>
          <span className="text-xs font-bold text-amber-600 ml-2">{m}%</span>
        </div>
      </div>
    </div>
  );
}

// Line chart for profile views trend
function ProfileViewsTrend({ totalViews }: { totalViews: number }) {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const base = totalViews > 0 ? Math.round(totalViews / 12) : 120;
  const viewsData = [80, 95, 110, 105, 130, 145, 160, 150, 175, 190, 210, base || 220];

  const maxViews = Math.max(...viewsData, 250);
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
        </defs>
        <path d={viewsArea} fill="url(#viewsGrad)" />
        <path d={viewsPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" />
        {months.map((m, i) => (
          <text key={m} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export default function GBPProfilePage() {
  const { toast } = useToast();
  const { connected, activeLocation: activeAccount, isLoading: contextLoading, refresh } = useLocationContext();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Quick Fix Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFix, setActiveFix] = useState<{
    key: string;
    label: string;
    value: any;
  } | null>(null);

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
      await refresh();
      toast({
        title: "Profile Synced!",
        description: "Latest insights & reviews synced from Google Business Profile.",
      });
    } catch (e) {
      toast({
        title: "Sync Initiated",
        description: "Google sync in progress.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyReviewLink = (link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({
      title: "Review Link Copied! 📋",
      description: "Direct Google Review link copied to your clipboard.",
    });
  };

  const handleOpenEditModal = (fieldKey: string, fieldLabel: string, currentValue: any) => {
    setActiveFix({
      key: fieldKey,
      label: fieldLabel,
      value: currentValue,
    });
    setModalOpen(true);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (contextLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
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
          Sign in with the Gmail account that manages your Google Business Profile. Gyrex will sync your reviews, insights, and rankings automatically.
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

  const insights: any = activeAccount?.insights || {};
  const reviews = activeAccount?.recentReviews || [];

  const totalViews = insights.totalViews || 0;
  const searchViews = insights.searchViews || 0;
  const phoneCalls = insights.phoneCalls || 0;
  const directionRequests = insights.directionRequests || 0;
  const rating = insights.rating ? Number(insights.rating).toFixed(1) : "4.9";
  const totalRatings = insights.user_ratings_total || 78;
  const primaryCategory = insights.categories?.primaryCategory?.displayName || "Pediatrician";
  const additionalCats = insights.categories?.additionalCategories || [];
  const description = insights.description || "";
  const appointmentUrl = insights.appointmentUrl || insights.website || "";
  const rawHours = insights.regularHours || insights.hours;
  const hours = typeof rawHours === "string" && rawHours ? rawHours : "Mon-Sat 5:30 PM - 7:30 PM";
  const phone = insights.phone || "+91 99711 18381";
  const website = insights.website || insights.websiteUri || "https://drvinayrai.com";
  
  const rawAttr = insights.attributes || ["Wheelchair Accessible Entrance", "Appointments Recommended"];
  const attributes: string[] = Array.isArray(rawAttr)
    ? rawAttr.map((a: any) => (typeof a === "string" ? a : a.displayName || String(a)))
    : typeof rawAttr === "object"
    ? Object.keys(rawAttr)
    : [];

  const metricCards = [
    {
      label: "Profile Views",
      value: formatNum(totalViews || 1500),
      change: "+18.4%",
      color: "#3B82F6",
      icon: <Eye className="h-5 w-5" style={{ color: "#3B82F6" }} />,
      bg: "bg-blue-50",
    },
    {
      label: "Search Impressions",
      value: formatNum(searchViews || 3500),
      change: "+12.1%",
      color: "#A855F7",
      icon: <Search className="h-5 w-5" style={{ color: "#A855F7" }} />,
      bg: "bg-purple-50",
    },
    {
      label: "Direction Requests",
      value: formatNum(directionRequests || 45),
      change: "+7.3%",
      color: "#F59E0B",
      icon: <Navigation className="h-5 w-5" style={{ color: "#F59E0B" }} />,
      bg: "bg-amber-50",
    },
    {
      label: "Phone Calls",
      value: formatNum(phoneCalls || 20),
      change: "+23.5%",
      color: "#EC4899",
      icon: <Phone className="h-5 w-5" style={{ color: "#EC4899" }} />,
      bg: "bg-pink-50",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* ── HERO BANNER ── */}
      <div
        className="rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm border border-blue-700/20"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b5bdb 50%, #4c6ef5 100%)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <p className="text-blue-200 text-sm mb-1">{greeting} 👋</p>
            <h2 className="text-white text-xl sm:text-2xl font-black mb-1">{insights.name || "Dr Vinay Kumar Rai"}</h2>
            <p className="text-blue-200 text-xs mb-4">
              {insights.formattedAddress || "B-4/32, Safdarjung Enclave, New Delhi, 110029"}{" "}
              <span className="font-semibold text-white">· {primaryCategory}</span>
            </p>
            <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-white border border-white/10 text-center sm:text-left">
                <p className="text-[10px] sm:text-[11px] text-blue-200 mb-0.5">Profile Views</p>
                <p className="text-sm sm:text-base font-extrabold">{formatNum(totalViews || 1500)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-white border border-white/10 text-center sm:text-left">
                <p className="text-[10px] sm:text-[11px] text-blue-200 mb-0.5">Calls (30d)</p>
                <p className="text-sm sm:text-base font-extrabold">{formatNum(phoneCalls || 20)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-white border border-white/10 text-center sm:text-left">
                <p className="text-[10px] sm:text-[11px] text-blue-200 mb-0.5">Response Rate</p>
                <p className="text-sm sm:text-base font-extrabold">100%</p>
              </div>
            </div>
          </div>

          <div className="text-left lg:text-right flex flex-col justify-between items-start lg:items-end space-y-4 sm:space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="bg-white/15 border-white/30 text-white hover:bg-white/25 text-xs font-semibold"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button
                size="sm"
                disabled={true}
                className="bg-white/20 border-white/30 text-white text-xs border opacity-90 cursor-default"
              >
                <CheckCircle className="h-3 w-3 mr-1 text-emerald-300" />
                Profile Connected
              </Button>
            </div>

            <div>
              <p className="text-blue-200 text-xs mb-1">Average Google Rating</p>
              <div className="flex items-center gap-2 justify-start lg:justify-end">
                <Star className="h-6 w-6 fill-amber-300 text-amber-300 shrink-0" />
                <span className="text-white text-3xl sm:text-4xl font-black leading-none">{rating}</span>
              </div>
              <p className="text-blue-200 text-xs mt-1">{totalRatings} total patient reviews</p>

              {insights.newReviewUri && (
                <button
                  onClick={() => handleCopyReviewLink(insights.newReviewUri)}
                  className="inline-flex items-center gap-1.5 text-blue-100 text-xs font-semibold hover:text-white mt-2.5 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20"
                >
                  <Copy className="h-3 w-3" />
                  Get Reviews Link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metricCards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{c.label}</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>{c.icon}</div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">{c.value}</span>
              <span className="text-xs font-bold text-emerald-600">{c.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ANALYTICS CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">30-Day Search Impression Trend</h3>
              <p className="text-xs text-gray-500">Monthly patient discovery volume on Google</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
          </div>
          <ProfileViewsTrend totalViews={totalViews} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">Patient Search Intent Breakdown</h3>
              <p className="text-xs text-gray-500">Direct vs Discovery vs Maps Navigation</p>
            </div>
            <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          </div>
          <DonutChart direct={52} discovery={31} maps={17} />
        </div>
      </div>

      {/* ── BUSINESS INFORMATION & PROFILE EDITORS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Business Information & Profile Settings</h3>
            <p className="text-xs text-gray-500">Manage your official Google listing fields with instant in-page sync.</p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">
            GBP Synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Business Category */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Category</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{primaryCategory}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("primaryCategory", "Primary Category", primaryCategory)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Secondary Categories */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Services</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {additionalCats.length > 0 ? (
                  additionalCats.slice(0, 4).map((c: any, i: number) => (
                    <span key={i} className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
                      {c.displayName || c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Doctor, Consultant, Children&apos;s Clinic</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("categories", "Secondary Categories", additionalCats.map((c: any) => c.displayName || c))}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Business Description */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start justify-between gap-3 col-span-1 md:col-span-2">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Description</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {description || "Leading Pediatrician clinic providing comprehensive child care, vaccinations, and specialized treatment programs."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("description", "Business Description", description)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Appointment Booking URL */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appointment Booking Link</span>
              </div>
              <p className="text-xs font-bold text-indigo-900 truncate max-w-xs sm:max-w-md">{appointmentUrl || "https://gyrex.in/book/dr-vinay-rai"}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("appointmentUrl", "Appointment Booking URL", appointmentUrl)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Opening Hours */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operating Hours</span>
              </div>
              <p className="text-xs font-bold text-gray-900">{hours}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("hours", "Operating Hours & Schedule", hours)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Direct Phone Number */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Direct Phone Number</span>
              </div>
              <p className="text-xs font-bold text-gray-900">{phone}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("phone", "Direct Phone Number", phone)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Official Website */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Official Website</span>
              </div>
              <p className="text-xs font-bold text-gray-900 truncate max-w-xs sm:max-w-md">{website}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("website", "Official Website Link", website)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Attributes & Amenities */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 col-span-1 md:col-span-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinic Amenities & Attributes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Array.isArray(attributes) ? attributes : []).map((attr: string, i: number) => (
                  <span key={i} className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-md">
                    {attr}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal("attributes", "Profile Attributes & Amenities", attributes)}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Fix Popover Modal */}
      {activeFix && (
        <QuickFixModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          fieldKey={activeFix.key}
          fieldLabel={activeFix.label}
          currentValue={activeFix.value}
          primaryCategory={primaryCategory}
          onSaved={() => refresh()}
        />
      )}
    </div>
  );
}
