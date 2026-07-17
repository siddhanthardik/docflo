"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, IndianRupee, User, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: "",
    dueDate: "",
    discountAmount: 0,
    notes: ""
  });

  const [items, setItems] = useState([
    { description: "", quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/patients?limit=100");
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients);
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = Math.max(0, subtotal - formData.discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast({ title: "Error", description: "Please select a patient", variant: "destructive" });
      return;
    }
    if (items.length === 0 || !items[0].description) {
      toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, items })
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: "Invoice created successfully" });
        router.push(`/billing/${data.id}`);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to create invoice", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/billing" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Invoice</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Generate a new bill for a patient.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Patient Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" /> Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Select Patient *</label>
              <select
                required
                className={inputClass}
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                className={inputClass}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Line Items
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Unit Price</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end sm:items-center bg-gray-50/50 p-4 sm:p-2 rounded-xl border border-gray-100 sm:border-none">
                <div className="col-span-1 sm:col-span-6">
                  <span className="sm:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description</span>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Consultation Fee"
                    className={inputClass}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="sm:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Qty</span>
                  <input
                    type="number"
                    min="1"
                    required
                    className={inputClass}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-1 sm:col-span-3 relative">
                  <span className="sm:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Unit Price</span>
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 sm:mt-0 mt-3" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className={`${inputClass} pl-9`}
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
            <textarea
              rows={4}
              placeholder="Terms, conditions, or thank you note..."
              className={inputClass}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
            
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-medium text-gray-600">
              <span>Discount</span>
              <div className="relative w-32">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputClass} py-1.5 pl-8 text-right`}
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-black text-indigo-600">₹{totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-200 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Invoice
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
