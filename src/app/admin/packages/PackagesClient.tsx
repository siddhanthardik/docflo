"use client";

import { useState } from "react";
import { Plus, Check, X, Edit, Trash2 } from "lucide-react";
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

export function PackagesClient({ initialPackages }: { initialPackages: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>(initialPackages);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    isActive: true,
    maxKeywords: 0,
    whatsappIntegration: false,
    geoGrid: false,
    prioritySupport: false,
    customIntegrations: false,
  });

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      isActive: true,
      maxKeywords: 0,
      whatsappIntegration: false,
      geoGrid: false,
      prioritySupport: false,
      customIntegrations: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPkg(pkg);
    const features = pkg.features || {};
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price,
      isActive: pkg.isActive,
      maxKeywords: features.maxKeywords || 0,
      whatsappIntegration: !!features.whatsappIntegration,
      geoGrid: !!features.geoGrid,
      prioritySupport: !!features.prioritySupport,
      customIntegrations: !!features.customIntegrations,
    });
    setIsModalOpen(true);
  };

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Success", description: "Package disabled successfully." });
        setPackages(packages.map(p => p.id === id ? { ...p, isActive: false } : p));
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to disable package", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      isActive: formData.isActive,
      features: {
        maxKeywords: Number(formData.maxKeywords),
        whatsappIntegration: formData.whatsappIntegration,
        geoGrid: formData.geoGrid,
        prioritySupport: formData.prioritySupport,
        customIntegrations: formData.customIntegrations,
      }
    };

    try {
      if (editingPkg) {
        const res = await fetch(`/api/admin/packages/${editingPkg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast({ title: "Success", description: "Package updated successfully." });
          const updated = await res.json();
          setPackages(packages.map(p => p.id === updated.id ? updated : p));
          setIsModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/admin/packages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast({ title: "Success", description: "Package created successfully." });
          const created = await res.json();
          setPackages([...packages, created].sort((a,b) => a.price - b.price));
          setIsModalOpen(false);
          router.refresh();
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
            Packages & Pricing
          </h1>
          <p className="text-gray-500 mt-1">Manage subscription plans, pricing, and features.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const features = pkg.features as any || {};
          return (
            <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
              {!pkg.isActive && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md z-10">
                  INACTIVE
                </div>
              )}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{pkg.name}</h3>
                <p className="text-sm text-gray-500 mt-1 h-10">{pkg.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">${pkg.price}</span>
                  <span className="text-sm font-medium text-gray-500">/mo</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{features.maxKeywords === 0 ? "No" : features.maxKeywords > 1000 ? "Unlimited" : features.maxKeywords} Local SEO Keywords</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {features.whatsappIntegration ? (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span>WhatsApp Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {features.geoGrid ? (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span>Geo-grid Rank Tracking</span>
                  </li>
                  {features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Priority Support</span>
                    </li>
                  )}
                  {features.customIntegrations && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Custom Integrations</span>
                    </li>
                  )}
                </ul>
                
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Button onClick={() => openEditModal(pkg)} variant="outline" className="w-full" size="sm">
                    <Edit className="h-4 w-4 mr-2 text-gray-500" />
                    Edit
                  </Button>
                  {pkg.isActive ? (
                    <Button onClick={() => handleDisable(pkg.id)} variant="outline" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disable
                    </Button>
                  ) : (
                    <Button onClick={() => openEditModal(pkg)} variant="outline" className="w-full" size="sm">
                       Restore
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Create New Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. STARTER"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the package"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Features & Quotas</h3>
              
              <div className="space-y-2">
                <Label htmlFor="maxKeywords">Max SEO Keywords (9999 for unlimited)</Label>
                <Input
                  id="maxKeywords"
                  type="number"
                  min="0"
                  value={formData.maxKeywords}
                  onChange={(e) => setFormData({ ...formData, maxKeywords: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.whatsappIntegration}
                    onChange={(e) => setFormData({ ...formData, whatsappIntegration: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">WhatsApp Integration</span>
                </label>
                
                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.geoGrid}
                    onChange={(e) => setFormData({ ...formData, geoGrid: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Geo-Grid Tracking</span>
                </label>
                
                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.prioritySupport}
                    onChange={(e) => setFormData({ ...formData, prioritySupport: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Priority Support</span>
                </label>

                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.customIntegrations}
                    onChange={(e) => setFormData({ ...formData, customIntegrations: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">Custom Integrations</span>
                </label>
                
                <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">Package is Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : (editingPkg ? "Save Changes" : "Create Package")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
