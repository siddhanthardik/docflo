"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Building2, Mail, Phone, Activity, FileText, ArrowLeft, Send, 
  MapPin, Link as LinkIcon, MessageSquare, PhoneCall, History, 
  Clock, CheckCircle, XCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateLeadStatus, addLeadNote } from "../actions";
import { toast } from "sonner";
import { AuditLeadStatus } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { ConvertLeadModal } from "./convert-lead-modal";

export default function LeadDetailClient({ lead, packages }: { lead: any, packages: any[] }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  
  const latestAudit = lead.requests[0];

  const handleStatusChange = async (newStatus: AuditLeadStatus) => {
    setIsUpdating(true);
    const res = await updateLeadStatus(lead.id, newStatus);
    if (res.success) {
      toast.success("Lead status updated");
    } else {
      toast.error("Failed to update status");
    }
    setIsUpdating(false);
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsSubmittingNote(true);
    const res = await addLeadNote(lead.id, note);
    if (res.success) {
      toast.success("Note added");
      setNote("");
    } else {
      toast.error("Failed to add note");
    }
    setIsSubmittingNote(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin/leads')} 
            className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leads
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {lead.name}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                lead.status === "NEW" ? "bg-blue-100 text-blue-700" : 
                lead.status === "CONTACTED" ? "bg-amber-100 text-amber-700" : 
                lead.status === "QUALIFIED" ? "bg-purple-100 text-purple-700" :
                lead.status === "CUSTOMER" ? "bg-emerald-100 text-emerald-700" : 
                "bg-slate-100 text-slate-700"
            }`}>
              {lead.status}
            </span>
          </h1>
          <p className="text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            {lead.clinicName || "Unknown Clinic"}
          </p>
        </div>

        <div className="flex gap-2">
          {lead.phone && (
            <>
              <Button variant="outline" size="sm" onClick={() => window.open(`tel:${lead.phone}`)}>
                <PhoneCall className="w-4 h-4 mr-2" /> Call
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}>
                <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </>
          )}
          {lead.email && (
            <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${lead.email}`)}>
              <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
          )}
          {lead.status !== "CUSTOMER" && (
            <Button size="sm" onClick={() => setIsConvertModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Building2 className="w-4 h-4 mr-2" /> Convert to Customer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Latest Audit Overview */}
          {latestAudit && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" /> Latest Audit
                </h2>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                    latestAudit.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : 
                    latestAudit.status === "FAILED" ? "bg-red-100 text-red-700" : 
                    "bg-amber-100 text-amber-700 animate-pulse"
                }`}>
                  {latestAudit.status === "COMPLETED" && <CheckCircle className="w-4 h-4" />}
                  {latestAudit.status === "FAILED" && <XCircle className="w-4 h-4" />}
                  {latestAudit.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Search Query</div>
                  <div className="font-medium text-slate-900">{latestAudit.searchQuery}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Date</div>
                  <div className="font-medium text-slate-900">{format(new Date(latestAudit.createdAt), "MMM d, yyyy")}</div>
                </div>
              </div>

              {latestAudit.status === "COMPLETED" && latestAudit.report && (
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href={`/local-seo/free-audit/report/${latestAudit.id}`} target="_blank">
                      <FileText className="w-4 h-4 mr-2" /> View Full Report
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Audit History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" /> Audit History
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {lead.requests.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No audits found.</div>
              ) : (
                lead.requests.map((req: any) => (
                  <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{req.searchQuery}</div>
                      <div className="text-xs text-slate-500 mt-1">{format(new Date(req.createdAt), "MMM d, yyyy h:mm a")}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-semibold ${
                        req.status === "COMPLETED" ? "text-emerald-600" : 
                        req.status === "FAILED" ? "text-red-600" : "text-amber-600"
                      }`}>{req.status}</span>
                      {req.status === "COMPLETED" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/local-seo/free-audit/report/${req.id}`} target="_blank">View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* CRM Controls */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <h3 className="font-semibold text-slate-900">CRM Controls</h3>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Lead Status</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value as AuditLeadStatus)}
                disabled={isUpdating}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Assigned To</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm opacity-60 cursor-not-allowed"
                disabled
              >
                <option>{lead.assignedTo?.name || "Unassigned"}</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Assignment requires additional setup.</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 mb-3">Contact Details</h3>
            {lead.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{lead.phone}</span>
              </div>
            )}
            {lead.placeId && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-mono text-xs break-all">{lead.placeId}</span>
              </div>
            )}
          </div>

          {/* Source Attribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 mb-3">Attribution</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
              <div className="text-slate-500 text-xs">Source</div>
              <div className="text-slate-900 font-medium">{lead.leadSource || "Organic"}</div>
              
              {lead.utmSource && (
                <>
                  <div className="text-slate-500 text-xs">UTM Source</div>
                  <div className="text-slate-900 font-medium">{lead.utmSource}</div>
                </>
              )}
              {lead.utmMedium && (
                <>
                  <div className="text-slate-500 text-xs">UTM Medium</div>
                  <div className="text-slate-900 font-medium">{lead.utmMedium}</div>
                </>
              )}
              {lead.utmCampaign && (
                <>
                  <div className="text-slate-500 text-xs">UTM Campaign</div>
                  <div className="text-slate-900 font-medium">{lead.utmCampaign}</div>
                </>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Lead Timeline
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {lead.activities.map((activity: any) => (
                <div key={activity.id} className="relative pl-6 border-l-2 border-slate-200 last:border-transparent">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white" />
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {activity.eventType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded-md border border-slate-100">
                    {activity.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Add a note..." 
                  className="min-h-[40px] h-10 resize-none py-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button 
                  size="icon" 
                  onClick={handleAddNote} 
                  disabled={isSubmittingNote || !note.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <ConvertLeadModal 
        isOpen={isConvertModalOpen} 
        onClose={() => setIsConvertModalOpen(false)} 
        lead={lead} 
        packages={packages} 
      />
    </div>
  );
}
