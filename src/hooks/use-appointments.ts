"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  reminderSent: boolean;
  reviewRequested: boolean;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface AppointmentInput {
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
  status?: string;
}

export function useAppointments(date?: Date, month?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (date) {
        params.append("date", date.toISOString().split("T")[0]);
      }
      if (month) {
        params.append("month", month);
      }

      const response = await fetch(`/api/appointments?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [date, month]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (data: AppointmentInput) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }

      const newAppointment = await response.json();
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      fetchAppointments();
      return newAppointment;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateAppointment = async (id: string, data: Partial<AppointmentInput>) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      const updated = await response.json();
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      fetchAppointments();
      return updated;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      fetchAppointments();
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
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
}

export function useTodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments/today");
      
      if (!response.ok) {
        throw new Error("Failed to fetch today's appointments");
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  return { appointments, loading, refetch: fetchTodayAppointments };
}