"use client";

import { useState, useMemo } from "react";
import { Plus, Check, X, Edit, Copy, Archive, RotateCcw, UserPlus, History, ShieldAlert, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const MODULES = [
  { id: "CLINIC_CORE", name: "Clinic Core", desc: "Essential clinic operations: Patients, Appointments, Billing, Staff, Reviews." },
  { id: "GROWTH_SEO", name: "Growth & SEO", desc: "Acquisition tools: Google Business Profile, Local SEO tracking, Scheduled Posts." },
  { id: "WHATSAPP_CRM", name: "WhatsApp CRM", desc: "Patient communication: WhatsApp Inbox, Announcements." },
  { id: "AI_ASSISTANT", name: "AI Assistant", desc: "Unified AI for bookings, reviews, profile updates, and ranking." }
];

const LIMITS = [
  { id: "MAX_STAFF_SEATS", name: "Staff Seats" },
  { id: "MAX_PATIENTS", name: "Max Patients" },
  { id: "MAX_GBP_LOCATIONS", name: "GBP Locations" },
  { id: "MAX_TRACKED_KEYWORDS", name: "Tracked Keywords" },
  { id: "MAX_SCHEDULED_POSTS", name: "Scheduled Posts / Month" },
  { id: "AI_CREDITS_PER_MONTH", name: "AI Credits / Month" },
];

export function PackagesClient({ initialPackages, doctors }: { initialPackages: any[], doctors: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>(initialPackages);
  const [activeTab, setActiveTab] = useState("active");

  const activePackages = packages.filter(p => !p.isArchived);
  const archivedPackages = packages.filter(p => p.isArchived);

  // Package Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    modules: [] as string[],
    limits: {} as Record<string, number | null>, // null means unlimited
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: !editingPkg ? generateSlug(newName) : prev.slug
    }));
  };

  const openCreateModal = () => {
    setEditingPkg(null);
    const initialLimits: Record<string, number | null> = {};
    LIMITS.forEach(l => { initialLimits[l.id] = null; }); // default unlimited

    setFormData({
      slug: "",
      name: "",
      description: "",
      priceMonthly: 0,
      priceQuarterly: 0,
      priceYearly: 0,
      modules: ["CLINIC_CORE"],
      limits: initialLimits,
    });
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPkg(pkg);
    const initialLimits: Record<string, number | null> = {};
    LIMITS.forEach(l => {
      const existing = pkg.limits?.find((pl: any) => pl.limitName === l.id);
      initialLimits[l.id] = existing ? existing.limitValue : null;
    });

    setFormData({
      slug: pkg.slug || "",
      name: pkg.name,
      description: pkg.description || "",
      priceMonthly: pkg.priceMonthly || 0,
      priceQuarterly: pkg.priceQuarterly || 0,
      priceYearly: pkg.priceYearly || 0,
      modules: pkg.modules?.map((m: any) => m.moduleName) || [],
      limits: initialLimits,
    });
    setShowAdvanced(false);
    setIsModalOpen(true);
  };

  const handleToggleModule = (modId: string) => {
    setFormData(prev => {
      const isSelected = prev.modules.includes(modId);
      if (isSelected) return { ...prev, modules: prev.modules.filter(m => m !== modId) };
      return { ...prev, modules: [...prev.modules, modId] };
    });
  };

  const handleLimitChange = (limitId: string, val: number | null) => {
    setFormData(prev => ({
      ...prev,
      limits: { ...prev.limits, [limitId]: val }
    }));
  };

  const submitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const limitsArray = Object.keys(formData.limits).map(limitName => ({
      limitName,
      limitValue: formData.limits[limitName]
    }));

    const payload = {
      ...formData,
      limits: limitsArray
    };

    try {
      if (editingPkg) {
        const res = await fetch(`/api/admin/subscriptions/packages/${editingPkg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPackages(packages.map(p => p.id === updated.id ? updated : p));
          toast({ title: "Success", description: "Package updated successfully." });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast({ title: "Error", description: (await res.json()).error || "Failed to update", variant: "destructive" });
        }
      } else {
        const res = await fetch(`/api/admin/subscriptions/packages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPackages([...packages, created]);
          toast({ title: "Success", description: "Package created successfully." });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast({ title: "Error", description: (await res.json()).error || "Failed to create", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Clone Package
  const handleClone = async (pkg: any) => {
    try {
      const newSlug = `${pkg.slug}-clone-${Date.now().toString().slice(-4)}`;
      const res = await fetch(`/api/admin/subscriptions/packages/${pkg.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug, name: `${pkg.name} (Clone)` }),
      });
      if (res.ok) {
        const cloned = await res.json();
        setPackages([...packages, cloned]);
        toast({ title: "Success", description: "Package cloned successfully." });
      } else {
        toast({ title: "Error", description: (await res.json()).error || "Failed to clone", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  // Archive / Restore
  const handleToggleState = async (pkg: any, isArchiving: boolean) => {
    if (isArchiving && pkg._count?.doctors > 0) {
      toast({ title: "Action Denied", description: "Cannot deactivate a package that is assigned to doctors.", variant: "destructive" });
      return;
    }

    try {
      const action = isArchiving ? "archive" : "restore";
      const res = await fetch(`/api/admin/subscriptions/packages/${pkg.id}/${action}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const updated = await res.json();
        setPackages(packages.map(p => p.id === pkg.id ? updated : p));
        toast({ title: "Success", description: `Package ${isArchiving ? 'deactivated' : 'restored'}.` });
      } else {
        toast({ title: "Error", description: (await res.json()).error || "Action failed", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    }
  };

  // Assign Doctor Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetPackage, setTargetPackage] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ doctorId: "", reason: "" });
  const [assignLoading, setAssignLoading] = useState(false);
  const [historyResult, setHistoryResult] = useState<any>(null);

  const openAssignModal = (pkg: any) => {
    setTargetPackage(pkg);
    setAssignForm({ doctorId: "", reason: "" });
    setHistoryResult(null);
    setAssignModalOpen(true);
  };

  const selectedDoctorInfo = useMemo(() => {
    if (!assignForm.doctorId) return null;
    return doctors.find(d => d.id === assignForm.doctorId);
  }, [assignForm.doctorId, doctors]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.doctorId) return;
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/doctors/${assignForm.doctorId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: targetPackage.id, reason: assignForm.reason }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryResult(data.historyRecord);
        toast({ title: "Success", description: "Package assigned successfully." });
        
        // update packages counts locally
        setPackages(packages.map(p => {
          if (p.id === targetPackage.id) return { ...p, _count: { doctors: (p._count?.doctors || 0) + 1 } };
          if (p.id === selectedDoctorInfo?.packageId) return { ...p, _count: { doctors: Math.max((p._count?.doctors || 1) - 1, 0) } };
          return p;
        }));
        
        // Update doctors locally
        const idx = doctors.findIndex(d => d.id === assignForm.doctorId);
        if (idx !== -1) {
          doctors[idx].packageId = targetPackage.id;
          doctors[idx].package = { name: targetPackage.name };
        }
      } else {
        toast({ title: "Error", description: (await res.json()).error || "Assignment failed", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setAssignLoading(false);
    }
  };


  const renderPackageCard = (pkg: any) => (
    <Card key={pkg.id} className={`flex flex-col relative ${pkg.isArchived ? 'opacity-75 bg-gray-50' : ''}`}>
      {!pkg.isActive && !pkg.isArchived && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md z-10">
          INACTIVE CLONE
        </div>
      )}
      {pkg.isArchived && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md z-10">
          DEACTIVATED
        </div>
      )}
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold uppercase">{pkg.name}</CardTitle>
            <CardDescription className="h-10 mt-1">{pkg.description}</CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">${pkg.priceMonthly}</span>
            <span className="text-sm font-medium text-gray-500">/mo</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Yearly: ${pkg.priceYearly} | Quarterly: ${pkg.priceQuarterly}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-6 flex flex-col gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Included Modules</h4>
          <div className="flex flex-wrap gap-2">
            {pkg.modules?.map((m: any) => {
              const modInfo = MODULES.find(x => x.id === m.moduleName);
              return <Badge key={m.moduleName} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">{modInfo?.name || m.moduleName}</Badge>;
            })}
            {(!pkg.modules || pkg.modules.length === 0) && <span className="text-sm text-gray-400 italic">No modules enabled</span>}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Usage Limits</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {LIMITS.map(l => {
              const val = pkg.limits?.find((pl: any) => pl.limitName === l.id)?.limitValue;
              const displayVal = val === null || val === undefined ? "Unlimited" : val;
              return (
                <li key={l.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                  <span>{l.name}</span>
                  <span className={`font-semibold ${displayVal === "Unlimited" ? "text-emerald-600" : "text-gray-900"}`}>
                    {displayVal}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 bg-gray-50 border-t pt-4">
        <div className="w-full flex items-center justify-between text-sm text-gray-600 px-1 mb-2">
          <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Assigned Doctors</span>
          <span className="font-bold text-gray-900">{pkg._count?.doctors || 0}</span>
        </div>
        <div className="w-full grid grid-cols-2 gap-2">
          {!pkg.isArchived && (
            <Button variant="default" className="col-span-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => openAssignModal(pkg)}>
              Assign to Doctor
            </Button>
          )}
          <Button variant="outline" onClick={() => openEditModal(pkg)}>
            <Edit className="h-4 w-4 mr-2 text-gray-500" /> Edit
          </Button>
          <Button variant="outline" onClick={() => handleClone(pkg)}>
            <Copy className="h-4 w-4 mr-2 text-gray-500" /> Clone
          </Button>
          <Button variant="outline" className="col-span-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => router.push(`/admin/packages/${pkg.id}/pricing`)}>
            <Globe className="h-4 w-4 mr-2" /> Manage Country Pricing
          </Button>
          {!pkg.isArchived ? (
            <Button variant="outline" className="col-span-2 text-rose-600 hover:bg-rose-50" onClick={() => handleToggleState(pkg, true)}>
              <Archive className="h-4 w-4 mr-2" /> Deactivate Package
            </Button>
          ) : (
             <Button variant="outline" className="col-span-2 text-emerald-600 hover:bg-emerald-50" onClick={() => handleToggleState(pkg, false)}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restore Package
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );


  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Package Builder</h1>
          <p className="text-gray-500 mt-1">Design and manage subscription tiers using capabilities and volume limits.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create New Package
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger value="active" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            Active Packages ({activePackages.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-gray-100">
            Deactivated ({archivedPackages.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activePackages.map(renderPackageCard)}
          </div>
          {activePackages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
              <p className="text-gray-500">No active packages found.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="archived" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {archivedPackages.map(renderPackageCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* PACKAGE BUILDER MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50 p-0">
          <div className="p-6">
            <DialogHeader className="bg-white p-6 pb-4 border-b -mx-6 -mt-6 mb-6 sticky top-0 z-10 shadow-sm">
              <DialogTitle className="text-2xl">{editingPkg ? "Edit Package" : "Create Package"}</DialogTitle>
            </DialogHeader>
          <form onSubmit={submitPackage} className="space-y-8 px-2 pb-8">
            
            {/* Section 1: Basic Info */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">1. Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package Name</Label>
                  <Input placeholder="e.g. Starter Plan" value={formData.name} onChange={handleNameChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Tagline or short desc" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-gray-500">
                  {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings (Slug)"}
                </Button>
                {showAdvanced && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border space-y-2">
                    <Label className="text-xs">System Slug (Auto-generated, used for idempotency)</Label>
                    <Input className="text-sm font-mono bg-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required disabled={!!editingPkg} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Monthly Price ($)</Label>
                  <Input type="number" min="0" value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>Quarterly Price ($)</Label>
                  <Input type="number" min="0" value={formData.priceQuarterly} onChange={e => setFormData({...formData, priceQuarterly: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price ($)</Label>
                  <Input type="number" min="0" value={formData.priceYearly} onChange={e => setFormData({...formData, priceYearly: Number(e.target.value)})} required />
                </div>
              </div>
            </div>

            {/* Section 2: Included Modules */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">2. Included Modules</h3>
              <p className="text-sm text-gray-500">Select the high-level capabilities this package provides.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map(mod => {
                  const isSelected = formData.modules.includes(mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      onClick={() => handleToggleModule(mod.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-200'}`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{mod.name}</h4>
                        <p className="text-sm text-gray-500 mt-1 leading-snug">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Usage Limits */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">3. Usage Limits</h3>
              <p className="text-sm text-gray-500">Configure constraints for resources. Toggle 'Unlimited' to remove the ceiling.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {LIMITS.map(limit => {
                  const val = formData.limits[limit.id];
                  const isUnlimited = val === null;
                  
                  return (
                    <div key={limit.id} className="p-4 rounded-lg bg-gray-50 border space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-gray-700">{limit.name}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Unlimited</span>
                          <Switch 
                            checked={isUnlimited} 
                            onCheckedChange={(checked) => {
                              handleLimitChange(limit.id, checked ? null : 0);
                            }} 
                          />
                        </div>
                      </div>
                      {!isUnlimited && (
                        <div className="pt-2">
                          <Input 
                            type="number" 
                            min="0"
                            value={val || 0} 
                            onChange={(e) => handleLimitChange(limit.id, Number(e.target.value))}
                            className="bg-white"
                          />
                        </div>
                      )}
                      {isUnlimited && (
                        <div className="pt-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md py-2 px-3 text-center">
                          ∞ Unlimited Volume
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-gray-50 pb-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                {loading ? "Saving..." : (editingPkg ? "Save Package" : "Create Package")}
              </Button>
            </div>

          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* DOCTOR ASSIGNMENT DIALOG */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Package to Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {!historyResult ? (
              <form onSubmit={handleAssign} className="space-y-6">
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-md shadow-sm border border-indigo-100">
                    <span className="text-xs font-bold text-gray-500 block">NEW PACKAGE</span>
                    <span className="text-lg font-extrabold text-indigo-700 uppercase">{targetPackage?.name}</span>
                  </div>
                  <div className="text-sm text-indigo-800">
                    You are about to assign this package to a doctor. This will generate an immutable subscription history record.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <select 
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    value={assignForm.doctorId}
                    onChange={e => setAssignForm({...assignForm, doctorId: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select a doctor...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.email}) - {d.clinicName || 'No Clinic'}</option>
                    ))}
                  </select>
                </div>

                {selectedDoctorInfo && (
                  <div className="p-3 bg-gray-50 rounded-md border text-sm flex justify-between items-center">
                    <span className="text-gray-500">Current Package:</span>
                    <Badge variant="outline" className={selectedDoctorInfo.package?.name ? "bg-white" : "bg-red-50 text-red-600"}>
                      {selectedDoctorInfo.package?.name || "NONE (Unassigned)"}
                    </Badge>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Reason for Change (Audit Trail)</Label>
                  <Textarea 
                    placeholder="e.g. Upgraded via sales call, fixing billing issue..."
                    value={assignForm.reason}
                    onChange={e => setAssignForm({...assignForm, reason: e.target.value})}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={assignLoading || !assignForm.doctorId} className="bg-indigo-600 hover:bg-indigo-700">
                    {assignLoading ? "Processing..." : "Confirm Assignment"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Assignment Complete!</h3>
                
                <div className="text-left bg-gray-50 p-4 rounded-xl border mt-6 space-y-3 shadow-inner">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2 pb-2 border-b">
                    <History className="w-4 h-4" />
                    Immutable History Record Created
                  </div>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Record ID:</span>
                    <span className="col-span-2 font-mono text-xs">{historyResult.id}</span>
                    
                    <span className="text-gray-500">Doctor ID:</span>
                    <span className="col-span-2 font-mono text-xs">{historyResult.doctorId}</span>
                    
                    <span className="text-gray-500">Timestamp:</span>
                    <span className="col-span-2 font-medium">{new Date(historyResult.createdAt).toLocaleString()}</span>
                    
                    <span className="text-gray-500">Admin Role:</span>
                    <span className="col-span-2 font-medium"><Badge variant="outline">{historyResult.changedByRole}</Badge></span>
                    
                    <span className="text-gray-500">Reason:</span>
                    <span className="col-span-2 text-gray-900 italic">"{historyResult.reason}"</span>
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={() => setAssignModalOpen(false)}>Close Window</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
