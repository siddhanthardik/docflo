"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { usePractitioners } from "@/hooks/use-practitioners";
import {
  UserPlus,
  User,
  Phone,
  Mail,
  HeartPulse,
  Stethoscope,
  MapPin,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: "create" | "edit";
}

export function PatientForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: PatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    city: "",
    medicalNotes: "",
    tags: [] as string[],
    patientType: "ACTIVE",
    primaryPractitionerId: "",
  });

  const { practitioners } = usePractitioners();

  useEffect(() => {
    if (initialData) {
      let cCode = "+91";
      let num = initialData.phone || "";
      if (num.startsWith("+")) {
        const match = num.match(/^(\+\d{1,4})\s*(.*)$/);
        if (match) {
          cCode = match[1];
          num = match[2];
        } else if (num.startsWith("+91")) {
          cCode = "+91";
          num = num.substring(3);
        } else if (num.startsWith("+1")) {
          cCode = "+1";
          num = num.substring(2);
        }
      }
      setCountryCode(cCode);

      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phone: num,
        email: initialData.email || "",
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: initialData.gender || "",
        bloodGroup: initialData.bloodGroup || "",
        address: initialData.address || "",
        city: initialData.city || "",
        medicalNotes: initialData.medicalNotes || "",
        tags: initialData.tags || [],
        patientType: initialData.patientType || "ACTIVE",
        primaryPractitionerId: initialData.primaryPractitionerId || "",
      });
    } else {
      setCountryCode("+91");
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        address: "",
        city: "",
        medicalNotes: "",
        tags: [],
        patientType: "ACTIVE",
        primaryPractitionerId: "",
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sanitize phone number in case user pasted country code or leading zeros
      const rawNumber = formData.phone.trim();
      const sanitizedNumber = rawNumber
        .replace(/^(\+91|\+1|\+44|\+61|\+971)/, "")
        .replace(/^0+/, "")
        .replace(/\D/g, "");

      await onSubmit({
        ...formData,
        phone: `${countryCode}${sanitizedNumber}`,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:max-w-2xl md:max-w-3xl p-0 rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Aesthetic Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                {mode === "create" ? "Add New Patient" : "Edit Patient Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal leading-tight mt-0.5">
                {mode === "create"
                  ? "Register a patient into your clinic CRM records"
                  : "Update and manage demographic records"}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spacious Balanced 2-Column Form */}
        <form
          id="patient-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          className="px-6 py-5 max-h-[80vh] sm:max-h-none overflow-y-auto sm:overflow-visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-4">
            {/* ════════════ LEFT COLUMN: IDENTITY & CONTACT ════════════ */}
            <div className="space-y-4">
              {/* Row 1: First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700 flex items-center gap-0.5">
                    First Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Rahul"
                      required
                      className="pl-9 h-10 text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Last Name <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Sharma (or leave blank)"
                      className="pl-9 h-10 text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Mobile Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 flex items-center gap-0.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    WhatsApp
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[115px] h-10 text-xs font-semibold text-slate-700 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500 shrink-0">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="+91">🇮🇳 +91 (IN)</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1 (US)</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44 (UK)</SelectItem>
                      <SelectItem value="+61">🇦🇺 +61 (AU)</SelectItem>
                      <SelectItem value="+971">🇦🇪 +971 (AE)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="98765 43210 (10 digits)"
                      required
                      className="pl-9 h-10 text-sm font-semibold tracking-wide text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:font-normal placeholder:tracking-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="rahul.sharma@example.com"
                    className="pl-9 h-10 text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Primary Practitioner Assignment */}
              <div className="space-y-1.5">
                <Label htmlFor="primaryPractitioner" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-500" /> Primary Practitioner
                </Label>
                <Select
                  value={formData.primaryPractitionerId || "NONE"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      primaryPractitionerId: value === "NONE" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500">
                    <SelectValue placeholder="Select Practitioner" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="NONE">None (General Clinic Pool)</SelectItem>
                    {practitioners.map((practitioner) => (
                      <SelectItem key={practitioner.id} value={practitioner.id}>
                        {practitioner.name} {practitioner.specialty ? `(${practitioner.specialty})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ════════════ RIGHT COLUMN: DEMOGRAPHICS & CLINICAL ════════════ */}
            <div className="space-y-4">
              {/* Row 1: DOB & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-semibold text-slate-700">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {genders.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Blood Group & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bloodGroup" className="text-xs font-semibold text-slate-700">
                    Blood Group
                  </Label>
                  <Select
                    value={formData.bloodGroup || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bloodGroup: value })
                    }
                  >
                    <SelectTrigger className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patientType" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Category
                  </Label>
                  <Select
                    value={formData.patientType || "ACTIVE"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patientType: value })
                    }
                  >
                    <SelectTrigger className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-indigo-500">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="ACTIVE">Standard (Active)</SelectItem>
                      <SelectItem value="VIP">VIP Patient</SelectItem>
                      <SelectItem value="CHRONIC">Chronic Care</SelectItem>
                      <SelectItem value="EMERGENCY">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Address & City */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Street Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="123 Main Road, Block B"
                      className="h-10 text-xs sm:text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Delhi"
                    className="h-10 text-xs sm:text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Medical Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="medicalNotes" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Medical Notes / Allergies
                </Label>
                <Input
                  id="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, medicalNotes: e.target.value })
                  }
                  placeholder="Known allergies, medical conditions, or notes..."
                  className="h-10 text-xs sm:text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Spacious Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-all"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="patient-form"
            disabled={loading}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Saving...
              </>
            ) : mode === "create" ? (
              <>
                <UserPlus className="w-4 h-4 text-white" />
                Add Patient
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}