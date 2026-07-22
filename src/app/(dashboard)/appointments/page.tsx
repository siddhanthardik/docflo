"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Clock,
  User,
  Phone,
  CalendarDays,
  X,
  MoreVertical,
} from "lucide-react";
import { format, isToday, isSameDay } from "date-fns";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

function getAvatarColor(name: string) {
  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
    "bg-sky-100 text-sky-700",
    "bg-pink-100 text-pink-700",
  ];
  const code = (name || "?").charCodeAt(0);
  return colors[code % colors.length];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-indigo-50 text-indigo-700",
    CHECKED_IN: "bg-sky-50 text-sky-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
    NO_SHOW: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? "bg-gray-50 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [patients, setPatients] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>("all");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all upcoming appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/appointments?future=true&status=CONFIRMED,CHECKED_IN");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for the form
  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients?limit=100");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch practitioners
  const fetchPractitioners = async () => {
    try {
      const res = await fetch("/api/practitioners");
      if (res.ok) {
        const data = await res.json();
        setPractitioners(data.filter((p: any) => p.isActive));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchPractitioners();
  }, []);

  // Filter appointments by selected date & practitioner
  const filteredAppointments = useMemo(() => {
    let result = appointments;
    if (selectedPractitionerId !== "all") {
      result = result.filter(apt => apt.practitionerId === selectedPractitionerId);
    }
    if (selectedDate) {
      result = result.filter((apt) => isSameDay(new Date(apt.date), selectedDate));
    }
    return result;
  }, [appointments, selectedDate, selectedPractitionerId]);

  const appointmentDates = useMemo(() => {
    let result = appointments;
    if (selectedPractitionerId !== "all") {
      result = result.filter(apt => apt.practitionerId === selectedPractitionerId);
    }
    return result.map((apt) => {
      const d = new Date(apt.date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    });
  }, [appointments, selectedPractitionerId]);

  const todayCount = useMemo(
    () => {
      let result = appointments;
      if (selectedPractitionerId !== "all") {
        result = result.filter(apt => apt.practitionerId === selectedPractitionerId);
      }
      return result.filter((a) => isToday(new Date(a.date))).length;
    },
    [appointments, selectedPractitionerId]
  );

  const handleCreate = () => {
    setSelectedAppointment(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (apt: any) => {
    setSelectedAppointment(apt);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    const payload = {
      patientId: data.patientId,
      date: data.date.toISOString().split("T")[0],
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      notes: data.notes,
      practitionerId: data.practitionerId,
    };

    const url =
      formMode === "create"
        ? "/api/appointments"
        : `/api/appointments/${selectedAppointment.id}`;
    const method = formMode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast({
        title: `Appointment ${formMode === "create" ? "created" : "updated"} successfully`,
      });
      fetchAppointments();
    } else {
      const err = await res.json();
      toast({
        title: "Error",
        description: err.error || "Failed",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200 shrink-0">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage upcoming patient appointments
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {practitioners.length > 1 && (
            <select
              value={selectedPractitionerId}
              onChange={(e) => setSelectedPractitionerId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Practitioners</option>
              {practitioners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Upcoming
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-100" />
                ) : (
                  appointments.length
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Today
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-100" />
                ) : (
                  todayCount
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <User className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {selectedDate ? "Filtered" : "Showing"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-100" />
                ) : (
                  filteredAppointments.length
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Calendar Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
              <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              Filter by Date
            </h2>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) =>
              setSelectedDate(
                selectedDate && date && isSameDay(selectedDate, date)
                  ? undefined
                  : date
              )
            }
            modifiers={{ appointment: appointmentDates }}
            modifiersStyles={{
              appointment: {
                backgroundColor: "#eef2ff",
                color: "#4338ca",
                fontWeight: "bold",
                borderRadius: "6px",
              },
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="w-full"
          />
          {selectedDate && (
            <button
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedDate(undefined)}
            >
              <X className="h-3.5 w-3.5" />
              Clear filter
            </button>
          )}
        </div>

        {/* Appointments List Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* Card Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "All Upcoming Appointments"}
            </h2>
            <span className="ml-auto bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {filteredAppointments.length}
            </span>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-50 animate-pulse rounded-xl border border-gray-100"
                  />
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">
                  No upcoming appointments
                </p>
                <p className="text-xs text-gray-400 mb-5">
                  {selectedDate
                    ? "No appointments on this date."
                    : "Schedule your first appointment to get started."}
                </p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Schedule One
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const initials = `${apt.patient.firstName?.[0] ?? ""}${apt.patient.lastName?.[0] ?? ""}`.toUpperCase();
                  const avatarColor = getAvatarColor(apt.patient.firstName ?? "");
                  const todayHighlight = isToday(new Date(apt.date));

                  return (
                    <div
                      key={apt.id}
                      className={`flex items-start justify-between rounded-xl border px-4 py-3.5 transition-colors hover:bg-gray-50 ${
                        todayHighlight
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-gray-100 bg-white"
                      }`}
                      style={apt.practitioner?.calendarColor && !todayHighlight ? { borderLeft: `4px solid ${apt.practitioner.calendarColor}` } : {}}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}
                        >
                          {initials}
                        </div>

                        <div className="flex-1">
                          {/* Time row */}
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                              <Clock className="h-3.5 w-3.5 text-indigo-400" />
                              {format(new Date(apt.startTime), "h:mm a")} —{" "}
                              {format(new Date(apt.endTime), "h:mm a")}
                            </div>
                            <StatusBadge status={apt.status} />
                            {todayHighlight && (
                              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                Today
                              </span>
                            )}
                          </div>

                          {/* Patient name */}
                          <div className="flex items-center gap-1.5 mb-0.5 mt-1">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {apt.patient.firstName} {apt.patient.lastName}
                            </span>
                          </div>

                          {/* Practitioner name */}
                          {practitioners.length > 1 && apt.practitioner && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: apt.practitioner.calendarColor }}></span>
                              {apt.practitioner.name}
                            </div>
                          )}

                          {/* Phone */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {apt.patient.phone}
                          </div>

                          {/* Reason */}
                          {apt.reason && (
                            <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                              <span className="font-medium text-gray-700">
                                Reason:
                              </span>{" "}
                              {apt.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {(apt.status === "CONFIRMED" || apt.status === "CHECKED_IN") && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(apt.id, "COMPLETED")
                                }
                              >
                                ✓ Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(apt.id, "NO_SHOW")
                                }
                              >
                                ⊘ Mark No Show
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(apt.id, "CANCELLED")
                                }
                              >
                                ✕ Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(apt)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(apt.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Form Modal */}
      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        patients={patients}
        initialData={selectedAppointment}
        mode={formMode}
      />
    </div>
  );
}