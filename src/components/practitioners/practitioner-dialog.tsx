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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{practitioner ? "Edit Doctor Details" : "Add New Doctor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="Dr. Sarah Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Select 
                value={formData.specialty} 
                onValueChange={v => setFormData({...formData, specialty: v})}
              >
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {specialtiesList.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.specialty === "Other" && (
              <div className="space-y-2 md:col-span-2">
                <Label>Custom Specialty</Label>
                <Input 
                  value={formData.otherSpecialty} 
                  onChange={e => setFormData({...formData, otherSpecialty: e.target.value})} 
                  placeholder="e.g. Immunologist"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Qualification (e.g. MBBS, MD)</Label>
              <Input value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Consultation Fee ($)</Label>
              <Input type="number" step="0.01" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Default Appt Duration (mins)</Label>
              <Select value={formData.duration} onValueChange={v => setFormData({...formData, duration: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-4">Calendar Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Working Hours Start</Label>
                <Input type="time" value={formData.workingHoursStart} onChange={e => setFormData({...formData, workingHoursStart: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Working Hours End</Label>
                <Input type="time" value={formData.workingHoursEnd} onChange={e => setFormData({...formData, workingHoursEnd: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label>Calendar Color</Label>
              <div className="flex gap-2">
                {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, calendarColor: color})}
                    className={`w-8 h-8 rounded-full border-2 ${formData.calendarColor === color ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm border p-2 rounded-md cursor-pointer hover:bg-gray-50">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
