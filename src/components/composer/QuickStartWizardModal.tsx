"use client";

import React, { useState } from "react";
import { X, Sparkles, Wand2, ArrowRight, CheckCircle2, Stethoscope, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPECIALTIES } from "@/lib/specialties";
import { THEME_PRESETS, ThemePreset } from "@/components/themes/theme-presets";
import { ClinicWebsiteData } from "@/components/themes/theme-types";
import { WebsiteFactoryService } from "@/services/website-factory.service";

interface QuickStartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ClinicWebsiteData;
  onApplySynthesizedSite: (synthesizedData: ClinicWebsiteData) => void;
}

export function QuickStartWizardModal({
  isOpen,
  onClose,
  currentData,
  onApplySynthesizedSite,
}: QuickStartWizardModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [doctorName, setDoctorName] = useState(currentData.doctor?.name || "Dr. Vinay Kumar Rai");
  const [clinicName, setClinicName] = useState(currentData.siteTitle || "Rai Child Care & Vaccination Clinic");
  const [specialty, setSpecialty] = useState(currentData.doctor?.specialty || "Pediatrics & Child Care");
  const [city, setCity] = useState("Varanasi");
  const [phone, setPhone] = useState(currentData.contactPhone || currentData.whatsappNumber || "");
  const [selectedThemeId, setSelectedThemeId] = useState(currentData.themeId || "warm-pediatrics");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSpecialtyChange = (newSpecialty: string) => {
    setSpecialty(newSpecialty);
    const themeDef = WebsiteFactoryService.getSpecialtyThemeDefaults(newSpecialty);
    if (themeDef?.themeId) {
      setSelectedThemeId(themeDef.themeId);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const themeDef = WebsiteFactoryService.getSpecialtyThemeDefaults(specialty);
      const cleanDoctor = doctorName.trim();
      const cleanClinic = clinicName.trim() || `${cleanDoctor}'s Clinic`;
      const cleanCity = city.trim() || "City";
      const cleanPhone = phone.trim();

      // Clinical Services tailored to specialty
      const specialtyLower = specialty.toLowerCase();
      let generatedServices = [
        {
          name: "Comprehensive Clinical Consultation",
          description: `Detailed diagnosis, physical assessment, and tailored treatment planning by ${cleanDoctor}.`,
          duration: 30,
          price: 500,
          icon: "stethoscope",
        },
        {
          name: `Specialized ${specialty} Care`,
          description: `Evidence-based clinical treatments and modern diagnostic management in ${cleanCity}.`,
          duration: 45,
          price: 800,
          icon: "activity",
        },
        {
          name: "Follow-Up & Recovery Review",
          description: "Progress evaluation, prescription optimization, and continuous patient recovery guidance.",
          duration: 20,
          price: 0,
          icon: "shield",
        },
      ];

      if (specialtyLower.includes("pediat") || specialtyLower.includes("child")) {
        generatedServices = [
          {
            name: "IAP Vaccination & Immunization",
            description: "Complete official IAP schedule vaccines with temperature-controlled cold chain storage and digital reminder cards.",
            duration: 30,
            price: 600,
            icon: "syringe",
          },
          {
            name: "Child Growth & Developmental Milestone Review",
            description: "Physical growth monitoring (height, weight, BMI percentile) and cognitive milestone assessment.",
            duration: 30,
            price: 500,
            icon: "baby",
          },
          {
            name: "Pediatric Acute Infection & Allergy Treatment",
            description: "Diagnosis and compassionate care for fever, asthma, respiratory allergies, colic, and childhood infections.",
            duration: 30,
            price: 500,
            icon: "stethoscope",
          },
        ];
      } else if (specialtyLower.includes("dent") || specialtyLower.includes("smile")) {
        generatedServices = [
          {
            name: "Painless Root Canal Treatment (RCT)",
            description: "Single-sitting rotary endodontics with computerized anesthesia for completely comfortable treatment.",
            duration: 45,
            price: 2500,
            icon: "smile",
          },
          {
            name: "Laser Teeth Whitening & Smile Designing",
            description: "Advanced cosmetic smile makeover, veneers, and safe non-abrasive enamel brightening.",
            duration: 45,
            price: 4500,
            icon: "sparkles",
          },
          {
            name: "Dental Implants & Digital X-Ray Checkup",
            description: "Precision titanium implants and low-radiation digital radiography for permanent tooth replacement.",
            duration: 60,
            price: 18000,
            icon: "cross",
          },
        ];
      } else if (specialtyLower.includes("derma") || specialtyLower.includes("skin")) {
        generatedServices = [
          {
            name: "Medical Acne & Scar Revision Laser",
            description: "Clinical dermatology protocol targeting active cystic acne, stubborn blemishes, and post-acne scars.",
            duration: 45,
            price: 2200,
            icon: "sparkles",
          },
          {
            name: "Anti-Aging, Botox & PRP Hair Therapy",
            description: "FDA-approved aesthetic rejuvenating injectables and autologous growth factor hair restoration.",
            duration: 45,
            price: 4500,
            icon: "activity",
          },
          {
            name: "Advanced Medi-Facial & Hydra Glow",
            description: "Deep pore infusion, medical peel, and intense hydration for refreshed, glowing clinical radiance.",
            duration: 45,
            price: 2500,
            icon: "leaf",
          },
        ];
      } else if (specialtyLower.includes("cardio") || specialtyLower.includes("heart")) {
        generatedServices = [
          {
            name: "Digital 12-Lead ECG & Echo Screening",
            description: "Comprehensive non-invasive cardiac evaluation, computerized rhythm analysis, and Doppler study.",
            duration: 30,
            price: 1200,
            icon: "heart",
          },
          {
            name: "Hypertension & Lipid Risk Optimization",
            description: "Personalized cardiovascular risk scoring, continuous blood pressure monitoring, and preventive guidance.",
            duration: 30,
            price: 700,
            icon: "activity",
          },
          {
            name: "Heart Failure & Angina Management",
            description: "Evidence-based clinical pharmacological management to improve myocardial function and longevity.",
            duration: 40,
            price: 900,
            icon: "shield",
          },
        ];
      }

      // Specialty FAQs
      let generatedFaqs = [
        {
          question: `How do I book an appointment with ${cleanDoctor}?`,
          answer: `You can reserve your consultation slot directly online via our website booking button or message our 24/7 AI Receptionist on WhatsApp at ${cleanPhone || "our clinic number"}.`,
        },
        {
          question: `What are the clinic consultation timings in ${cleanCity}?`,
          answer: "Our clinic is open Monday to Saturday from 09:00 AM to 01:00 PM (Morning OPD) and 05:00 PM to 08:30 PM (Evening OPD).",
        },
        {
          question: "Is walk-in consultation allowed or is prior appointment mandatory?",
          answer: "While pre-booked appointments receive dedicated priority to minimize waiting time, walk-in patients are also warmly attended during open OPD hours.",
        },
      ];

      if (specialtyLower.includes("pediat") || specialtyLower.includes("child")) {
        generatedFaqs.unshift({
          question: "Are all IAP vaccines available and how is the cold-chain maintained?",
          answer: "Yes, 100% of official IAP recommended childhood vaccines (birth to 18 years) are maintained in certified medical cold-chain refrigerators with uninterrupted power backup.",
        });
      }

      const synthesizedData: ClinicWebsiteData = {
        ...currentData,
        themeId: selectedThemeId || themeDef.themeId,
        primaryColor: themeDef.primaryColor,
        secondaryColor: themeDef.secondaryColor,
        accentColor: themeDef.accentColor,
        fontHeading: themeDef.fontHeading,
        fontBody: themeDef.fontBody,
        siteTitle: cleanClinic,
        tagline: `Leading ${specialty} in ${cleanCity} • High Patient Satisfaction`,
        heroHeading: `Advanced ${specialty} & Dedicated Patient Care`,
        heroSubheading: `Led by ${cleanDoctor} at ${cleanClinic}. Delivering patient-centered clinical excellence, modern diagnostics, and compassionate healthcare in ${cleanCity}.`,
        heroImage: currentData.heroImage || null,
        ctaButtonText: "Book Appointment",
        ctaButtonAction: "BOOKING_MODAL",
        whatsappNumber: cleanPhone,
        contactPhone: cleanPhone,
        showServices: true,
        showReviews: true,
        showDoctorBio: true,
        showFaq: true,
        showMap: true,
        showStickyBar: true,
        customServices: generatedServices,
        customFaqs: generatedFaqs,
        doctor: {
          ...currentData.doctor,
          name: cleanDoctor,
          specialty: specialty,
          degrees: currentData.doctor?.degrees || "MBBS, MD",
          designation: currentData.doctor?.designation || `Lead Consultant - ${specialty}`,
        },
        customBio: `${cleanDoctor} is a highly regarded specialist in ${specialty} with extensive clinical experience. Practicing at ${cleanClinic} in ${cleanCity}, ${cleanDoctor} is committed to ethical, evidence-based medicine and providing personalized patient care with modern clinical standards.`,
        sections: [
          { id: "sec_hero", type: "HERO", badgeText: "Verified Clinical Excellence", subtitle: "" },
          { id: "sec_stats", type: "STATS_RIBBON" },
          { id: "sec_services", type: "SERVICES" },
          { id: "sec_reviews", type: "REVIEWS" },
          { id: "sec_bio", type: "DOCTOR_BIO" },
          { id: "sec_cta", type: "CTA_BANNER", title: `Ready to Consult with ${cleanDoctor}?`, subtitle: "Book your appointment online or chat directly with our clinic on WhatsApp." },
          { id: "sec_faq", type: "FAQ" },
          { id: "sec_map", type: "MAP_HOURS" },
        ],
      };

      onApplySynthesizedSite(synthesizedData);
      setIsGenerating(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">5-Minute Magic QuickStart</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Fast-Track</span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Auto-generate your medical website with treatments, FAQs, and WhatsApp booking in 45s.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Doctor Name
                </label>
                <Input
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Vinay Kumar Rai"
                  className="h-10 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Clinic / Practice Name
                </label>
                <Input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Rai Child Care & Vaccination Clinic"
                  className="h-10 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Primary Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => handleSpecialtyChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> City
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Varanasi, Mumbai"
                    className="h-10 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp & Calling Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210 (For 24/7 AI Receptionist & Booking)"
                  className="h-10 rounded-xl text-xs font-medium"
                />
                <p className="text-[10px] text-slate-500">
                  Patients will be able to message your clinic and confirm appointments directly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Choose Website Aesthetic & Theme</h4>
                <p className="text-[11px] text-slate-500">
                  We pre-selected the best matching medical theme for <strong className="text-blue-600">{specialty}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto p-1">
                {Object.values(THEME_PRESETS).slice(0, 8).map((thm: ThemePreset) => (
                  <div
                    key={thm.id}
                    onClick={() => setSelectedThemeId(thm.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedThemeId === thm.id
                        ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: thm.primaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: thm.secondaryColor }} />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: thm.accentColor }} />
                      </div>
                      {selectedThemeId === thm.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{thm.name}</h5>
                      <span className="text-[10px] text-slate-500">{thm.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step === 1 ? (
            <>
              <Button type="button" variant="ghost" onClick={onClose} className="h-10 text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md"
              >
                Next: Choose Theme <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-10 text-xs">
                ← Back
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-lg"
              >
                {isGenerating ? (
                  "Synthesizing Website..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    Generate My Website in 45s
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
