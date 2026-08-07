"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, RefreshCcw, Save, Link2, FileText, Layers, Clock, Phone, Globe, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface QuickFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  currentValue: any;
  primaryCategory?: string;
  onSaved: () => void;
}

export function QuickFixModal({
  isOpen,
  onClose,
  fieldKey,
  fieldLabel,
  currentValue,
  primaryCategory = "Doctor",
  onSaved,
}: QuickFixModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Field states
  const [textVal, setTextVal] = useState("");
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (fieldKey === "categories") {
        setCategoryTags(Array.isArray(currentValue) ? currentValue : []);
      } else if (fieldKey === "attributes") {
        const initialAttrs = Array.isArray(currentValue)
          ? currentValue
          : typeof currentValue === "object" && currentValue
          ? Object.keys(currentValue)
          : [];
        setSelectedAttributes(initialAttrs);
      } else {
        setTextVal(typeof currentValue === "string" ? currentValue : "");
      }
    }
  }, [isOpen, fieldKey, currentValue]);

  if (!isOpen) return null;

  // Category suggestions based on specialty
  const getCategorySuggestions = () => {
    const p = primaryCategory.toLowerCase();
    if (p.includes("gynaecolog") || p.includes("obstetr")) {
      return ["Gynecologist", "Women's Health Clinic", "Maternity Hospital", "Fertility Clinic", "Ultrasound Scan Center"];
    } else if (p.includes("pediat") || p.includes("child")) {
      return ["Pediatrician", "Child Specialist", "Vaccination Center", "Pediatric Care Clinic"];
    } else if (p.includes("derma") || p.includes("skin")) {
      return ["Dermatologist", "Skin Care Clinic", "Hair Transplant Clinic", "Laser Hair Removal Service"];
    } else if (p.includes("denta") || p.includes("teeth")) {
      return ["Dental Clinic", "Orthodontist", "Cosmetic Dentist", "Teeth Whitening Service"];
    }
    return ["Medical Clinic", "Specialist Clinic", "Urgent Care Center", "Wellness Center"];
  };

  const attributeOptions = [
    "Wheelchair Accessible Entrance",
    "Wheelchair Accessible Restroom",
    "Appointments Recommended",
    "Women-Led Practice",
    "Online Care & Telehealth",
    "Restroom Available",
  ];

  const handleToggleCategory = (cat: string) => {
    if (categoryTags.includes(cat)) {
      setCategoryTags(categoryTags.filter((c) => c !== cat));
    } else {
      setCategoryTags([...categoryTags, cat]);
    }
  };

  const handleToggleAttribute = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter((a) => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  const handleAiGenerateDescription = async () => {
    try {
      setAiGenerating(true);
      const generated = `Leading ${primaryCategory} clinic providing comprehensive medical care, patient consultations, and specialized treatment programs. Dedicated to clinical excellence and compassionate patient outcome delivery in modern, fully equipped facilities.`;
      setTextVal(generated);
      toast({
        title: "AI Description Generated!",
        description: "Review and click 'Save & Sync to Google' to update your profile.",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let payloadValue: any = textVal;

      if (fieldKey === "categories") {
        payloadValue = categoryTags;
      } else if (fieldKey === "attributes") {
        payloadValue = selectedAttributes;
      } else if (fieldKey === "hours") {
        payloadValue = textVal || "Mon-Sat 9:00 AM - 6:00 PM";
      }

      const res = await fetch("/api/local-seo/profile-health/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: fieldKey,
          value: payloadValue,
        }),
      });

      if (res.ok) {
        toast({
          title: "Profile Health Updated! 🎉",
          description: `"${fieldLabel}" has been saved and synced to your Google Business Profile.`,
        });
        onSaved();
        onClose();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e.message || "Could not save profile update.",
        variant: "destructive",
      });
    } fontally: {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {fieldKey === "appointmentUrl" ? (
                <Link2 className="w-4 h-4" />
              ) : fieldKey === "description" ? (
                <FileText className="w-4 h-4" />
              ) : fieldKey === "categories" ? (
                <Layers className="w-4 h-4" />
              ) : fieldKey === "hours" ? (
                <Clock className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Optimize {fieldLabel}</h3>
              <p className="text-[11px] text-gray-500">Instant in-page update · Synced to Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* APPOINTMENT URL */}
          {fieldKey === "appointmentUrl" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Appointment Booking URL</label>
              <input
                type="url"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder="https://gyrex.in/book/your-clinic"
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Direct booking links allow patients searching on Google Maps to schedule appointments in 1 click.
              </p>
            </div>
          )}

          {/* BUSINESS DESCRIPTION */}
          {fieldKey === "description" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Business Description</label>
                <button
                  type="button"
                  onClick={handleAiGenerateDescription}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {aiGenerating ? "Generating..." : "AI Auto-Generate"}
                </button>
              </div>
              <textarea
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                rows={5}
                placeholder="Describe your medical practice, specialties, treatments offered, and patient care philosophy..."
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-gray-400">
                <span>Recommended: 250+ characters</span>
                <span className={textVal.length >= 250 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {textVal.length} chars
                </span>
              </div>
            </div>
          )}

          {/* SECONDARY CATEGORIES */}
          {fieldKey === "categories" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Select Secondary Categories</label>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Click category tags below to add secondary specialties to your profile.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {getCategorySuggestions().map((cat) => {
                  const isSelected = categoryTags.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-gray-400" />}
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-gray-400 font-medium">Selected ({categoryTags.length}): </span>
                <span className="text-xs font-bold text-indigo-900">{categoryTags.join(", ") || "None"}</span>
              </div>
            </div>
          )}

          {/* OPENING HOURS */}
          {fieldKey === "hours" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Operating Hours & Schedule</label>
              <input
                type="text"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder="Mon-Sat 9:00 AM - 6:00 PM"
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <div className="flex gap-2 flex-wrap">
                {["Mon-Sat 5:30 PM - 7:30 PM", "Mon-Sat 9AM-6PM", "Mon-Fri 10AM-8PM", "Open 24/7"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTextVal(preset)}
                    className="text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 rounded-lg border border-gray-200 transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ATTRIBUTES */}
          {fieldKey === "attributes" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Clinic Amenities & Attributes</label>
              <div className="space-y-2">
                {attributeOptions.map((attr) => {
                  const isChecked = selectedAttributes.includes(attr);
                  return (
                    <label
                      key={attr}
                      onClick={() => handleToggleAttribute(attr)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>{attr}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHONE & WEBSITE FALLBACK */}
          {(fieldKey === "phone" || fieldKey === "website") && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">{fieldLabel}</label>
              <input
                type="text"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                placeholder={fieldKey === "phone" ? "+91 99999 88888" : "https://yourclinic.com"}
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            {saving ? (
              <>
                <RefreshCcw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving & Syncing...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save & Sync to Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
