"use client";

import { useState } from "react";
import { 
  Bot, 
  Search, 
  Sparkles, 
  MapPin, 
  Stethoscope, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  TrendingDown, 
  AlertTriangle,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { DiscoveredClinicLead } from "@/lib/prospector";

const MEDICAL_SPECIALTIES = [
  { value: "physician", label: "Physician / General Medicine" },
  { value: "orthopedics", label: "Orthopedics & Joint Specialist" },
  { value: "pediatrician", label: "Pediatrician / Child Care" },
  { value: "dentist", label: "Dentist & Dental Clinic" },
  { value: "surgeon", label: "General & Laparoscopic Surgeon" },
  { value: "physiotherapist", label: "Physiotherapist & Rehab" },
  { value: "gynaecologist", label: "Gynaecologist & Obstetrics" },
  { value: "cardiologist", label: "Cardiologist & Heart Clinic" },
  { value: "nutritionist", label: "Nutritionist & Dietitian" },
  { value: "diabetologist", label: "Diabetologist & Endocrinology" },
  { value: "dermatologist", label: "Dermatologist & Skin Clinic" },
];

export default function AdminProspectorPage() {
  const { toast } = useToast();
  const [areaOrPincode, setAreaOrPincode] = useState("110001");
  const [specialty, setSpecialty] = useState("dentist");
  const [city, setCity] = useState("New Delhi");
  const [limit, setLimit] = useState(10);

  const [scanning, setScanning] = useState(false);
  const [leads, setLeads] = useState<DiscoveredClinicLead[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaOrPincode || !specialty) return;

    try {
      setScanning(true);
      const res = await fetch("/api/admin/prospector/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaOrPincode, specialty, city, limit }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      setLeads(data.leads || []);
      if (data.sheetSync?.spreadsheetUrl) {
        setSheetUrl(data.sheetSync.spreadsheetUrl);
      }

      toast({
        title: "AI Prospecting Scan Complete! 🎯",
        description: `Discovered ${data.leads?.length || 0} clinics, generated audit reports, and synced to Google Sheets.`,
      });
    } catch (error: any) {
      toast({
        title: "Prospector Scan Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleDispatchEmail = async (lead: DiscoveredClinicLead) => {
    try {
      setDispatchingId(lead.id);
      const res = await fetch("/api/admin/prospector/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispatch failed");

      setDispatchedMap((prev) => ({ ...prev, [lead.id]: true }));
      toast({
        title: "Audit Email Sent! 🚀",
        description: `Audit report link dispatched to ${lead.email} via secondary domain.`,
      });
    } catch (error: any) {
      toast({
        title: "Dispatch Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4 text-indigo-400" /> SuperAdmin AI Growth Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Sales & Clinic Prospecting Agent
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Automatically discovers doctors by area & PIN code, extracts website emails, generates interactive Local SEO Audit Reports, and syncs directly to Google Sheets.
          </p>
        </div>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-11 px-5 rounded-2xl shadow-lg transition-all shrink-0"
          >
            <FileSpreadsheet className="w-4.5 h-4.5" /> Open Google Sheet Live <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Task Creation Form */}
      <form onSubmit={handleRunScan} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Launch AI Discovery Task
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Medical Specialty
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {MEDICAL_SPECIALTIES.map((spec) => (
                <option key={spec.value} value={spec.value}>
                  {spec.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Area / PIN Code
            </label>
            <Input
              value={areaOrPincode}
              onChange={(e) => setAreaOrPincode(e.target.value)}
              placeholder="e.g. 110001, Indiranagar"
              className="h-11 rounded-xl text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> City
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. New Delhi, Bengaluru"
              className="h-11 rounded-xl text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-600" /> Target Clinics Count
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={5}>5 Clinics</option>
              <option value={10}>10 Clinics</option>
              <option value={20}>20 Clinics</option>
              <option value={50}>50 Clinics</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Outreach Domain Isolation Active (<span className="font-semibold text-slate-700">getgyrex.com</span>)
          </div>

          <Button
            type="submit"
            disabled={scanning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-sm"
          >
            {scanning ? (
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Scanning & Extracting Emails...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2 text-amber-300" /> Run AI Prospecting Agent</>
            )}
          </Button>
        </div>
      </form>

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Discovered Doctor Leads</h3>
              <p className="text-xs text-gray-500">{leads.length} clinic leads parsed and synced to Google Sheets</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
              {leads.length} Leads Ready
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Clinic & Doctor Details</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Audit Score</th>
                  <th className="py-3 px-4 text-center">Patient Loss</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {leads.map((lead) => {
                  const isDispatched = dispatchedMap[lead.id];
                  const isSending = dispatchingId === lead.id;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-gray-900 text-sm">{lead.clinicName}</div>
                        <div className="text-gray-600 font-medium">{lead.doctorName}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" /> {lead.address}
                        </div>
                      </td>

                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-mono text-[11px] truncate max-w-[180px]">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" /> {lead.phone}
                          </div>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                          >
                            <Globe className="w-3 h-3 text-indigo-400 shrink-0" /> Visit Website
                          </a>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {lead.auditScore} / 100
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                          <TrendingDown className="w-3.5 h-3.5" /> -{lead.estimatedPatientsLostMonthly}/mo
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        <a
                          href={lead.auditReportLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-white shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          Audit Report <ExternalLink className="w-3 h-3 ml-1" />
                        </a>

                        <Button
                          onClick={() => handleDispatchEmail(lead)}
                          disabled={isDispatched || isSending}
                          size="sm"
                          className={
                            isDispatched
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs h-8 px-3"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3"
                          }
                        >
                          {isSending ? (
                            <><RefreshCcw className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                          ) : isDispatched ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Sent</>
                          ) : (
                            <><Send className="w-3.5 h-3.5 mr-1" /> Send Email</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
