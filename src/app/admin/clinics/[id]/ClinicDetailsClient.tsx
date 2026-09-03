"use client";

import { useState } from "react";
import { 
  Building2, 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle2,
  AlertTriangle,
  History,
  Shield,
  Zap,
  Clock,
  CalendarDays,
  ArrowRight,
  Loader2,
  Sparkles,
  Info
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function ClinicDetailsClient({ 
  initialClinic, 
  packages, 
  allPackages = [],
  featureFlags 
}: { 
  initialClinic: any; 
  packages: any[]; 
  allPackages?: any[];
  featureFlags: any[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(initialClinic);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, subscription, features, transactions

  // Subscription Form State
  const [selectedPackageId, setSelectedPackageId] = useState(clinic.packageId || "");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState(clinic.billingPeriod || "monthly");
  const [selectedStatus, setSelectedStatus] = useState(clinic.subscriptionStatus || "ACTIVE");
  const [selectedExpiry, setSelectedExpiry] = useState(
    clinic.subscriptionExpiry ? new Date(clinic.subscriptionExpiry).toISOString().split("T")[0] : ""
  );
  const [reason, setReason] = useState("");
  const [subSaving, setSubSaving] = useState(false);

  // Fast package name lookup map
  const packageMap = new Map<string, string>();
  packages.forEach(p => packageMap.set(p.id, p.name));
  allPackages.forEach(p => packageMap.set(p.id, p.name));

  const handleToggleSuspend = async () => {
    if (!confirm(`Are you sure you want to ${clinic.isSuspended ? 'unsuspend' : 'suspend'} this clinic?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !clinic.isSuspended }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Clinic status updated." });
        setClinic({ ...clinic, isSuspended: !clinic.isSuspended });
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to update clinic.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId || null,
          billingPeriod: selectedBillingPeriod,
          subscriptionStatus: selectedStatus,
          subscriptionExpiry: selectedExpiry ? new Date(selectedExpiry).toISOString() : null,
          reason: reason.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Subscription details updated successfully." });
        const updated = await res.json();
        setClinic({
          ...clinic,
          packageId: updated.packageId,
          package: updated.package,
          billingPeriod: updated.billingPeriod,
          subscriptionStatus: updated.subscriptionStatus,
          subscriptionExpiry: updated.subscriptionExpiry,
          subscriptionHistories: updated.subscriptionHistories || clinic.subscriptionHistories,
        });
        setReason("");
        router.refresh();
      } else {
        const errText = await res.text();
        toast({ title: "Error", description: errText || "Failed to update subscription.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setSubSaving(false);
    }
  };

  const addDaysToExpiry = (days: number) => {
    const base = new Date();
    const future = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setSelectedExpiry(future.toISOString().split("T")[0]);
  };

  const calculateDaysLeft = () => {
    if (!clinic.subscriptionExpiry) return null;
    const now = new Date();
    const expiry = new Date(clinic.subscriptionExpiry);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "features", label: "Feature Overrides", icon: Zap },
    { id: "transactions", label: "Transactions", icon: History },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clinics">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              {clinic.clinicName || clinic.name}
              {clinic.isSuspended && (
                <Badge variant="destructive" className="ml-2 uppercase tracking-wider text-[10px]">Suspended</Badge>
              )}
            </h1>
            <p className="text-sm text-gray-500">ID: {clinic.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
             variant={clinic.isSuspended ? "default" : "destructive"} 
             onClick={handleToggleSuspend}
             disabled={loading}
           >
             <Ban className="h-4 w-4 mr-2" />
             {clinic.isSuspended ? "Unsuspend Clinic" : "Suspend Clinic"}
           </Button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Clinic Profile</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-500">{clinic.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-500">{clinic.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-500">
                    {[clinic.address, clinic.city, clinic.state, clinic.country, clinic.pincode].filter(Boolean).join(", ") || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Joined On</p>
                  <p className="text-sm text-gray-500">{format(new Date(clinic.createdAt), "PPP")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Google Business Profile</h3>
            {clinic.gbpAccounts && clinic.gbpAccounts.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">GBP Connected</p>
                      <p className="text-xs text-emerald-800 mt-0.5">{clinic.gbpAccounts[0]?.accountName || "Google Account Linked"}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={async () => {
                    if (!confirm("Are you sure you want to disconnect Google Business Profile for this clinic?")) return;
                    setLoading(true);
                    try {
                      const res = await fetch(`/api/gbp/disconnect?doctorId=${clinic.id}`, { method: "DELETE" });
                      if (res.ok) {
                        toast({ title: "Profile Reset!", description: "Disconnected Google Business Profile for this clinic cleanly." });
                        setClinic({ ...clinic, gbpAccounts: [] });
                        router.refresh();
                      } else {
                        toast({ title: "Error", description: "Failed to disconnect Google Business Profile.", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Error", description: "Network error", variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Disconnect Profile
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                No Google Business Profile currently connected for this clinic.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="space-y-6">
          {/* Card 1: Subscription Status & Validity Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Subscription Overview
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Active package, billing cycle, and expiry date.</p>
              </div>
              <Badge className={
                clinic.subscriptionStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-800 font-bold" :
                clinic.subscriptionStatus === "TRIAL" ? "bg-blue-100 text-blue-800 font-bold" :
                clinic.subscriptionStatus === "PAST_DUE" ? "bg-amber-100 text-amber-800 font-bold" :
                "bg-gray-100 text-gray-800 font-bold"
              }>
                {clinic.subscriptionStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Plan</p>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {clinic.package?.name || "No Plan"}
                </p>
                <span className="text-[10px] text-indigo-600 font-medium uppercase mt-0.5 inline-block">
                  {clinic.package ? `${clinic.country !== "IN" ? "$" : "₹"}${clinic.package.priceMonthly}/mo` : "Free Tier"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Billing Cycle</p>
                <p className="text-base font-bold text-slate-900 mt-1 capitalize">
                  {clinic.billingPeriod || "Monthly"}
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 inline-block">Standard Recurring</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Joined / Started</p>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {format(new Date(clinic.createdAt), "MMM d, yyyy")}
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 inline-block">Registration date</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiry / Renewal</p>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {clinic.subscriptionExpiry ? format(new Date(clinic.subscriptionExpiry), "MMM d, yyyy") : "No Expiry"}
                </p>
                {daysLeft !== null ? (
                  <span className={`text-[10px] font-bold mt-0.5 inline-block ${
                    daysLeft > 7 ? "text-emerald-600" : daysLeft >= 0 ? "text-amber-600" : "text-rose-600"
                  }`}>
                    {daysLeft > 0 ? `${daysLeft} days remaining` : daysLeft === 0 ? "Expires today" : `Expired ${Math.abs(daysLeft)}d ago`}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5 inline-block">Unlimited access</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Subscription Update Form with Explicit Save Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Modify Package & Subscription Validity
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Assign a plan, modify billing duration, or extend subscription validity. Click Save to apply changes.
              </p>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Package Plan */}
                <div className="space-y-1.5">
                  <Label htmlFor="packageSelect" className="text-xs font-semibold text-slate-700">
                    Package Plan <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="packageSelect"
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No Package (Free / Default)</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({clinic.country !== "IN" ? "$" : "₹"}{p.priceMonthly}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Period */}
                <div className="space-y-1.5">
                  <Label htmlFor="billingPeriodSelect" className="text-xs font-semibold text-slate-700">
                    Billing Period
                  </Label>
                  <select
                    id="billingPeriodSelect"
                    value={selectedBillingPeriod}
                    onChange={(e) => setSelectedBillingPeriod(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="statusSelect" className="text-xs font-semibold text-slate-700">
                    Subscription Status
                  </Label>
                  <select
                    id="statusSelect"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELED">CANCELED</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date with 1-Click Quick Preset Buttons */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label htmlFor="expiryInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                    Package Expiry / Renewal Date
                  </Label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Set:</span>
                    <button
                      type="button"
                      onClick={() => addDaysToExpiry(30)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => addDaysToExpiry(90)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                      +90 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => addDaysToExpiry(365)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                      +1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedExpiry("")}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <Input
                  id="expiryInput"
                  type="date"
                  value={selectedExpiry}
                  onChange={(e) => setSelectedExpiry(e.target.value)}
                  className="max-w-xs h-10 text-sm font-medium rounded-xl border-slate-300 bg-white"
                />
              </div>

              {/* Audit Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="reasonInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Reason / Audit Log Note <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="reasonInput"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Upgraded to Premium per invoice payment, Promotional 3-month extension"
                  className="h-10 text-sm rounded-xl border-slate-300 bg-white"
                />
              </div>

              {/* Action Button: Save Subscription Changes */}
              <div className="pt-2 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={subSaving}
                  className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  {subSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Saving Subscription...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Save Subscription Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Card 3: Subscription History & Audit Log Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Package Change History & Audit Logs
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Immutable record of all past package transitions and staff modifications.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                {clinic.subscriptionHistories?.length || 0} Records
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Package Transition</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Changed By</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Audit Note / Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {clinic.subscriptionHistories && clinic.subscriptionHistories.length > 0 ? (
                    clinic.subscriptionHistories.map((hist: any) => {
                      const prevName = hist.previousPackageId ? packageMap.get(hist.previousPackageId) || "Previous Package" : "None";
                      const newName = hist.newPackageId ? packageMap.get(hist.newPackageId) || "New Package" : "None";

                      return (
                        <tr key={hist.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                            {format(new Date(hist.createdAt), "MMM d, yyyy h:mm a")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                                {prevName}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {newName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <span className="font-semibold text-slate-800">{hist.changedByRole || "ADMIN"}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {hist.reason || <span className="text-gray-400 italic">No note provided</span>}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs text-gray-400">
                        No package change logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clinic.paymentTransactions?.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.currency === "USD" ? "$" : "₹"}{Number(tx.amount).toLocaleString(tx.currency === "USD" ? "en-US" : "en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Badge variant={tx.status === "SUCCESS" ? "default" : "secondary"}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {tx.razorpayPaymentId || tx.id}
                  </td>
                </tr>
              ))}
              {(!clinic.paymentTransactions || clinic.paymentTransactions.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "features" && (
         <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                Clinic Feature Overrides
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Overrides take precedence over package and default feature values. 
                They allow granting specific features or custom limits to this clinic exclusively.
              </p>
            </div>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
               Feature overrides are implemented in the API but UI for setting them per-clinic is planned for a future phase.
            </div>
         </div>
      )}
    </div>
  );
}
