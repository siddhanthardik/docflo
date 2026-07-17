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

export function PackagesClient({ initialPackages, featureFlags }: { initialPackages: any[], featureFlags: any[] }) {
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
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    isActive: true,
    features: [] as { featureId: string, isEnabled: boolean, limit: number | null }[],
  });

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormData({
      name: "",
      description: "",
      priceMonthly: 0,
      priceQuarterly: 0,
      priceYearly: 0,
      isActive: true,
      features: featureFlags.map(f => ({
        featureId: f.id,
        isEnabled: false,
        limit: f.type === "NUMBER" ? 0 : null
      })),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPkg(pkg);
    const existingFeatures = pkg.packageFeatures || [];
    
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      priceMonthly: pkg.priceMonthly || 0,
      priceQuarterly: pkg.priceQuarterly || 0,
      priceYearly: pkg.priceYearly || 0,
      isActive: pkg.isActive,
      features: featureFlags.map(f => {
        const existing = existingFeatures.find((ef: any) => ef.featureId === f.id);
        if (existing) {
          return { featureId: f.id, isEnabled: existing.isEnabled, limit: existing.limit };
        }
        return { featureId: f.id, isEnabled: false, limit: f.type === "NUMBER" ? 0 : null };
      }),
    });
    setIsModalOpen(true);
  };

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(f => f.featureId === featureId ? { ...f, isEnabled: checked } : f)
    }));
  };

  const handleFeatureLimit = (featureId: string, limit: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(f => f.featureId === featureId ? { ...f, limit } : f)
    }));
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
      ...formData,
      priceMonthly: Number(formData.priceMonthly),
      priceQuarterly: Number(formData.priceQuarterly),
      priceYearly: Number(formData.priceYearly),
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
          setPackages([...packages, created].sort((a,b) => a.priceMonthly - b.priceMonthly));
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
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">${pkg.priceMonthly}</span>
                    <span className="text-sm font-medium text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Quarterly: ${pkg.priceQuarterly} / Yearly: ${pkg.priceYearly}
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1 text-sm text-gray-600">
                  {featureFlags.map(ff => {
                    const feat = pkg.packageFeatures?.find((pf: any) => pf.featureId === ff.id);
                    const isEnabled = feat?.isEnabled || false;
                    const limit = feat?.limit;

                    return (
                      <li key={ff.id} className="flex items-center gap-2">
                        {isEnabled ? (
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-rose-500 flex-shrink-0" />
                        )}
                        <span>
                          {ff.name} 
                          {ff.type === "NUMBER" && isEnabled && (
                            <span className="text-xs font-bold ml-1 bg-gray-100 px-2 py-0.5 rounded">
                              {limit === 0 ? "Unlimited" : limit}
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                />
                <span className="text-sm font-medium">Package is Active</span>
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

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly Price ($)</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  min="0"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceQuarterly">Quarterly Price ($)</Label>
                <Input
                  id="priceQuarterly"
                  type="number"
                  min="0"
                  value={formData.priceQuarterly}
                  onChange={(e) => setFormData({ ...formData, priceQuarterly: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Yearly Price ($)</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  min="0"
                  value={formData.priceYearly}
                  onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Features Mapping</h3>
              <p className="text-xs text-gray-500">Toggle which features are available in this package.</p>
              
              <div className="grid grid-cols-2 gap-4">
                {featureFlags.map(ff => {
                  const val = formData.features.find(f => f.featureId === ff.id);
                  const isChecked = val?.isEnabled || false;

                  return (
                    <div key={ff.id} className="border p-3 rounded-lg flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleFeatureToggle(ff.id, e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium">{ff.name}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase ml-auto">
                          {ff.type}
                        </span>
                      </label>
                      {ff.type === "NUMBER" && (
                        <div className="pl-6 pt-2">
                          <Label className="text-xs text-gray-500 mb-1 block">Limit (0 for unlimited)</Label>
                          <Input 
                            type="number"
                            min="0"
                            disabled={!isChecked}
                            value={val?.limit || 0}
                            onChange={(e) => handleFeatureLimit(ff.id, Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
