"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  Loader2, IndianRupee, Users, TrendingUp, Copy, LogOut, 
  CheckCircle, AlertTriangle, FileText, Building, MessageSquare, 
  Mail, Share2, Wallet, Clock, Sparkles, Check, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function AffiliateDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [bankDetails, setBankDetails] = useState({ 
    accountName: "", 
    accountNumber: "", 
    bankName: "", 
    ifscCode: "",
    upiId: "",
    panNumber: "",
    routingNumber: "" 
  });
  const [kycDocUrl, setKycDocUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Payout Request State
  const [isPayoutRequestModalOpen, setIsPayoutRequestModalOpen] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  const formatINR = (val: number) => 
    `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/affiliates/login");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "AFFILIATE" && session?.user?.role !== "SALES") {
        redirect("/"); // Unauthorized
      } else {
        fetchDashboardData();
      }
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/affiliates/me");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.profile.bankDetails) {
          setBankDetails({
            accountName: json.profile.bankDetails.accountName || "",
            accountNumber: json.profile.bankDetails.accountNumber || "",
            bankName: json.profile.bankDetails.bankName || "",
            ifscCode: json.profile.bankDetails.ifscCode || json.profile.bankDetails.routingNumber || "",
            upiId: json.profile.bankDetails.upiId || "",
            panNumber: json.profile.bankDetails.panNumber || "",
            routingNumber: json.profile.bankDetails.routingNumber || json.profile.bankDetails.ifscCode || "",
          });
        }
        if (json.profile.kycDocuments && json.profile.kycDocuments.url) {
          setKycDocUrl(json.profile.kycDocuments.url);
        }
      } else {
        toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/affiliates/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankDetails: {
            ...bankDetails,
            routingNumber: bankDetails.ifscCode || bankDetails.routingNumber,
          },
          kycDocuments: kycDocUrl ? { url: kycDocUrl } : null
        }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Your banking & KYC details have been updated." });
        fetchDashboardData();
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPayout = async () => {
    setIsRequestingPayout(true);
    try {
      const res = await fetch("/api/affiliates/payout-request", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        toast({ title: "Payout Requested! 🎉", description: json.message });
        setIsPayoutRequestModalOpen(false);
        fetchDashboardData();
      } else {
        throw new Error(json.error || "Failed to submit payout request");
      }
    } catch (e: any) {
      toast({ title: "Request Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const copyLink = (type: "register" | "home" = "register") => {
    if (data?.profile?.affiliateCode) {
      const path = type === "register" ? "/register" : "";
      const link = `${window.location.origin}${path}?ref=${data.profile.affiliateCode}`;
      navigator.clipboard.writeText(link);
      toast({ 
        title: "Link Copied!", 
        description: type === "register" 
          ? "Direct registration link copied to clipboard." 
          : "Homepage referral link copied to clipboard." 
      });
    }
  };

  const copySwipe = (title: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Swipe Copy Ready! 📋", 
      description: `${title} copied to clipboard with your referral link included.` 
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const partnerRefCode = data.profile?.affiliateCode || "PARTNER";
  const partnerHomeLink = typeof window !== "undefined" 
    ? `${window.location.origin}/?ref=${partnerRefCode}` 
    : `https://gyrex.in/?ref=${partnerRefCode}`;

  // Pre-compiled doctor pitch swipe files
  const swipeFiles = [
    {
      id: "whatsapp-receptionist",
      title: "WhatsApp Pitch: 24/7 Practice Receptionist",
      icon: MessageSquare,
      badge: "High Response Rate",
      description: "Pitch focused on missed patient calls after clinic hours and automated OPD appointment booking.",
      content: `Namaste Dr. [Doctor Name],

Quick question: How many patient appointment queries does your clinic miss after 8 PM or on Sundays?

Most practices lose 30-40% of potential patients simply because reception is closed. Gyrex provides a 24/7 WhatsApp Practice Receptionist that connects to your existing number via QR code, answers patient queries in 6+ Indian languages, and books appointments directly into your clinic schedule.

Take a quick look at the live simulator:
${partnerHomeLink}

Can we schedule a quick 5-minute live preview for your clinic?`
    },
    {
      id: "whatsapp-maps",
      title: "WhatsApp Pitch: 5×5 Google Maps Geo-Rank",
      icon: TrendingUp,
      badge: "Local SEO Focus",
      description: "Pitch for doctors losing patients to competitors outside their immediate neighborhood street.",
      content: `Hello Dr. [Doctor Name],

When patients in your neighborhood search for a [Specialty, e.g. Dermatologist / Pediatrician / Dental Clinic] on Google Maps, does your clinic show up in the Top 3?

Google data shows 70% of patient calls go exclusively to the top 3 listings. Gyrex gives your practice a 5×5 neighborhood visibility heatmap to identify where competitors are winning, plus an automated WhatsApp review collector that boosts 5-star Google reviews.

You can run a free 60-second clinic audit here:
${partnerHomeLink}

Happy to share a tailored local visibility audit for your clinic!`
    },
    {
      id: "email-formal",
      title: "Email Proposal: Practice Growth Platform",
      icon: Mail,
      badge: "Formal / Hospital Proposal",
      description: "Comprehensive introduction email suitable for hospital directors, polyclinics, and senior doctors.",
      content: `Subject: Modernizing patient acquisition & 24/7 WhatsApp reception for [Clinic Name]

Dear Dr. [Doctor Name],

I hope this email finds you well.

I am writing to introduce Gyrex (gyrex.in), India's dedicated practice growth platform built exclusively for doctors and specialty clinics.

Gyrex helps practices address three primary operational bottlenecks:
1. 24/7 WhatsApp Practice Receptionist: Answers patient inquiries, explains clinical procedures, and books OPD consultations around the clock via QR connection.
2. 5×5 Google Maps Geo-Rank Domination: Tracks patient discovery across a 5km radius to maintain #1 neighborhood rankings.
3. Automated 5-Star Reviews: Sends automated post-consultation WhatsApp feedback requests to build an authoritative Google rating.

Clinics typically see a 30-50% increase in patient appointment confirmations within 30 days.

You can explore a live demonstration and start a 14-day free trial here:
${partnerHomeLink}

Would you be open to a brief 10-minute online walkthrough this week?

Warm regards,
${data.profile.name}
Gyrex Practice Growth Partner`
    },
    {
      id: "social-share",
      title: "LinkedIn & WhatsApp Status Copy",
      icon: Share2,
      badge: "Social Media",
      description: "Short copy for posting on WhatsApp Status, LinkedIn, or medical practitioner groups.",
      content: `Doctors spend years building clinical excellence, but still lose patient consultations because their clinic reception doesn't respond after hours or their Google Maps profile isn't ranking in neighboring localities.

Gyrex gives doctors:
• 24/7 WhatsApp Practice Receptionist (no staff needed)
• 5×5 Google Maps Local Search Heatmap
• Custom Specialty Clinic Websites (20 Medical Presets)
• Automated 5-Star Google Review Growth

Try the interactive practice simulator here:
${partnerHomeLink}`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Partner Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">{data.profile.name}</span>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/affiliates/login" })}>
              <LogOut className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back. Here is your latest performance data.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-1.5 flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gray-50 rounded text-xs sm:text-sm font-mono text-gray-600 border border-gray-100 flex-1 min-w-[200px] max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap">
                {typeof window !== "undefined" ? window.location.origin : "https://gyrex.in"}/register?ref={data.profile.affiliateCode}
              </div>
              <Button onClick={() => copyLink("register")} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-3 text-xs sm:text-sm whitespace-nowrap">
                <Copy className="h-4 w-4 mr-1.5" /> Direct Register Link
              </Button>
            </div>
            <Button variant="outline" onClick={() => copyLink("home")} className="border-gray-200 hover:bg-gray-50 h-[46px] px-3 text-xs sm:text-sm whitespace-nowrap">
              <Copy className="h-4 w-4 mr-1.5" /> Homepage Link
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm w-full sm:w-auto h-auto p-1 overflow-x-auto flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4 font-medium text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4 font-medium text-sm">
              My Referrals
            </TabsTrigger>
            <TabsTrigger value="marketing" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4 font-medium text-sm flex items-center gap-1.5">
              <span>Marketing Kit (Swipe Files)</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                NEW
              </span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4 font-medium text-sm">
              Payout History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4 font-medium text-sm">
              Bank &amp; KYC Settings
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-6">
            {data.profile.kycStatus === "PENDING" && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Action Required: KYC Pending</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Your KYC verification is currently pending. You can still refer clinics, but payouts will be held until your documents and bank details are approved.
                  </p>
                </div>
              </div>
            )}

            {/* Payout Status Banner */}
            {data.metrics.hasPendingPayoutRequest ? (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Payout Request Under Review</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Your payout request for <span className="font-bold">{formatINR(data.metrics.pendingPayoutRequestAmount)}</span> is being processed by our accounts team for direct NEFT/UPI transfer.
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>
              </div>
            ) : data.metrics.pendingPayout >= 1000 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Withdrawal Available</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You have <span className="font-bold">{formatINR(data.metrics.pendingPayout)}</span> ready for withdrawal (min ₹1,000 threshold reached).
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsPayoutRequestModalOpen(true)} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold text-xs h-9 px-4 whitespace-nowrap"
                >
                  <Wallet className="w-4 h-4 mr-1.5" /> Request Payout
                </Button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Threshold for withdrawal is ₹1,000. Balance: <span className="font-bold text-slate-900">{formatINR(data.metrics.pendingPayout)}</span>.</span>
                </div>
                <span className="text-slate-500 font-medium">Auto-settled on the 1st of every month via NEFT/UPI</span>
              </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Commission Rate</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.profile.commissionPercentage}%</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Signups</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.metrics.totalSignups}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatINR(data.metrics.totalEarnings)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-100 ring-1 ring-indigo-50 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Pending Payout</p>
                      <h3 className="text-3xl font-bold text-indigo-900 mt-2">{formatINR(data.metrics.pendingPayout)}</h3>
                    </div>
                    <div className="p-3 bg-indigo-600 rounded-full text-white">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── REFERRALS TAB ── */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>My Referrals</CardTitle>
                <CardDescription>A list of all clinics that registered using your affiliate link, with live subscription statuses.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <th className="px-4 py-3 font-medium">Clinic Name</th>
                        <th className="px-4 py-3 font-medium">Contact Person</th>
                        <th className="px-4 py-3 font-medium">Joined Date</th>
                        <th className="px-4 py-3 font-medium">Subscription Status</th>
                        <th className="px-4 py-3 font-medium">Current Package</th>
                        <th className="px-4 py-3 font-medium text-right">Revenue Generated</th>
                        <th className="px-4 py-3 font-medium text-right">Your Cut ({data.profile.commissionPercentage}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.referrals.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">No referrals yet. Share your link or use the Marketing Kit to get started!</td>
                        </tr>
                      ) : (
                        data.referrals.map((ref: any) => (
                          <tr key={ref.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{ref.clinicName || "Unknown"}</td>
                            <td className="px-4 py-3 text-gray-600">{ref.name}</td>
                            <td className="px-4 py-3 text-gray-600">{new Date(ref.dateJoined).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <Badge className={
                                ref.status === "Active (Paid)" 
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : ref.status === "14-Day Free Trial"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : ref.status === "Past Due"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }>
                                {ref.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">
                                {ref.package} {ref.billingPeriod ? `(${ref.billingPeriod})` : ""}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatINR(ref.revenue)}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatINR(ref.revenue * (data.profile.commissionPercentage/100))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MARKETING KIT (SWIPE FILES) TAB ── */}
          <TabsContent value="marketing" className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> High-Converting Pitch Templates
                </div>
                <h2 className="text-xl font-bold">Doctor Outreach Swipe Files</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Copy and send these proven messages directly to doctors, hospital managers, and clinic administrators. Your referral link is automatically embedded.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
                <span className="text-slate-400 block font-medium">Your Active Referral Link:</span>
                <span className="font-mono text-indigo-300 font-bold text-xs truncate max-w-[260px] block mt-0.5">
                  {partnerHomeLink}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {swipeFiles.map((swipe) => {
                const IconComponent = swipe.icon;
                return (
                  <Card key={swipe.id} className="border-slate-200 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <CardTitle className="text-base font-bold text-slate-900">{swipe.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px] uppercase font-bold shrink-0">
                          {swipe.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-500">
                        {swipe.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {swipe.content}
                      </div>

                      <Button 
                        onClick={() => copySwipe(swipe.title, swipe.content)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 shadow-sm"
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy Message with My Link
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Doctor Objection Handling Cheat Sheet */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  Doctor Objection Handling Cheat Sheet
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Quick answers to common questions doctors ask before onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-900 mb-1">&quot;Do I need to change my clinic WhatsApp number?&quot;</h5>
                    <p className="text-slate-600">No. Gyrex connects directly to your existing WhatsApp Business number via standard QR code sync. All existing chats remain intact.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-900 mb-1">&quot;Is any technical or coding skill required?&quot;</h5>
                    <p className="text-slate-600">Zero coding required. Gyrex provides 20 ready-to-launch medical presets. The clinic can launch their specialty website and rank tracker in 2 minutes.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-900 mb-1">&quot;Can I connect my own custom domain (e.g. drname.com)?&quot;</h5>
                    <p className="text-slate-600">Yes. Custom domains connect in 1 click with automated free SSL certificates and high-speed cloud CDN hosting included.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-900 mb-1">&quot;Can I test it before committing?&quot;</h5>
                    <p className="text-slate-600">Yes. Every new doctor receives a 14-day free trial with full feature access and money-back guarantee, allowing them to verify patient results first.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PAYOUTS TAB ── */}
          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Record of all commission payments sent to your bank account or UPI.</CardDescription>
                </div>
                {data.metrics.pendingPayout >= 1000 && !data.metrics.hasPendingPayoutRequest && (
                  <Button 
                    onClick={() => setIsPayoutRequestModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 shrink-0 shadow-sm"
                  >
                    <Wallet className="w-4 h-4 mr-1.5" /> Request Payout ({formatINR(data.metrics.pendingPayout)})
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <th className="px-4 py-3 font-medium">Date Initiated</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Reference ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.payouts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">No payouts have been processed yet.</td>
                        </tr>
                      ) : (
                        data.payouts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{formatINR(p.amount)}</td>
                            <td className="px-4 py-3">
                              <Badge className={
                                p.status === "PAID" 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                              }>
                                {p.status === "PAID" ? "Settled" : "Pending Review"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.referenceId || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SETTINGS TAB ── */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Bank Details</CardTitle>
                  <CardDescription>Where should we send your commission payouts?</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveSettings} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input 
                        value={bankDetails.accountName} 
                        onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} 
                        placeholder="Dr. / Partner Full Legal Name"
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input 
                          value={bankDetails.bankName} 
                          onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} 
                          placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input 
                          value={bankDetails.accountNumber} 
                          onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} 
                          placeholder="Bank Account Number"
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank IFSC Code</Label>
                        <Input 
                          value={bankDetails.ifscCode} 
                          onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase(), routingNumber: e.target.value.toUpperCase()})} 
                          placeholder="e.g. HDFC0001234"
                          required 
                        />
                        <p className="text-xs text-gray-500">11-character Indian Financial System Code</p>
                      </div>
                      <div className="space-y-2">
                        <Label>UPI ID (Optional)</Label>
                        <Input 
                          value={bankDetails.upiId} 
                          onChange={e => setBankDetails({...bankDetails, upiId: e.target.value})} 
                          placeholder="e.g. partner@okhdfcbank"
                        />
                        <p className="text-xs text-gray-500">For fast instant settlement</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>PAN / Tax ID (Optional)</Label>
                      <Input 
                        value={bankDetails.panNumber} 
                        onChange={e => setBankDetails({...bankDetails, panNumber: e.target.value.toUpperCase()})} 
                        placeholder="e.g. ABCDE1234F"
                      />
                      <p className="text-xs text-gray-500">For TDS compliance & invoice generation</p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 mt-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> KYC Document</h4>
                      <div className="space-y-2">
                        <Label>Link to KYC Document (Aadhaar / PAN / Cancelled Cheque)</Label>
                        <Input placeholder="https://drive.google.com/..." value={kycDocUrl} onChange={e => setKycDocUrl(e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Please provide a Google Drive / cloud link to your ID or cancelled cheque for bank verification.</p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-6" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      {isSaving ? "Saving..." : "Save Details"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div>
                <Card className="bg-indigo-50 border-indigo-100">
                  <CardHeader>
                    <CardTitle className="text-indigo-900">Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-50">
                        <span className="text-sm font-medium text-gray-700">KYC Status</span>
                        <Badge className={
                          data.profile.kycStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : 
                          data.profile.kycStatus === "REJECTED" ? "bg-red-100 text-red-700" : 
                          "bg-amber-100 text-amber-700"
                        }>
                          {data.profile.kycStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 leading-relaxed">
                        To receive payouts, you must complete your bank details and submit valid KYC documents. Once submitted, our team will review and approve your account for automated commission payouts.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── PAYOUT REQUEST MODAL ── */}
      <Dialog open={isPayoutRequestModalOpen} onOpenChange={setIsPayoutRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Confirm Payout Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your pending earnings will be queued for manual/direct transfer to your verified account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <span className="text-xs text-emerald-700 font-medium block">Total Withdrawal Amount</span>
              <span className="text-3xl font-black text-emerald-900 mt-1 block">
                {formatINR(data.metrics.pendingPayout)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Settlement Account on File:</p>
              {bankDetails.accountNumber ? (
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-medium text-slate-700">Holder:</span> {bankDetails.accountName || "N/A"}</p>
                  <p><span className="font-medium text-slate-700">Bank:</span> {bankDetails.bankName || "N/A"}</p>
                  <p><span className="font-medium text-slate-700">Account:</span> {bankDetails.accountNumber}</p>
                  <p><span className="font-medium text-slate-700">IFSC:</span> {bankDetails.ifscCode || "N/A"}</p>
                  {bankDetails.upiId && <p><span className="font-medium text-slate-700">UPI ID:</span> {bankDetails.upiId}</p>}
                </div>
              ) : (
                <p className="text-amber-700">No bank details added yet. Please fill Bank Settings before requesting.</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Payouts are verified against doctor subscription invoices and transferred within 24-48 business hours via NEFT or UPI.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPayoutRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPayout} 
              disabled={isRequestingPayout || !bankDetails.accountNumber}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isRequestingPayout ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
