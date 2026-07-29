"use client";

import { useState } from "react";
import { PatientTable } from "@/components/patients/patient-table";
import { PatientForm } from "@/components/patients/patient-form";
import { usePatients } from "@/hooks/use-patients";
import { useSession } from "next-auth/react";
import { Plus, Users, UserCheck, UserX, Download } from "lucide-react";

export default function PatientsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const {
    patients,
    pagination,
    loading,
    createPatient,
    updatePatient,
    deletePatient,
    refetch,
  } = usePatients(searchQuery, undefined, activeTab, page);

  const handleCreate = () => {
    setSelectedPatient(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (patient: any) => {
    setSelectedPatient(patient);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (formMode === "create") {
      await createPatient(data);
    } else {
      await updatePatient(selectedPatient.id, data);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePatient(id);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleExport = () => {
    window.location.href = "/api/patients/export";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200 shrink-0">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patients Directory</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage clinical records and patient treatment histories
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {session?.user?.role === "DOCTOR" && (
            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Patient
          </button>
        </div>
      </div>


      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex items-center px-6 pt-2 overflow-x-auto">
          {[
            { id: "ALL", label: "All Patients" },
            { id: "ACTIVE", label: "Active Patients" },
            { id: "INACTIVE", label: "Inactive" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <PatientTable
          patients={patients}
          loading={loading}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
          onRefresh={refetch}
        />
      </div>

      <PatientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={selectedPatient}
        mode={formMode}
      />
    </div>
  );
}