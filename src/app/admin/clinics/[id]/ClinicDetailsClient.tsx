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
  Zap
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function ClinicDetailsClient({ 
  initialClinic, 
  packages, 
  featureFlags 
}: { 
  initialClinic: any; 
  packages: any[]; 
  featureFlags: any[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(initialClinic);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, subscription, features, transactions

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

  const handleUpdatePackage = async (packageId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Clinic package updated." });
        const updated = await res.json();
        setClinic({ ...clinic, packageId, package: updated.package });
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to update package.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
                  <p className="text-sm text-gray-500">{clinic.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Joined Date</p>
                  <p className="text-sm text-gray-500">{format(new Date(clinic.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Current Subscription</h3>
                <p className="text-sm text-gray-500">Manage the package assigned to this clinic.</p>
              </div>
              <Badge className={
                clinic.subscriptionStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                clinic.subscriptionStatus === "PAST_DUE" ? "bg-amber-100 text-amber-800" :
                "bg-gray-100 text-gray-800"
              }>
                {clinic.subscriptionStatus}
              </Badge>
            </div>
            
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">Package Plan</label>
              <select
                value={clinic.packageId || ""}
                onChange={(e) => handleUpdatePackage(e.target.value || null)}
                disabled={loading}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">No Package</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
                    ${tx.amount}
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
