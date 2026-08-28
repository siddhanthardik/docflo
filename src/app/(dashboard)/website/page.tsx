"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData, PageSection, SectionType } from "@/components/themes/theme-types";
import {
  Globe,
  Palette,
  Layout,
  Layers,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  RefreshCw,
  Save,
  Eye,
  Check,
  Stethoscope,
  Share2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  HelpCircle,
  FileText,
  Copy,
  ArrowUpRight,
  Plus,
  Trash2,
  X,
  Smartphone,
  Monitor,
  Tablet,
  Building2,
  ChevronRight,
  Sliders,
  CheckCheck,
  Lock,
  Link2,
  Unlink,
  Sparkles,
  ArrowRight,
  Brush,
  Zap,
  MoveUp,
  MoveDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Image as ImageIcon,
  Type,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const THEME_OPTIONS = [
  { id: "apex-clinical", name: "Apex Multi-Specialty", category: "Polyclinic & Hospitals", primary: "#2563EB", secondary: "#0F172A", accent: "#10B981" },
  { id: "serene-glow", name: "Serene Aesthetics", category: "Dermatology & Skin", primary: "#BE185D", secondary: "#1E1B4B", accent: "#F43F5E" },
  { id: "minimal-luxe", name: "Minimal Luxe Dental", category: "Dentistry & Smile", primary: "#0284C7", secondary: "#0F172A", accent: "#14B8A6" },
  { id: "warm-pediatrics", name: "Warm Pediatrics", category: "Pediatrics & Kids", primary: "#059669", secondary: "#1E293B", accent: "#F59E0B" },
  { id: "vitality-rehab", name: "Vitality Rehab", category: "Ortho & Physio", primary: "#0D9488", secondary: "#18181B", accent: "#E11D48" },
];

const AVAILABLE_WIDGETS: Array<{ type: SectionType; label: string; icon: any; description: string }> = [
  { type: "HERO", label: "Hero Banner & Welcome", icon: Layout, description: "Main headline, clinic photo, rating badges, and booking trigger." },
  { type: "SERVICES", label: "Services & Treatments Grid", icon: Stethoscope, description: "Clinical procedures with durations, pricing, and booking buttons." },
  { type: "DOCTOR_BIO", label: "Doctor Bio & Experience", icon: ShieldCheck, description: "Doctor portrait, medical credentials, and clinical philosophy." },
  { type: "REVIEWS", label: "Google Patient Reviews", icon: Star, description: "Verified Google Maps patient feedback cards with 5-star ratings." },
  { type: "CTA_BANNER", label: "Conversion CTA Callout", icon: MessageSquare, description: "High-impact banner to drive WhatsApp chats and consultations." },
  { type: "GALLERY", label: "Clinic Facility Showcase", icon: ImageIcon, description: "Modern photography grid of your treatment rooms and clinic." },
  { type: "FAQ", label: "Interactive FAQ Accordion", icon: HelpCircle, description: "Expandable patient questions & answers with Google FAQ schema." },
  { type: "MAP_HOURS", label: "Location Map & Hours", icon: MapPin, description: "Interactive clinic Google Map, telephone, and weekly schedule." },
  { type: "CUSTOM_TEXT", label: "Custom Story & Notice", icon: Type, description: "Custom headline and rich text for clinic notices or patient guides." },
];

export default function ElementorComposerPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "structure" | "style" | "domain">("elements");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Custom Domain State
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [connectingDomain, setConnectingDomain] = useState(false);
  const [customDomainStatus, setCustomDomainStatus] = useState<{ connectedDomain?: string | null; dnsConfigured?: boolean }>({});

  // Free URL validation state
  const [urlInput, setUrlInput] = useState("");
  const [urlStatus, setUrlStatus] = useState<{ available?: boolean; checking?: boolean; reason?: string }>({});

  // Active Website State
  const [siteData, setSiteData] = useState<ClinicWebsiteData>({
    subdomain: "clinic",
    themeId: "apex-clinical",
    primaryColor: "#2563EB",
    secondaryColor: "#0F172A",
    accentColor: "#10B981",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    siteTitle: "Clinic",
    tagline: "Comprehensive Healthcare",
    heroHeading: "Advanced Healthcare & Dedicated Patient Care",
    heroSubheading: "Delivering compassionate clinical consultations, evidence-based treatments, and high patient satisfaction.",
    heroImage: null,
    heroStyle: "IMAGE_ONLY",
    showHeroBookingForm: false,
    announcementBar: "Now accepting new patient appointments online.",
    ctaButtonText: "Book Appointment",
    ctaButtonAction: "BOOKING_MODAL",
    whatsappNumber: "",
    contactPhone: "",
    contactEmail: "",
    showServices: true,
    showReviews: true,
    showDoctorBio: true,
    showFaq: true,
    showMap: true,
    showStickyBar: true,
    customServices: [],
    customFaqs: [],
    sections: [
      { id: "sec_hero", type: "HERO" },
      { id: "sec_services", type: "SERVICES" },
      { id: "sec_reviews", type: "REVIEWS" },
      { id: "sec_bio", type: "DOCTOR_BIO" },
      { id: "sec_cta", type: "CTA_BANNER", title: "Ready to Consult with Our Specialist?", subtitle: "Book your appointment online or chat directly with our clinic on WhatsApp." },
      { id: "sec_faq", type: "FAQ" },
      { id: "sec_map", type: "MAP_HOURS" },
    ],
  });

  const fetchWebsiteData = async (forceSync = false) => {
    try {
      if (forceSync) setSyncingGbp(true);
      else setLoading(true);

      const res = await fetch(`/api/website${forceSync ? "?sync=true" : ""}`);
      const data = await res.json();

      if (data.website) {
        setSiteData((prev) => ({
          ...prev,
          ...data.website,
          sections: (data.website.sections && data.website.sections.length > 0) ? data.website.sections : prev.sections,
        }));
        setUrlInput(data.website.subdomain || "");
        if (data.website.customDomain) {
          setCustomDomainInput(data.website.customDomain);
          setCustomDomainStatus({ connectedDomain: data.website.customDomain, dnsConfigured: true });
        }
        if (forceSync) {
          toast({
            title: "Synced with Google Profile! 🔄",
            description: "Updated latest clinic address, hours, reviews, services, and doctor details.",
          });
        }
      }
      fetchCustomDomainStatus();
    } catch (err: any) {
      toast({ title: "Failed to load website configuration", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setSyncingGbp(false);
    }
  };

  const fetchCustomDomainStatus = async () => {
    try {
      const res = await fetch("/api/websites/custom-domain");
      const data = await res.json();
      if (data.customDomain) {
        setCustomDomainInput(data.customDomain);
        setCustomDomainStatus({ connectedDomain: data.customDomain, dnsConfigured: data.dnsConfigured });
      } else {
        setCustomDomainStatus({ connectedDomain: null, dnsConfigured: false });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  // Section Manipulation
  const handleAddWidget = (type: SectionType) => {
    const newId = `sec_${type.toLowerCase()}_${Date.now()}`;
    const newSection: PageSection = {
      id: newId,
      type,
      title: type === "CUSTOM_TEXT" ? "Custom Clinic Notice" : undefined,
      subtitle: type === "CUSTOM_TEXT" ? "Write announcements or patient health tips here." : undefined,
      isVisible: true,
    };

    setSiteData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));

    setSelectedSectionId(newId);
    toast({ title: "Widget Added to Page! 🧩", description: `Inserted ${type.replace("_", " ")} section.` });
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    setSiteData((prev) => {
      const list = [...(prev.sections || [])];
      const index = list.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;

      const [removed] = list.splice(index, 1);
      list.splice(targetIndex, 0, removed);
      return { ...prev, sections: list };
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    setSiteData((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((s) => s.id !== sectionId),
    }));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    toast({ title: "Section Removed" });
  };

  // Image Upload
  const handleHeroImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "blog");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSiteData((prev) => ({ ...prev, heroImage: data.url }));
      toast({ title: "Photo Uploaded 📸", description: "Image updated on canvas." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  // Save Website
  const handleSaveWebsite = async () => {
    if (!siteData.subdomain) {
      toast({ title: "Website URL Required", description: "Please enter your clinic URL name.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save website");

      toast({
        title: "Clinic Website Published Live! 🚀",
        description: `Active at https://${siteData.subdomain}.gyrex.in`,
      });
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Currently Selected Section for Inspector
  const selectedSection = (siteData.sections || []).find((s) => s.id === selectedSectionId);

  const updateSelectedSection = (patch: Partial<PageSection>) => {
    if (!selectedSectionId) return;
    setSiteData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => (s.id === selectedSectionId ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden font-sans bg-slate-100">
      {/* ── TOP ELEMENTOR STUDIO HEADER TOOLBAR ── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        {/* Left: Branding & Theme Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              G
            </span>
            <div>
              <p className="text-xs font-black text-slate-900 leading-none">Visual Composer</p>
              <p className="text-[10px] text-slate-500 font-medium">Elementor-Grade Studio</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-[11px] font-bold text-slate-400">Theme:</span>
            <select
              value={siteData.themeId}
              onChange={(e) => {
                const found = THEME_OPTIONS.find((t) => t.id === e.target.value);
                if (found) {
                  setSiteData({
                    ...siteData,
                    themeId: found.id,
                    primaryColor: found.primary,
                    secondaryColor: found.secondary,
                    accentColor: found.accent,
                  });
                  toast({ title: `Applied ${found.name} Theme! 🎨` });
                }
              }}
              className="h-8 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setViewport("desktop")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "tablet" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            title="Mobile View (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" /> <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncingGbp}
            onClick={() => fetchWebsiteData(true)}
            className="h-9 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hidden lg:flex items-center gap-1.5"
            title="Sync latest information from Google Business Profile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${syncingGbp ? "animate-spin" : ""}`} />
            <span>Sync GBP</span>
          </Button>

          <a
            href={`https://${siteData.subdomain}.gyrex.in`}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hidden sm:flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>View Live</span>
          </a>

          <Button
            onClick={handleSaveWebsite}
            disabled={saving}
            size="sm"
            className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Publishing..." : "Publish Live"}</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY: LEFT PALETTE (380px) + CENTER VISUAL CANVAS ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT ELEMENTOR TOOLBAR / INSPECTOR DRAWER ── */}
        <aside className="w-[380px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs">
          {/* If a section is selected, show Section Inspector */}
          {selectedSection ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left-2 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSectionId(null)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                    title="Back to elements"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {selectedSection.type.replace("_", " ")}
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Section Inspector</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSection(selectedSection.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Form Fields */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* 1. HERO SPECIFIC CONTROLS */}
                {selectedSection.type === "HERO" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Clinic Name</label>
                      <Input
                        value={siteData.siteTitle}
                        onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Hero Main Headline</label>
                      <Input
                        value={selectedSection.title || siteData.heroHeading}
                        onChange={(e) => {
                          updateSelectedSection({ title: e.target.value });
                          setSiteData({ ...siteData, heroHeading: e.target.value });
                        }}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Hero Subtitle / Description</label>
                      <Textarea
                        value={selectedSection.subtitle || siteData.heroSubheading || ""}
                        onChange={(e) => {
                          updateSelectedSection({ subtitle: e.target.value });
                          setSiteData({ ...siteData, heroSubheading: e.target.value });
                        }}
                        rows={3}
                        className="text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="font-bold text-slate-700">Clinic Hero Photo</label>
                      <div className="flex items-center gap-3">
                        {siteData.heroImage ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img src={siteData.heroImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] text-center p-1">
                            No photo
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 text-xs font-bold rounded-xl"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1 text-blue-600" /> Upload Photo
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleHeroImageSelect}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Show Booking Form in Hero</span>
                        <input
                          type="checkbox"
                          checked={siteData.showHeroBookingForm || false}
                          onChange={(e) => setSiteData({ ...siteData, showHeroBookingForm: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">Displays quick appointment form on the right.</p>
                    </div>
                  </div>
                )}

                {/* 2. SERVICES SPECIFIC CONTROLS */}
                {selectedSection.type === "SERVICES" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Title</label>
                      <Input
                        value={selectedSection.title || "Clinical Services & Procedures"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">Treatments List</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const list = siteData.customServices || [];
                            setSiteData({
                              ...siteData,
                              customServices: [...list, { name: "New Treatment", description: "Procedure details & clinical care.", price: 1000 }],
                            });
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>

                      <div className="space-y-2.5">
                        {(siteData.customServices || []).map((s, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={s.name}
                                onChange={(e) => {
                                  const updated = [...(siteData.customServices || [])];
                                  updated[idx].name = e.target.value;
                                  setSiteData({ ...siteData, customServices: updated });
                                }}
                                placeholder="Service Name"
                                className="h-8 text-xs font-bold bg-white"
                              />
                              <Input
                                type="number"
                                value={s.price || ""}
                                onChange={(e) => {
                                  const updated = [...(siteData.customServices || [])];
                                  updated[idx].price = e.target.value ? Number(e.target.value) : undefined;
                                  setSiteData({ ...siteData, customServices: updated });
                                }}
                                placeholder="Price"
                                className="h-8 text-xs w-20 bg-white shrink-0 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (siteData.customServices || []).filter((_, i) => i !== idx);
                                  setSiteData({ ...siteData, customServices: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Textarea
                              value={s.description}
                              onChange={(e) => {
                                const updated = [...(siteData.customServices || [])];
                                updated[idx].description = e.target.value;
                                setSiteData({ ...siteData, customServices: updated });
                              }}
                              placeholder="Description"
                              rows={2}
                              className="text-[11px] bg-white rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CTA BANNER CONTROLS */}
                {selectedSection.type === "CTA_BANNER" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Callout Heading</label>
                      <Input
                        value={selectedSection.title || "Ready to Book Your Consultation?"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Callout Subtitle</label>
                      <Textarea
                        value={selectedSection.subtitle || "Schedule your appointment in seconds."}
                        onChange={(e) => updateSelectedSection({ subtitle: e.target.value })}
                        rows={2}
                        className="text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Button Text</label>
                      <Input
                        value={selectedSection.ctaText || "Book Appointment Now"}
                        onChange={(e) => updateSelectedSection({ ctaText: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* 4. DOCTOR BIO CONTROLS */}
                {selectedSection.type === "DOCTOR_BIO" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Heading</label>
                      <Input
                        value={selectedSection.title || "Clinical Philosophy & Background"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Doctor Bio & Experience</label>
                      <Textarea
                        value={selectedSection.content || siteData.customBio || ""}
                        onChange={(e) => {
                          updateSelectedSection({ content: e.target.value });
                          setSiteData({ ...siteData, customBio: e.target.value });
                        }}
                        rows={6}
                        className="text-xs rounded-xl leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 5. CUSTOM TEXT BLOCK */}
                {selectedSection.type === "CUSTOM_TEXT" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Headline</label>
                      <Input
                        value={selectedSection.title || ""}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        placeholder="e.g. Special Patient Notice"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Content / Story</label>
                      <Textarea
                        value={selectedSection.content || ""}
                        onChange={(e) => updateSelectedSection({ content: e.target.value })}
                        rows={5}
                        placeholder="Write detailed announcements, clinical certifications, or patient guidance..."
                        className="text-xs rounded-xl leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Elementor Drawer Tabs */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Drawer Top Navigation */}
              <div className="grid grid-cols-4 p-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                <button
                  onClick={() => setSidebarTab("elements")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "elements" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Plus className="w-4 h-4" /> <span>Add</span>
                </button>
                <button
                  onClick={() => setSidebarTab("structure")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "structure" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Layers className="w-4 h-4" /> <span>Navigator</span>
                </button>
                <button
                  onClick={() => setSidebarTab("style")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "style" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Palette className="w-4 h-4" /> <span>Style</span>
                </button>
                <button
                  onClick={() => setSidebarTab("domain")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "domain" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Globe className="w-4 h-4" /> <span>Domain</span>
                </button>
              </div>

              {/* TAB 1: ADD WIDGETS TRAY */}
              {sidebarTab === "elements" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Drag &amp; Add Elements</h3>
                    <p className="text-[11px] text-slate-500">Click any element to insert it onto your live website canvas.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {AVAILABLE_WIDGETS.map((widget) => {
                      const Icon = widget.icon;
                      return (
                        <div
                          key={widget.type}
                          onClick={() => handleAddWidget(widget.type)}
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-xs transition-all cursor-pointer flex items-start gap-3 bg-white group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{widget.label}</h4>
                            <p className="text-[10px] text-slate-500 leading-tight">{widget.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: PAGE STRUCTURE NAVIGATOR */}
              {sidebarTab === "structure" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Section Navigator</h3>
                    <p className="text-[11px] text-slate-500">Reorder sections or click to inspect and edit.</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {(siteData.sections || []).map((sec, idx) => (
                      <div
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 flex items-center justify-between gap-2 cursor-pointer shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 capitalize">
                            {sec.type.replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSection(sec.id, "up");
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < (siteData.sections || []).length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSection(sec.id, "down");
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(sec.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GLOBAL STYLING */}
              {sidebarTab === "style" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brand Palette &amp; Colors</h3>
                    <p className="text-[11px] text-slate-500">Pick custom hex colors for your live site.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Primary Brand Color</label>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <input
                          type="color"
                          value={siteData.primaryColor}
                          onChange={(e) => setSiteData({ ...siteData, primaryColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-slate-800">{siteData.primaryColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Dark Contrast Color</label>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <input
                          type="color"
                          value={siteData.secondaryColor}
                          onChange={(e) => setSiteData({ ...siteData, secondaryColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-slate-800">{siteData.secondaryColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Accent Action Color</label>
                      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <input
                          type="color"
                          value={siteData.accentColor}
                          onChange={(e) => setSiteData({ ...siteData, accentColor: e.target.value })}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-slate-800">{siteData.accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DOMAIN SETTINGS */}
              {sidebarTab === "domain" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Free URL &amp; Custom Domain</h3>
                    <p className="text-[11px] text-slate-500">Configure your website address.</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-700">Free Website URL</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="h-9 text-xs font-mono font-bold bg-white"
                      />
                      <span className="text-[11px] font-mono text-slate-500 font-bold">.gyrex.in</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSiteData({ ...siteData, subdomain: urlInput });
                        toast({ title: "URL Updated!" });
                      }}
                      className="w-full h-8 text-[11px] font-bold rounded-xl"
                    >
                      Update URL
                    </Button>
                  </div>

                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
                    <label className="font-bold text-purple-950">Custom Branded Domain</label>
                    <Input
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                      placeholder="e.g. www.drvinaykumar.com"
                      className="h-9 text-xs font-mono font-bold bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (!customDomainInput) return;
                        setConnectingDomain(true);
                        try {
                          const res = await fetch("/api/websites/custom-domain", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ domain: customDomainInput }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed");
                          setCustomDomainStatus({ connectedDomain: data.customDomain, dnsConfigured: data.dnsConfigured });
                          toast({ title: "Domain Connected!", description: data.message });
                        } catch (e: any) {
                          toast({ title: "Error", description: e.message, variant: "destructive" });
                        } finally {
                          setConnectingDomain(false);
                        }
                      }}
                      className="w-full h-8 text-[11px] font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                    >
                      {connectingDomain ? "Connecting..." : "Connect Domain"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CENTER LIVE VISUAL CANVAS (WYSIWYG) ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center bg-slate-100/80">
          <div
            className={`bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-slate-300/80 ${
              viewport === "desktop"
                ? "w-full max-w-7xl"
                : viewport === "tablet"
                ? "w-[768px]"
                : "w-[390px]"
            }`}
          >
            <ThemeRenderer
              data={siteData}
              previewMode={false}
              composerMode={true}
              selectedSectionId={selectedSectionId}
              onSelectSection={(id) => setSelectedSectionId(id)}
              onMoveSection={handleMoveSection}
              onDeleteSection={handleDeleteSection}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
