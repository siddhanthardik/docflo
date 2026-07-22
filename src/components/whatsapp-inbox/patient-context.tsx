import { Phone, Mail, Calendar, Tag, User } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Patient {
  firstName: string
  lastName: string
  phone: string
  email?: string
  tags?: string[]
  appointments?: {
    id: string
    date: string
    status: string
    reason?: string
  }[]
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700" },
    CHECKED_IN: { bg: "bg-sky-50", text: "text-sky-700" },
    COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700" },
    NO_SHOW: { bg: "bg-amber-50", text: "text-amber-700" },
  }
  const style = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600" }
  return (
    <span
      className={`inline-flex items-center ${style.bg} ${style.text} text-xs font-medium px-2 py-0.5 rounded-full`}
    >
      {status.replace("_", " ")}
    </span>
  )
}

export function PatientContext({ patient }: { patient: Patient }) {
  return (
    <div className="p-4 space-y-4">
      {/* Patient Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-base font-bold text-indigo-700 flex-shrink-0">
            {(patient.firstName[0] + patient.lastName[0]).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-xs text-gray-500">Patient Profile</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span>{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {patient.tags && patient.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patient.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Appointments Card */}
      {patient.appointments && patient.appointments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-gray-900">Recent Appointments</h4>
          </div>
          <div className="space-y-3">
            {patient.appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-gray-700 font-medium">
                    {formatDate(new Date(apt.date))}
                  </p>
                  {apt.reason && (
                    <p className="text-gray-400 truncate mt-0.5">{apt.reason}</p>
                  )}
                </div>
                <AppointmentStatusBadge status={apt.status} />
              </div>
            ))}
          </div>
          {patient.appointments.length > 3 && (
            <p className="text-xs text-gray-400 mt-3">
              +{patient.appointments.length - 3} more appointments
            </p>
          )}
        </div>
      )}
    </div>
  )
}