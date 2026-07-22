"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-indigo-50 text-indigo-700",
    CHECKED_IN: "bg-sky-50 text-sky-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
    NO_SHOW: "bg-amber-50 text-amber-700",
  };
  return styles[status] ?? "bg-gray-50 text-gray-700";
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const code = (name || "?").charCodeAt(0);
  return colors[code % colors.length];
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await fetch(`/api/appointments/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchAppointment();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-2" />
        <div className="h-4 w-44 animate-pulse rounded bg-gray-100 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-48 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <CalendarDays className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Appointment not found
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            This appointment may have been removed or doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/appointments")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : "Unknown Patient";
  const initials = appointment.patient
    ? `${appointment.patient.firstName?.[0] ?? ""}${appointment.patient.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  const avatarColor = getAvatarColor(appointment.patient?.firstName ?? "");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <button
        onClick={() => router.push("/appointments")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appointments
      </button>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {appointment.date
                ? format(new Date(appointment.date), "EEEE, MMMM d, yyyy")
                : "—"}
            </p>
          </div>
        </div>
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadge(appointment.status)}`}
        >
          {appointment.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Patient</h2>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold flex-shrink-0 ${avatarColor}`}
            >
              {initials}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                {patientName}
              </p>
              {appointment.patient?.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <Phone className="h-3.5 w-3.5" />
                  {appointment.patient.phone}
                </div>
              )}
            </div>
          </div>

          {appointment.patient?.id && (
            <button
              onClick={() =>
                router.push(`/patients/${appointment.patient.id}`)
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              View Patient Profile →
            </button>
          )}
        </div>

        {/* Schedule Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Clock className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <CalendarDays className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {appointment.date
                    ? format(new Date(appointment.date), "MMMM d, yyyy")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {appointment.startTime
                    ? format(new Date(appointment.startTime), "h:mm a")
                    : "—"}{" "}
                  —{" "}
                  {appointment.endTime
                    ? format(new Date(appointment.endTime), "h:mm a")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(appointment.status)}`}
                >
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason & Notes */}
        {(appointment.reason || appointment.notes) && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                Reason &amp; Notes
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {appointment.reason && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Reason for Visit
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    {appointment.reason}
                  </p>
                </div>
              )}
              {appointment.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Additional Notes
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
