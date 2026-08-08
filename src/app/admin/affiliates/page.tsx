"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2, DollarSign, Search, CheckCircle, ExternalLink, AlertTriangle, FileText, Download, Plus, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AffiliatesPage() {
  const { data: session, status } = useSession();
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ amount: "", referenceId: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", commission: "20" });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ commission: "", kycStatus: "" });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (!session?.user?.role || !["SUPERADMIN", "ACCOUNTS"].includes(session.user.role)) {
        redirect("/");
      } else {
        fetchPayouts();
      }
    } else if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status, session]);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        toast({ title: "Success", description: "Payout recorded successfully." });
        setIsPayoutModalOpen(false);
        setPayoutForm({ amount: "", referenceId: "", notes: "" });
        fetchPayouts();
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
        toast({ title: "Success", description: "Affiliate added successfully." });
        setIsAddModalOpen(false);
        setAddForm({ name: "", email: "", password: "", commission: "20" });
        fetchPayouts();
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
        toast({ title: "Success", description: "Settings updated successfully." });
        setIsSettingsModalOpen(false);
        fetchPayouts();
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
    setPayoutForm({ amount: affiliate.pendingPayout.toFixed(2), referenceId: "", notes: "" });
    setIsPayoutModalOpen(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const filteredAffiliates = affiliates.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            Affiliates
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your Affiliates, record payouts, and track commissions.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Affiliate
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search partners by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Partner</th>
                <th className="font-semibold px-6 py-4">KYC Status</th>
                <th className="font-semibold px-6 py-4">Referred Signups</th>
                <th className="font-semibold px-6 py-4">Total Earnings</th>
                <th className="font-semibold px-6 py-4">Pending Payout</th>
                <th className="font-semibold px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No partners found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {affiliate.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{affiliate.name} <span className="text-gray-400 font-normal text-xs ml-1">({affiliate.role})</span></p>
                          <p className="text-xs text-gray-500">{affiliate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        affiliate.kycStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                        affiliate.kycStatus === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" : 
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }>
                        {affiliate.kycStatus || "PENDING"}
                      </Badge>
                      {affiliate.kycDocuments?.url && (
                        <a href={affiliate.kycDocuments.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-indigo-600 hover:underline mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> View Doc
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {affiliate.referredDoctors.length}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ${affiliate.totalEarnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      ${affiliate.pendingPayout.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setSettingsForm({ 
                              commission: affiliate.commissionPercentage?.toString() || "20",
                              kycStatus: affiliate.kycStatus || "PENDING"
                            });
                            setIsSettingsModalOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                        {affiliate.pendingPayout > 0 ? (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openPayoutModal(affiliate)}>
                            Record Payout
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Settled
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <form onSubmit={handleRecordPayout} className="space-y-4 pt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Bank Details on File</h4>
                {selectedAffiliate.bankDetails ? (
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-900">Account Name:</span> {selectedAffiliate.bankDetails.accountName}</p>
                    <p><span className="font-medium text-gray-900">Bank:</span> {selectedAffiliate.bankDetails.bankName}</p>
                    <p><span className="font-medium text-gray-900">Account #:</span> {selectedAffiliate.bankDetails.accountNumber}</p>
                    <p><span className="font-medium text-gray-900">Routing/IFSC:</span> {selectedAffiliate.bankDetails.routingNumber}</p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> No bank details provided yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payout Amount ($)</Label>
                <Input required type="number" step="0.01" min="0.01" value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Transaction Reference ID</Label>
                <Input required placeholder="TXN-123456" value={payoutForm.referenceId} onChange={e => setPayoutForm({...payoutForm, referenceId: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input placeholder="Paid via Bank Transfer" value={payoutForm.notes} onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Confirm Payment Recorded"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affiliate Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <Label>Commission Percentage</Label>
              <Input 
                type="number" 
                value={settingsForm.commission} 
                onChange={e => setSettingsForm({...settingsForm, commission: e.target.value})} 
                min="0" max="100" required 
              />
            </div>
            <div>
              <Label>KYC Status</Label>
              <Select value={settingsForm.kycStatus} onValueChange={(v) => setSettingsForm({...settingsForm, kycStatus: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Affiliate Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Affiliate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAffiliate} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} />
            </div>
            <div>
              <Label>Commission %</Label>
              <Input type="number" required value={addForm.commission} onChange={e => setAddForm({...addForm, commission: e.target.value})} min="0" max="100" />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Affiliate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Affiliate Details: {selectedAffiliate?.name}</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 font-medium mb-1">Affiliate Code</p>
                  <p className="text-lg font-bold text-slate-900">{selectedAffiliate.affiliateCode || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500 font-medium mb-1">Commission Rate</p>
                  <p className="text-lg font-bold text-slate-900">{selectedAffiliate.commissionPercentage || 0}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold text-slate-900 mb-3 border-b pb-2">Bank Details</h3>
                {selectedAffiliate.bankDetails ? (
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><span className="font-medium text-slate-500">Bank Name:</span> {(selectedAffiliate.bankDetails as any).bankName || "N/A"}</p>
                    <p><span className="font-medium text-slate-500">Account Name:</span> {(selectedAffiliate.bankDetails as any).accountName || "N/A"}</p>
                    <p><span className="font-medium text-slate-500">Account Number:</span> {(selectedAffiliate.bankDetails as any).accountNumber || "N/A"}</p>
                    <p><span className="font-medium text-slate-500">Routing/IFSC:</span> {(selectedAffiliate.bankDetails as any).routingNumber || "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> No bank details provided yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-md font-semibold text-slate-900 mb-3 border-b pb-2">Referred Doctors</h3>
                {selectedAffiliate.referredDoctors && selectedAffiliate.referredDoctors.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedAffiliate.referredDoctors.map((doc: any, i: number) => (
                      <li key={i} className="text-sm bg-slate-50 p-2 rounded flex justify-between border border-slate-100">
                        <span>{doc.clinicName || "Unknown Clinic"}</span>
                        <span className="text-indigo-600 font-medium">{doc.package?.name || "No Package"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No referred doctors yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-md font-semibold text-slate-900 mb-3 border-b pb-2">Payout History</h3>
                {selectedAffiliate.affiliatePayouts && selectedAffiliate.affiliatePayouts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAffiliate.affiliatePayouts.map((payout: any, i: number) => (
                      <div key={i} className="text-sm bg-slate-50 p-3 rounded flex justify-between items-center border border-slate-100">
                        <div>
                          <p className="font-medium text-slate-900">${payout.amount.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">Ref: {payout.referenceId}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{payout.status}</Badge>
                          <p className="text-xs text-slate-500 mt-1">{new Date(payout.paidAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No payout history.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
