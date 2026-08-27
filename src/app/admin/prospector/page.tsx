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
  MessageSquare,
  Copy,
  PhoneCall,
  Sparkles,
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

  // Call Script Modal State
  const [callScriptLead, setCallScriptLead] = useState<DiscoveredClinicLead | null>(null);

  const cleanWhatsAppPhone = (phone?: string) => {
    if (!phone) return "";
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    if (digits.startsWith("0")) digits = "91" + digits.slice(1);
    return digits;
  };

  const getWhatsAppPitch = (lead: DiscoveredClinicLead) => {
    const docName = lead.doctorName || "Doctor";
    return `Hello ${docName},

I ran an automated 5km Google Maps audit for ${lead.clinicName} in ${lead.city}.

📊 Google Visibility Score: ${lead.auditScore}/100
⚠️ Est. Patient Inquiries Lost: ~${lead.estimatedPatientsLostMonthly}/month due to unoptimized ranking and missing review pipeline.

Here is your clinic's complimentary 10-point audit report:
👉 ${lead.auditReportLink}

Would you be open to a quick 5-minute walkthrough this week on how to rank #1 on Google Maps in your area?`;
  };

  const handleCopyPitch = (lead: DiscoveredClinicLead) => {
    const pitch = getWhatsAppPitch(lead);
    navigator.clipboard.writeText(pitch);
    toast({
      title: "Outreach Pitch Copied! 📋",
      description: `Personalized message for ${lead.clinicName} copied to clipboard. Ready to paste in WhatsApp, SMS, or Email.`,
    });
  };

  const handleOpenCallScript = (lead: DiscoveredClinicLead) => {
    setCallScriptLead(lead);
  };

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

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
              <><Play className="w-4 h-4 mr-2 text-amber-300" /> Launch Prospecting Engine</>
            )}
          </Button>
        </div>
      </form>

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Discovered Authentic Doctor Leads</h3>
              <p className="text-xs text-gray-500">{leads.length} official clinic listings parsed and synced to Google Sheets CRM</p>
            </div>
            <div className="flex items-center gap-2">
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> View in Google Sheets <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100">
                {leads.length} Leads Ready
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Clinic & Doctor Details</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Audit Score</th>
                  <th className="py-3 px-4 text-center">Patient Loss</th>
                  <th className="py-3 px-4 text-right">Zero-Ad Outreach Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {leads.map((lead) => {
                  const isDispatched = dispatchedMap[lead.id];
                  const isSending = dispatchingId === lead.id;
                  const waPhone = cleanWhatsAppPhone(lead.phone);
                  const waPitch = getWhatsAppPitch(lead);

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
                            <span className="font-mono">{lead.phone}</span>
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
                            <Globe className="w-3 h-3 text-indigo-400 shrink-0" /> Official Site
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

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. View Report */}
                          <a
                            href={lead.auditReportLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[11px] font-semibold text-slate-700 hover:text-indigo-600 border border-gray-200 px-2.5 py-1.5 rounded-lg bg-white shadow-2xs hover:bg-slate-50 transition-colors"
                          >
                            Report <ExternalLink className="w-3 h-3 ml-1" />
                          </a>

                          {/* 2. 1-Click WhatsApp Direct Pitch */}
                          {waPhone ? (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waPitch)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
                              title="Open direct WhatsApp conversation with pre-filled audit pitch"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                            </a>
                          ) : null}

                          {/* 3. Copy Pitch to Clipboard */}
                          <button
                            onClick={() => handleCopyPitch(lead)}
                            className="inline-flex items-center text-[11px] font-semibold text-slate-700 hover:text-indigo-600 border border-gray-200 px-2.5 py-1.5 rounded-lg bg-white shadow-2xs hover:bg-slate-50 transition-colors"
                            title="Copy personalized doctor outreach message"
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy Pitch
                          </button>

                          {/* 4. Call Script View */}
                          <button
                            onClick={() => handleOpenCallScript(lead)}
                            className="inline-flex items-center text-[11px] font-semibold text-slate-700 hover:text-indigo-600 border border-gray-200 px-2.5 py-1.5 rounded-lg bg-white shadow-2xs hover:bg-slate-50 transition-colors"
                            title="View quick telephone talking points for reception"
                          >
                            <PhoneCall className="w-3 h-3 mr-1 text-blue-600" /> Script
                          </button>

                          {/* 5. Send Cold Email */}
                          <Button
                            onClick={() => handleOpenEmailPreview(lead)}
                            disabled={isDispatched || isSending}
                            size="sm"
                            className={
                              isDispatched
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] h-7 px-2.5"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] h-7 px-2.5"
                            }
                          >
                            {isSending ? (
                              <><RefreshCcw className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                            ) : isDispatched ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Sent</>
                            ) : (
                              <><Send className="w-3 h-3 mr-1" /> Email</>
                            )}
                          </Button>
                        </div>
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

      {/* ─── TELEPHONE CALL SCRIPT & TALKING POINTS MODAL ───────────────────── */}
      {callScriptLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-blue-400" /> Phone Call Script & Talking Points
                </h3>
                <p className="text-xs text-slate-300">
                  {callScriptLead.clinicName} ({callScriptLead.phone || "No phone listed"})
                </p>
              </div>
              <button
                onClick={() => setCallScriptLead(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm leading-relaxed">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                  1. Front Desk / Reception Opening
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  &ldquo;Hello, this is calling regarding {callScriptLead.clinicName}&apos;s Google Business listing in {callScriptLead.city}. May I speak with {callScriptLead.doctorName || "the clinic manager / Dr."}? We just completed an automated local visibility audit for your area.&rdquo;
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                  2. Pain Point Hook (Google Maps Rank Gap)
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  &ldquo;When patients in {callScriptLead.pincode} search for {callScriptLead.specialty}, {callScriptLead.clinicName} has an audit score of {callScriptLead.auditScore}/100, losing an estimated ~{callScriptLead.estimatedPatientsLostMonthly} inquiries/month to competitor clinics nearby.&rdquo;
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  3. The Offer (Zero-Cost Walkthrough)
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  &ldquo;We have generated a 10-point audit report that pinpoints the exact keywords and review gaps needed to reach Rank #1. Would Dr. / clinic team have 5 minutes this week for a quick screen-share walkthrough?&rdquo;
                </p>
              </div>

              {/* Audit link box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Report Link to Share:</span>
                <a
                  href={callScriptLead.auditReportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Open Report <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyPitch(callScriptLead)}
                className="h-9 px-3 rounded-xl text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy WhatsApp Pitch
              </Button>
              <Button
                onClick={() => setCallScriptLead(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-xl"
              >
                Close Script
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


