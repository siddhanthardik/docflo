"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2, DollarSign, Users, TrendingUp, Copy, LogOut, CheckCircle, AlertTriangle, FileText, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AffiliateDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [bankDetails, setBankDetails] = useState({ accountName: "", accountNumber: "", bankName: "", routingNumber: "" });
  const [kycDocUrl, setKycDocUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/affiliates/login");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "AFFILIATE" && session?.user?.role !== "SALES") {
        redirect("/"); // They shouldn't be here!
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
          setBankDetails(json.profile.bankDetails);
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
          bankDetails,
          kycDocuments: kycDocUrl ? { url: kycDocUrl } : null
        }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Your details have been updated." });
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

  const copyLink = () => {
    if (data?.profile?.affiliateCode) {
      const link = `${window.location.origin}/register?ref=${data.profile.affiliateCode}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Copied!", description: "Affiliate link copied to clipboard." });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

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
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-1.5 flex items-center gap-2">
            <div className="px-3 py-1.5 bg-gray-50 rounded text-sm font-mono text-gray-600 border border-gray-100 flex-1 min-w-[250px] overflow-hidden text-ellipsis">
              {window.location.origin}/register?ref={data.profile.affiliateCode}
            </div>
            <Button onClick={copyLink} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-3">
              <Copy className="h-4 w-4 mr-2" /> Copy Link
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm w-full sm:w-auto h-auto p-1 overflow-x-auto flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4">Overview</TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4">My Referrals</TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4">Payout History</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-md py-2 px-4">Bank & KYC Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {data.profile.kycStatus === "PENDING" && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Action Required: KYC Pending</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Your KYC verification is currently pending. You can still refer clients, but payouts will be held until your documents and bank details are approved.
                  </p>
                </div>
              </div>
            )}

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
                      <h3 className="text-3xl font-bold text-gray-900 mt-2">${data.metrics.totalEarnings.toFixed(2)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-100 ring-1 ring-indigo-50 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Pending Payout</p>
                      <h3 className="text-3xl font-bold text-indigo-900 mt-2">${data.metrics.pendingPayout.toFixed(2)}</h3>
                    </div>
                    <div className="p-3 bg-indigo-600 rounded-full text-white">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>My Referrals</CardTitle>
                <CardDescription>A list of all clinics that registered using your affiliate link.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <th className="px-4 py-3 font-medium">Clinic Name</th>
                        <th className="px-4 py-3 font-medium">Contact Person</th>
                        <th className="px-4 py-3 font-medium">Joined Date</th>
                        <th className="px-4 py-3 font-medium">Current Package</th>
                        <th className="px-4 py-3 font-medium text-right">Revenue Generated</th>
                        <th className="px-4 py-3 font-medium text-right">Your Cut ({data.profile.commissionPercentage}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.referrals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">No referrals yet. Share your link to get started!</td>
                        </tr>
                      ) : (
                        data.referrals.map((ref: any) => (
                          <tr key={ref.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{ref.clinicName || "Unknown"}</td>
                            <td className="px-4 py-3 text-gray-600">{ref.name}</td>
                            <td className="px-4 py-3 text-gray-600">{new Date(ref.dateJoined).toLocaleDateString()}</td>
                            <td className="px-4 py-3"><Badge variant="secondary">{ref.package}</Badge></td>
                            <td className="px-4 py-3 text-right text-gray-600">${ref.revenue.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">${(ref.revenue * (data.profile.commissionPercentage/100)).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Record of all commission payments sent to your bank account.</CardDescription>
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
                            <td className="px-4 py-3 font-medium text-gray-900">${p.amount.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <Badge className={p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                                {p.status}
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
                      <Input value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Routing / IFSC Code</Label>
                      <Input value={bankDetails.routingNumber} onChange={e => setBankDetails({...bankDetails, routingNumber: e.target.value})} required />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 mt-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> KYC Document</h4>
                      <div className="space-y-2">
                        <Label>Link to KYC Document (ID Proof / Tax ID)</Label>
                        <Input placeholder="https://drive.google.com/..." value={kycDocUrl} onChange={e => setKycDocUrl(e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Please provide a secure link to your identification document for compliance.</p>
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
    </div>
  );
}
