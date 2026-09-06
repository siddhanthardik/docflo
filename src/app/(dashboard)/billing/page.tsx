"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, FileText, CheckCircle2, Clock, AlertCircle, IndianRupee, Loader2, Ban } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED">("ALL");
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

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
      inv.patient.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.cancellationReason && inv.cancellationReason.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "PAID") return inv.status === "PAID";
    if (statusFilter === "UNPAID") return inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID";
    if (statusFilter === "OVERDUE") return inv.status === "OVERDUE";
    if (statusFilter === "CANCELLED") return inv.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
      PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-blue-600/20",
      CANCELLED: "bg-rose-50 text-rose-700 ring-rose-600/20 font-semibold",
      OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/20",
      DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20"
    };
    const icons: any = {
      PAID: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
      UNPAID: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />,
      PARTIALLY_PAID: <IndianRupee className="w-3.5 h-3.5 mr-1 text-blue-600" />,
      CANCELLED: <Ban className="w-3.5 h-3.5 mr-1 text-rose-600" />,
      OVERDUE: <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
      DRAFT: <FileText className="w-3.5 h-3.5 mr-1 text-gray-600" />
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.DRAFT}`}>
        {icons[status] || icons.DRAFT} {status.replace("_", " ")}
      </span>
    );
  };

  // Strict Calculations for KPI: CANCELLED invoices are strictly excluded from all clinic revenue calculations
  const totalRevenue = invoices
    .filter(i => i.status !== 'CANCELLED' && (i.status === 'PAID' || i.status === 'PARTIALLY_PAID'))
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const outstandingBalance = invoices
    .filter(i => i.status !== 'CANCELLED' && (i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID' || i.status === 'OVERDUE'))
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const unpaidCount = invoices
    .filter(i => i.status !== 'CANCELLED' && (i.status === 'UNPAID' || i.status === 'OVERDUE'))
    .length;

  const cancelledCount = invoices.filter(i => i.status === 'CANCELLED').length;

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
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Excl. Cancelled</span>
          </div>
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

      {/* Filter Tabs & Toolbar */}
      <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 p-5 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === "ALL"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === "PAID"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Paid ({invoices.filter(i => i.status === "PAID").length})
          </button>
          <button
            onClick={() => setStatusFilter("UNPAID")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === "UNPAID"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Unpaid ({invoices.filter(i => i.status === "UNPAID" || i.status === "PARTIALLY_PAID").length})
          </button>
          <button
            onClick={() => setStatusFilter("OVERDUE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === "OVERDUE"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Overdue ({invoices.filter(i => i.status === "OVERDUE").length})
          </button>
          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === "CANCELLED"
                ? "bg-rose-700 text-white shadow-sm"
                : cancelledCount > 0
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Ban className="w-3 h-3" />
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Patient Name, or Cancel Reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
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
                    No invoices found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isCancelled = inv.status === "CANCELLED";
                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors group ${
                        isCancelled
                          ? "bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500"
                          : "hover:bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isCancelled ? "text-rose-900" : "text-gray-900"}`}>
                            {inv.invoiceNumber}
                          </span>
                          {isCancelled && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800 tracking-wider">
                              VOID
                            </span>
                          )}
                        </div>
                        {isCancelled && inv.cancellationReason && (
                          <p className="text-xs text-rose-700 font-medium truncate max-w-xs mt-1" title={inv.cancellationReason}>
                            Reason: {inv.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${isCancelled ? "text-gray-700" : "text-gray-900"}`}>
                          {inv.patient.firstName} {inv.patient.lastName}
                        </span>
                        <p className="text-xs text-gray-500">{inv.patient.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(inv.issueDate), "MMM dd, yyyy")}
                        {isCancelled && inv.cancelledAt && (
                          <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                            Cancelled {format(new Date(inv.cancelledAt), "MMM dd")}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isCancelled ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-400 line-through">
                              {inv.currencySymbol || "₹"}{inv.totalAmount.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-rose-600">₹0 (Void)</span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">
                            {inv.currencySymbol || "₹"}{inv.totalAmount.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/billing/${inv.id}`}
                          className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            isCancelled
                              ? "text-rose-700 bg-rose-100 hover:bg-rose-200"
                              : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                          }`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

