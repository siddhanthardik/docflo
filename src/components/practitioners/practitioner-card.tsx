import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Mail, Edit, Crown, Trash2, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PractitionerCardProps {
  practitioner: any;
  onEdit: () => void;
  onRefresh: () => void;
  allPractitioners: any[];
}

export function PractitionerCard({ practitioner, onEdit, onRefresh, allPractitioners }: PractitionerCardProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleStatus = async () => {
    try {
      const res = await fetch(`/api/practitioners/${practitioner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !practitioner.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Practitioner ${practitioner.isActive ? "deactivated" : "activated"}`);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTransfer = async () => {
    if (!selectedNewOwner) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`/api/practitioners/${selectedNewOwner}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOwner: true }),
      });
      if (!res.ok) throw new Error("Failed to transfer ownership");
      toast.success("Ownership transferred successfully");
      setTransferOpen(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this practitioner?")) {
      try {
        const res = await fetch(`/api/practitioners/${practitioner.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        toast.success("Practitioner deleted");
        onRefresh();
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const eligibleNewOwners = allPractitioners.filter(p => !p.isOwner && p.isActive);

  return (
    <>
      <Card className="flex flex-col relative overflow-hidden bg-white hover:shadow-md transition-shadow border-gray-100 rounded-xl">
        <div 
          className="absolute top-0 left-0 w-1 h-full" 
          style={{ backgroundColor: practitioner.calendarColor || "#cbd5e1" }} 
        />
        <div className="p-5 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3 items-center">
              {practitioner.profileImageUrl ? (
                <img 
                  src={practitioner.profileImageUrl} 
                  alt={practitioner.name} 
                  className="w-12 h-12 rounded-full object-cover border border-gray-100" 
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: practitioner.calendarColor || "#6366f1" }}
                >
                  {getInitials(practitioner.name)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  {practitioner.name}
                  {practitioner.isOwner && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </h3>
                <p className="text-sm text-gray-500">{practitioner.specialty || "General Practice"}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Open menu</span>
                  <div className="flex flex-col gap-0.5 items-center justify-center">
                    <div className="w-1 h-1 bg-current rounded-full" />
                    <div className="w-1 h-1 bg-current rounded-full" />
                    <div className="w-1 h-1 bg-current rounded-full" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                
                {practitioner.isOwner && (
                  <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                    <Crown className="mr-2 h-4 w-4" /> Transfer Ownership
                  </DropdownMenuItem>
                )}

                {!practitioner.isOwner && (
                  <>
                    <DropdownMenuItem onClick={toggleStatus}>
                      {practitioner.isActive ? (
                        <><PowerOff className="mr-2 h-4 w-4 text-amber-600" /> <span className="text-amber-600">Deactivate</span></>
                      ) : (
                        <><Power className="mr-2 h-4 w-4 text-emerald-600" /> <span className="text-emerald-600">Reactivate</span></>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 mb-4">
            {practitioner.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                {practitioner.phone}
              </div>
            )}
            {practitioner.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                {practitioner.email}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-auto">
            {practitioner.isOwner && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Clinic Owner
              </Badge>
            )}
            <Badge variant="outline" className={practitioner.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
              {practitioner.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </Card>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              Select an active practitioner to become the new owner of this clinic. You will lose owner privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select new owner..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleNewOwners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.specialty})</SelectItem>
                ))}
                {eligibleNewOwners.length === 0 && (
                  <SelectItem value="none" disabled>No other active practitioners</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleTransfer} 
              disabled={!selectedNewOwner || selectedNewOwner === "none" || isTransferring}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
