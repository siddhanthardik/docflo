"use client";

import { useParams, useRouter } from "next/navigation";
import { usePatient } from "@/hooks/use-patients";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  User,
  Edit,
  ClipboardList,
  Clock,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

// Generates a deterministic avatar color from a name string
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

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
      return "bg-indigo-50 text-indigo-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "NO_SHOW":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { patient, loading } = usePatient(params.id as string);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-6">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200 mb-6" />
          <div className="h-8 w-56 animate-pulse rounded bg-gray-200 mb-2" />
          <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-64 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-64 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-48 md:col-span-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <User className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Patient not found
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            The patient record you&apos;re looking for doesn&apos;t exist or was
            removed.
          </p>
          <button
            onClick={() => router.push("/patients")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const initials = `${patient.firstName?.[0] ?? ""}${patient.lastName?.[0] ?? ""}`.toUpperCase();
  const avatarColor = getAvatarColor(patient.firstName ?? "");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <button
        onClick={() => router.push("/patients")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </button>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${avatarColor}`}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Patient Profile</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/patients/${patient.id}/edit`)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Edit className="h-4 w-4" />
          Edit Patient
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Personal Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <Phone className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {patient.phone}
                </p>
              </div>
            </div>

            {/* Email */}
            {patient.email && (
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                <Mail className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.email}
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            {patient.address && (
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.address}
                  </p>
                </div>
              </div>
            )}

            {/* Grid: Gender / DOB / Blood Group */}
            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
              <div className="flex flex-col items-center rounded-lg bg-gray-50 px-2 py-3 text-center">
                <User className="h-4 w-4 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {patient.gender || "—"}
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-gray-50 px-2 py-3 text-center">
                <Calendar className="h-4 w-4 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {patient.dateOfBirth
                    ? formatDate(new Date(patient.dateOfBirth))
                    : "—"}
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-gray-50 px-2 py-3 text-center">
                <Droplets className="h-4 w-4 text-rose-400 mb-1" />
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {patient.bloodGroup || "—"}
                </p>
              </div>
            </div>

            {/* Tags */}
            {patient.tags && patient.tags.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {patient.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medical Notes */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <ClipboardList className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Medical Notes
            </h2>
          </div>

          {patient.medicalNotes ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {patient.medicalNotes}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No medical notes recorded</p>
              <button
                onClick={() => router.push(`/patients/${patient.id}/edit`)}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Add a note →
              </button>
            </div>
          )}
        </div>

        {/* Appointment History */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Appointment History
            </h2>
            {patient.appointments && patient.appointments.length > 0 && (
              <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {patient.appointments.length} total
              </span>
            )}
          </div>

          {patient.appointments && patient.appointments.length > 0 ? (
            <div className="space-y-2">
              {patient.appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(new Date(appointment.date))}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(new Date(appointment.startTime))} —{" "}
                        {formatTime(new Date(appointment.endTime))}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(appointment.status)}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No appointments yet</p>
              <a
                href="/appointments"
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Schedule an appointment →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}