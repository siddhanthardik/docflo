"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AsyncPatientSelect } from "@/components/ui/async-patient-select";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  patientType?: string;
}

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  patients: Patient[];
  initialData?: any;
  mode: "create" | "edit";
}


const durations = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
];

export function AppointmentForm({
  open,
  onOpenChange,
  onSubmit,
  patients,
  initialData,
  mode,
}: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [selectedPatientObj, setSelectedPatientObj] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date(),
    startTime: "09:00",
    duration: 30,
    reason: "",
    notes: "",
    practitionerId: "",
    isWalkIn: false,
    type: "IN_CLINIC",
  });

  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/practitioners").then(res => res.ok ? res.json() : []).then(data => {
      const active = data.filter((p: any) => p.isActive);
      setPractitioners(active);
      if (active.length === 1) {
        setFormData(prev => ({ ...prev, practitionerId: active[0].id }));
      }
    });

    fetch("/api/settings/clinic")
      .then((res) => res.json())
      .then((data) => {
        const start = data.workingHoursStart || "09:00";
        const end = data.workingHoursEnd || "17:00";
        
        const slots = [];
        let [hour, minute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);
        
        while (hour < endHour || (hour === endHour && minute < endMinute)) {
          slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
          minute += 15;
          if (minute >= 60) {
            minute -= 60;
            hour += 1;
          }
        }
        setTimeSlots(slots);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        patientId: initialData.patientId || "",
        date: initialData.date ? new Date(initialData.date) : new Date(),
        startTime: initialData.startTime
          ? format(new Date(initialData.startTime), "HH:mm")
          : "09:00",
        duration: 30,
        reason: initialData.reason || "",
        notes: initialData.notes || "",
        practitionerId: initialData.practitionerId || "",
        isWalkIn: false,
        type: initialData.type || "IN_CLINIC",
      });
    } else {
      setFormData(prev => ({
        patientId: "",
        date: new Date(),
        startTime: "09:00",
        duration: 30,
        reason: "",
        notes: "",
        practitionerId: prev.practitionerId, // preserve if it was auto-set
        isWalkIn: false,
        type: "IN_CLINIC",
      }));
      setSelectedPatientObj(null);
    }
  }, [initialData, mode, open]);

  const handleConvertLead = async () => {
    if (!selectedPatientObj) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatientObj.id}/convert`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to convert lead");
      const updated = await res.json();
      setSelectedPatientObj({ ...selectedPatientObj, patientType: "ACTIVE" });
    } catch (error) {
      console.error(error);
    } finally {
      setConverting(false);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endTime = calculateEndTime(formData.startTime, formData.duration);
      await onSubmit({
        patientId: formData.patientId,
        date: formData.date,
        startTime: formData.startTime,
        endTime,
        reason: formData.reason,
        notes: formData.notes,
        practitionerId: formData.practitionerId,
        isWalkIn: formData.type === "TELE_CONSULTATION" ? false : formData.isWalkIn,
        type: formData.type,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Schedule Appointment" : "Edit Appointment"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Schedule a new appointment for a patient"
              : "Update appointment details"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <AsyncPatientSelect
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                onPatientChange={(patient) => setSelectedPatientObj(patient)}
                initialPatients={patients}
              />
              {selectedPatientObj?.patientType === "LEAD" && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  <p className="text-yellow-800 font-medium mb-2">
                    This person is currently a Lead.
                  </p>
                  <p className="text-yellow-700 mb-3">
                    Leads must be converted to active patients before scheduling an appointment.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    onClick={handleConvertLead}
                    disabled={converting}
                  >
                    {converting ? "Converting..." : "Convert to Patient"}
                  </Button>
                </div>
              )}
            </div>

            {practitioners.length > 1 && (
              <div className="space-y-2">
                <Label>Doctor / Practitioner *</Label>
                <Select
                  value={formData.practitionerId}
                  onValueChange={(value) => setFormData({ ...formData, practitionerId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {practitioners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.specialty ? `(${p.specialty})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, date })
                    }
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val, isWalkIn: val === "TELE_CONSULTATION" ? false : formData.isWalkIn })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_CLINIC">In Clinic</SelectItem>
                    <SelectItem value="TELE_CONSULTATION">Tele-Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {formData.startTime}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem
                        key={duration.value}
                        value={duration.value.toString()}
                      >
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.startTime && formData.duration > 0 && (
              <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                End time: {calculateEndTime(formData.startTime, formData.duration)}
              </div>
            )}

            <div className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm ${formData.type === "TELE_CONSULTATION" ? "opacity-50 pointer-events-none" : "bg-gray-50/50"}`}>
              <Checkbox
                id="isWalkIn"
                checked={formData.type === "TELE_CONSULTATION" ? false : formData.isWalkIn}
                disabled={formData.type === "TELE_CONSULTATION"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isWalkIn: checked === true })
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isWalkIn" className="font-semibold text-gray-900">
                  Walk-in Patient
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.type === "TELE_CONSULTATION" 
                    ? "Walk-ins are not applicable for Tele-Consultation."
                    : "Check this if the patient is already at the clinic. This will bypass the WhatsApp scheduled confirmation message and mark them as Checked In."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="General checkup, Follow-up, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading || selectedPatientObj?.patientType === "LEAD"}
            >
              {loading
                ? "Saving..."
                : mode === "create"
                ? "Schedule"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}