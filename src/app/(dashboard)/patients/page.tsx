"use client";

import { useState } from "react";
import { PatientTable } from "@/components/patients/patient-table";
import { PatientForm } from "@/components/patients/patient-form";
import { usePatients } from "@/hooks/use-patients";
import { Plus, Users } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your patient records and information
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex items-center px-6 pt-2">
          {["ALL", "LEAD", "ACTIVE", "INACTIVE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "ALL" ? "All Contacts" : tab === "LEAD" ? "Leads" : tab === "ACTIVE" ? "Active Patients" : "Inactive"}
            </button>
          ))}
        </div>
        <PatientTable
          patients={patients}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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