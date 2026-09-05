"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Search, Phone, Mail, UserPlus, Users, MessageSquare, ChevronLeft, ChevronRight, UserCheck, UserX, Tag, Filter, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: string;
  tags: string[];
  createdAt: string;
  patientType?: string;
  primaryPractitioner?: {
    id: string;
    name: string;
  };
  appointments?: any[];
}

interface PatientTableProps {
  patients: Patient[];
  loading: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  page?: number;
  onPageChange?: (page: number) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => Promise<void>;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  availableTags?: string[];
  selectedTag?: string;
  onTagSelect?: (tag: string) => void;
  practitioners?: any[];
  selectedPractitionerId?: string;
  onPractitionerChange?: (id: string) => void;
}

export function PatientTable({
  patients,
  loading,
  pagination,
  page = 1,
  onPageChange,
  onEdit,
  onDelete,
  onCreate,
  searchQuery,
  onSearchChange,
  onRefresh,
  availableTags = [],
  selectedTag = "",
  onTagSelect,
  practitioners = [],
  selectedPractitionerId = "ALL",
  onPractitionerChange,
}: PatientTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/patients/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientType: newStatus }),
      });
      if (res.ok) {
        toast({ title: "Status Updated", description: `Patient marked as ${newStatus}` });
        onRefresh?.();
      } else {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-white rounded-t-xl space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 pr-10 h-11 w-full bg-gray-50/70 border-gray-200 focus-visible:ring-indigo-500 rounded-xl text-xs sm:text-sm shadow-2xs transition-all hover:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {loading && !searchQuery && (
              <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Practitioner Filter Selector */}
          {practitioners.length > 0 && onPractitionerChange && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Doctor:
              </span>
              <select
                value={selectedPractitionerId}
                onChange={(e) => onPractitionerChange(e.target.value)}
                className="h-11 px-3 text-xs sm:text-sm font-medium bg-white border border-gray-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Doctors / Clinic Pool</option>
                {practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.specialty ? `(${p.specialty})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tag Filter Bar */}
        {(availableTags.length > 0 || selectedTag) && onTagSelect && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-50">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-indigo-500" /> Tags:
            </span>
            <button
              onClick={() => onTagSelect("")}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                !selectedTag
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Tags
            </button>
            {availableTags.map((t) => {
              const isSelected = selectedTag.toLowerCase() === t.toLowerCase();
              return (
                <button
                  key={t}
                  onClick={() => onTagSelect(isSelected ? "" : t)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span>{t}</span>
                  {isSelected && <X className="w-3 h-3 text-indigo-600 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {patients.length === 0 && !loading ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery
              ? "No patients match your search criteria"
              : "Start by adding your first patient"}
          </p>
          {!searchQuery && (
            <Button onClick={onCreate} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Patient
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-gray-600 pl-6">Patient Name</TableHead>
                <TableHead className="font-semibold text-gray-600">Contact & WhatsApp</TableHead>
                <TableHead className="font-semibold text-gray-600">Gender</TableHead>
                <TableHead className="font-semibold text-gray-600">Doctor</TableHead>
                <TableHead className="font-semibold text-gray-600">Last Visit</TableHead>
                <TableHead className="font-semibold text-gray-600">Tags</TableHead>
                <TableHead className="w-[120px] text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const lastActivityDate = patient.appointments && patient.appointments[0] 
                  ? new Date(patient.appointments[0].date) 
                  : new Date(patient.createdAt);
                const isInactive = patient.patientType === "INACTIVE" || lastActivityDate < oneYearAgo;
                const displayStatus = isInactive ? "INACTIVE" : "ACTIVE";

                return (
                <TableRow
                  key={patient.id}
                  className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-0"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold shadow-sm">
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                              displayStatus === "INACTIVE"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Added {formatDate(new Date(patient.createdAt))}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        {patient.phone}
                        <button
                          title="Open WhatsApp Chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/whatsapp`);
                          }}
                          className="ml-2 p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {patient.email && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {patient.gender || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {patient.primaryPractitioner ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        <Users className="h-3 w-3" />
                        {patient.primaryPractitioner.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {patient.appointments && patient.appointments[0]
                        ? formatDate(new Date(patient.appointments[0].date))
                        : "No visits"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      {patient.tags?.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTagSelect?.(tag);
                          }}
                          title={`Filter by tag: ${tag}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Patient Profile"
                        className="h-8 w-8 text-gray-400 hover:text-indigo-600 bg-white shadow-sm border border-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(patient);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 bg-white shadow-sm border border-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/patients/${patient.id}`); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(patient); }}>
                            Edit Profile
                          </DropdownMenuItem>
                          
                          {patient.patientType === "INACTIVE" ? (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(patient.id, "ACTIVE"); }}>
                              <UserCheck className="h-4 w-4 mr-2 text-emerald-600" />
                              Reactivate Patient
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(patient.id, "INACTIVE"); }}>
                              <UserX className="h-4 w-4 mr-2 text-amber-600" />
                              Mark Inactive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteId(patient.id); }}>
                            Delete Patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium">
                Showing page <span className="font-bold text-gray-900">{pagination.page}</span> of{" "}
                <span className="font-bold text-gray-900">{pagination.totalPages}</span> ({pagination.totalCount} total patients)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot be
              undone. All associated appointments and records will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}