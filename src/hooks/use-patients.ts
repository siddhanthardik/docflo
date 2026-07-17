"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  medicalNotes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  appointments?: any[];
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function usePatients(search?: string, tag?: string, type?: string, page: number = 1) {
  const { toast } = useToast();   // 👈 use the hook here (allowed inside a custom hook)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search) params.append("search", search);
      if (tag) params.append("tag", tag);
      if (type && type !== "ALL") params.append("type", type);

      const response = await fetch(`/api/patients?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search, tag, type, page, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = async (patientData: Partial<Patient>) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create patient");
      }

      const newPatient = await response.json();
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      fetchPatients();
      return newPatient;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update patient");
      }

      const updatedPatient = await response.json();
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      fetchPatients();
      return updatedPatient;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }

      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      fetchPatients();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    patients,
    pagination,
    loading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients,
  };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch patient");
      }

      const data = await response.json();
      setPatient(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id, fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
}