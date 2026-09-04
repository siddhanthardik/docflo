"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GoogleTimePicker } from "@/components/ui/google-time-picker";
import {
  Stethoscope,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Award,
  ShieldCheck,
  Palette,
  X,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Plus,
  Trash2,
  Sliders,
} from "lucide-react";

interface PractitionerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  practitioner?: any;
  onSuccess: () => void;
}

import { SPECIALTIES, isStandardSpecialty } from "@/lib/specialties";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function PractitionerDialog({ isOpen, onClose, practitioner, onSuccess }: PractitionerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    otherSpecialty: "",
    qualification: "",
    registrationNumber: "",
    consultationFee: "",
    followUpFee: "0",
    followUpDays: "7",
    duration: "15",
    calendarColor: "#6366f1",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });

  // AI Booking Capacity & Pacing Controls (Per-Doctor / OPD)
  const [capacityControls, setCapacityControls] = useState({
    maxDailyAiBookings: "10" as string,
    maxMorningAiBookings: 5,
    maxEveningAiBookings: 5,
    aiSlotPacing: "STAGGERED",
  });

  // Multi-Session OPD Slots
  const [morningSlot, setMorningSlot] = useState({ enabled: true, start: "10:00", end: "13:30" });
  const [eveningSlot, setEveningSlot] = useState({ enabled: true, start: "17:30", end: "20:30" });
  const [afternoonSlot, setAfternoonSlot] = useState({ enabled: false, start: "14:30", end: "16:30" });
  const [showAfternoon, setShowAfternoon] = useState(false);

  useEffect(() => {
    if (practitioner && isOpen) {
      setFormData({
        name: practitioner.name || "",
        email: practitioner.email || "",
        phone: practitioner.phone || "",
        specialty: isStandardSpecialty(practitioner.specialty) ? practitioner.specialty : (practitioner.specialty ? "Other" : ""),
        otherSpecialty: !isStandardSpecialty(practitioner.specialty) ? practitioner.specialty : "",
        qualification: practitioner.qualification || "",
        registrationNumber: practitioner.registrationNumber || "",
        consultationFee: practitioner.consultationFee !== null && practitioner.consultationFee !== undefined ? practitioner.consultationFee.toString() : "",
        followUpFee: practitioner.followUpFee !== null && practitioner.followUpFee !== undefined ? practitioner.followUpFee.toString() : "0",
        followUpDays: practitioner.followUpDays ? practitioner.followUpDays.toString() : "7",
        duration: practitioner.duration ? practitioner.duration.toString() : "15",
        calendarColor: practitioner.calendarColor || "#6366f1",
        workingDays: practitioner.workingDays && practitioner.workingDays.length > 0 ? practitioner.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });

      // Load AI booking capacity controls
      fetch("/api/doctor/opd-status")
        .then(res => res.json())
        .then(data => {
          if (data?.doctor) {
            setCapacityControls({
              maxDailyAiBookings: data.doctor.maxDailyAiBookings !== null && data.doctor.maxDailyAiBookings !== undefined ? String(data.doctor.maxDailyAiBookings) : "unlimited",
              maxMorningAiBookings: data.doctor.maxMorningAiBookings ?? 5,
              maxEveningAiBookings: data.doctor.maxEveningAiBookings ?? 5,
              aiSlotPacing: data.doctor.aiSlotPacing || "STAGGERED",
            });
          }
        })
        .catch(() => {});

      // Parse multi-slot working hours
      const startStr = practitioner.workingHoursStart || "09:00";
      const endStr = practitioner.workingHoursEnd || "17:00";

      if (startStr.includes(",") || endStr.includes(",")) {
        const starts = startStr.split(",");
        const ends = endStr.split(",");
        if (starts.length >= 1) {
          setMorningSlot({ enabled: true, start: starts[0], end: ends[0] || "13:30" });
        }
        if (starts.length >= 2) {
          setEveningSlot({ enabled: true, start: starts[1], end: ends[1] || "20:30" });
        } else {
          setEveningSlot({ enabled: false, start: "17:30", end: "20:30" });
        }
        if (starts.length >= 3) {
          setAfternoonSlot({ enabled: true, start: starts[2], end: ends[2] || "16:30" });
          setShowAfternoon(true);
        } else {
          setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
          setShowAfternoon(false);
        }
      } else {
        const startH = parseInt(startStr.split(":")[0], 10);
        if (startH >= 15) {
          // Evening only (e.g. 17:00 to 20:30)
          setMorningSlot({ enabled: false, start: "10:00", end: "13:30" });
          setEveningSlot({ enabled: true, start: startStr, end: endStr });
          setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
          setShowAfternoon(false);
        } else if (parseInt(endStr.split(":")[0], 10) <= 15) {
          // Morning only
          setMorningSlot({ enabled: true, start: startStr, end: endStr });
          setEveningSlot({ enabled: false, start: "17:30", end: "20:30" });
          setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
          setShowAfternoon(false);
        } else {
          // Full day
          setMorningSlot({ enabled: true, start: startStr, end: "13:30" });
          setEveningSlot({ enabled: true, start: "17:30", end: endStr });
          setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
          setShowAfternoon(false);
        }
      }
    } else if (isOpen) {
      setFormData({
        name: "", email: "", phone: "", specialty: "", otherSpecialty: "",
        qualification: "", registrationNumber: "", consultationFee: "", followUpFee: "", followUpDays: "7", duration: "15",
        calendarColor: "#6366f1",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
      setMorningSlot({ enabled: true, start: "10:00", end: "13:30" });
      setEveningSlot({ enabled: true, start: "17:30", end: "20:30" });
      setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
      setShowAfternoon(false);
    }
  }, [practitioner, isOpen]);

  const applyPreset = (preset: "BOTH" | "EVENING" | "MORNING" | "FULL_DAY") => {
    if (preset === "BOTH") {
      setMorningSlot({ enabled: true, start: "10:00", end: "13:30" });
      setEveningSlot({ enabled: true, start: "17:30", end: "20:30" });
      setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
      setShowAfternoon(false);
    } else if (preset === "EVENING") {
      setMorningSlot({ enabled: false, start: "10:00", end: "13:30" });
      setEveningSlot({ enabled: true, start: "17:00", end: "21:00" });
      setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
      setShowAfternoon(false);
    } else if (preset === "MORNING") {
      setMorningSlot({ enabled: true, start: "09:00", end: "14:00" });
      setEveningSlot({ enabled: false, start: "17:30", end: "20:30" });
      setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
      setShowAfternoon(false);
    } else if (preset === "FULL_DAY") {
      setMorningSlot({ enabled: true, start: "10:00", end: "19:00" });
      setEveningSlot({ enabled: false, start: "17:30", end: "20:30" });
      setAfternoonSlot({ enabled: false, start: "14:30", end: "16:30" });
      setShowAfternoon(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const days = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: days };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter doctor's full name");
      return;
    }

    setLoading(true);
    try {
      const feeNum = formData.consultationFee.trim() !== "" ? parseFloat(formData.consultationFee) : null;
      const durationNum = parseInt(formData.duration) || 15;

      // Compile active session slots
      const activeStarts: string[] = [];
      const activeEnds: string[] = [];

      if (morningSlot.enabled) {
        activeStarts.push(morningSlot.start);
        activeEnds.push(morningSlot.end);
      }
      if (showAfternoon && afternoonSlot.enabled) {
        activeStarts.push(afternoonSlot.start);
        activeEnds.push(afternoonSlot.end);
      }
      if (eveningSlot.enabled) {
        activeStarts.push(eveningSlot.start);
        activeEnds.push(eveningSlot.end);
      }

      const workingHoursStart = activeStarts.length > 0 ? activeStarts.join(",") : "09:00";
      const workingHoursEnd = activeEnds.length > 0 ? activeEnds.join(",") : "17:00";

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        specialty: formData.specialty === "Other" ? formData.otherSpecialty.trim() : formData.specialty,
        otherSpecialty: formData.specialty === "Other" ? formData.otherSpecialty.trim() : null,
        qualification: formData.qualification.trim() || null,
        registrationNumber: formData.registrationNumber.trim() || null,
        consultationFee: isNaN(feeNum as number) ? null : feeNum,
        duration: durationNum,
        calendarColor: formData.calendarColor,
        workingDays: formData.workingDays,
        workingHoursStart,
        workingHoursEnd,
      };

      const url = practitioner ? `/api/practitioners/${practitioner.id}` : "/api/practitioners";
      const method = practitioner ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save practitioner");
      }

      // Synchronize capacity & follow-up policy to AI agent config
      try {
        const capacityPayload = {
          maxDailyAiBookings: capacityControls.maxDailyAiBookings === "unlimited" ? null : parseInt(capacityControls.maxDailyAiBookings),
          maxMorningAiBookings: capacityControls.maxMorningAiBookings,
          maxEveningAiBookings: capacityControls.maxEveningAiBookings,
          aiSlotPacing: capacityControls.aiSlotPacing,
          consultationFee: formData.consultationFee ? `₹${formData.consultationFee}` : "",
          followUpFee: formData.followUpFee ? `₹${formData.followUpFee}` : "₹0",
          followUpDays: formData.followUpDays ? `${formData.followUpDays} days` : "7 days",
        };

        await fetch("/api/ai-agents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentType: "APPOINTMENT",
            config: capacityPayload,
          }),
        });
      } catch (capErr) {
        console.warn("Capacity sync notice:", capErr);
      }

      toast.success(practitioner ? "Doctor updated successfully" : "Doctor added successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white transition";
  const labelClass = "text-xs font-bold text-slate-700 block mb-1";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 rounded-3xl bg-white shadow-2xl border border-slate-200/90">
        
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b border-slate-100 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                {practitioner ? "Edit Doctor Profile" : "Add New Doctor"}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-normal">
                Configure doctor credentials, WhatsApp phone for AI reception, fees &amp; OPD schedule.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-3">
          
          {/* SECTION 1: BASIC & CREDENTIALS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Doctor Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Doctor Full Name *</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Dr. Jane Doe" 
                  required 
                  className={inputClass} 
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Medical Specialty</label>
                <Select value={formData.specialty} onValueChange={v => setFormData({...formData, specialty: v})}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent className="max-h-56">
                    {SPECIALTIES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.specialty === "Other" && (
              <div className="space-y-1">
                <label className={labelClass}>Specify Custom Specialty</label>
                <Input 
                  value={formData.otherSpecialty} 
                  onChange={e => setFormData({...formData, otherSpecialty: e.target.value})} 
                  placeholder="e.g. Trichology / Hair Specialist" 
                  className={inputClass} 
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Doctor WhatsApp Mobile Number</label>
                </div>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="e.g. +919876543210" 
                  className={inputClass} 
                />
                <span className="text-[10px] text-slate-500">
                  Used by the 24/7 AI Receptionist to recognize you for delegated booking &amp; cancellations.
                </span>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Email Address</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="doctor@clinic.com" 
                  className={inputClass} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Qualification (e.g. MBBS, MD, MS)</label>
                <Input 
                  value={formData.qualification} 
                  onChange={e => setFormData({...formData, qualification: e.target.value})} 
                  placeholder="e.g. MBBS, MD (Cardiology)" 
                  className={inputClass} 
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Medical Registration Number</label>
                <Input 
                  value={formData.registrationNumber} 
                  onChange={e => setFormData({...formData, registrationNumber: e.target.value})} 
                  placeholder="e.g. MCI-12345" 
                  className={inputClass} 
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: FEES & FOLLOW-UP POLICY */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Consultation Fees &amp; Follow-up Policy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>First Visit Fee (₹)</label>
                <Input 
                  type="number" 
                  step="1" 
                  min="0"
                  value={formData.consultationFee} 
                  onChange={e => setFormData({...formData, consultationFee: e.target.value})} 
                  placeholder="e.g. 500" 
                  className={inputClass} 
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Default Slot Duration</label>
                <Select value={formData.duration} onValueChange={v => setFormData({...formData, duration: v})}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 mins</SelectItem>
                    <SelectItem value="15">15 mins (Standard)</SelectItem>
                    <SelectItem value="20">20 mins</SelectItem>
                    <SelectItem value="30">30 mins</SelectItem>
                    <SelectItem value="45">45 mins</SelectItem>
                    <SelectItem value="60">60 mins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Follow-up Consultation Fee (₹)</label>
                <Input 
                  type="number" 
                  step="1" 
                  min="0"
                  value={formData.followUpFee} 
                  onChange={e => setFormData({...formData, followUpFee: e.target.value})} 
                  placeholder="e.g. 0 (Free) or 300" 
                  className={inputClass} 
                />
                <span className="text-[10px] text-slate-500">Charged for test report review &amp; second consult</span>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Follow-up Validity Period</label>
                <Select value={formData.followUpDays} onValueChange={v => setFormData({...formData, followUpDays: v})}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Within 3 Days</SelectItem>
                    <SelectItem value="5">Within 5 Days</SelectItem>
                    <SelectItem value="7">Within 7 Days (Standard)</SelectItem>
                    <SelectItem value="10">Within 10 Days</SelectItem>
                    <SelectItem value="14">Within 14 Days</SelectItem>
                    <SelectItem value="30">Within 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-500">Duration after first visit where follow-up rate applies</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: CALENDAR & TIMINGS (GOOGLE-STYLE MULTI-SLOT) */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>OPD Sessions &amp; Working Timings</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                12-Hour AM/PM
              </span>
            </div>

            {/* 1-Click Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("BOTH")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    morningSlot.enabled && eveningSlot.enabled && !showAfternoon
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ⚡ Morning &amp; Evening
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("EVENING")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    !morningSlot.enabled && eveningSlot.enabled
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🌙 Evening Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("MORNING")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    morningSlot.enabled && !eveningSlot.enabled
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ☀️ Morning Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("FULL_DAY")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  🏢 Full Day (Continuous)
                </button>
              </div>
            </div>

            {/* Session Cards */}
            <div className="space-y-3">
              {/* 1. Morning Session Card */}
              <div className={`p-4 rounded-2xl border transition-all ${morningSlot.enabled ? 'bg-amber-50/40 border-amber-200/80 shadow-xs' : 'bg-slate-50/60 border-slate-200/60 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${morningSlot.enabled ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' : 'bg-slate-200 text-slate-500'}`}>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">Morning OPD Session</span>
                      <span className="text-[10px] text-slate-500 block">General morning consultation window</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={morningSlot.enabled}
                      onChange={e => setMorningSlot({ ...morningSlot, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {morningSlot.enabled ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">From (Start Time)</label>
                      <GoogleTimePicker
                        value={morningSlot.start}
                        onChange={val => setMorningSlot({ ...morningSlot, start: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">To (End Time)</label>
                      <GoogleTimePicker
                        value={morningSlot.end}
                        minTime={morningSlot.start}
                        onChange={val => setMorningSlot({ ...morningSlot, end: val })}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Doctor is closed / not available for morning OPD.</p>
                )}
              </div>

              {/* 2. Evening Session Card */}
              <div className={`p-4 rounded-2xl border transition-all ${eveningSlot.enabled ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs' : 'bg-slate-50/60 border-slate-200/60 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${eveningSlot.enabled ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'bg-slate-200 text-slate-500'}`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">Evening OPD Session</span>
                      <span className="text-[10px] text-slate-500 block">Peak evening clinic consultation hours</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eveningSlot.enabled}
                      onChange={e => setEveningSlot({ ...eveningSlot, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {eveningSlot.enabled ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">From (Start Time)</label>
                      <GoogleTimePicker
                        value={eveningSlot.start}
                        onChange={val => setEveningSlot({ ...eveningSlot, start: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">To (End Time)</label>
                      <GoogleTimePicker
                        value={eveningSlot.end}
                        minTime={eveningSlot.start}
                        onChange={val => setEveningSlot({ ...eveningSlot, end: val })}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Doctor is closed / not available for evening OPD.</p>
                )}
              </div>

              {/* 3. Optional Afternoon Session Card */}
              {showAfternoon ? (
                <div className="p-4 rounded-2xl border bg-emerald-50/40 border-emerald-200/80 shadow-xs transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Afternoon OPD Session</span>
                        <span className="text-[10px] text-slate-500 block">Mid-day procedures or consultation</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAfternoon(false);
                        setAfternoonSlot(prev => ({ ...prev, enabled: false }));
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">From (Start Time)</label>
                      <GoogleTimePicker
                        value={afternoonSlot.start}
                        onChange={val => setAfternoonSlot({ ...afternoonSlot, start: val, enabled: true })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">To (End Time)</label>
                      <GoogleTimePicker
                        value={afternoonSlot.end}
                        minTime={afternoonSlot.start}
                        onChange={val => setAfternoonSlot({ ...afternoonSlot, end: val, enabled: true })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAfternoon(true);
                    setAfternoonSlot(prev => ({ ...prev, enabled: true }));
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Afternoon / Mid-Day Session</span>
                </button>
              )}
            </div>

            {/* Calendar Color */}
            <div className="space-y-1.5 pt-2">
              <label className={labelClass}>Calendar Highlight Color</label>
              <div className="flex items-center gap-3 pt-1">
                {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, calendarColor: color})}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 flex items-center justify-center ${formData.calendarColor === color ? 'border-slate-900 ring-2 ring-slate-900/20 scale-110' : 'border-white shadow-xs'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Working Days */}
            <div className="space-y-2 pt-1">
              <label className={labelClass}>Available Working Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = formData.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4: AI BOOKING CAPACITY & PACING CONTROLS */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>AI Booking Capacity &amp; Pacing Controls</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Pacing Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Configure how many automated appointment slots the 24/7 WhatsApp AI receptionist can confirm per day for this doctor, avoiding waiting room overcrowding.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Daily AI Booking Cap</label>
                <Select
                  value={capacityControls.maxDailyAiBookings}
                  onValueChange={(v) => setCapacityControls({ ...capacityControls, maxDailyAiBookings: v })}
                >
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Max 5 Patients / day</SelectItem>
                    <SelectItem value="8">Max 8 Patients / day</SelectItem>
                    <SelectItem value="10">Max 10 Patients / day</SelectItem>
                    <SelectItem value="15">Max 15 Patients / day</SelectItem>
                    <SelectItem value="20">Max 20 Patients / day</SelectItem>
                    <SelectItem value="unlimited">Unlimited (Fill all slots)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-400">Total daily limit for AI</span>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Morning Session Max</label>
                <Input
                  type="number"
                  min="0"
                  value={capacityControls.maxMorningAiBookings}
                  onChange={(e) => setCapacityControls({ ...capacityControls, maxMorningAiBookings: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
                <span className="text-[10px] text-slate-400">Slots reserved in morning</span>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Evening Session Max</label>
                <Input
                  type="number"
                  min="0"
                  value={capacityControls.maxEveningAiBookings}
                  onChange={(e) => setCapacityControls({ ...capacityControls, maxEveningAiBookings: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
                <span className="text-[10px] text-slate-400">Slots reserved in evening</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className={labelClass}>Slot Pacing Strategy</label>
                <Select
                  value={capacityControls.aiSlotPacing}
                  onValueChange={(v) => setCapacityControls({ ...capacityControls, aiSlotPacing: v })}
                >
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAGGERED">Staggered (Leaves 15m gaps for walk-ins)</SelectItem>
                    <SelectItem value="CONTINUOUS">Continuous (Fills back-to-back)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-400">Staggered prevents crowded waiting areas</span>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>When Quota is Reached</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  AI politely offers <strong>Tomorrow&apos;s earliest slot</strong> + shares counter walk-in instructions.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="w-full sm:w-auto h-11 rounded-xl font-bold border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto h-11 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20"
            >
              {loading ? "Saving..." : (practitioner ? "Update Doctor Profile" : "Save & Add Doctor")}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
