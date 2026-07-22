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
import { Badge } from "@/components/ui/badge";
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
import { MoreHorizontal, Search, Phone, Mail, UserPlus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => Promise<void>;
  onCreate: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function PatientTable({
  patients,
  loading,
  onEdit,
  onDelete,
  onCreate,
  searchQuery,
  onSearchChange,
}: PatientTableProps) {
  const router = useRouter();
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

  // Removed early return for loading to prevent screen blanking during search
  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-center p-6 border-b border-gray-100 bg-white rounded-t-xl">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search patients by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-12 h-12 w-full bg-gray-50/50 border-gray-200 focus-visible:ring-indigo-500 rounded-xl text-sm shadow-sm transition-all hover:bg-white"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
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
            <Button onClick={onCreate} className="mt-4">
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
                <TableHead className="font-semibold text-gray-600">Contact</TableHead>
                <TableHead className="font-semibold text-gray-600">Gender</TableHead>
                <TableHead className="font-semibold text-gray-600">Practitioner</TableHead>
                <TableHead className="font-semibold text-gray-600">Last Visit</TableHead>
                <TableHead className="font-semibold text-gray-600">Tags</TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
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
                          {patient.patientType && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                                patient.patientType === "LEAD" ? "bg-purple-100 text-purple-700" :
                                patient.patientType === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                                patient.patientType === "INACTIVE" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}
                            >
                              {patient.patientType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Added {formatDate(new Date(patient.createdAt))}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-gray-400" />
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-2" />
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
                        ? formatDate(
                            new Date(patient.appointments[0].date)
                          )
                        : "No visits"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      {patient.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600 bg-white shadow-sm border border-gray-100" onClick={(e) => { e.stopPropagation(); onEdit(patient); }}>
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
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteId(patient.id); }}>
                            Delete Patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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