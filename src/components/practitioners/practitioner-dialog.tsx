import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface PractitionerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  practitioner?: any;
  onSuccess: () => void;
}

const specialtiesList = [
  "General Medicine", "Pediatrics", "Cardiology", "Dermatology", "Orthopedics",
  "Neurology", "Psychiatry", "Oncology", "Gastroenterology", "Endocrinology",
  "Ophthalmology", "ENT (Otolaryngology)", "Urology", "Gynecology & Obstetrics",
  "Dentistry", "Other"
];

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
        specialty: specialtiesList.includes(practitioner.specialty) ? practitioner.specialty : (practitioner.specialty ? "Other" : ""),
        otherSpecialty: !specialtiesList.includes(practitioner.specialty) ? practitioner.specialty : "",
        qualification: practitioner.qualification || "",
        registrationNumber: practitioner.registrationNumber || "",
        consultationFee: practitioner.consultationFee?.toString() || "",
        duration: practitioner.duration?.toString() || "15",
        calendarColor: practitioner.calendarColor || "#6366f1",
        workingDays: practitioner.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
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
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
        duration: parseInt(formData.duration),
        specialty: formData.specialty === "Other" ? formData.otherSpecialty : formData.specialty
      };

      const url = practitioner ? `/api/practitioners/${practitioner.id}` : "/api/practitioners";
      const method = practitioner ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      toast.success(practitioner ? "Doctor updated" : "Doctor added");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[680px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">{practitioner ? "Edit Doctor Details" : "Add New Doctor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="Dr. Sarah Smith"
                className="h-10 text-sm rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Specialty *</Label>
              <Select 
                value={formData.specialty} 
                onValueChange={v => setFormData({...formData, specialty: v})}
              >
                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-200"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {specialtiesList.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.specialty === "Other" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">Custom Specialty</Label>
                <Input 
                  value={formData.otherSpecialty} 
                  onChange={e => setFormData({...formData, otherSpecialty: e.target.value})} 
                  placeholder="e.g. Immunologist"
                  className="h-10 text-sm rounded-xl border-slate-200"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
              <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Qualification (e.g. MBBS, MD)</Label>
              <Input value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Registration Number</Label>
              <Input value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Consultation Fee (₹)</Label>
              <Input type="number" step="0.01" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Default Appt Duration (mins)</Label>
              <Select value={formData.duration} onValueChange={v => setFormData({...formData, duration: v})}>
                <SelectTrigger className="h-10 text-sm rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 mins</SelectItem>
                  <SelectItem value="15">15 mins</SelectItem>
                  <SelectItem value="20">20 mins</SelectItem>
                  <SelectItem value="30">30 mins</SelectItem>
                  <SelectItem value="45">45 mins</SelectItem>
                  <SelectItem value="60">60 mins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Calendar Settings</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Working Hours Start</Label>
                <Input type="time" value={formData.workingHoursStart} onChange={e => setFormData({...formData, workingHoursStart: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Working Hours End</Label>
                <Input type="time" value={formData.workingHoursEnd} onChange={e => setFormData({...formData, workingHoursEnd: e.target.value})} className="h-10 text-sm rounded-xl border-slate-200" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Calendar Color</Label>
              <div className="flex gap-2">
                {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, calendarColor: color})}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${formData.calendarColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Working Days</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {daysOfWeek.map((day) => (
                  <label key={day} className={`flex items-center gap-2 text-xs font-semibold border px-3 py-2 rounded-xl cursor-pointer transition-colors ${formData.workingDays.includes(day) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <Checkbox
                      checked={formData.workingDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    {day.substring(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto h-10 rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20">
              {loading ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
