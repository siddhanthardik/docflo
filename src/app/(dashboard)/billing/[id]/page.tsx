"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, MessageCircle, CreditCard, CheckCircle2, Clock, AlertCircle, Loader2, Ban } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getCurrencySymbol } from "@/lib/currency";
import { numberToWords } from "@/lib/number-to-words";

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/billing/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        toast({ title: "Error", description: "Failed to load invoice", variant: "destructive" });
        router.push("/billing");
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (invoice?.status === "CANCELLED") {
      toast({ title: "Action Blocked", description: "Cannot send reminders for a cancelled invoice.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/billing/invoices/${params.id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: data.message || "Invoice sent to patient via WhatsApp" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to send invoice", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoice?.status === "CANCELLED") {
      toast({ title: "Action Blocked", description: "Cannot record payments on a cancelled invoice.", variant: "destructive" });
      return;
    }
    setProcessingPayment(true);
    try {
      const res = await fetch(`/api/billing/invoices/${params.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paymentAmount, paymentMethod, referenceId })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Payment recorded successfully" });
        setShowPaymentModal(false);
        fetchInvoice(); // Refresh data
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to record payment", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason.trim() || cancellationReason.trim().length < 3) {
      toast({ title: "Reason Required", description: "Please enter a valid cancellation reason (min 3 characters).", variant: "destructive" });
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/billing/invoices/${params.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Invoice Cancelled", description: "Invoice marked as CANCELLED and excluded from clinic revenue." });
        setShowCancelModal(false);
        fetchInvoice(); // Refresh invoice data
      } else {
        toast({ title: "Cancellation Failed", description: data.error || "Failed to cancel invoice", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
      PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-blue-600/20",
      CANCELLED: "bg-rose-50 text-rose-700 ring-rose-600/20 font-bold",
      OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/20",
      DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20"
    };
    return (
      <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ring-1 ring-inset ${styles[status] || styles.DRAFT}`}>
        {status === "CANCELLED" && <Ban className="w-3.5 h-3.5 mr-1.5 text-rose-600 inline" />}
        {status.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!invoice) return null;

  const totalPaid = invoice.payments ? invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0;
  const balanceDue = Math.max(0, invoice.totalAmount - totalPaid);
  const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);
  const isCancelled = invoice.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-in fade-in zoom-in-95 duration-500 print:bg-white print:min-h-0 print:pb-0 print:p-0">
      <style>{`
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          body {
            margin: 15mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/billing" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Issued {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.open(`/api/billing/invoices/${invoice.id}/pdf`, '_blank')}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Download PDF
          </button>
          
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>

          {!isCancelled && (
            <>
              <button
                onClick={handleSendWhatsApp}
                disabled={sending}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Send WhatsApp
              </button>
              
              {balanceDue > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" /> Record Payment
                </button>
              )}

              <button
                onClick={() => {
                  setCancellationReason("");
                  setShowCancelModal(true);
                }}
                className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                <Ban className="w-4 h-4" /> Cancel Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancelled / Void Alert Banner */}
      {isCancelled && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 mb-8 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5 sm:mt-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-rose-950 tracking-tight">
                  INVOICE CANCELLED & VOIDED
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  Zero Revenue
                </span>
              </div>
              <p className="text-sm font-semibold text-rose-900 mt-1">
                Reason: &ldquo;{invoice.cancellationReason || "Cancelled by doctor"}&rdquo;
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {invoice.cancelledAt && `Cancelled on ${format(new Date(invoice.cancelledAt), "MMMM dd, yyyy 'at' h:mm a")}`}
                {invoice.cancelledBy && ` • Authorized by ${invoice.cancelledBy}`}
                {" • Strictly excluded from all clinic revenue calculations"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-white/80 backdrop-blur-sm border border-rose-200 px-4 py-2 rounded-xl">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Revenue Impact</p>
            <p className="text-base font-black text-rose-600">₹0.00 (Voided)</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice A4 Preview */}
        <div className="relative lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] print:shadow-none print:border-none print:p-0 overflow-hidden">
          {/* Cancelled Diagonal Watermark Stamp */}
          {isCancelled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
              <div className="border-8 border-rose-500/25 rounded-3xl px-12 py-6 -rotate-[28deg] transform shadow-sm">
                <span className="text-6xl sm:text-8xl font-black tracking-widest text-rose-500/25 uppercase">
                  CANCELLED
                </span>
              </div>
            </div>
          )}

          {/* Clinic Header (Print & Screen View) */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-100 pb-6 sm:pb-8 mb-6 sm:mb-8 gap-4">
            <div>
              {invoice.doctor?.image && (
                <img src={invoice.doctor.image} alt="Clinic Logo" className="h-12 w-auto mb-2 object-contain" />
              )}
              <h2 className="text-xl font-bold text-gray-900">{invoice.doctor?.clinicName || invoice.doctor?.name || "Clinic"}</h2>
              {invoice.doctor?.address && <p className="text-xs text-gray-600">{invoice.doctor.address}</p>}
              {(invoice.doctor?.city || invoice.doctor?.state) && (
                <p className="text-xs text-gray-600">{[invoice.doctor?.city, invoice.doctor?.state, invoice.doctor?.country].filter(Boolean).join(", ")}</p>
              )}
              {invoice.doctor?.phone && <p className="text-xs text-gray-600">Phone: {invoice.doctor.phone}</p>}
              {invoice.doctor?.email && <p className="text-xs text-gray-600">Email: {invoice.doctor.email}</p>}
              {invoice.doctor?.taxGstNumber && <p className="text-xs font-semibold text-gray-700 mt-1">GSTIN: {invoice.doctor.taxGstNumber}</p>}
            </div>
            
            <div className="text-left sm:text-right">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                {isCancelled ? "VOID INVOICE" : invoice.status === "PAID" ? "RECEIPT" : "INVOICE"}
              </h3>
              <p className="text-sm font-semibold text-gray-500">#{invoice.invoiceNumber}</p>
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Due</p>
                {isCancelled ? (
                  <div>
                    <p className="text-xl font-bold text-gray-400 line-through">{sym}{balanceDue.toFixed(2)}</p>
                    <p className="text-2xl font-black text-rose-600">₹0.00 (Void)</p>
                  </div>
                ) : (
                  <p className={`text-3xl font-black ${balanceDue > 0.01 ? "text-rose-600" : "text-emerald-600"} print:text-black`}>
                    {sym}{balanceDue.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 text-sm">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider mb-2 text-xs">Billed To</p>
              <p className="font-bold text-gray-900 text-base">
                {(invoice.patient.lastName && invoice.patient.lastName.trim().toLowerCase() !== invoice.patient.firstName.trim().toLowerCase())
                  ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
                  : invoice.patient.firstName}
              </p>
              <p className="text-gray-600 mt-1">{invoice.patient.phone}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-semibold text-gray-500 uppercase tracking-wider mb-2 text-xs">Dates</p>
              <p className="text-gray-900"><span className="font-medium text-gray-500 mr-2">Issued:</span> {format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
              {invoice.dueDate && (
                <p className="text-gray-900 mt-1"><span className="font-medium text-gray-500 mr-2">Due:</span> {format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm text-left min-w-[480px]">
              <thead className="text-xs text-gray-500 uppercase tracking-wider border-b-2 border-gray-100">
                <tr>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-center">Qty</th>
                  <th className="pb-3 font-semibold text-right">Price</th>
                  <th className="pb-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4 font-medium text-gray-900">{item.description}</td>
                    <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">{sym}{item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 text-right font-bold text-gray-900">{sym}{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-1/2 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 print:text-gray-900">
                <span>Subtotal</span>
                <span className="font-medium">{sym}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 print:text-gray-900">
                  <span>Discount</span>
                  <span className="font-medium">-{sym}{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {(invoice.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-gray-600 print:text-gray-900">
                  <span>Tax</span>
                  <span className="font-medium">{sym}{invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {(() => {
                const rawTotal = (invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxAmount || 0);
                const roundOff = (invoice.totalAmount || 0) - rawTotal;
                if (Math.abs(roundOff) >= 0.01) {
                  return (
                    <div className="flex justify-between text-gray-500 print:text-gray-900">
                      <span>Round Off</span>
                      <span className="font-medium">{roundOff > 0 ? '+' : ''}{sym}{roundOff.toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })()}
              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-black text-gray-900">{sym}{invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 print:text-gray-900">
                <span>Amount Paid</span>
                <span className="font-medium text-emerald-600 print:text-gray-900">{sym}{totalPaid.toFixed(2)}</span>
              </div>
              <hr className="border-gray-200 my-2 border-dashed" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900">Balance Due</span>
                {isCancelled ? (
                  <span className="font-black text-rose-600 print:text-black">₹0.00 (Cancelled)</span>
                ) : (
                  <span className="font-black text-indigo-600 print:text-black">{sym}{balanceDue.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-sm">
            <p className="font-semibold uppercase tracking-wider text-xs text-gray-500 mb-1">Amount in Words</p>
            <p className="font-medium text-gray-900 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 print:bg-white print:border-none print:p-0">
              {numberToWords(invoice.totalAmount, invoice.currencyCode)}
            </p>
          </div>

          {isCancelled && invoice.cancellationReason && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900">
              <p className="font-bold uppercase tracking-wider text-xs text-rose-700 mb-1 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5" /> Official Cancellation Record
              </p>
              <p className="font-semibold text-rose-900">{invoice.cancellationReason}</p>
              <p className="text-xs text-rose-600 mt-1">
                {invoice.cancelledAt && `Cancelled: ${format(new Date(invoice.cancelledAt), "MMM dd, yyyy h:mm a")}`}
                {invoice.cancelledBy && ` • Authorized by: ${invoice.cancelledBy}`}
              </p>
            </div>
          )}

          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
              <p className="font-semibold uppercase tracking-wider text-xs mb-2">Notes & Activity</p>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Payment History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Payment History
            </h3>
            
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No payments recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {invoice.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{sym}{payment.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(payment.paymentDate), "MMM dd, yyyy h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                        {payment.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[calc(100vw-1.5rem)] sm:w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-gray-100 bg-white">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">Record Payment</h3>
              <p className="text-xs text-gray-500">Manually record a payment made by the patient.</p>
            </div>
            
            {/* Scrollable Form Body */}
            <form id="record-payment-form" onSubmit={handleRecordPayment} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={balanceDue}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || "")}
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <p className="text-xs text-indigo-600 mt-1 cursor-pointer" onClick={() => setPaymentAmount(balanceDue)}>
                  Pay full balance: ₹{balanceDue.toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Reference / Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </form>

            {/* Pinned Action Footer */}
            <div className="shrink-0 p-4 border-t border-gray-100 bg-slate-50/90 flex gap-2.5 sm:gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="h-10 px-4 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="record-payment-form"
                disabled={processingPayment || !paymentAmount}
                className="h-10 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60 flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[calc(100vw-1.5rem)] sm:w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200">
            {/* Pinned Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-gray-100 bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-rose-950">Cancel & Void Invoice</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Invoice #{invoice.invoiceNumber} will be voided and removed from clinic revenue.
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="cancel-invoice-form" onSubmit={handleCancelInvoice} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Quick Select Reason
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    "Created by mistake",
                    "Duplicate invoice",
                    "Incorrect patient / items",
                    "Patient treatment cancelled",
                    "Billing dispute / fee waived"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCancellationReason(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        cancellationReason === preset
                          ? "bg-rose-100 border-rose-400 text-rose-900 font-bold"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Mandatory Cancellation Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explain why this invoice is being cancelled (minimum 3 characters)..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  * Must be authorized by Clinic Owner, Doctor, or Manager. An audit record is permanently stored.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200/60 text-rose-800 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> What happens after cancellation:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-rose-700">
                  <li>Excluded from Total Revenue and outstanding balance totals.</li>
                  <li>WhatsApp reminders and payment recordings are disabled.</li>
                  <li>Official PDF will be stamped with CANCELLED / VOID.</li>
                </ul>
              </div>
            </form>

            {/* Pinned Action Footer */}
            <div className="shrink-0 p-4 border-t border-gray-100 bg-slate-50 flex gap-2.5 sm:gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="h-10 px-4 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                Keep Invoice
              </button>
              <button
                type="submit"
                form="cancel-invoice-form"
                disabled={cancelling || !cancellationReason.trim() || cancellationReason.trim().length < 3}
                className="h-10 px-5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-60 flex justify-center items-center gap-2 shadow-md shadow-rose-600/20"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
