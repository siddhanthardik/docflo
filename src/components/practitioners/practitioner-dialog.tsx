"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Stethoscope, Calendar, Clock, DollarSign, Phone, Mail, Award, ShieldCheck, Palette, X, Sparkles } from "lucide-react";

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
    duration: "15",
    calendarColor: "#6366f1",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
  });

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
        duration: practitioner.duration ? practitioner.duration.toString() : "15",
        calendarColor: practitioner.calendarColor || "#6366f1",
        workingDays: practitioner.workingDays && practitioner.workingDays.length > 0 ? practitioner.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workingHoursStart: practitioner.workingHoursStart || "09:00",
        workingHoursEnd: practitioner.workingHoursEnd || "17:00",
      });
    } else if (isOpen) {
      setFormData({
        name: "", email: "", phone: "", specialty: "", otherSpecialty: "",
        qualification: "", registrationNumber: "", consultationFee: "", duration: "15",
        calendarColor: "#6366f1",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workingHoursStart: "09:00", workingHoursEnd: "17:00",
      });
    }
  }, [practitioner, isOpen]);

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
        workingHoursStart: formData.workingHoursStart || "09:00",
        workingHoursEnd: formData.workingHoursEnd || "17:00",
      };

      const url = practitioner ? `/api/practitioners/${practitioner.id}` : "/api/practitioners";
      const method = practitioner ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to save doctor details.");
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900">
                {practitioner ? "Edit Doctor Profile" : "Add Practicing Doctor"}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium">
                Configure doctor credentials, WhatsApp phone for AI reception, fees &amp; OPD schedule.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          {/* SECTION 1: CREDENTIALS & CONTACT */}
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
                  required 
                  placeholder="e.g. Dr. Vikash Kumar"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Medical Specialty</label>
                <Select 
                  value={formData.specialty} 
                  onValueChange={v => setFormData({...formData, specialty: v})}
                >
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SPECIALTIES.map(s => (
                      <SelectItem key={s} value={s} className="text-xs sm:text-sm">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.specialty === "Other" && (
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelClass}>Custom Specialty Name</label>
                  <Input 
                    value={formData.otherSpecialty} 
                    onChange={e => setFormData({...formData, otherSpecialty: e.target.value})} 
                    placeholder="e.g. Pediatric Neurologist"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className={labelClass}>Doctor WhatsApp Mobile Number</label>
                <Input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="e.g. 9876543210" 
                  className={inputClass} 
                />
                <p className="text-[11px] text-slate-500 leading-tight">Used by the 24/7 AI Receptionist to recognize you for delegated booking &amp; cancellations.</p>
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

          {/* SECTION 2: FEES & APPOINTMENTS */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Consultation Fees &amp; Duration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Consultation Fee (₹)</label>
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
            </div>
          </div>

          {/* SECTION 3: CALENDAR & TIMINGS */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>OPD Schedule &amp; Working Days</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>OPD Start Time</label>
                <Input 
                  type="time" 
                  value={formData.workingHoursStart} 
                  onChange={e => setFormData({...formData, workingHoursStart: e.target.value})} 
                  className={inputClass} 
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>OPD End Time</label>
                <Input 
                  type="time" 
                  value={formData.workingHoursEnd} 
                  onChange={e => setFormData({...formData, workingHoursEnd: e.target.value})} 
                  className={inputClass} 
                />
              </div>
            </div>

            {/* Calendar Color */}
            <div className="space-y-1.5">
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
            <div className="space-y-2">
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
