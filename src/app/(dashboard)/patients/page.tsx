"use client";

import { useState } from "react";
import { PatientTable } from "@/components/patients/patient-table";
import { PatientForm } from "@/components/patients/patient-form";
import { usePatients } from "@/hooks/use-patients";
import { Plus, Users, UserCheck, UserX } from "lucide-react";

export default function PatientsPage() {
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
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add New Patient
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div 
          onClick={() => handleTabChange("ALL")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${activeTab === "ALL" ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20" : "bg-white border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Patients
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === "ALL" ? pagination.totalCount : "--"}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => handleTabChange("ACTIVE")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${activeTab === "ACTIVE" ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20" : "bg-white border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active Patients
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === "ACTIVE" ? pagination.totalCount : "--"}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => handleTabChange("INACTIVE")}
          className={`cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${activeTab === "INACTIVE" ? "bg-white border-amber-500 ring-2 ring-amber-500/20" : "bg-white border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <UserX className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Inactive Patients
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === "INACTIVE" ? pagination.totalCount : "--"}
              </p>
            </div>
          </div>
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