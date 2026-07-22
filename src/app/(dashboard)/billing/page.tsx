"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, FileText, CheckCircle2, Clock, AlertCircle, IndianRupee, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/billing/invoices");
      const data = await res.json();
      if (res.ok) {
        setInvoices(data);
      } else {
        toast({ title: "Error", description: data.error || "Failed to load invoices", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
    inv.patient.lastName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
      PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-blue-600/20",
      CANCELLED: "bg-gray-50 text-gray-700 ring-gray-600/20",
      OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/20",
      DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20"
    };
    const icons: any = {
      PAID: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      UNPAID: <Clock className="w-3.5 h-3.5 mr-1" />,
      PARTIALLY_PAID: <IndianRupee className="w-3.5 h-3.5 mr-1" />,
      CANCELLED: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
      OVERDUE: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
      DRAFT: <FileText className="w-3.5 h-3.5 mr-1" />
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
        {icons[status]} {status.replace("_", " ")}
      </span>
    );
  };

  // Calculations for KPI
  const totalRevenue = invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIALLY_PAID').reduce((sum, inv) => sum + inv.totalAmount, 0); // Simplified for now
  const outstandingBalance = invoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID' || i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const unpaidCount = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Manage patient bills, track payments, and follow up on balances.
          </p>
        </div>
        <Link
          href="/billing/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-200"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-gray-900">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding Balance</p>
          <p className="text-3xl font-black text-amber-600">₹{outstandingBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Unpaid Invoices</p>
          <p className="text-3xl font-black text-rose-600">{unpaidCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice # or Patient Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 w-full sm:w-auto justify-center">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-b-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{inv.patient.firstName} {inv.patient.lastName}</span>
                      <p className="text-xs text-gray-500">{inv.patient.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(inv.issueDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{inv.currencySymbol || "$"}{inv.totalAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/billing/${inv.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
