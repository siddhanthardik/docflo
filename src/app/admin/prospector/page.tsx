"use client";

import { useState } from "react";
import { 
  Bot, 
  Search, 
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
  ShieldCheck,
  Play,
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
  const [scanStep, setScanStep] = useState(0);
  const [leads, setLeads] = useState<DiscoveredClinicLead[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  // Email Preview Modal State
  const [previewLead, setPreviewLead] = useState<DiscoveredClinicLead | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const SCAN_STEPS = [
    "Step 1/5: Searching Google Business Places in Area...",
    "Step 2/5: Fetching Place Details & Authentic Phone Numbers...",
    "Step 3/5: Scraping Official Clinic Websites for Public Emails...",
    "Step 4/5: Generating Persistent Database Audit Reports...",
    "Step 5/5: Syncing Discovered Rows to Google Sheets...",
  ];

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaOrPincode || !specialty) return;

    try {
      setScanning(true);
      setScanStep(0);

      const stepInterval = setInterval(() => {
        setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1500);

      const res = await fetch("/api/admin/prospector/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaOrPincode, specialty, city, limit }),
      });

      clearInterval(stepInterval);
      setScanStep(4);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      setLeads(data.leads || []);
      if (data.sheetSync?.spreadsheetUrl) {
        setSheetUrl(data.sheetSync.spreadsheetUrl);
      }

      toast({
        title: data.sheetSync?.success ? "AI Prospecting & Google Sheet Sync Complete! 🎯" : "AI Prospecting Scan Complete! 🎯",
        description: `Discovered ${data.leads?.length || 0} authentic clinic leads. ${data.sheetSync?.message || ""}`,
        variant: data.sheetSync?.success === false ? "destructive" : "default",
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

  const handleOpenEmailPreview = (lead: DiscoveredClinicLead) => {
    setPreviewLead(lead);
    setCustomRecipientEmail(lead.email || "");
    setCustomSubject(`Google Business Scan for ${lead.clinicName}: Estimated ${lead.estimatedPatientsLostMonthly} Monthly Patient Loss`);
    setCustomMessage(
      `Hello ${lead.doctorName || "Doctor"},\n\nOur AI Local SEO engine performed an automated Google Business Profile scan for ${lead.clinicName} in ${lead.city} (${lead.pincode}).\n\n⚠️ Local Visibility Score: ${lead.auditScore}/100\nYour clinic is currently losing an estimated ${lead.estimatedPatientsLostMonthly} patient inquiries every month due to missing keyword targeting and unoptimized profile attributes.\n\nWe have generated a free interactive Audit Report for your clinic.`
    );
  };

  const handleConfirmSendEmail = async () => {
    if (!previewLead) return;
    const targetEmail = customRecipientEmail.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      toast({
        title: "Invalid Email Address",
        description: "Please enter a valid recipient email address before sending.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDispatchingId(previewLead.id);
      const res = await fetch("/api/admin/prospector/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: previewLead,
          customEmail: targetEmail,
          customSubject,
          customMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispatch failed");

      setDispatchedMap((prev) => ({ ...prev, [previewLead.id]: true }));
      setPreviewLead(null); // Close modal

      toast({
        title: "Audit Email Dispatched! 🚀",
        description: `Audit report link successfully delivered to ${targetEmail} via secondary domain.`,
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
            Automatically discovers real doctors by area & PIN code, extracts authentic website emails, generates persistent Local SEO Audit Reports, and syncs to Google Sheets.
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
          <Search className="w-4 h-4 text-indigo-600" /> Launch Discovery Task
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
              placeholder="e.g. Green Park, 110016"
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

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Scans Google Maps & Places API for local clinics needing review & SEO optimization.</p>
          <Button
            type="submit"
            disabled={scanning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-sm"
          >
            {scanning ? (
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Executing Prospecting Engine...</>
            ) : (
              <><Play className="w-4 h-4 mr-2 text-amber-300" /> Run Prospecting Scan</>
            )}
          </Button>
        </div>

        {/* Live Stepper Indicator */}
        {scanning && (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-indigo-600 animate-spin" /> Deep AI Prospecting in Progress...
              </span>
              <span>{SCAN_STEPS[scanStep]}</span>
            </div>
            <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500"
                style={{ width: `${((scanStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

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
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Executing Prospecting Engine...</>
            ) : (
              <><Play className="w-4 h-4 mr-2 text-amber-300" /> Run Prospecting Engine</>
            )}
          </Button>
        </div>
      </form>

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Discovered Authentic Doctor Leads</h3>
              <p className="text-xs text-gray-500">{leads.length} official clinic listings parsed and synced to Google Sheets</p>
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
                        <a
                          href={lead.gmbUrl || (lead.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${lead.googlePlaceId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.clinicName + " " + lead.address)}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-gray-900 hover:text-indigo-600 hover:underline text-sm inline-flex items-center gap-1.5 group transition-colors"
                          title="Click to open official Google Business Profile on Google Maps"
                        >
                          {lead.clinicName}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                        </a>
                        {lead.doctorName ? (
                          <div className="text-gray-600 font-medium text-xs">{lead.doctorName}</div>
                        ) : null}
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 max-w-[280px]">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> {lead.address}
                        </div>
                      </td>

                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {lead.email ? (
                            <span className="font-mono text-[11px] truncate max-w-[180px]">{lead.email}</span>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Not Published on Site</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          {lead.phone ? (
                            <span>{lead.phone}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not Listed</span>
                          )}
                        </div>

                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-medium"
                          >
                            <Globe className="w-3 h-3 text-indigo-400 shrink-0" /> Visit Official Website
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-300" /> No Website
                          </span>
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
                          onClick={() => handleOpenEmailPreview(lead)}
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

      {/* ─── EMAIL PREVIEW & EDITOR MODAL ────────────────────────────────────── */}
      {previewLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" /> Review & Edit Outreach Audit Email
                </h3>
                <p className="text-xs text-slate-400">
                  Verify recipient address and customize message before sending via secondary outreach domain.
                </p>
              </div>
              <button
                onClick={() => setPreviewLead(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Recipient Email Address</label>
                <Input
                  value={customRecipientEmail}
                  onChange={(e) => setCustomRecipientEmail(e.target.value)}
                  placeholder="Enter target doctor email address..."
                  className="h-10 text-sm font-mono"
                  required
                />
                {!previewLead.email && (
                  <p className="text-[11px] text-amber-600">
                    ⚠️ Official website had no public email. Please type the verified doctor email address above.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Email Subject Line</label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="h-10 text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Message Body Content</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed bg-slate-50"
                />
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="text-xs text-indigo-900 font-medium">
                  Audit Report Button Link:
                </div>
                <a
                  href={previewLead.auditReportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Test Audit Report Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewLead(null)}
                className="h-10 px-4 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSendEmail}
                disabled={dispatchingId === previewLead.id}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-sm"
              >
                {dispatchingId === previewLead.id ? (
                  <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Dispatching...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Confirm & Send Audit Email</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

