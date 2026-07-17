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

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const durations = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 hour", value: 60 },
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
  });

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
      });
    } else {
      setFormData({
        patientId: "",
        date: new Date(),
        startTime: "09:00",
        duration: 30,
        reason: "",
        notes: "",
      });
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
      <DialogContent className="sm:max-w-[550px]">
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

            <div className="grid grid-cols-2 gap-4">
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
            <Button type="submit" disabled={loading || selectedPatientObj?.patientType === "LEAD"}>
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