"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, MessageCircle, CreditCard, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getCurrencySymbol } from "@/lib/currency";

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
    setSending(true);
    try {
      const res = await fetch(`/api/billing/invoices/${params.id}/send`, { method: "POST" });
      if (res.ok) {
        toast({ title: "Success", description: "Invoice sent to patient via WhatsApp" });
      } else {
        toast({ title: "Error", description: "Failed to send invoice", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
      PARTIALLY_PAID: "bg-blue-50 text-blue-700 ring-blue-600/20",
      CANCELLED: "bg-gray-50 text-gray-700 ring-gray-600/20",
      OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/20",
      DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20"
    };
    return (
      <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ring-1 ring-inset ${styles[status]}`}>
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

  const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const balanceDue = Math.max(0, invoice.totalAmount - totalPaid);
  const sym = invoice.currencySymbol || getCurrencySymbol(invoice.currencyCode);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-in fade-in zoom-in-95 duration-500 print:bg-white print:min-h-0 print:pb-0">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice A4 Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.05)] print:shadow-none print:border-none print:p-0">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">INVOICE</h2>
              <p className="text-sm font-semibold text-gray-500">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Amount Due</p>
              <p className="text-3xl font-black text-indigo-600 print:text-black">{sym}{balanceDue.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider mb-2 text-xs">Billed To</p>
              <p className="font-bold text-gray-900 text-base">{invoice.patient.firstName} {invoice.patient.lastName}</p>
              <p className="text-gray-600 mt-1">{invoice.patient.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-500 uppercase tracking-wider mb-2 text-xs">Dates</p>
              <p className="text-gray-900"><span className="font-medium text-gray-500 mr-2">Issued:</span> {format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
              {invoice.dueDate && (
                <p className="text-gray-900 mt-1"><span className="font-medium text-gray-500 mr-2">Due:</span> {format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-sm text-left mb-8">
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
                <span className="font-black text-indigo-600 print:text-black">{sym}{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
              <p className="font-semibold uppercase tracking-wider text-xs mb-2">Notes</p>
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Record Payment</h3>
              <p className="text-sm text-gray-500 mb-6">Manually record a payment made by the patient.</p>
              
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={balanceDue}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
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

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPayment || !paymentAmount}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60 flex justify-center items-center gap-2"
                  >
                    {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
