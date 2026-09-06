"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  Loader2, 
  IndianRupee, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle, 
  FileText, 
  Download, 
  Plus, 
  Settings, 
  Eye,
  Copy,
  Check,
  Users,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ArrowDownToLine,
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type FilterTab = "ALL" | "PAYOUT_REQUESTED" | "KYC_PENDING" | "ACTIVE";

export default function AffiliatesPage() {
  const { data: session, status } = useSession();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formatINR = (val: number) => 
    `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: "Copied", description: `Copied ${text} to clipboard.` });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Modals state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ amount: "", referenceId: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", commission: "20" });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ commission: "", kycStatus: "" });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("overview");

  useEffect(() => {
    if (status === "authenticated") {
      if (!session?.user?.role || !["SUPERADMIN", "ACCOUNTS"].includes(session.user.role)) {
        redirect("/");
      } else {
        fetchAffiliates();
      }
    } else if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status, session]);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load affiliates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalPartners = affiliates.length;
    let totalPendingSettlements = 0;
    let totalPaidOut = 0;
    let payoutRequestsCount = 0;
    let kycPendingCount = 0;
    let activePartnersCount = 0;

    affiliates.forEach(a => {
      totalPendingSettlements += (a.pendingPayout || 0);
      totalPaidOut += (a.totalPaidOut || 0);
      if (a.pendingPayoutRequest) payoutRequestsCount++;
      if (a.kycStatus !== "APPROVED" || !a.hasBankingDetails) kycPendingCount++;
      if ((a.referredDoctors?.length || 0) > 0 || (a.totalEarnings || 0) > 0) activePartnersCount++;
    });

    return {
      totalPartners,
      totalPendingSettlements,
      totalPaidOut,
      payoutRequestsCount,
      kycPendingCount,
      activePartnersCount
    };
  }, [affiliates]);

  // Filtered List
  const filteredAffiliates = useMemo(() => {
    return affiliates.filter(a => {
      const matchesSearch = 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affiliateCode?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "PAYOUT_REQUESTED") {
        return Boolean(a.pendingPayoutRequest);
      }
      if (activeTab === "KYC_PENDING") {
        return a.kycStatus !== "APPROVED" || !a.hasBankingDetails;
      }
      if (activeTab === "ACTIVE") {
        return (a.referredDoctors?.length || 0) > 0 || (a.totalEarnings || 0) > 0;
      }

      return true;
    });
  }, [affiliates, searchTerm, activeTab]);

  // Bulk CSV Export for Banking/UPI Settlements
  const handleExportPendingPayoutsCSV = () => {
    const pendingAffiliates = affiliates.filter(a => (a.pendingPayout || 0) > 0 || a.pendingPayoutRequest);

    if (pendingAffiliates.length === 0) {
      toast({ title: "No Pending Payouts", description: "All affiliate accounts are currently settled." });
      return;
    }

    const headers = [
      "Beneficiary Name",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "UPI ID",
      "Payable Amount (INR)",
      "PAN Number",
      "Affiliate Code",
      "Partner Email",
      "Request Date",
      "Payout Status"
    ];

    const rows = pendingAffiliates.map(a => {
      const bank = a.bankDetails || {};
      const pendingReq = a.pendingPayoutRequest;
      const payableAmount = pendingReq ? pendingReq.amount : a.pendingPayout;
      const requestDate = pendingReq ? new Date(pendingReq.createdAt).toISOString().split("T")[0] : "";

      return [
        `"${(bank.accountName || a.name || "").replace(/"/g, '""')}"`,
        `"${(bank.bankName || "").replace(/"/g, '""')}"`,
        `"${(bank.accountNumber || "").replace(/"/g, '""')}"`,
        `"${(bank.ifscCode || bank.routingNumber || "").replace(/"/g, '""')}"`,
        `"${(bank.upiId || "").replace(/"/g, '""')}"`,
        payableAmount.toFixed(2),
        `"${(bank.panNumber || "").replace(/"/g, '""')}"`,
        `"${(a.affiliateCode || "").replace(/"/g, '""')}"`,
        `"${(a.email || "").replace(/"/g, '""')}"`,
        `"${requestDate}"`,
        `"${pendingReq ? "REQUESTED" : "UNSETTLED"}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `gyrex-pending-settlements-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "CSV Export Ready", 
      description: `Exported ${pendingAffiliates.length} pending settlement(s) for bank upload.` 
    });
  };

  // Full Partner Export
  const handleExportAllPartnersCSV = () => {
    if (affiliates.length === 0) return;

    const headers = [
      "Partner Name",
      "Email",
      "Role",
      "Affiliate Code",
      "Commission %",
      "KYC Status",
      "Bank Account Name",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "UPI ID",
      "PAN Number",
      "Referred Clinics",
      "Total Revenue Generated (INR)",
      "Total Commission Earned (INR)",
      "Total Paid Out (INR)",
      "Pending Balance (INR)",
      "Payout Request Pending"
    ];

    const rows = affiliates.map(a => {
      const bank = a.bankDetails || {};
      return [
        `"${(a.name || "").replace(/"/g, '""')}"`,
        `"${(a.email || "").replace(/"/g, '""')}"`,
        `"${(a.role || "").replace(/"/g, '""')}"`,
        `"${(a.affiliateCode || "").replace(/"/g, '""')}"`,
        a.commissionPercentage || 20,
        `"${a.kycStatus || "PENDING"}"`,
        `"${(bank.accountName || "").replace(/"/g, '""')}"`,
        `"${(bank.bankName || "").replace(/"/g, '""')}"`,
        `"${(bank.accountNumber || "").replace(/"/g, '""')}"`,
        `"${(bank.ifscCode || bank.routingNumber || "").replace(/"/g, '""')}"`,
        `"${(bank.upiId || "").replace(/"/g, '""')}"`,
        `"${(bank.panNumber || "").replace(/"/g, '""')}"`,
        a.referredDoctors?.length || 0,
        (a.totalRevenueGenerated || 0).toFixed(2),
        (a.totalEarnings || 0).toFixed(2),
        (a.totalPaidOut || 0).toFixed(2),
        (a.pendingPayout || 0).toFixed(2),
        a.pendingPayoutRequest ? "YES" : "NO"
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `gyrex-partners-roster-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export Complete", description: `Exported ${affiliates.length} partner records.` });
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "payout",
          affiliateId: selectedAffiliate.id,
          amount: payoutForm.amount,
          referenceId: payoutForm.referenceId,
          notes: payoutForm.notes,
        }),
      });

      if (res.ok) {
        toast({ title: "Settlement Recorded", description: `Recorded settlement of ₹${payoutForm.amount} for ${selectedAffiliate.name}.` });
        setIsPayoutModalOpen(false);
        setPayoutForm({ amount: "", referenceId: "", notes: "" });
        fetchAffiliates();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to record payout.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "System error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...addForm
        }),
      });

      if (res.ok) {
        toast({ title: "Partner Created", description: `Affiliate ${addForm.name} created successfully.` });
        setIsAddModalOpen(false);
        setAddForm({ name: "", email: "", password: "", commission: "20" });
        fetchAffiliates();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to add affiliate.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "System error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.id,
          ...settingsForm
        }),
      });

      if (res.ok) {
        toast({ title: "Settings Saved", description: "Affiliate settings updated successfully." });
        setIsSettingsModalOpen(false);
        fetchAffiliates();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to update settings.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "System error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayoutModal = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    const pendingRequest = affiliate.pendingPayoutRequest;
    const amountToSettle = pendingRequest ? pendingRequest.amount : affiliate.pendingPayout;
    setPayoutForm({ 
      amount: (amountToSettle || 0).toFixed(2), 
      referenceId: "", 
      notes: pendingRequest ? `Settling withdrawal request #${pendingRequest.id?.slice(-6)}` : "Settled via NEFT / UPI" 
    });
    setIsPayoutModalOpen(true);
  };

  const openDetailsModal = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setDetailsTab("overview");
    setIsDetailsModalOpen(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-teal-600" />
            Partner & Affiliate Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track clinic signups, verify banking KYC, manage commissions, and process bulk bank settlements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={handleExportAllPartnersCSV} 
            className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5 text-gray-500" />
            Export All (CSV)
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Partners</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summaryMetrics.totalPartners}</p>
          <p className="text-xs text-gray-500 mt-1">
            {summaryMetrics.activePartnersCount} active with referrals
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Settlements</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {formatINR(summaryMetrics.totalPendingSettlements)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Payable partner commissions
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout Requests</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${summaryMetrics.payoutRequestsCount > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-gray-100 text-gray-500"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            {summaryMetrics.payoutRequestsCount}
            {summaryMetrics.payoutRequestsCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Action Required</Badge>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Submitted by partners
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Settled</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatINR(summaryMetrics.totalPaidOut)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Lifetime bank / UPI payouts
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Tabs & Search Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "ALL" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All Partners ({affiliates.length})
            </button>
            <button
              onClick={() => setActiveTab("PAYOUT_REQUESTED")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "PAYOUT_REQUESTED" 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : summaryMetrics.payoutRequestsCount > 0 
                    ? "bg-amber-50 text-amber-800 border border-amber-300 font-semibold" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Payout Requested
              {summaryMetrics.payoutRequestsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === "PAYOUT_REQUESTED" ? "bg-white text-amber-700" : "bg-amber-200 text-amber-900"}`}>
                  {summaryMetrics.payoutRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("KYC_PENDING")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "KYC_PENDING" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Bank / KYC Pending ({summaryMetrics.kycPendingCount})
            </button>
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "ACTIVE" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Active ({summaryMetrics.activePartnersCount})
            </button>
          </div>

          {/* Search & Bulk Export Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search name, email, code..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button
              onClick={handleExportPendingPayoutsCSV}
              variant="outline"
              size="sm"
              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-50 font-medium whitespace-nowrap text-xs shadow-sm"
              title="Download NEFT / UPI batch upload CSV for all pending payouts"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Export Payouts (CSV)
            </Button>
          </div>
        </div>

        {/* Partners Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs">
              <tr>
                <th className="px-6 py-3.5">Partner</th>
                <th className="px-6 py-3.5">Banking & KYC</th>
                <th className="px-6 py-3.5">Referred Clinics</th>
                <th className="px-6 py-3.5">Total Earned</th>
                <th className="px-6 py-3.5">Pending Settlement</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <p className="font-medium text-gray-700">No partners found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filter tab.</p>
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((affiliate) => {
                  const hasPendingReq = Boolean(affiliate.pendingPayoutRequest);
                  const bank = affiliate.bankDetails || {};
                  const activeDocs = affiliate.referredDoctors?.filter((d: any) => d.status === "Active (Paid)").length || 0;

                  return (
                    <tr key={affiliate.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Partner Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm">
                            {affiliate.name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{affiliate.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-600">
                                {affiliate.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span>{affiliate.email}</span>
                              <span>•</span>
                              <code className="bg-gray-100 text-teal-800 px-1 py-0.2 rounded font-mono text-[11px]">
                                {affiliate.affiliateCode || "NO-CODE"}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Banking & KYC Column */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge className={
                              affiliate.kycStatus === "APPROVED" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" 
                                : affiliate.kycStatus === "REJECTED" 
                                ? "bg-red-50 text-red-700 border-red-200 text-[10px]" 
                                : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                            }>
                              KYC: {affiliate.kycStatus || "PENDING"}
                            </Badge>

                            {affiliate.hasBankingDetails ? (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" /> Bank / UPI Ready
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">
                                No Bank Info
                              </Badge>
                            )}
                          </div>
                          {bank.upiId ? (
                            <p className="text-[11px] text-gray-500 font-mono">UPI: {bank.upiId}</p>
                          ) : bank.accountNumber ? (
                            <p className="text-[11px] text-gray-500">
                              {bank.bankName || "Bank"} ••{bank.accountNumber.slice(-4)}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* Referred Signups */}
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">
                          {affiliate.referredDoctors?.length || 0} clinics
                        </div>
                        <div className="text-xs text-gray-500">
                          {activeDocs} paid subscriptions
                        </div>
                      </td>

                      {/* Total Earned */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{formatINR(affiliate.totalEarnings)}</p>
                        <p className="text-xs text-gray-500">{affiliate.commissionPercentage || 20}% share</p>
                      </td>

                      {/* Pending Settlement */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 text-base">
                            {formatINR(affiliate.pendingPayout)}
                          </span>
                          {hasPendingReq && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] animate-pulse w-fit">
                              Requested: ₹{affiliate.pendingPayoutRequest.amount?.toLocaleString("en-IN")}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2.5 text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={() => openDetailsModal(affiliate)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setSettingsForm({ 
                                commission: affiliate.commissionPercentage?.toString() || "20",
                                kycStatus: affiliate.kycStatus || "PENDING"
                              });
                              setIsSettingsModalOpen(true);
                            }}
                            title="Edit commission & KYC status"
                          >
                            <Settings className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          {hasPendingReq ? (
                            <Button 
                              size="sm" 
                              className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
                              onClick={() => openPayoutModal(affiliate)}
                            >
                              Settle Request
                            </Button>
                          ) : affiliate.pendingPayout > 0 ? (
                            <Button 
                              size="sm" 
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm" 
                              onClick={() => openPayoutModal(affiliate)}
                            >
                              Record Payout
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled className="h-8 px-2.5 text-xs text-gray-400">
                              Settled
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedAffiliate?.name}
                  <Badge variant="outline" className="text-xs text-teal-800 border-teal-200 bg-teal-50">
                    {selectedAffiliate?.role}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  {selectedAffiliate?.email} • Code: <span className="font-mono font-bold text-gray-900">{selectedAffiliate?.affiliateCode}</span> • Rate: <span className="font-bold text-teal-700">{selectedAffiliate?.commissionPercentage || 20}%</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAffiliate && (
            <div className="space-y-6 pt-2">
              <Tabs value={detailsTab} onValueChange={setDetailsTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="overview" className="text-xs">Overview & Bank</TabsTrigger>
                  <TabsTrigger value="clinics" className="text-xs">
                    Clinics ({selectedAffiliate.referredDoctors?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="text-xs">
                    Transactions ({selectedAffiliate.transactions?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="payouts" className="text-xs">
                    Payout Log ({selectedAffiliate.affiliatePayouts?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW & BANKING DETAILS */}
                <TabsContent value="overview" className="space-y-5 pt-4">
                  {/* Financial Snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-[11px] font-medium text-gray-500 uppercase">Referred Clinics</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{selectedAffiliate.referredDoctors?.length || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-[11px] font-medium text-gray-500 uppercase">Clinic Revenue</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatINR(selectedAffiliate.totalRevenueGenerated)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-[11px] font-medium text-gray-500 uppercase">Total Earned</p>
                      <p className="text-lg font-bold text-teal-700 mt-1">{formatINR(selectedAffiliate.totalEarnings)}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-[11px] font-semibold text-amber-800 uppercase">Pending Balance</p>
                      <p className="text-lg font-bold text-amber-700 mt-1">{formatINR(selectedAffiliate.pendingPayout)}</p>
                    </div>
                  </div>

                  {/* Indian Banking & UPI Details */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-teal-600" />
                        Indian Banking & UPI Details for Settlement
                      </h4>
                      <Badge className={
                        selectedAffiliate.kycStatus === "APPROVED" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" 
                          : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                      }>
                        KYC: {selectedAffiliate.kycStatus || "PENDING"}
                      </Badge>
                    </div>
                    <div className="p-4 bg-white">
                      {selectedAffiliate.bankDetails ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Beneficiary Name */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Beneficiary / Account Name</p>
                              <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedAffiliate.bankDetails.accountName || "N/A"}</p>
                            </div>
                            {selectedAffiliate.bankDetails.accountName && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.accountName, "accName")}
                              >
                                {copiedKey === "accName" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>

                          {/* Bank Name */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Bank Name</p>
                              <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedAffiliate.bankDetails.bankName || "N/A"}</p>
                            </div>
                            {selectedAffiliate.bankDetails.bankName && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.bankName, "bankName")}
                              >
                                {copiedKey === "bankName" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>

                          {/* Account Number */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Account Number</p>
                              <p className="text-sm font-mono font-bold text-gray-900 mt-0.5">{selectedAffiliate.bankDetails.accountNumber || "N/A"}</p>
                            </div>
                            {selectedAffiliate.bankDetails.accountNumber && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.accountNumber, "accNum")}
                              >
                                {copiedKey === "accNum" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>

                          {/* IFSC Code */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">IFSC Code</p>
                              <p className="text-sm font-mono font-bold text-gray-900 mt-0.5">
                                {selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber || "N/A"}
                              </p>
                            </div>
                            {(selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber, "ifsc")}
                              >
                                {copiedKey === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>

                          {/* UPI ID */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">UPI ID (Instant Transfer)</p>
                              <p className="text-sm font-mono font-semibold text-teal-700 mt-0.5">{selectedAffiliate.bankDetails.upiId || "Not provided"}</p>
                            </div>
                            {selectedAffiliate.bankDetails.upiId && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.upiId, "upi")}
                              >
                                {copiedKey === "upi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>

                          {/* PAN / Tax ID */}
                          <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">PAN / Tax ID (TDS Compliance)</p>
                              <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{selectedAffiliate.bankDetails.panNumber || "Not provided"}</p>
                            </div>
                            {selectedAffiliate.bankDetails.panNumber && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => copyToClipboard(selectedAffiliate.bankDetails.panNumber, "pan")}
                              >
                                {copiedKey === "pan" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">No banking details on file</p>
                          <p className="text-xs text-gray-400 mt-1">The partner has not yet submitted their bank or UPI information.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: REFERRED CLINICS */}
                <TabsContent value="clinics" className="pt-4">
                  {selectedAffiliate.referredDoctors && selectedAffiliate.referredDoctors.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="px-4 py-3">Clinic & Doctor</th>
                            <th className="px-4 py-3">Joined Date</th>
                            <th className="px-4 py-3">Subscription Status</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Revenue (₹)</th>
                            <th className="px-4 py-3 text-right">Commission (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedAffiliate.referredDoctors.map((doc: any) => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900">{doc.clinicName || "Unknown Clinic"}</p>
                                <p className="text-gray-500 text-[11px]">{doc.name} {doc.email ? `(${doc.email})` : ""}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {new Date(doc.dateJoined).toLocaleDateString("en-IN")}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={
                                  doc.status === "Active (Paid)" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" :
                                  doc.status === "14-Day Free Trial" ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]" :
                                  doc.status === "Past Due" ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]" :
                                  "bg-gray-100 text-gray-600 border-gray-200 text-[10px]"
                                }>
                                  {doc.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-700 font-medium">
                                {doc.package} <span className="text-gray-400 font-normal">({doc.billingPeriod})</span>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {formatINR(doc.revenue)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-teal-700">
                                {formatINR(doc.commission)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                      <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">No clinics referred yet</p>
                      <p className="text-xs text-gray-400 mt-1">When this partner refers doctors, their lifecycle and commission will appear here.</p>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: TRANSACTION LOG */}
                <TabsContent value="transactions" className="pt-4">
                  {selectedAffiliate.transactions && selectedAffiliate.transactions.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Clinic</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Transaction ID</th>
                            <th className="px-4 py-3">Amount Paid (₹)</th>
                            <th className="px-4 py-3 text-right">Partner Cut (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedAffiliate.transactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500">
                                {new Date(tx.date).toLocaleDateString("en-IN")}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {tx.clinicName}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {tx.packageName}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                                {tx.razorpayPaymentId || tx.id.slice(0, 10)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {formatINR(tx.amount)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-teal-700">
                                {formatINR(tx.commission)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">No subscription payments yet</p>
                      <p className="text-xs text-gray-400 mt-1">Transactions will appear as referred clinics renew or subscribe to paid plans.</p>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: SETTLEMENT LOG */}
                <TabsContent value="payouts" className="pt-4">
                  {selectedAffiliate.affiliatePayouts && selectedAffiliate.affiliatePayouts.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Amount (₹)</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Reference / UTR ID</th>
                            <th className="px-4 py-3 text-right">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedAffiliate.affiliatePayouts.map((p: any) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500">
                                {new Date(p.paidAt || p.createdAt).toLocaleDateString("en-IN")}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-900 text-sm">
                                {formatINR(p.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={p.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"}>
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-mono text-gray-700 font-medium">
                                {p.referenceId || "Pending Transfer"}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500">
                                {p.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">No settlements recorded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Recorded bank transfers and UPI payouts will be archived here.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record / Settle Payout Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {selectedAffiliate?.pendingPayoutRequest ? "Settle Payout Request" : "Record Bank Settlement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Transfer funds via NEFT/RTGS or UPI, then enter the transaction reference to complete the settlement.
            </DialogDescription>
          </DialogHeader>

          {selectedAffiliate && (
            <form onSubmit={handleRecordPayout} className="space-y-4 pt-2">
              {selectedAffiliate.pendingPayoutRequest && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Affiliate Withdrawal Requested:</span>
                    <p className="mt-0.5 text-amber-800">
                      Requested amount: <span className="font-bold">₹{selectedAffiliate.pendingPayoutRequest.amount?.toLocaleString("en-IN")}</span> on {new Date(selectedAffiliate.pendingPayoutRequest.createdAt).toLocaleDateString("en-IN")}.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Details on File with 1-Click Copy */}
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">Settlement Account</h4>
                  <span className="text-[11px] text-teal-700 font-medium">Click icon to copy</span>
                </div>

                {selectedAffiliate.bankDetails ? (
                  <div className="space-y-1.5 text-xs text-gray-700">
                    {selectedAffiliate.bankDetails.upiId && (
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">UPI ID</span>
                          <span className="font-mono font-bold text-teal-800">{selectedAffiliate.bankDetails.upiId}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0" 
                          onClick={() => copyToClipboard(selectedAffiliate.bankDetails.upiId, "modalUpi")}
                        >
                          {copiedKey === "modalUpi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Bank Account #</span>
                        <span className="font-mono font-bold text-gray-900">
                          {selectedAffiliate.bankDetails.accountNumber || "N/A"}
                        </span>
                        <span className="text-gray-400 ml-1 text-[11px]">
                          ({selectedAffiliate.bankDetails.bankName || "Bank"})
                        </span>
                      </div>
                      {selectedAffiliate.bankDetails.accountNumber && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0" 
                          onClick={() => copyToClipboard(selectedAffiliate.bankDetails.accountNumber, "modalAcc")}
                        >
                          {copiedKey === "modalAcc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </Button>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">IFSC Code</span>
                        <span className="font-mono font-bold text-gray-900">
                          {selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber || "N/A"}
                        </span>
                      </div>
                      {(selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber) && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0" 
                          onClick={() => copyToClipboard(selectedAffiliate.bankDetails.ifscCode || selectedAffiliate.bankDetails.routingNumber, "modalIfsc")}
                        >
                          {copiedKey === "modalIfsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> No banking details submitted yet.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Settlement Amount (₹)</Label>
                <Input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  value={payoutForm.amount} 
                  onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} 
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Bank UTR / Transaction Reference ID</Label>
                <Input 
                  required 
                  placeholder="e.g. UTR-20260906-894231" 
                  value={payoutForm.referenceId} 
                  onChange={e => setPayoutForm({...payoutForm, referenceId: e.target.value})} 
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Settlement Notes (Optional)</Label>
                <Input 
                  placeholder="Paid via Netbanking / UPI" 
                  value={payoutForm.notes} 
                  onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})} 
                  className="text-sm"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording Settlement...
                  </>
                ) : (
                  "Confirm Settlement Recorded"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Partner Settings</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure commission percentage and verify KYC status for {selectedAffiliate?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSettings} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Commission Percentage (%)</Label>
              <Input 
                type="number" 
                value={settingsForm.commission} 
                onChange={e => setSettingsForm({...settingsForm, commission: e.target.value})} 
                min="0" 
                max="100" 
                required 
                className="mt-1"
              />
              <p className="text-[11px] text-gray-500 mt-1">Default is 20%. Adjust for VIP sales reps or special partners.</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">KYC Verification Status</Label>
              <Select value={settingsForm.kycStatus} onValueChange={(v) => setSettingsForm({...settingsForm, kycStatus: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Verification</SelectItem>
                  <SelectItem value="APPROVED">Approved (Verified)</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Partner Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add New Affiliate Partner</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create an affiliate or sales partner account. A referral code will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAffiliate} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
              <Input required placeholder="Dr. Vikram Sharma" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input type="email" required placeholder="vikram@partner.com" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Password</Label>
              <Input type="password" required placeholder="••••••••" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Commission Percentage (%)</Label>
              <Input type="number" required value={addForm.commission} onChange={e => setAddForm({...addForm, commission: e.target.value})} min="0" max="100" className="mt-1" />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Partner Account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
