"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2, Users, Search, CheckCircle, ShieldAlert, Plus, Link as LinkIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { hasPermission } from "@/lib/permissions";

export default function TeamPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Add Member Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "ADMIN" });

  useEffect(() => {
    if (status === "authenticated") {
      if (!session?.user?.role || !hasPermission(session.user.role, "MANAGE_USERS")) {
        redirect("/");
      } else {
        fetchUsers();
      }
    } else if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "User role updated successfully" });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        throw new Error("Failed to update user");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Team member added successfully" });
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to add team member");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAffiliateLink = (code: string) => {
    const link = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Affiliate link copied to clipboard." });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Team Members
          </h1>
          <p className="text-gray-500 mt-1">Manage superadmins, admins, sales, accounts, and marketing staff.</p>
        </div>
        
        {session?.user?.role === "SUPERADMIN" && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="SALES">SALES</SelectItem>
                      <SelectItem value="ACCOUNTS">ACCOUNTS</SelectItem>
                      <SelectItem value="MARKETING">MARKETING</SelectItem>
                      <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500">
              <tr>
                <th className="font-semibold px-6 py-4">User</th>
                <th className="font-semibold px-6 py-4">Role</th>
                <th className="font-semibold px-6 py-4">Joined Date</th>
                <th className="font-semibold px-6 py-4">Affiliate Info</th>
                <th className="font-semibold px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session?.user?.role === "SUPERADMIN" ? (
                        <Select 
                          value={user.role} 
                          onValueChange={(val) => handleUpdateRole(user.id, val)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="SALES">SALES</SelectItem>
                            <SelectItem value="ACCOUNTS">ACCOUNTS</SelectItem>
                            <SelectItem value="MARKETING">MARKETING</SelectItem>
                            <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'SALES' && user.affiliateCode ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                            {user.affiliateCode}
                          </Badge>
                          <Button variant="ghost" size="icon-sm" onClick={() => copyAffiliateLink(user.affiliateCode)} title="Copy Link">
                            <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-indigo-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {updating === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                      ) : (
                        <Badge variant="outline" className={user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
