"use client";

import { useState } from "react";
import { Receipt, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SubscriptionsClient({ initialDoctors }: { initialDoctors: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredDoctors = initialDoctors.filter(doc => {
    const matchesSearch = 
      (doc.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (doc.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "ALL" || doc.subscriptionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-600" />
            Subscriptions
          </h1>
          <p className="text-gray-500 mt-1">Track and manage active subscriptions across all clinics.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by clinic name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              className="w-full sm:w-auto border-gray-300 rounded-md text-sm pl-3 pr-8 py-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
              <option value="NONE">None</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Clinic / Doctor</th>
                <th className="font-semibold px-6 py-4">Country</th>
                <th className="font-semibold px-6 py-4">Package</th>
                <th className="font-semibold px-6 py-4">Status</th>
                <th className="font-semibold px-6 py-4">Joined On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="h-10 w-10 text-gray-300 mb-3" />
                      <p>No subscriptions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{doc.name || "Unnamed"}</div>
                      <div className="text-gray-500 text-xs">{doc.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{doc.country || "IN"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{doc.package?.name || "No Plan"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {doc.subscriptionStatus === "ACTIVE" && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>}
                      {doc.subscriptionStatus === "TRIAL" && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Trial</span>}
                      {doc.subscriptionStatus === "PAST_DUE" && <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Past Due</span>}
                      {doc.subscriptionStatus === "CANCELED" && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Canceled</span>}
                      {doc.subscriptionStatus === "NONE" && <span className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-wider">None</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
