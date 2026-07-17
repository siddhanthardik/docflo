"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, ShieldAlert, User, Shield, AlertTriangle, Pen, Trash2, ShieldOff, ShieldCheck } from "lucide-react"

export function StaffManagement({ initialStaff }: { initialStaff: any[] }) {
  const { toast } = useToast()
  const [staff, setStaff] = useState(initialStaff)
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Selected staff for edit/delete
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  
  // Form state
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "RECEPTIONIST" })
  const [editForm, setEditForm] = useState({ name: "", role: "", password: "" })

  const fetchStaff = async () => {
    // Re-fetch staff (or rely on state updates for simplicity)
    const res = await fetch("/api/staff", { method: "GET" })
    if(res.ok) {
        // Wait, /api/staff GET doesn't exist yet, we rely on page reload or state updates
        // To be safe, we just update local state instead of fetching since we didn't build GET
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const newMember = await res.json()
        setStaff([...staff, newMember])
        setForm({ email: "", password: "", name: "", role: "RECEPTIONIST" })
        setIsAddOpen(false)
        toast({ title: "Staff member added successfully" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: editForm.name,
            role: editForm.role,
            ...(editForm.password ? { password: editForm.password } : {}) // Only send password if changed
        }),
      })
      if (res.ok) {
        const updatedMember = await res.json()
        setStaff(staff.map(s => s.id === updatedMember.id ? updatedMember : s))
        setIsEditOpen(false)
        toast({ title: "Staff member updated" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (staffMember: any) => {
    try {
      const newStatus = !staffMember.isActive
      const res = await fetch(`/api/staff/${staffMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (res.ok) {
        const updatedMember = await res.json()
        setStaff(staff.map(s => s.id === updatedMember.id ? updatedMember : s))
        toast({ title: `Staff member ${newStatus ? 'activated' : 'suspended'}` })
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!selectedStaff) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setStaff(staff.filter(s => s.id !== selectedStaff.id))
        setIsDeleteOpen(false)
        toast({ title: "Staff member removed" })
      } else {
        const err = await res.json()
        toast({ title: "Error", description: err.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (staffMember: any) => {
    setSelectedStaff(staffMember)
    setEditForm({ name: staffMember.name, role: staffMember.role, password: "" })
    setIsEditOpen(true)
  }

  const openDelete = (staffMember: any) => {
    setSelectedStaff(staffMember)
    setIsDeleteOpen(true)
  }

  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case 'MANAGER':
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full"><Shield className="h-3 w-3" /> Manager</span>
      case 'NURSE':
        return <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-0.5 rounded-full"><User className="h-3 w-3" /> Nurse</span>
      case 'RECEPTIONIST':
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full"><User className="h-3 w-3" /> Receptionist</span>
      default:
        return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">{role}</span>
    }
  }

  return (
    <div>
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Directory</CardTitle>
            <CardDescription>Manage access and roles for your clinic staff.</CardDescription>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      No staff members found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{s.name}</span>
                            <span className="text-sm text-gray-500">{s.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={s.role} />
                      </TableCell>
                      <TableCell>
                        {s.isActive ? (
                           <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                        ) : (
                           <span className="inline-flex items-center bg-red-50 text-red-700 text-xs font-medium px-2.5 py-0.5 rounded-full">Suspended</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)} className="cursor-pointer">
                              <Pen className="mr-2 h-4 w-4 text-gray-500" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(s)} className="cursor-pointer">
                              {s.isActive ? (
                                <><ShieldOff className="mr-2 h-4 w-4 text-amber-500" /> Suspend Access</>
                              ) : (
                                <><ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Restore Access</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDelete(s)} className="cursor-pointer text-red-600 focus:text-red-700">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
            <DialogDescription>Create a new account for a staff member to access the clinic dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sarah Jenkins" required />
            </div>
            <div className="space-y-2">
              <Label>Email Address (Login ID)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sarah@clinic.com" required />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPTIONIST">Receptionist (Appointments, Chat)</SelectItem>
                  <SelectItem value="NURSE">Nurse (Patients, Reports)</SelectItem>
                  <SelectItem value="MANAGER">Manager (Full Access)</SelectItem>
                  <SelectItem value="STAFF">Standard Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Adding..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Details</DialogTitle>
            <DialogDescription>Update the role or name of {selectedStaff?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                  <SelectItem value="NURSE">Nurse</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Standard Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reset Password (Optional)</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Remove Staff Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{selectedStaff?.name}</strong> from your clinic? This will revoke their access immediately. If you want to temporarily remove their access, consider suspending them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? "Deleting..." : "Yes, Remove Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}