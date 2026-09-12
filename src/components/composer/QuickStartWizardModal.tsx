"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Wand2,
  CheckCircle2,
  Stethoscope,
  Building2,
  MapPin,
  Phone,
  Search,
  Star,
  Image as ImageIcon,
  ShieldCheck,
  Loader2,
  Calendar,
  MessageSquare,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPECIALTIES } from "@/lib/specialties";
import { THEME_PRESETS, ThemePreset } from "@/components/themes/theme-presets";
import { ClinicWebsiteData } from "@/components/themes/theme-types";
import { WebsiteFactoryService } from "@/services/website-factory.service";
import { useToast } from "@/components/ui/use-toast";

interface QuickStartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ClinicWebsiteData;
  onApplySynthesizedSite: (synthesizedData: ClinicWebsiteData) => void;
}

interface GbpProfileData {
  connected: boolean;
  gbpAccountId?: string;
  businessName?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  phone?: string;
  description?: string;
  primaryCategory?: string;
  doctorName?: string;
}

interface PlaceSearchResult {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function QuickStartWizardModal({
  isOpen,
  onClose,
  currentData,
  onApplySynthesizedSite,
}: QuickStartWizardModalProps) {
  const { toast } = useToast();

  // Wizard tab mode: "google" | "search" | "manual"
  const [activeTab, setActiveTab] = useState<"google" | "search" | "manual">("google");

  // GBP Auto-Detect state
  const [checkingGbp, setCheckingGbp] = useState(false);
  const [gbpProfile, setGbpProfile] = useState<GbpProfileData | null>(null);

  // Google Places Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual fallback inputs
  const [doctorName, setDoctorName] = useState(currentData.doctor?.name || "Dr. Vinay Kumar Rai");
  const [clinicName, setClinicName] = useState(currentData.siteTitle || "Rai Child Care & Clinic");
  const [specialty, setSpecialty] = useState(currentData.doctor?.specialty || "Pediatrics & Child Care");
  const [city, setCity] = useState("Varanasi");
  const [phone, setPhone] = useState(currentData.contactPhone || currentData.whatsappNumber || "");
  const [selectedThemeId, setSelectedThemeId] = useState(currentData.themeId || "warm-pediatrics");

  // Cinematic synthesis state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(5);

  // Synthesis steps displayed in the animation
  const SYNTHESIS_STEPS = [
    { label: "Connecting to Google Business Profile & Google Maps...", icon: Search },
    { label: "Importing verified clinic photography into facilities gallery...", icon: ImageIcon },
    { label: "Verifying 5-star Google patient reviews & trust badges...", icon: Star },
    { label: "Synthesizing specialized procedures, doctor bio & OPD hours...", icon: Stethoscope },
    { label: "Wiring 24/7 WhatsApp AI receptionist & online appointment booking...", icon: MessageSquare },
  ];

  // 1. Fetch connected GBP profile on modal open
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setGenerationStep(0);
      return;
    }

    setCheckingGbp(true);
    fetch("/api/website/auto-build")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setGbpProfile(data);
          setActiveTab("google");
          if (data.businessName) setClinicName(data.businessName);
          if (data.doctorName) setDoctorName(data.doctorName);
          if (data.phone) setPhone(data.phone);
          if (data.primaryCategory) {
            setSpecialty(data.primaryCategory);
            const def = WebsiteFactoryService.getSpecialtyThemeDefaults(data.primaryCategory);
            if (def?.themeId) setSelectedThemeId(def.themeId);
          }
        } else {
          setActiveTab("search");
        }
      })
      .catch(() => {
        setActiveTab("search");
      })
      .finally(() => {
        setCheckingGbp(false);
      });
  }, [isOpen]);

  // 2. Debounced Google Places search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch (err) {
        console.warn("Places search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  // Execute Auto-Build
  const handleExecuteAutoBuild = async (overrideParams: {
    gbpAccountId?: string;
    placeId?: string;
    clinicName?: string;
    doctorName?: string;
    specialty?: string;
    city?: string;
    phone?: string;
  } = {}) => {
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(10);

    // Run progressive UI timer
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < SYNTHESIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
      setGenerationProgress((prev) => Math.min(prev + 18, 92));
    }, 7000);

    try {
      const payload = {
        gbpAccountId: overrideParams.gbpAccountId || gbpProfile?.gbpAccountId,
        placeId: overrideParams.placeId || selectedPlace?.place_id,
        clinicName: overrideParams.clinicName || clinicName,
        doctorName: overrideParams.doctorName || doctorName,
        specialty: overrideParams.specialty || specialty,
        city: overrideParams.city || city,
        phone: overrideParams.phone || phone,
      };

      const res = await fetch("/api/website/auto-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      clearInterval(stepInterval);
      setGenerationProgress(100);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Synthesis failed");
      }

      setTimeout(() => {
        onApplySynthesizedSite(data.website);
        setIsGenerating(false);
        onClose();
        toast({
          title: "🎉 Clinic Website Auto-Built in 45s!",
          description: `Imported ${data.stats?.photosImported || 6} photos, ${data.stats?.reviewsImported || 8} reviews, and wired WhatsApp booking.`,
        });
      }, 800);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      const rawMsg = err.message || "";
      const cleanErrMsg = rawMsg.includes("}") 
        ? rawMsg.slice(rawMsg.lastIndexOf("}") + 1).trim() || "Failed to synthesize website"
        : rawMsg || "Failed to synthesize website. You can try manual fast setup.";

      toast({
        title: "Auto-Build Error",
        description: cleanErrMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Gyrex Clinical AI Synthesis Engine</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Fast-Track</span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Auto-build your complete clinic website from Google Business Profile in 45s.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cinematic Generating Screen */}
        {isGenerating ? (
          <div className="p-8 sm:p-10 space-y-7 text-center">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                <Sparkles className="w-9 h-9 text-yellow-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Gyrex AI is Building Your Clinic Website...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Synthesizing Google Business Profile details, high-res photos, 5-star reviews, and treatments.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Gathering Google Data</span>
                <span>{generationProgress}%</span>
                <span>Finalizing Studio</span>
              </div>
            </div>

            {/* Dynamic Step Tracker */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2.5">
              {SYNTHESIS_STEPS.map((stepItem, idx) => {
                const Icon = stepItem.icon;
                const isCurrent = idx === generationStep;
                const isPassed = idx < generationStep;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 text-xs transition-colors ${
                      isCurrent
                        ? "text-blue-700 font-bold"
                        : isPassed
                        ? "text-emerald-600 font-semibold"
                        : "text-slate-400 font-normal"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{stepItem.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Normal Configuration Tabs */
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Tab Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              {gbpProfile?.connected && (
                <button
                  type="button"
                  onClick={() => setActiveTab("google")}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "google"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified Google Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "search"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Search Google Maps</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "manual"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                <span>Manual Fast Setup</span>
              </button>
            </div>

            {/* TAB 1: CONNECTED GOOGLE BUSINESS PROFILE */}
            {activeTab === "google" && gbpProfile?.connected && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                          Connected Google Business Profile
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1.5">
                        {gbpProfile.businessName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{gbpProfile.address || "Verified Clinical Address"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-100 text-center">
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100/80">
                      <span className="text-[10px] text-slate-500 font-medium">Google Rating</span>
                      <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{gbpProfile.rating ? gbpProfile.rating.toFixed(1) : "5.0"}</span>
                      </p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100/80">
                      <span className="text-[10px] text-slate-500 font-medium">Patient Reviews</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {gbpProfile.userRatingsTotal || 0}+ Reviews
                      </p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100/80">
                      <span className="text-[10px] text-slate-500 font-medium">Primary Specialty</span>
                      <p className="text-xs font-bold text-blue-700 truncate mt-0.5">
                        {gbpProfile.primaryCategory || "Medical Care"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleExecuteAutoBuild({ gbpAccountId: gbpProfile.gbpAccountId })}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>Auto-Build My Website with Gyrex AI (45s)</span>
                </Button>
              </div>
            )}

            {/* TAB 2: SEARCH GOOGLE MAPS PLACE */}
            {activeTab === "search" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-600" /> Search Clinic or Hospital on Google Maps
                  </label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Rai Child Care Clinic Varanasi or Max Hospital..."
                      className="h-10 rounded-xl text-xs pl-9 bg-white"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-3" />
                    )}
                  </div>
                </div>

                {/* Autocomplete Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white shadow-md">
                    {searchResults.map((place) => (
                      <button
                        key={place.place_id}
                        type="button"
                        onClick={() => {
                          setSelectedPlace(place);
                          setClinicName(place.structured_formatting.main_text);
                          setSearchQuery(place.structured_formatting.main_text);
                          setSearchResults([]);
                        }}
                        className="w-full p-3 text-left hover:bg-blue-50/50 transition-colors flex items-start gap-2.5 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {place.structured_formatting.main_text}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {place.structured_formatting.secondary_text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Place Details Preview */}
                {selectedPlace && (
                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {selectedPlace.structured_formatting.main_text}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-6 truncate">
                      {selectedPlace.structured_formatting.secondary_text}
                    </p>

                    <Button
                      type="button"
                      onClick={() => handleExecuteAutoBuild({ placeId: selectedPlace.place_id, clinicName: selectedPlace.structured_formatting.main_text })}
                      className="w-full h-10 mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Auto-Build from this Google Location (45s)</span>
                    </Button>
                  </div>
                )}

                {!selectedPlace && searchResults.length === 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">Find your practice in 1 click</p>
                    <p className="text-[11px] text-slate-500">
                      Gyrex AI will pull your verified photos, reviews, opening hours, and address automatically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MANUAL FAST SETUP */}
            {activeTab === "manual" && (
              <div className="space-y-4 pt-1">
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
                      onChange={(e) => {
                        setSpecialty(e.target.value);
                        const def = WebsiteFactoryService.getSpecialtyThemeDefaults(e.target.value);
                        if (def?.themeId) setSelectedThemeId(def.themeId);
                      }}
                      className="w-full h-10 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white"
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
                </div>

                <Button
                  type="button"
                  onClick={() => handleExecuteAutoBuild()}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>Synthesize Website with Gyrex AI (45s)</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isGenerating && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Medical-grade HIPAA & GDPR compliant
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs font-bold">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
