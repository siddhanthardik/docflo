"use client";

import { useState } from "react";
import { Building2, Search, ArrowRight, Ban, Edit, LogIn, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function ClinicsClient({ initialClinics, packages }: { initialClinics: any[], packages: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [clinics, setClinics] = useState<any[]>(initialClinics);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [packageFilter, setPackageFilter] = useState("ALL");

  const filteredClinics = clinics.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                          c.email?.toLowerCase().includes(search.toLowerCase()) ||
                          c.clinicName?.toLowerCase().includes(search.toLowerCase());
                          
    let matchesStatus = true;
    if (statusFilter === "ACTIVE") matchesStatus = !c.isSuspended && c.subscriptionStatus === "ACTIVE";
    if (statusFilter === "SUSPENDED") matchesStatus = c.isSuspended;
    if (statusFilter === "PAST_DUE") matchesStatus = c.subscriptionStatus === "PAST_DUE" && !c.isSuspended;

    let matchesPackage = true;
    if (packageFilter !== "ALL") matchesPackage = c.packageId === packageFilter;

    return matchesSearch && matchesStatus && matchesPackage;
  });

  const handleLoginAsClinic = async (clinicId: string) => {
    try {
      const res = await fetch(`/api/admin/impersonate`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: clinicId })
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: "Impersonation started. Redirecting..." });
        
        window.location.href = data.redirectUrl || "/dashboard";
      } else {
        toast({ title: "Error", description: "Failed to impersonate clinic.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Clinic Management
          </h1>
          <p className="text-gray-500 mt-1">Manage all SaaS tenants, view revenue, and manage subscriptions.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search clinics by name, email, or doctor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PAST_DUE">Past Due</option>
          </select>

          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
          >
            <option value="ALL">All Packages</option>
            <option value="NONE">No Package</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Clinic / Doctor</th>
                <th className="font-semibold px-6 py-4">Status</th>
                <th className="font-semibold px-6 py-4">Package</th>
                <th className="font-semibold px-6 py-4">Lifetime Rev</th>
                <th className="font-semibold px-6 py-4">Joined Date</th>
                <th className="font-semibold px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No clinics found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClinics.map((clinic) => {
                  const revenue = clinic.paymentTransactions?.reduce((sum: number, tx: any) => sum + tx.amount, 0) || 0;
                  
                  return (
                    <tr key={clinic.id} className={`hover:bg-gray-50 transition-colors group ${clinic.isSuspended ? 'bg-red-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {clinic.clinicName?.charAt(0) || clinic.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{clinic.clinicName || clinic.name}</p>
                            <p className="text-xs text-gray-500">{clinic.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {clinic.isSuspended ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-700">
                            Suspended
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            clinic.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                            clinic.subscriptionStatus === 'PAST_DUE' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {clinic.subscriptionStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {clinic.package ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{clinic.package.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{clinic.billingPeriod}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No Package</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ${revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(clinic.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLoginAsClinic(clinic.id)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Login as this clinic"
                          >
                            <LogIn className="h-4 w-4" />
                          </Button>
                          <Link href={`/admin/clinics/${clinic.id}`}>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                              View <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
