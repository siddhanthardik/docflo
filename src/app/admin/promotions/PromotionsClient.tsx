"use client";

import { useState } from "react";
import { Plus, Tag, CalendarDays, Ticket, Edit, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export function PromotionsClient({ initialPromotions }: { initialPromotions: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [promotions, setPromotions] = useState<any[]>(initialPromotions);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountPercent: 0,
    active: true,
    endDate: "",
    usageLimit: "",
  });

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      code: "",
      description: "",
      discountPercent: 0,
      active: true,
      endDate: "",
      usageLimit: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discountPercent: promo.discountPercent,
      active: promo.isActive,
      endDate: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : "",
      usageLimit: promo.usageLimit ? String(promo.usageLimit) : "",
    });
    setIsModalOpen(true);
  };

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Success", description: "Promotion disabled successfully." });
        setPromotions(promotions.map(p => p.id === id ? { ...p, isActive: false } : p));
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to disable promotion", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      code: formData.code,
      description: formData.description,
      discountPercent: Number(formData.discountPercent),
      active: formData.active,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
    };

    try {
      if (editingPromo) {
        const res = await fetch(`/api/admin/promotions/${editingPromo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          toast({ title: "Success", description: "Promotion updated successfully." });
          setPromotions(promotions.map(p => p.id === data.id ? data : p));
          setIsModalOpen(false);
          router.refresh();
        } else {
           toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } else {
        const res = await fetch(`/api/admin/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          toast({ title: "Success", description: "Promotion created successfully." });
          setPromotions([data, ...promotions]);
          setIsModalOpen(false);
          router.refresh();
        } else {
           toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-600" />
            Promotions & Coupons
          </h1>
          <p className="text-gray-500 mt-1">Create discount codes for your sales team and marketing campaigns.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Code</th>
                <th className="font-semibold px-6 py-4">Discount</th>
                <th className="font-semibold px-6 py-4">Status</th>
                <th className="font-semibold px-6 py-4">Usage</th>
                <th className="font-semibold px-6 py-4">Expires</th>
                <th className="font-semibold px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Ticket className="h-10 w-10 text-gray-300 mb-3" />
                      <p>No promotions created yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold tracking-wider">
                        {promo.code}
                      </span>
                      {promo.description && <p className="text-xs text-gray-500 mt-1">{promo.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{promo.discountPercent}% OFF</span>
                    </td>
                    <td className="px-6 py-4">
                      {promo.isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <span>{promo.usageCount || 0}</span>
                        {promo.usageLimit && <span className="text-gray-400">/ {promo.usageLimit}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button onClick={() => openEditModal(promo)} variant="ghost" size="icon" className="text-gray-400 hover:text-indigo-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {promo.isActive ? (
                        <Button onClick={() => handleDisable(promo.id)} variant="ghost" size="icon" className="text-gray-400 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button onClick={() => openEditModal(promo)} variant="ghost" size="icon" className="text-gray-400 hover:text-emerald-600">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code</Label>
              <Input
                id="code"
                placeholder="e.g. SUMMER50"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="font-mono uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discountPercent">Discount Percentage (%)</Label>
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the promotion"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Expiration Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Promotion is Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : (editingPromo ? "Save Changes" : "Create Promotion")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
