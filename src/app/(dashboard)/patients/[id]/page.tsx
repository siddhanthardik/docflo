"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/hooks/use-patients";
import { PatientForm } from "@/components/patients/patient-form";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  User,
  Edit,
  Activity,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  Star,
  AlertTriangle
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

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
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const getActivityIcon = (type: string, status?: string) => {
  switch (type) {
    case "REGISTERED":
      return <User className="h-4 w-4 text-emerald-600" />;
    case "APPOINTMENT":
      if (status === "COMPLETED") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      if (status === "CANCELLED") return <XCircle className="h-4 w-4 text-red-600" />;
      return <Calendar className="h-4 w-4 text-indigo-600" />;
    case "INVOICE":
      return <FileText className="h-4 w-4 text-amber-600" />;
    case "PAYMENT":
      return <CreditCard className="h-4 w-4 text-emerald-600" />;
    case "WHATSAPP":
    case "REVIEW_SURVEY":
    case "REVIEW_LINK":
      return <Star className="h-4 w-4 text-indigo-600" />;
    case "REVIEW_POSITIVE":
      return <Star className="h-4 w-4 text-emerald-600 fill-emerald-600" />;
    case "REVIEW_NEGATIVE":
      return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    case "ALERT":
      return <AlertTriangle className="h-4 w-4 text-rose-600 fill-rose-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
};

const getActivityColor = (type: string, status?: string) => {
  switch (type) {
    case "REGISTERED":
      return "bg-emerald-100";
    case "APPOINTMENT":
      if (status === "COMPLETED") return "bg-emerald-100";
      if (status === "CANCELLED") return "bg-red-100";
      return "bg-indigo-100";
    case "INVOICE":
      return "bg-amber-100";
    case "PAYMENT":
      return "bg-emerald-100";
    case "WHATSAPP":
    case "REVIEW_SURVEY":
    case "REVIEW_LINK":
      return "bg-indigo-100";
    case "REVIEW_POSITIVE":
      return "bg-emerald-100";
    case "REVIEW_NEGATIVE":
    case "ALERT":
      return "bg-rose-100";
    default:
      return "bg-gray-100";
  }
};

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { patient, loading, error, updatePatient } = usePatient(resolvedParams.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);
  const [showCooldownOverride, setShowCooldownOverride] = useState(false);

  const handleSendReviewRequest = async (overrideCooldown = false) => {
    if (!patient) return;
    setSendingReview(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/request-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideCooldown })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.isCooldownError) {
          setShowCooldownOverride(true);
        } else {
          throw new Error(data.error || "Failed to send review request");
        }
      } else {
        toast({ title: "Success", description: "Review request sent via WhatsApp!" });
        setShowCooldownOverride(false);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSendingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-gray-500">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-red-100 p-3">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Patient not found</h3>
        <p className="text-gray-500">{error || "The requested patient profile could not be found."}</p>
        <button
          onClick={() => router.push("/patients")}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Return to Patients
        </button>
      </div>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const avatarColor = getAvatarColor(fullName);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/patients")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Patient Profile</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleSendReviewRequest(false)}
                disabled={sendingReview}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                {sendingReview ? "Sending..." : "Request Review"}
              </button>
              <button
                onClick={() => router.push(`/book/${patient.doctorId}?patient=${patient.id}`)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <Calendar className="h-4 w-4" />
                Book
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Sticky Profile Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Profile Card */}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-6 pb-6 relative">
                  <div className="-mt-12 mb-4 flex justify-between items-end">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-2xl ${avatarColor} text-3xl font-bold shadow-lg ring-4 ring-white`}>
                      {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </div>
                    {patient.patientType && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${patient.patientType === "LEAD" ? "bg-purple-100 text-purple-700" :
                          patient.patientType === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                          patient.patientType === "INACTIVE" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"}`}>
                        {patient.patientType}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
                  
                  {patient.primaryPractitioner ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
                      <Users className="h-4 w-4" />
                      Assigned to {patient.primaryPractitioner.name}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg w-fit border border-gray-100">
                      <Users className="h-4 w-4" />
                      Unassigned (Clinic)
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{patient.phone}</span>
                    </div>
                    
                    {patient.email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="font-medium truncate">{patient.email}</span>
                      </div>
                    )}
                    
                    {(patient.gender || patient.dateOfBirth || patient.bloodGroup) && (
                      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        {patient.gender && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Gender</p>
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <User className="h-4 w-4 text-gray-400" />
                              {patient.gender}
                            </div>
                          </div>
                        )}
                        {patient.dateOfBirth && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Age</p>
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / 31557600000)} yrs
                            </div>
                          </div>
                        )}
                        {patient.bloodGroup && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Blood Group</p>
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Droplets className="h-4 w-4 text-rose-400" />
                              {patient.bloodGroup}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              {patient.tags && patient.tags.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {patient.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Timeline & Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Quick Actions Bar */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => router.push(`/billing/new?patient=${patient.id}`)}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 hover:text-indigo-600 hover:ring-indigo-200 transition-all"
              >
                <FileText className="h-4 w-4" />
                Create Invoice
              </button>
              <button className="shrink-0 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 hover:text-indigo-600 hover:ring-indigo-200 transition-all">
                <Plus className="h-4 w-4" />
                Add Clinical Note
              </button>
              <button className="shrink-0 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 hover:text-indigo-600 hover:ring-indigo-200 transition-all">
                <Activity className="h-4 w-4" />
                Log Call
              </button>
            </div>

            {/* Medical Notes */}
            {patient.medicalNotes && (
              <div className="rounded-2xl bg-amber-50 p-6 shadow-sm ring-1 ring-amber-100/50">
                <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" />
                  Important Notes
                </h3>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{patient.medicalNotes}</p>
              </div>
            )}

            {/* Unified Activity Timeline */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">Activity Timeline</h3>
              </div>
              
              <div className="p-6">
                {!patient.activityTimeline || patient.activityTimeline.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Activities will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul role="list" className="-mb-8">
                      {patient.activityTimeline.map((activity: any, eventIdx: number) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {eventIdx !== patient.activityTimeline!.length - 1 ? (
                              <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-4">
                              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-8 ring-white ${getActivityColor(activity.type, activity.status)}`}>
                                {getActivityIcon(activity.type, activity.status)}
                              </div>
                              <div className="min-w-0 flex-1 bg-gray-50/50 rounded-xl p-4 ring-1 ring-gray-100">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                                    <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-medium text-gray-500">{formatDate(new Date(activity.date))}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(new Date(activity.date))}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Patient Edit Modal */}
      <PatientForm
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={updatePatient}
        initialData={patient}
        mode="edit"
      />

      {/* Cooldown Override Modal */}
      {showCooldownOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Cooldown Period Active</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This patient has recently received a review request. Sending another request so soon might be perceived as spam. 
                  Are you sure you want to override the cooldown?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCooldownOverride(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={sendingReview}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReviewRequest(true)}
                disabled={sendingReview}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {sendingReview ? "Sending..." : "Override & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}