"use client";

import { useState } from "react";
import { Plus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PricingClient({ initialPackage }: { initialPackage: any }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pkg, setPkg] = useState(initialPackage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    countryCode: "IN",
    currency: "INR",
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    razorpayMonthlyPlanId: "",
    razorpayQuarterlyPlanId: "",
    razorpayYearlyPlanId: "",
    stripeMonthlyPriceId: "",
    stripeQuarterlyPriceId: "",
    stripeYearlyPriceId: ""
  });

  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      countryCode: "US",
      currency: "USD",
      priceMonthly: 0,
      priceQuarterly: 0,
      priceYearly: 0,
      razorpayMonthlyPlanId: "",
      razorpayQuarterlyPlanId: "",
      razorpayYearlyPlanId: "",
      stripeMonthlyPriceId: "",
      stripeQuarterlyPriceId: "",
      stripeYearlyPriceId: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (priceRow: any) => {
    setEditingPrice(priceRow);
    setFormData({
      countryCode: priceRow.countryCode,
      currency: priceRow.currency,
      priceMonthly: priceRow.priceMonthly,
      priceQuarterly: priceRow.priceQuarterly,
      priceYearly: priceRow.priceYearly,
      razorpayMonthlyPlanId: priceRow.razorpayMonthlyPlanId || "",
      razorpayQuarterlyPlanId: priceRow.razorpayQuarterlyPlanId || "",
      razorpayYearlyPlanId: priceRow.razorpayYearlyPlanId || "",
      stripeMonthlyPriceId: priceRow.stripeMonthlyPriceId || "",
      stripeQuarterlyPriceId: priceRow.stripeQuarterlyPriceId || "",
      stripeYearlyPriceId: priceRow.stripeYearlyPriceId || ""
    });
    setIsModalOpen(true);
  };

  const submitPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `/api/admin/packages/${pkg.id}/prices`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingPrice?.id }),
      });

      if (res.ok) {
        const updatedPackage = await res.json();
        setPkg(updatedPackage);
        toast({ title: "Success", description: "Pricing updated successfully." });
        setIsModalOpen(false);
        router.refresh();
      } else {
        toast({ title: "Error", description: (await res.json()).error || "Failed to update", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deletePrice = async (priceId: string) => {
    if (!confirm("Are you sure you want to delete this pricing configuration?")) return;
    
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}/prices?id=${priceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updatedPackage = await res.json();
        setPkg(updatedPackage);
        toast({ title: "Success", description: "Pricing deleted." });
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to delete pricing", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push('/admin/packages')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Packages
        </Button>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Country Pricing</h1>
          <p className="text-gray-500 mt-1">Manage pricing for <span className="font-semibold text-indigo-600">{pkg.name}</span> across different countries.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Add Country Pricing
        </Button>
      </div>

      <div className="space-y-4">
        {pkg.prices?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500">No country pricing configured yet.</p>
            <Button variant="outline" className="mt-4" onClick={openCreateModal}>Set Up Default Pricing (GLOBAL)</Button>
          </div>
        )}

        {pkg.prices?.map((price: any) => (
          <Card key={price.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-sm font-bold">{price.countryCode}</span>
                  Pricing Configuration
                </CardTitle>
                <CardDescription>Currency: <span className="font-bold">{price.currency}</span></CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(price)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => deletePrice(price.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly</h4>
                  <div className="text-2xl font-bold mb-4">{price.currency} {price.priceMonthly}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Razorpay Plan ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.razorpayMonthlyPlanId || 'Not set'}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Stripe Price ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.stripeMonthlyPriceId || 'Not set'}</code>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Quarterly</h4>
                  <div className="text-2xl font-bold mb-4">{price.currency} {price.priceQuarterly}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Razorpay Plan ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.razorpayQuarterlyPlanId || 'Not set'}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Stripe Price ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.stripeQuarterlyPriceId || 'Not set'}</code>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Yearly</h4>
                  <div className="text-2xl font-bold mb-4">{price.currency} {price.priceYearly}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Razorpay Plan ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.razorpayYearlyPlanId || 'Not set'}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Stripe Price ID:</span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{price.stripeYearlyPriceId || 'Not set'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPrice ? "Edit Pricing" : "Add Country Pricing"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPrice} className="space-y-6 mt-4">
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <Label>Country Code</Label>
                <Select value={formData.countryCode} onValueChange={v => setFormData({...formData, countryCode: v})} disabled={!!editingPrice}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GLOBAL">Global (Default)</SelectItem>
                    <SelectItem value="IN">India (IN)</SelectItem>
                    <SelectItem value="US">United States (US)</SelectItem>
                    <SelectItem value="UK">United Kingdom (UK)</SelectItem>
                    <SelectItem value="AE">UAE (AE)</SelectItem>
                    <SelectItem value="AU">Australia (AU)</SelectItem>
                    <SelectItem value="CA">Canada (CA)</SelectItem>
                    <SelectItem value="SG">Singapore (SG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="AED">AED (د.إ)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="SGD">SGD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-bold border-b pb-2">Monthly</h4>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Razorpay Plan ID</Label>
                  <Input value={formData.razorpayMonthlyPlanId} onChange={e => setFormData({...formData, razorpayMonthlyPlanId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Stripe Price ID</Label>
                  <Input value={formData.stripeMonthlyPriceId} onChange={e => setFormData({...formData, stripeMonthlyPriceId: e.target.value})} />
                </div>
              </div>

              {/* Quarterly */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-bold border-b pb-2">Quarterly</h4>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" value={formData.priceQuarterly} onChange={e => setFormData({...formData, priceQuarterly: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Razorpay Plan ID</Label>
                  <Input value={formData.razorpayQuarterlyPlanId} onChange={e => setFormData({...formData, razorpayQuarterlyPlanId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Stripe Price ID</Label>
                  <Input value={formData.stripeQuarterlyPriceId} onChange={e => setFormData({...formData, stripeQuarterlyPriceId: e.target.value})} />
                </div>
              </div>

              {/* Yearly */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-bold border-b pb-2">Yearly</h4>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" value={formData.priceYearly} onChange={e => setFormData({...formData, priceYearly: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Razorpay Plan ID</Label>
                  <Input value={formData.razorpayYearlyPlanId} onChange={e => setFormData({...formData, razorpayYearlyPlanId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Stripe Price ID</Label>
                  <Input value={formData.stripeYearlyPriceId} onChange={e => setFormData({...formData, stripeYearlyPriceId: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Save Pricing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
