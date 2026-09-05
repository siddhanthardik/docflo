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
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { COUNTRIES, getDefaultCountryCodeForTimezone } from "@/lib/countries";
import {
  UserPlus,
  User,
  Mail,
  Stethoscope,
  MapPin,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Tag,
  Plus,
} from "lucide-react";

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: "create" | "edit";
}

function calculateAgeFromDob(dobString: string): { years: number; months: number; display: string } | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (today.getDate() < dob.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return null;

  let display = "";
  if (years > 0 && months > 0) {
    display = `${years} Y, ${months} M`;
  } else if (years > 0) {
    display = `${years} Years`;
  } else {
    display = `${months} Months`;
  }
  return { years, months, display };
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
  const [ageInput, setAgeInput] = useState("");
  const [ageDisplay, setAgeDisplay] = useState("");
  const [newTagInput, setNewTagInput] = useState("");

  const PRESET_TAGS = [
    "VIP",
    "Diabetic",
    "Hypertension",
    "Pediatric",
    "Follow-up",
    "Senior Citizen",
    "Post-Op",
  ];

  const handleAddCustomTag = (tagToAdd?: string) => {
    const clean = (tagToAdd || newTagInput).trim();
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, clean],
      }));
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

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
      let cCode = getDefaultCountryCodeForTimezone();
      let num = (initialData.phone || "").trim();

      if (num.startsWith("+")) {
        const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const matched = sorted.find((c) => num.startsWith(c.dialCode));
        if (matched) {
          cCode = matched.dialCode;
          num = num.substring(matched.dialCode.length);
        } else {
          const match = num.match(/^(\+\d{1,4})\s*(.*)$/);
          if (match) {
            cCode = match[1];
            num = match[2];
          }
        }
      }
      setCountryCode(cCode);

      const dobString = initialData.dateOfBirth
        ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
        : "";

      if (dobString) {
        const ageResult = calculateAgeFromDob(dobString);
        if (ageResult) {
          setAgeInput(ageResult.years.toString());
          setAgeDisplay(ageResult.display);
        } else {
          setAgeInput("");
          setAgeDisplay("");
        }
      } else {
        setAgeInput("");
        setAgeDisplay("");
      }

      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phone: num,
        email: initialData.email || "",
        dateOfBirth: dobString,
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
      setCountryCode(getDefaultCountryCodeForTimezone());
      setAgeInput("");
      setAgeDisplay("");
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

  // Handle direct age entry: computes approximate Date of Birth (Jan 1 of birth year)
  const handleAgeChange = (val: string) => {
    setAgeInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 125) {
      const now = new Date();
      const birthYear = now.getFullYear() - parsed;
      const approxDob = `${birthYear}-01-01`;
      setFormData((prev) => ({ ...prev, dateOfBirth: approxDob }));
      setAgeDisplay(`${parsed} Years`);
    } else if (!val.trim()) {
      setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
      setAgeDisplay("");
    }
  };

  // Handle calendar Date of Birth selection: computes exact years and months
  const handleDobChange = (dobVal: string) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: dobVal }));
    if (dobVal) {
      const result = calculateAgeFromDob(dobVal);
      if (result) {
        setAgeInput(result.years.toString());
        setAgeDisplay(result.display);
      }
    } else {
      setAgeInput("");
      setAgeDisplay("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean phone number dynamically regardless of country code
      let rawNumber = formData.phone.trim();
      if (rawNumber.startsWith("+")) {
        if (rawNumber.startsWith(countryCode)) {
          rawNumber = rawNumber.slice(countryCode.length);
        } else {
          rawNumber = rawNumber.replace(/^\+\d{1,4}/, "");
        }
      }
      const sanitizedNumber = rawNumber.replace(/^0+/, "").replace(/\D/g, "");

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

        {/* Spacious Balanced 2-Column Form (4 Rows × 4 Rows) */}
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
                      autoFocus
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
                      placeholder="Sharma (or blank)"
                      className="pl-9 h-10 text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Mobile Number with Global Country Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 flex items-center gap-0.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    WhatsApp
                  </span>
                </div>
                <CountryPhoneInput
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  phone={formData.phone}
                  onPhoneChange={(val) => setFormData({ ...formData, phone: val })}
                  required
                />
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
              {/* Row 1: Age & Date of Birth (Bidirectional Calculation) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="age" className="text-xs font-semibold text-slate-700">
                      Age
                    </Label>
                    {ageDisplay && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                        {ageDisplay}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="125"
                      value={ageInput}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      placeholder="e.g. 23"
                      className="h-10 text-xs sm:text-sm font-semibold text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all pr-12"
                    />
                    <span className="absolute right-3 text-[11px] font-semibold text-slate-400 pointer-events-none uppercase">
                      Years
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="h-10 text-xs sm:text-sm font-medium text-slate-800 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Gender & Blood Group */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Row 4: Medical Notes / Allergies */}
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

              {/* Row 5: Tags & Clinical Labels */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" /> Patient Tags & Clinical Labels
                  </Label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>

                {/* Active Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Tag Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Add tag (e.g. VIP, Diabetic, Ortho) and press Enter..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      className="h-9 text-xs sm:text-sm bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCustomTag()}
                    className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-medium text-slate-400 mr-1">Quick Add:</span>
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveTag(tag);
                          } else {
                            handleAddCustomTag(tag);
                          }
                        }}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                          isSelected
                            ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-semibold"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
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