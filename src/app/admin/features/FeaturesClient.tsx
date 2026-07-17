"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Key, Database, Type, List } from "lucide-react";
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

export function FeaturesClient({ initialFeatures }: { initialFeatures: any[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [features, setFeatures] = useState<any[]>(initialFeatures);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeat, setEditingFeat] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    type: "BOOLEAN",
    defaultValue: "false",
  });

  const openCreateModal = () => {
    setEditingFeat(null);
    setFormData({
      name: "",
      key: "",
      description: "",
      type: "BOOLEAN",
      defaultValue: "false",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (feat: any) => {
    setEditingFeat(feat);
    setFormData({
      name: feat.name,
      key: feat.key,
      description: feat.description || "",
      type: feat.type,
      defaultValue: feat.defaultValue,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the feature from ALL packages and clinics.")) return;
    try {
      const res = await fetch(`/api/admin/features/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Feature deleted." });
        setFeatures(features.filter(f => f.id !== id));
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to delete feature", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFeat) {
        const res = await fetch(`/api/admin/features/${editingFeat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast({ title: "Success", description: "Feature updated." });
          const updated = await res.json();
          setFeatures(features.map(f => f.id === updated.id ? updated : f));
          setIsModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/admin/features`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          toast({ title: "Success", description: "Feature created." });
          const created = await res.json();
          setFeatures([created, ...features]);
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast({ title: "Error", description: "Key might already exist.", variant: "destructive" });
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
            Feature Flags
          </h1>
          <p className="text-gray-500 mt-1">Manage global system features and their default limits.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Feature
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">Feature Name</th>
                <th className="font-semibold px-6 py-4">Key</th>
                <th className="font-semibold px-6 py-4">Type</th>
                <th className="font-semibold px-6 py-4">Default Value</th>
                <th className="font-semibold px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {features.map((feat) => (
                <tr key={feat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{feat.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{feat.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600">
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded w-fit">
                      <Key className="h-3 w-3" />
                      {feat.key}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                      feat.type === 'NUMBER' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {feat.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {feat.defaultValue}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(feat)} className="text-gray-500 hover:text-indigo-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(feat.id)} className="text-gray-500 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {features.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No features configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFeat ? "Edit Feature" : "Create New Feature"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="e.g. Max AI Agents"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="key">Unique Key</Label>
              <Input
                id="key"
                placeholder="e.g. max_ai_agents"
                value={formData.key}
                disabled={!!editingFeat}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className="font-mono"
                required
              />
              {!editingFeat && <p className="text-xs text-gray-500">Only lowercase letters, numbers, and underscores.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Value Type</Label>
              <select
                id="type"
                value={formData.type}
                disabled={!!editingFeat}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, defaultValue: e.target.value === 'NUMBER' ? '0' : 'false' })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="BOOLEAN">Toggle (Boolean)</option>
                <option value="NUMBER">Limit (Number)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value (Fallback)</Label>
              {formData.type === "BOOLEAN" ? (
                <select
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                >
                  <option value="false">False (Disabled)</option>
                  <option value="true">True (Enabled)</option>
                </select>
              ) : (
                <Input
                  id="defaultValue"
                  type="number"
                  min="0"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this feature control?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : (editingFeat ? "Save Changes" : "Create Feature")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
