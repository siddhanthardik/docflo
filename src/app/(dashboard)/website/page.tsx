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
  DollarSign,
  HeartPulse,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const THEME_OPTIONS = [
  { id: "apex-clinical", name: "Apex Multi-Specialty", category: "Polyclinic & Hospitals (Full-Width Slider)", primary: "#2563EB", secondary: "#0F172A", accent: "#10B981" },
  { id: "serene-glow", name: "Serene Aesthetics", category: "Dermatology & Skin (Luxury Editorial)", primary: "#BE185D", secondary: "#1E1B4B", accent: "#F43F5E" },
  { id: "minimal-luxe", name: "Minimal Luxe Dental", category: "Dentistry & Smile (Cyan Modern)", primary: "#0284C7", secondary: "#0F172A", accent: "#14B8A6" },
  { id: "warm-pediatrics", name: "Warm Pediatrics", category: "Pediatrics & Kids (Comfort Mint)", primary: "#059669", secondary: "#1E293B", accent: "#F59E0B" },
  { id: "vitality-rehab", name: "Vitality Rehab", category: "Ortho & Physio (Active Performance)", primary: "#0D9488", secondary: "#18181B", accent: "#E11D48" },
];

const AVAILABLE_WIDGETS: Array<{ type: SectionType; label: string; icon: any; description: string }> = [
  { type: "HERO", label: "Hero Banner & Welcome", icon: Layout, description: "Headline, multi-photo slider, rating badge, and booking action." },
  { type: "SERVICES", label: "Services & Treatments Grid", icon: Stethoscope, description: "Clinical procedures, descriptions, icons, duration, and optional pricing." },
  { type: "DOCTOR_BIO", label: "Doctor Bio & Experience", icon: ShieldCheck, description: "Doctor credentials, medical degrees, and clinical philosophy." },
  { type: "REVIEWS", label: "Google Patient Reviews", icon: Star, description: "Verified patient testimonials with 5-star Google rating badge." },
  { type: "CTA_BANNER", label: "Conversion CTA Callout", icon: MessageSquare, description: "High-impact banner to drive WhatsApp consultations and calls." },
  { type: "GALLERY", label: "Clinic Facilities Showcase", icon: ImageIcon, description: "Photo gallery showcase of your clinic ambiance and technology." },
  { type: "FAQ", label: "Interactive FAQ Accordion", icon: HelpCircle, description: "Expandable patient questions & answers with Google FAQ schema." },
  { type: "MAP_HOURS", label: "Location Map & Hours", icon: MapPin, description: "Interactive clinic Google Map, telephone, and weekly schedule." },
  { type: "CUSTOM_TEXT", label: "Custom Story & Notice", icon: Type, description: "Custom headline and rich text for clinic notices or patient guides." },
];

const SERVICE_ICONS = ["stethoscope", "heart", "activity", "smile", "baby", "eye", "pill", "shield", "sparkles"];

export default function ElementorComposerPage() {
  const { toast } = useToast();
  const heroUploadRef = useRef<HTMLInputElement>(null);
  const galleryUploadRef = useRef<HTMLInputElement>(null);
  const doctorPhotoRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "structure" | "style" | "domain">("elements");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec_hero");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Custom Domain State
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [connectingDomain, setConnectingDomain] = useState(false);
  const [customDomainStatus, setCustomDomainStatus] = useState<{ connectedDomain?: string | null; dnsConfigured?: boolean }>({});

  // Free URL validation state
  const [urlInput, setUrlInput] = useState("");

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
    heroSubheading: "",
    heroImage: null,
    heroSliderImages: [],
    heroStyle: "IMAGE_ONLY",
    showHeroBookingForm: false,
    showPrices: true,
    announcementBar: "",
    showAnnouncementBar: false,
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
    galleryImages: [],
    sections: [
      { id: "sec_hero", type: "HERO", subtitle: "" },
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

  // 1-Click AI Copy Generator Helper
  const generateAiCopy = (field: "hero" | "bio" | "service") => {
    const specialty = siteData.doctor?.specialty || siteData.tagline || "Healthcare & Clinical Care";
    const doctorName = siteData.doctor?.name || siteData.siteTitle || "Lead Consultant Doctor";

    if (field === "hero") {
      const headlines = [
        `Leading ${specialty} & Dedicated Clinical Excellence`,
        `Evidence-Based ${specialty} for Complete Health & Wellness`,
        `Compassionate Care, Modern Diagnostics & ${specialty}`,
      ];
      const subtitles = [
        `Personalized outpatient consultations, modern treatments, and comprehensive care led by ${doctorName}.`,
        `Combining clinical expertise with dedicated patient-first medical treatments in a compassionate environment.`,
      ];
      const pickedHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      const pickedSubtitle = subtitles[Math.floor(Math.random() * subtitles.length)];

      setSiteData((prev) => ({ ...prev, heroHeading: pickedHeadline, heroSubheading: pickedSubtitle }));
      updateSelectedSection({ title: pickedHeadline, subtitle: pickedSubtitle });
      toast({ title: "✨ AI Headline & Subtitle Generated!" });
    } else if (field === "bio") {
      const bioText = `${doctorName} is a distinguished specialist in ${specialty} dedicated to providing compassionate, evidence-based clinical treatments. Combining extensive clinical diagnostic experience with modern medical protocols, ${doctorName} ensures every patient receives customized, high-quality care with the highest safety standards.`;
      setSiteData((prev) => ({ ...prev, customBio: bioText }));
      updateSelectedSection({ content: bioText });
      toast({ title: "✨ AI Medical Bio Generated!" });
    }
  };

  // Element Tray Click Handling
  const handleElementCardClick = (type: SectionType) => {
    const existing = (siteData.sections || []).find((s) => s.type === type);
    if (existing) {
      setSelectedSectionId(existing.id);
      toast({ title: `Editing ${type.replace("_", " ")} Section ✏️` });
    } else {
      handleAddNewSection(type);
    }
  };

  const handleAddNewSection = (type: SectionType) => {
    const newId = `sec_${type.toLowerCase()}_${Date.now()}`;
    const newSection: PageSection = {
      id: newId,
      type,
      title: type === "CUSTOM_TEXT" ? "Custom Clinic Notice" : undefined,
      subtitle: type === "CUSTOM_TEXT" ? "Write announcements or patient guidance here." : undefined,
      isVisible: true,
    };

    setSiteData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));

    setSelectedSectionId(newId);
    toast({ title: "New Section Added to Canvas! 🧩", description: `Inserted ${type.replace("_", " ")}.` });
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

  // Image Uploads (Auto-WebP)
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "hero");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const currentSlider = siteData.heroSliderImages || [];
      setSiteData((prev) => ({
        ...prev,
        heroImage: data.url,
        heroSliderImages: [...currentSlider, data.url],
      }));
      toast({ title: "Slide Photo Uploaded (WebP) 📸", description: "Added to hero carousel." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const currentGallery = siteData.galleryImages || [];
      setSiteData((prev) => ({
        ...prev,
        galleryImages: [...currentGallery, { url: data.url, caption: "Clinic Facility" }],
      }));
      toast({ title: "Gallery Photo Uploaded (WebP) 📸" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDoctorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "website");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSiteData((prev) => ({
        ...prev,
        doctor: { ...(prev.doctor || { name: "Doctor" }), image: data.url },
      }));
      toast({ title: "Doctor Photo Uploaded (WebP) 🩺", description: "Portrait updated." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveWebsite = async (sectionName?: string) => {
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
        title: sectionName ? `${sectionName} Saved Successfully! ✅` : "Clinic Website Published Live! 🚀",
        description: `Active at https://${siteData.subdomain}.gyrex.in`,
      });
      setPublishModalOpen(false);
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Selected Section Helper
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
              <p className="text-[10px] text-slate-500 font-medium">Award-Winning Studio</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-[11px] font-bold text-slate-400">Layout Theme:</span>
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
                  toast({ title: `Applied ${found.name} Layout Theme! 🎨` });
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
            onClick={() => setPublishModalOpen(true)}
            size="sm"
            className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Live</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY: LEFT PALETTE (390px) + CENTER LIVE VISUAL CANVAS ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT ELEMENTOR TOOLBAR / INSPECTOR DRAWER ── */}
        <aside className="w-[390px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs">
          {/* If a section is selected, show Deep Section Inspector */}
          {selectedSection ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left-2 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSectionId(null)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shadow-2xs"
                    title="Back to Element Tray"
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
                {/* 1. HERO SECTION INSPECTOR */}
                {selectedSection.type === "HERO" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Hero Section Content</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiCopy("hero")}
                        className="h-7 text-[11px] font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 rounded-lg flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3 text-purple-600" /> ✨ AI Magic Copy
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Clinic Name</label>
                      <Input
                        value={siteData.siteTitle}
                        onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Specialty Tagline</label>
                      <Input
                        value={siteData.tagline || ""}
                        onChange={(e) => setSiteData({ ...siteData, tagline: e.target.value })}
                        placeholder="e.g. Leading Pediatrics in New Delhi"
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Hero Main Headline</label>
                      <Input
                        value={selectedSection.title !== undefined ? selectedSection.title : siteData.heroHeading}
                        onChange={(e) => {
                          updateSelectedSection({ title: e.target.value });
                          setSiteData({ ...siteData, heroHeading: e.target.value });
                        }}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Hero Subtitle / Description (Leave blank to remove)</label>
                      <Textarea
                        value={selectedSection.subtitle !== undefined ? selectedSection.subtitle : (siteData.heroSubheading || "")}
                        onChange={(e) => {
                          updateSelectedSection({ subtitle: e.target.value });
                          setSiteData({ ...siteData, heroSubheading: e.target.value });
                        }}
                        placeholder="Leave blank to completely hide description..."
                        rows={3}
                        className="text-xs rounded-xl leading-relaxed"
                      />
                    </div>

                    {/* Announcement Bar Toggle & Text */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Top Announcement Bar</span>
                        <input
                          type="checkbox"
                          checked={siteData.showAnnouncementBar === true}
                          onChange={(e) => setSiteData({ ...siteData, showAnnouncementBar: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </div>
                      {siteData.showAnnouncementBar === true && (
                        <Input
                          value={siteData.announcementBar || ""}
                          onChange={(e) => setSiteData({ ...siteData, announcementBar: e.target.value })}
                          placeholder="e.g. Now accepting new patient appointments online."
                          className="h-9 text-xs rounded-xl bg-white"
                        />
                      )}
                    </div>

                    {/* Multi-Photo Carousel Slider Manager */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">Hero Carousel Photos</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => heroUploadRef.current?.click()}
                          className="h-7 text-[11px] font-bold rounded-lg"
                        >
                          <Upload className="w-3 h-3 mr-1 text-blue-600" /> Add Photo
                        </Button>
                        <input
                          ref={heroUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleHeroImageUpload}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(siteData.heroSliderImages && siteData.heroSliderImages.length > 0 ? siteData.heroSliderImages : (siteData.heroImage ? [siteData.heroImage] : [])).map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (siteData.heroSliderImages || []).filter((_, idx) => idx !== i);
                                setSiteData({ ...siteData, heroSliderImages: updated, heroImage: updated[0] || null });
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Booking Form in Hero Toggle */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Show Quick Booking Form in Hero</span>
                        <input
                          type="checkbox"
                          checked={siteData.showHeroBookingForm || false}
                          onChange={(e) => setSiteData({ ...siteData, showHeroBookingForm: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SERVICES SECTION INSPECTOR */}
                {selectedSection.type === "SERVICES" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Title</label>
                      <Input
                        value={selectedSection.title || "Clinical Services & Procedures"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    {/* Optional Pricing Switch */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Show Treatment Pricing</p>
                        <p className="text-[10px] text-slate-500">Turn off if you don&apos;t want fixed prices displayed.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={siteData.showPrices !== false}
                        onChange={(e) => setSiteData({ ...siteData, showPrices: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">Treatments &amp; Procedures</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const list = siteData.customServices || [];
                            setSiteData({
                              ...siteData,
                              customServices: [...list, { name: "New Treatment", description: "Comprehensive procedure & clinical care.", icon: "stethoscope" }],
                            });
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Service
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {(siteData.customServices || []).map((s, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
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
                              {siteData.showPrices !== false && (
                                <Input
                                  type="number"
                                  value={s.price || ""}
                                  onChange={(e) => {
                                    const updated = [...(siteData.customServices || [])];
                                    updated[idx].price = e.target.value ? Number(e.target.value) : undefined;
                                    setSiteData({ ...siteData, customServices: updated });
                                  }}
                                  placeholder="Price (₹)"
                                  className="h-8 text-xs w-24 bg-white shrink-0 font-bold"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (siteData.customServices || []).filter((_, i) => i !== idx);
                                  setSiteData({ ...siteData, customServices: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Service Icon Selector */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              <span className="text-[10px] text-slate-400 font-medium">Icon:</span>
                              {SERVICE_ICONS.map((ic) => (
                                <button
                                  key={ic}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(siteData.customServices || [])];
                                    updated[idx].icon = ic;
                                    setSiteData({ ...siteData, customServices: updated });
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize transition-all ${
                                    (s.icon || "stethoscope") === ic ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {ic}
                                </button>
                              ))}
                            </div>

                            <Textarea
                              value={s.description}
                              onChange={(e) => {
                                const updated = [...(siteData.customServices || [])];
                                updated[idx].description = e.target.value;
                                setSiteData({ ...siteData, customServices: updated });
                              }}
                              placeholder="Describe clinical procedure and benefits..."
                              rows={2}
                              className="text-[11px] bg-white rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DOCTOR BIO INSPECTOR */}
                {selectedSection.type === "DOCTOR_BIO" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Doctor Credentials &amp; Bio</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAiCopy("bio")}
                        className="h-7 text-[11px] font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 rounded-lg flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3 text-purple-600" /> ✨ AI Bio Generator
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Doctor Name</label>
                      <Input
                        value={siteData.doctor?.name || ""}
                        onChange={(e) => setSiteData({ ...siteData, doctor: { ...(siteData.doctor || { name: "Doctor" }), name: e.target.value } })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Specialty</label>
                        <Input
                          value={siteData.doctor?.specialty || ""}
                          onChange={(e) => setSiteData({ ...siteData, doctor: { ...(siteData.doctor || { name: "Doctor" }), specialty: e.target.value } })}
                          placeholder="e.g. Pediatrician"
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Degrees</label>
                        <Input
                          value={siteData.doctor?.degrees || ""}
                          onChange={(e) => setSiteData({ ...siteData, doctor: { ...(siteData.doctor || { name: "Doctor" }), degrees: e.target.value } })}
                          placeholder="e.g. MBBS, MD, DNB"
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="font-bold text-slate-700">Doctor Portrait</label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {siteData.doctor?.image ? (
                            <img src={siteData.doctor.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">Dr</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => doctorPhotoRef.current?.click()}
                          className="h-8 text-xs font-bold rounded-xl"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1 text-blue-600" /> Upload Portrait (WebP)
                        </Button>
                        <input
                          ref={doctorPhotoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDoctorPhotoUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="font-bold text-slate-700">Clinical Philosophy &amp; Background</label>
                      <Textarea
                        value={selectedSection.content !== undefined ? selectedSection.content : (siteData.customBio || "")}
                        onChange={(e) => {
                          updateSelectedSection({ content: e.target.value });
                          setSiteData({ ...siteData, customBio: e.target.value });
                        }}
                        rows={5}
                        placeholder="Detailed medical experience, qualifications, and patient care commitment..."
                        className="text-xs rounded-xl leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 4. GALLERY INSPECTOR */}
                {selectedSection.type === "GALLERY" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Title</label>
                      <Input
                        value={selectedSection.title || "Our Modern Clinical Facilities"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">Facility Photos</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => galleryUploadRef.current?.click()}
                          className="h-7 text-[11px] font-bold rounded-lg"
                        >
                          <Upload className="w-3 h-3 mr-1 text-blue-600" /> Add Photo
                        </Button>
                        <input
                          ref={galleryUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleGalleryUpload}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(siteData.galleryImages || []).map((img, i) => (
                          <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative group">
                            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <Input
                              value={img.caption || ""}
                              onChange={(e) => {
                                const updated = [...(siteData.galleryImages || [])];
                                updated[i].caption = e.target.value;
                                setSiteData({ ...siteData, galleryImages: updated });
                              }}
                              placeholder="Caption"
                              className="h-7 text-[10px] bg-white rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (siteData.galleryImages || []).filter((_, idx) => idx !== i);
                                setSiteData({ ...siteData, galleryImages: updated });
                              }}
                              className="absolute top-3 right-3 w-5 h-5 rounded-md bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. FAQ INSPECTOR */}
                {selectedSection.type === "FAQ" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Title</label>
                      <Input
                        value={selectedSection.title || "Frequently Asked Questions"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700">Q&amp;A List</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const list = siteData.customFaqs || [];
                            setSiteData({
                              ...siteData,
                              customFaqs: [...list, { question: "New Question?", answer: "Answer details here." }],
                            });
                          }}
                          className="h-7 text-[11px] font-bold rounded-lg"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add FAQ
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {(siteData.customFaqs || []).map((faq, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Input
                                value={faq.question}
                                onChange={(e) => {
                                  const updated = [...(siteData.customFaqs || [])];
                                  updated[idx].question = e.target.value;
                                  setSiteData({ ...siteData, customFaqs: updated });
                                }}
                                placeholder="Question"
                                className="h-8 text-xs font-bold bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (siteData.customFaqs || []).filter((_, i) => i !== idx);
                                  setSiteData({ ...siteData, customFaqs: updated });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => {
                                const updated = [...(siteData.customFaqs || [])];
                                updated[idx].answer = e.target.value;
                                setSiteData({ ...siteData, customFaqs: updated });
                              }}
                              placeholder="Answer"
                              rows={2}
                              className="text-[11px] bg-white rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CTA BANNER INSPECTOR */}
                {selectedSection.type === "CTA_BANNER" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Callout Heading</label>
                      <Input
                        value={selectedSection.title || "Ready to Book Your Consultation?"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
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

                {/* 7. REVIEWS INSPECTOR */}
                {selectedSection.type === "REVIEWS" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Section Heading</label>
                      <Input
                        value={selectedSection.title || "Verified Patient Feedback"}
                        onChange={(e) => updateSelectedSection({ title: e.target.value })}
                        className="h-10 text-xs rounded-xl font-bold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Reviews are automatically synced from your connected Google Business Profile.</p>
                  </div>
                )}

                {/* DEDICATED SAVE BUTTON INSIDE INSPECTOR */}
                <div className="pt-6 border-t border-slate-100">
                  <Button
                    onClick={() => handleSaveWebsite(selectedSection.type.replace("_", " "))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving Changes..." : "Save Section Changes"}</span>
                  </Button>
                </div>
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
                  <Plus className="w-4 h-4" /> <span>Elements</span>
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
                  <Palette className="w-4 h-4" /> <span>Styling</span>
                </button>
                <button
                  onClick={() => setSidebarTab("domain")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "domain" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Globe className="w-4 h-4" /> <span>Domain</span>
                </button>
              </div>

              {/* TAB 1: ADD & EDIT WIDGETS TRAY */}
              {sidebarTab === "elements" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Website Elements</h3>
                    <p className="text-[11px] text-slate-500">Click to edit existing sections or insert new widgets.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {AVAILABLE_WIDGETS.map((widget) => {
                      const Icon = widget.icon;
                      const isPresentOnPage = (siteData.sections || []).some((s) => s.type === widget.type);

                      return (
                        <div
                          key={widget.type}
                          onClick={() => handleElementCardClick(widget.type)}
                          className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 bg-white group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">{widget.label}</h4>
                                {isPresentOnPage && (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight">{widget.description}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNewSection(widget.type);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white transition-colors shrink-0"
                            title="Add as New Section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
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
                    <p className="text-[11px] text-slate-500">Reorder sections with up/down arrows or click to edit.</p>
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
                              title="Move Up"
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
                              title="Move Down"
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
                            title="Delete"
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

                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      onClick={() => handleSaveWebsite("Global Styling")}
                      disabled={saving}
                      className="w-full h-10 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      Save Global Styling
                    </Button>
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

      {/* ── PUBLISH CONFIRMATION DIALOG MODAL ── */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Publish Clinic Website Live?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your latest design, custom sections, treatments, and photos will be updated live across the web immediately at:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs font-bold text-blue-700">
                https://{siteData.subdomain}.gyrex.in
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPublishModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveWebsite()}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                {saving ? "Publishing..." : "Confirm & Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
