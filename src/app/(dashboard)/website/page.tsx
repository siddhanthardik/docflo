"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeRenderer, ICON_MAP } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData, PageSection, SectionType, NavLinkItem, SectionDesignConfig } from "@/components/themes/theme-types";
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
  Navigation,
  Key,
  Server,
  Shield,
  SlidersVertical,
  Paintbrush,
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const THEME_OPTIONS = [
  { id: "apex-clinical", name: "Apex Clinical Pro", category: "Hospital & Polyclinic", primary: "#2563EB", secondary: "#0F172A", accent: "#10B981" },
  { id: "serene-glow", name: "Serene Glow Haute", category: "Dermatology & Skin", primary: "#BE185D", secondary: "#1E1B4B", accent: "#F43F5E" },
  { id: "minimal-luxe", name: "Minimal Cyan Precision", category: "Dentistry & Smile", primary: "#0284C7", secondary: "#0F172A", accent: "#14B8A6" },
  { id: "warm-pediatrics", name: "Warm Family & Kids", category: "Pediatrics & Child Care", primary: "#059669", secondary: "#1E293B", accent: "#F59E0B" },
  { id: "vitality-rehab", name: "Vitality Active Carbon", category: "Ortho & Physio", primary: "#0D9488", secondary: "#18181B", accent: "#E11D48" },
  { id: "ayurveda-earth", name: "Ayurveda & Holistic Earth", category: "Wellness & Integrative", primary: "#854D0E", secondary: "#1C1917", accent: "#15803D" },
  { id: "ophthalmology-vision", name: "Ophthalmology Vision", category: "Eye & Lasik Clinics", primary: "#0369A1", secondary: "#082F49", accent: "#06B6D4" },
  { id: "cardiocare-executive", name: "CardioCare Executive", category: "Cardiology & Vascular", primary: "#DC2626", secondary: "#0F172A", accent: "#E11D48" },
  { id: "neuropsych-horizon", name: "NeuroPsych Horizon", category: "Mental & Neurology", primary: "#7C3AED", secondary: "#1E1B4B", accent: "#A855F7" },
  { id: "executive-private", name: "Executive Private Practice", category: "VIP Concierge Suites", primary: "#CA8A04", secondary: "#0A0A0A", accent: "#EAB308" },
  { id: "blossom-gynae", name: "Blossom Gynae & Maternity", category: "Gynecology & Fertility", primary: "#E11D48", secondary: "#1E1B4B", accent: "#FB7185" },
  { id: "sculpt-aesthetics", name: "Sculpt Luxe Aesthetics", category: "Plastic & Cosmetic Surgery", primary: "#9D174D", secondary: "#09090B", accent: "#D97706" },
  { id: "zenith-internal-medicine", name: "Zenith Internal Medicine", category: "General Physician & Internal Medicine", primary: "#1E3A8A", secondary: "#0F172A", accent: "#10B981" },
  { id: "nutrilife-dietetics", name: "NutriLife Dietetics", category: "Dietitian & Clinical Nutrition", primary: "#16A34A", secondary: "#1C1917", accent: "#D97706" },
  { id: "acculab-diagnostics", name: "AccuLab Diagnostics", category: "Pathology & Diagnostic Center", primary: "#4338CA", secondary: "#0F172A", accent: "#0891B2" },
  { id: "uropulse-advanced", name: "UroPulse Advanced", category: "Urology & Andrology", primary: "#1D4ED8", secondary: "#0F172A", accent: "#06B6D4" },
  { id: "oncohorizon-cancer", name: "OncoHorizon Cancer Care", category: "Oncology & Cancer Center", primary: "#7E22CE", secondary: "#0F172A", accent: "#EC4899" },
];

const FONTS_HEADINGS = [
  "Plus Jakarta Sans",
  "Playfair Display",
  "Inter",
  "Poppins",
  "Outfit",
  "Montserrat",
  "Lora",
  "Cinzel",
];

const FONTS_BODY = [
  "Inter",
  "Plus Jakarta Sans",
  "Roboto",
  "Open Sans",
  "Lato",
];

const BUTTON_RADII = [
  { id: "full", label: "Pill (Rounded Full)" },
  { id: "2xl", label: "Modern (Rounded 2XL)" },
  { id: "xl", label: "Classic (Rounded XL)" },
  { id: "lg", label: "Subtle (Rounded LG)" },
  { id: "none", label: "Sharp Square" },
];

const BG_PRESETS = [
  { label: "Clean White", value: "#FFFFFF" },
  { label: "Soft Slate", value: "#F8FAFC" },
  { label: "Warm Sand", value: "#FAF8F5" },
  { label: "Dark Obsidian", value: "#0F172A" },
  { label: "Mint Tint", value: "#F0FDF4" },
  { label: "Cyan Tint", value: "#F0FDFA" },
];

const AVAILABLE_WIDGETS: Array<{ type: SectionType; label: string; icon: any; description: string }> = [
  { type: "HERO", label: "Hero Banner & Welcome", icon: Layout, description: "Headline, multi-photo slider, logo, and customizable CTA buttons." },
  { type: "PACKAGES", label: "Health Packages & Pricing", icon: DollarSign, description: "Full-body checkup packages, test parameter counts, and offer pricing." },
  { type: "STATS_RIBBON", label: "Trust Metrics & Stats Bar", icon: ShieldCheck, description: "Highlight clinical experience, patient counts, and Google ratings." },
  { type: "SERVICES", label: "Services & Treatments Grid", icon: Stethoscope, description: "Clinical procedures, custom icons/images, duration, and optional pricing." },
  { type: "DOCTOR_BIO", label: "Doctor Bio & Experience", icon: ShieldCheck, description: "Doctor credentials, medical degrees, portrait, and philosophy." },
  { type: "REVIEWS", label: "Google Patient Reviews", icon: Star, description: "Verified patient testimonials with 5-star Google rating badge." },
  { type: "CTA_BANNER", label: "Conversion CTA Callout", icon: MessageSquare, description: "High-impact banner to drive WhatsApp consultations and calls." },
  { type: "GALLERY", label: "Clinic Facilities Showcase", icon: ImageIcon, description: "Photo gallery showcase of your clinic ambiance and technology." },
  { type: "FAQ", label: "Interactive FAQ Accordion", icon: HelpCircle, description: "Expandable patient questions & answers with Google FAQ schema." },
  { type: "MAP_HOURS", label: "Location Map & Hours", icon: MapPin, description: "Interactive clinic Google Map, telephone, and weekly schedule." },
  { type: "CUSTOM_TEXT", label: "Custom Story & Notice", icon: Type, description: "Custom headline and rich text for clinic notices or patient guides." },
];

const ALL_ICON_KEYS = Object.keys(ICON_MAP);

export default function ElementorComposerPage() {
  const { toast } = useToast();
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const heroUploadRef = useRef<HTMLInputElement>(null);
  const galleryUploadRef = useRef<HTMLInputElement>(null);
  const doctorPhotoRef = useRef<HTMLInputElement>(null);
  const servicePhotoRef = useRef<HTMLInputElement>(null);
  const [activeServiceUploadIdx, setActiveServiceUploadIdx] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "structure" | "style" | "navbar" | "domain">("elements");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>("sec_hero");
  const [inspectorSubTab, setInspectorSubTab] = useState<"content" | "style">("content");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Undo History Stack
  const [historyStack, setHistoryStack] = useState<ClinicWebsiteData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

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
    buttonRadius: "2xl",
    siteTitle: "Clinic",
    tagline: "Comprehensive Healthcare",
    logoUrl: null,
    heroHeading: "Advanced Healthcare & Dedicated Patient Care",
    heroSubheading: "",
    heroImage: null,
    heroSliderImages: [],
    heroStyle: "IMAGE_ONLY",
    showHeroBookingForm: false,
    showPrices: true,
    showServiceButtons: false,
    showAppointmentPage: true,
    clinicAddress: "",
    mapEmbedUrl: "",
    announcementBar: "",
    showAnnouncementBar: false,
    ctaButtonText: "Book Appointment",
    ctaButtonAction: "BOOKING_MODAL",
    primaryCtaLink: "",
    secondaryCtaText: "WhatsApp Chat",
    secondaryCtaAction: "WHATSAPP",
    secondaryCtaLink: "",
    whatsappNumber: "",
    contactPhone: "",
    contactEmail: "",
    showServices: true,
    showReviews: true,
    showDoctorBio: true,
    showFaq: true,
    showMap: true,
    showStickyBar: true,
    navLinks: [],
    customServices: [],
    customFaqs: [],
    galleryImages: [],
    doctor: {
      name: "",
      specialty: "",
      degrees: "",
      designation: "",
      image: "",
    },
    sections: [
      { id: "sec_hero", type: "HERO", badgeText: "", subtitle: "" },
      { id: "sec_stats", type: "STATS_RIBBON" },
      { id: "sec_services", type: "SERVICES" },
      { id: "sec_reviews", type: "REVIEWS" },
      { id: "sec_bio", type: "DOCTOR_BIO" },
      { id: "sec_cta", type: "CTA_BANNER", title: "Ready to Consult with Our Specialist?", subtitle: "Book your appointment online or chat directly with our clinic on WhatsApp." },
      { id: "sec_faq", type: "FAQ" },
      { id: "sec_map", type: "MAP_HOURS" },
    ],
  });

  const pushHistory = (newState: ClinicWebsiteData) => {
    setHistoryStack((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, JSON.parse(JSON.stringify(newState))];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetState = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSiteData(JSON.parse(JSON.stringify(targetState)));
      toast({ title: "Rollback Successful ↩️", description: "Reverted to previous step." });
    }
  };

  const scrollToSectionOnCanvas = (sectionId: string) => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setInspectorSubTab("content");
    scrollToSectionOnCanvas(sectionId);
  };

  const fetchWebsiteData = async (forceSync = false) => {
    try {
      if (forceSync) setSyncingGbp(true);
      else setLoading(true);

      const res = await fetch(`/api/website${forceSync ? "?sync=true" : ""}`);
      const data = await res.json();

      if (data.website) {
        const loadedData = {
          ...data.website,
          clinicAddress: data.website.clinicAddress || data.doctor?.address || "",
          doctor: {
            name: data.doctor?.name || data.website.doctorInfo?.name || "",
            specialty: data.doctor?.specialty || data.website.doctorInfo?.specialty || "",
            degrees: data.doctor?.degrees || data.website.doctorInfo?.degrees || "",
            designation: data.doctor?.designation || data.website.doctorInfo?.designation || "",
            image: data.doctor?.image || data.website.doctorInfo?.image || "",
            phone: data.doctor?.phone,
          },
          sections: (data.website.sections && data.website.sections.length > 0) ? data.website.sections : [
            { id: "sec_hero", type: "HERO", badgeText: "" },
            { id: "sec_services", type: "SERVICES" },
            { id: "sec_reviews", type: "REVIEWS" },
            { id: "sec_bio", type: "DOCTOR_BIO" },
            { id: "sec_cta", type: "CTA_BANNER" },
            { id: "sec_faq", type: "FAQ" },
            { id: "sec_map", type: "MAP_HOURS" },
          ],
        };

        setSiteData(loadedData);
        setHistoryStack([JSON.parse(JSON.stringify(loadedData))]);
        setHistoryIndex(0);

        setUrlInput(data.website.subdomain || "");
        if (data.website.customDomain) {
          setCustomDomainInput(data.website.customDomain);
          setCustomDomainStatus({ connectedDomain: data.website.customDomain, dnsConfigured: true });
        }
        if (forceSync) {
          toast({
            title: "Synced with Google Profile! 🔄",
            description: "Updated verified clinic address, hours, reviews, services, and doctor details.",
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
  const generateAiCopy = (field: "hero" | "bio") => {
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

      const nextState = { ...siteData, heroHeading: pickedHeadline, heroSubheading: pickedSubtitle };
      setSiteData(nextState);
      pushHistory(nextState);
      updateSelectedSection({ title: pickedHeadline, subtitle: pickedSubtitle });
      toast({ title: "✨ AI Headline & Subtitle Generated!" });
    } else if (field === "bio") {
      const bioText = `${doctorName} is a distinguished specialist in ${specialty} dedicated to providing compassionate, evidence-based clinical treatments. Combining extensive clinical diagnostic experience with modern medical protocols, ${doctorName} ensures every patient receives customized, high-quality care with the highest safety standards.`;
      const nextState = { ...siteData, customBio: bioText };
      setSiteData(nextState);
      pushHistory(nextState);
      updateSelectedSection({ content: bioText });
      toast({ title: "✨ AI Medical Bio Generated!" });
    }
  };

  const handleElementCardClick = (type: SectionType) => {
    const existing = (siteData.sections || []).find((s) => s.type === type);
    if (existing) {
      handleSelectSection(existing.id);
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
      title: type === "CUSTOM_TEXT" ? "Custom Clinic Notice" : type === "GALLERY" ? "Our Modern Clinical Facilities" : undefined,
      subtitle: type === "CUSTOM_TEXT" ? "Write announcements or patient guidance here." : undefined,
      content: type === "CUSTOM_TEXT" ? "Add detailed patient notices, clinic policies, or special guidance here." : undefined,
      badgeText: "",
      isVisible: true,
    };

    const nextState = {
      ...siteData,
      sections: [...(siteData.sections || []), newSection],
    };

    setSiteData(nextState);
    pushHistory(nextState);
    handleSelectSection(newId);
    toast({ title: "New Section Added to Canvas! 🧩", description: `Inserted ${type.replace("_", " ")}.` });
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const list = [...(siteData.sections || [])];
    const index = list.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const [removed] = list.splice(index, 1);
    list.splice(targetIndex, 0, removed);
    const nextState = { ...siteData, sections: list };
    setSiteData(nextState);
    pushHistory(nextState);
  };

  const handleDeleteSection = (sectionId: string) => {
    const nextState = {
      ...siteData,
      sections: (siteData.sections || []).filter((s) => s.id !== sectionId),
    };
    setSiteData(nextState);
    pushHistory(nextState);
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    toast({ title: "Section Removed" });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const nextState = { ...siteData, logoUrl: data.url };
      setSiteData(nextState);
      pushHistory(nextState);
      toast({ title: "Clinic Logo Uploaded (WebP) 🏥", description: "Logo updated in header & footer." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

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
      const nextState = {
        ...siteData,
        heroImage: data.url,
        heroSliderImages: [...currentSlider, data.url],
      };
      setSiteData(nextState);
      pushHistory(nextState);
      toast({ title: "Slide Photo Uploaded (WebP) 📸", description: "Added to hero carousel." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleServicePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeServiceUploadIdx === null) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "service");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const updated = [...(siteData.customServices || [])];
      updated[activeServiceUploadIdx].image = data.url;
      const nextState = { ...siteData, customServices: updated };
      setSiteData(nextState);
      pushHistory(nextState);
      toast({ title: "Service Photo Uploaded (WebP) 📸" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setActiveServiceUploadIdx(null);
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
      const nextState = {
        ...siteData,
        galleryImages: [...currentGallery, { url: data.url, caption: "Clinic Facility" }],
      };
      setSiteData(nextState);
      pushHistory(nextState);
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

      const nextState = {
        ...siteData,
        doctor: { ...(siteData.doctor || { name: "Doctor" }), image: data.url },
      };
      setSiteData(nextState);
      pushHistory(nextState);
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

  const selectedSection = (siteData.sections || []).find((s) => s.id === selectedSectionId);

  const updateSelectedSection = (patch: Partial<PageSection>) => {
    if (!selectedSectionId) return;
    setSiteData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => (s.id === selectedSectionId ? { ...s, ...patch } : s)),
    }));
  };

  const updateSelectedSectionDesign = (designPatch: Partial<SectionDesignConfig>) => {
    if (!selectedSectionId || !selectedSection) return;
    const currentDesign = selectedSection.design || {};
    updateSelectedSection({
      design: { ...currentDesign, ...designPatch },
    });
  };

  const cleanDomainString = (val: string) => {
    return val.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim().toLowerCase();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden font-sans bg-slate-100">
      {/* ── TOP CLEAN ELEMENTOR STUDIO HEADER ── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">E</span>
            Elementor Composer
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <select
              value={siteData.themeId}
              onChange={(e) => {
                const found = THEME_OPTIONS.find((t) => t.id === e.target.value);
                if (found) {
                  const nextState = {
                    ...siteData,
                    themeId: found.id,
                    primaryColor: found.primary,
                    secondaryColor: found.secondary,
                    accentColor: found.accent,
                  };
                  setSiteData(nextState);
                  pushHistory(nextState);
                  toast({ title: `Applied ${found.name} Theme! 🎨` });
                }
              }}
              className="h-8 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Viewport & Undo/Rollback Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`h-8 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              historyIndex > 0
                ? "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-2xs cursor-pointer"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
            }`}
            title="Rollback Changes to Previous Step (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rollback</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewport("desktop")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "desktop" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" /> <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewport("tablet")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "tablet" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewport === "mobile" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" /> <span className="hidden md:inline">Mobile</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncingGbp}
            onClick={() => fetchWebsiteData(true)}
            className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hidden sm:flex items-center gap-1.5"
            title="Sync verified information from Google Business Profile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${syncingGbp ? "animate-spin" : ""}`} />
            <span>Sync GBP</span>
          </Button>

          <a
            href={`https://${siteData.subdomain}.gyrex.in`}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hidden sm:flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>View Live</span>
          </a>

          <Button
            onClick={() => setPublishModalOpen(true)}
            size="sm"
            className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Live</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY: LEFT PALETTE (390px) + CENTER LIVE VISUAL CANVAS ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT TOOLBAR / INSPECTOR DRAWER ── */}
        <aside className="w-[390px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs">
          {selectedSection ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left-2 duration-150">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
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
                  </div>
                </div>

                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setInspectorSubTab("content")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${inspectorSubTab === "content" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorSubTab("style")}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${inspectorSubTab === "style" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600"}`}
                  >
                    <Paintbrush className="w-3 h-3" /> Style
                  </button>
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

              {/* ── SUB-TAB 2: STYLE CONTROLS ── */}
              {inspectorSubTab === "style" ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Section Styling Engine</h4>
                    <p className="text-[10px] text-slate-500">Customize backgrounds, inner card designs, and spacing.</p>
                  </div>

                  {/* Section Background Presets & Custom Hex */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="font-bold text-slate-800">Outer Section Background</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BG_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            updateSelectedSection({ bgColor: preset.value });
                            updateSelectedSectionDesign({ bgColor: preset.value });
                            pushHistory(siteData);
                          }}
                          className={`p-2 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                            (selectedSection.bgColor || selectedSection.design?.bgColor) === preset.value
                              ? "border-blue-600 ring-2 ring-blue-500/20 bg-white"
                              : "border-slate-200 bg-white/70 hover:bg-white"
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0" style={{ backgroundColor: preset.value }} />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-600">Custom Hex:</span>
                      <input
                        type="color"
                        value={selectedSection.bgColor || selectedSection.design?.bgColor || "#FFFFFF"}
                        onChange={(e) => {
                          updateSelectedSection({ bgColor: e.target.value });
                          updateSelectedSectionDesign({ bgColor: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <Input
                        value={selectedSection.bgColor || selectedSection.design?.bgColor || ""}
                        onChange={(e) => {
                          updateSelectedSection({ bgColor: e.target.value });
                          updateSelectedSectionDesign({ bgColor: e.target.value });
                        }}
                        placeholder="#FFFFFF"
                        className="h-7 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  {/* Inner Card Material & Slate Design Customizer */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="font-bold text-slate-800">Inner Card / Block Design</label>
                    <p className="text-[10px] text-slate-500">Change the card container behind text and doctor details.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedSectionDesign({ cardBg: "dark" });
                          pushHistory(siteData);
                        }}
                        className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          (selectedSection.design?.cardBg === "dark" || !selectedSection.design?.cardBg)
                            ? "border-blue-600 bg-slate-900 text-white ring-2 ring-blue-500/20"
                            : "bg-slate-900 text-white border-slate-800"
                        }`}
                      >
                        Dark Obsidian Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedSectionDesign({ cardBg: "#FFFFFF" });
                          pushHistory(siteData);
                        }}
                        className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          selectedSection.design?.cardBg === "#FFFFFF"
                            ? "border-blue-600 bg-white text-slate-900 ring-2 ring-blue-500/20"
                            : "bg-white text-slate-900 border-slate-200"
                        }`}
                      >
                        Pure White Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedSectionDesign({ cardBg: "#F8FAFC" });
                          pushHistory(siteData);
                        }}
                        className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          selectedSection.design?.cardBg === "#F8FAFC"
                            ? "border-blue-600 bg-slate-100 text-slate-900 ring-2 ring-blue-500/20"
                            : "bg-slate-50 text-slate-900 border-slate-200"
                        }`}
                      >
                        Soft Slate Card
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedSectionDesign({ cardBg: "#FAF8F5" });
                          pushHistory(siteData);
                        }}
                        className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          selectedSection.design?.cardBg === "#FAF8F5"
                            ? "border-blue-600 bg-[#FAF8F5] text-slate-900 ring-2 ring-blue-500/20"
                            : "bg-[#FAF8F5] text-slate-900 border-amber-200/60"
                        }`}
                      >
                        Warm Sand Card
                      </button>
                    </div>
                  </div>

                  {/* Vertical Padding Size */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="font-bold text-slate-800">Section Vertical Spacing</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["compact", "normal", "spacious"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            updateSelectedSectionDesign({ paddingSize: sz as any });
                            pushHistory(siteData);
                          }}
                          className={`py-1.5 rounded-xl border text-[10px] font-bold capitalize transition-all ${
                            (selectedSection.design?.paddingSize || "normal") === sz
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      onClick={() => handleSaveWebsite(`${selectedSection.type.replace("_", " ")} Style`)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : "Save Section Style"}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── SUB-TAB 1: CONTENT EDITING ── */
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

                      {/* Logo & Clinic Name */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">Clinic Logo Image</label>
                          {siteData.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = { ...siteData, logoUrl: null };
                                setSiteData(nextState);
                                pushHistory(nextState);
                              }}
                              className="text-[10px] text-rose-600 font-bold hover:underline"
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {siteData.logoUrl ? (
                            <div className="h-10 px-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                              <img src={siteData.logoUrl} alt="Logo" className="h-7 object-contain" />
                            </div>
                          ) : (
                            <div className="h-10 px-3 bg-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-600 font-bold">
                              Using Name (No Logo)
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoUploadRef.current?.click()}
                            className="h-8 text-xs font-bold rounded-xl"
                          >
                            <Upload className="w-3 h-3 mr-1 text-blue-600" /> Upload Logo (WebP)
                          </Button>
                          <input
                            ref={logoUploadRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Clinic Name (Shown if no logo)</label>
                        <Input
                          value={siteData.siteTitle}
                          onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                          className="h-10 text-xs rounded-xl font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Hero Floating Badge Text (Leave blank to remove)</label>
                        <Input
                          value={selectedSection.badgeText || ""}
                          onChange={(e) => updateSelectedSection({ badgeText: e.target.value })}
                          placeholder="e.g. Precision Vision & Retina Care (Leave blank to hide)"
                          className="h-9 text-xs rounded-xl"
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

                      {/* Hero Buttons & Links Customizer */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-900">Hero Action Buttons</p>

                        {/* Primary Button */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600">Primary Button</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={siteData.ctaButtonText}
                              onChange={(e) => setSiteData({ ...siteData, ctaButtonText: e.target.value })}
                              placeholder="Button Text"
                              className="h-8 text-xs bg-white rounded-lg"
                            />
                            <select
                              value={siteData.ctaButtonAction}
                              onChange={(e) => setSiteData({ ...siteData, ctaButtonAction: e.target.value })}
                              className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="BOOKING_MODAL">Instant Booking Modal</option>
                              <option value="WHATSAPP">WhatsApp Direct</option>
                              <option value="PHONE">Phone Call</option>
                              <option value="CUSTOM_URL">Custom URL Link</option>
                            </select>
                          </div>
                          {siteData.ctaButtonAction === "CUSTOM_URL" && (
                            <Input
                              value={siteData.primaryCtaLink || ""}
                              onChange={(e) => setSiteData({ ...siteData, primaryCtaLink: e.target.value })}
                              placeholder="https://..."
                              className="h-8 text-xs bg-white rounded-lg mt-1"
                            />
                          )}
                        </div>

                        {/* Secondary Button */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <label className="text-[11px] font-bold text-slate-600">Secondary Button</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={siteData.secondaryCtaText || "WhatsApp Chat"}
                              onChange={(e) => setSiteData({ ...siteData, secondaryCtaText: e.target.value })}
                              placeholder="Button Text"
                              className="h-8 text-xs bg-white rounded-lg"
                            />
                            <select
                              value={siteData.secondaryCtaAction || "WHATSAPP"}
                              onChange={(e) => setSiteData({ ...siteData, secondaryCtaAction: e.target.value })}
                              className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="WHATSAPP">WhatsApp Direct</option>
                              <option value="BOOKING_MODAL">Instant Booking Modal</option>
                              <option value="PHONE">Phone Call</option>
                              <option value="CUSTOM_URL">Custom URL Link</option>
                            </select>
                          </div>
                          {siteData.secondaryCtaAction === "CUSTOM_URL" && (
                            <Input
                              value={siteData.secondaryCtaLink || ""}
                              onChange={(e) => setSiteData({ ...siteData, secondaryCtaLink: e.target.value })}
                              placeholder="https://..."
                              className="h-8 text-xs bg-white rounded-lg mt-1"
                            />
                          )}
                        </div>
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

                      {/* Hero Slider Image Adjustments & Opacity Controls */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Hero Image Adjustments
                          </label>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Opacity: {selectedSection.design?.imageOpacity !== undefined ? selectedSection.design.imageOpacity : 85}%
                          </span>
                        </div>

                        {/* Opacity Range Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Image Opacity / Brightness</span>
                            <span className="text-blue-600">{selectedSection.design?.imageOpacity !== undefined ? selectedSection.design.imageOpacity : 85}%</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            step={5}
                            value={selectedSection.design?.imageOpacity !== undefined ? selectedSection.design.imageOpacity : 85}
                            onChange={(e) => {
                              updateSelectedSectionDesign({ imageOpacity: Number(e.target.value) });
                            }}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1">
                            <span>20% (Dark)</span>
                            <span>50%</span>
                            <span>85% (Optimal)</span>
                            <span>100% (Full Bright)</span>
                          </div>
                        </div>

                        {/* Image Alignment / Focal Point */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700">Image Alignment / Focal Point</label>
                          <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                            {[
                              { id: "top", label: "Top" },
                              { id: "center", label: "Center" },
                              { id: "bottom", label: "Bottom" },
                              { id: "left", label: "Left" },
                              { id: "right", label: "Right" },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => {
                                  updateSelectedSectionDesign({ imagePosition: pos.id as any });
                                }}
                                className={`py-1.5 rounded-lg border transition-all ${
                                  (selectedSection.design?.imagePosition || "center") === pos.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Overlay Darkness */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700">Dark Gradient Overlay</label>
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                            {[
                              { id: "none", label: "None" },
                              { id: "subtle", label: "Subtle" },
                              { id: "medium", label: "Balanced" },
                              { id: "dark", label: "Deep" },
                            ].map((ov) => (
                              <button
                                key={ov.id}
                                type="button"
                                onClick={() => {
                                  updateSelectedSectionDesign({ overlayDarkness: ov.id as any });
                                }}
                                className={`py-1.5 rounded-lg border transition-all ${
                                  (selectedSection.design?.overlayDarkness || "medium") === ov.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {ov.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hero Height */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-bold text-slate-700">Hero Section Height</label>
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                            {[
                              { id: "compact", label: "440px" },
                              { id: "normal", label: "580px" },
                              { id: "tall", label: "700px" },
                              { id: "fullscreen", label: "Full Screen" },
                            ].map((ht) => (
                              <button
                                key={ht.id}
                                type="button"
                                onClick={() => {
                                  updateSelectedSectionDesign({ heroHeight: ht.id as any });
                                }}
                                className={`py-1.5 rounded-lg border transition-all ${
                                  (selectedSection.design?.heroHeight || "normal") === ht.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {ht.label}
                              </button>
                            ))}
                          </div>
                        </div>
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
                                  const nextState = { ...siteData, heroSliderImages: updated, heroImage: updated[0] || null };
                                  setSiteData(nextState);
                                  pushHistory(nextState);
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1.5. STATS RIBBON INSPECTOR */}
                  {selectedSection.type === "STATS_RIBBON" && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Trust Metrics &amp; Key Numbers</label>
                        <p className="text-[10px] text-slate-500">Edit the statistics and credentials displayed in the ribbon.</p>
                      </div>

                      <div className="space-y-3">
                        {((selectedSection.stats && selectedSection.stats.length > 0)
                          ? selectedSection.stats
                          : [
                              { value: "15+ Years", label: "Clinical Excellence", icon: "shield" },
                              { value: "50,000+", label: "Patients Treated", icon: "user" },
                              { value: "100%", label: "Evidence-Based Care", icon: "sparkles" },
                              { value: "4.9 ★", label: "Google Rated", icon: "star" },
                            ]).map((st, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-500">Metric #{idx + 1}</span>
                              <div className="flex items-center gap-1">
                                {["shield", "user", "sparkles", "star", "heart", "activity", "cross"].map((ic) => {
                                  const IComp = ICON_MAP[ic] || ShieldCheck;
                                  return (
                                    <button
                                      key={ic}
                                      type="button"
                                      onClick={() => {
                                        const currentStats = [...((selectedSection.stats && selectedSection.stats.length > 0)
                                          ? selectedSection.stats
                                          : [
                                              { value: "15+ Years", label: "Clinical Excellence", icon: "shield" },
                                              { value: "50,000+", label: "Patients Treated", icon: "user" },
                                              { value: "100%", label: "Evidence-Based Care", icon: "sparkles" },
                                              { value: "4.9 ★", label: "Google Rated", icon: "star" },
                                            ])];
                                        currentStats[idx].icon = ic;
                                        updateSelectedSection({ stats: currentStats });
                                      }}
                                      className={`p-1 rounded border ${
                                        (st.icon || "shield") === ic ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200"
                                      }`}
                                    >
                                      <IComp className="w-3 h-3" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={st.value}
                                onChange={(e) => {
                                  const currentStats = [...((selectedSection.stats && selectedSection.stats.length > 0)
                                    ? selectedSection.stats
                                    : [
                                        { value: "15+ Years", label: "Clinical Excellence", icon: "shield" },
                                        { value: "50,000+", label: "Patients Treated", icon: "user" },
                                        { value: "100%", label: "Evidence-Based Care", icon: "sparkles" },
                                        { value: "4.9 ★", label: "Google Rated", icon: "star" },
                                      ])];
                                  currentStats[idx].value = e.target.value;
                                  updateSelectedSection({ stats: currentStats });
                                }}
                                placeholder="Value (e.g. 15+ Years)"
                                className="h-8 text-xs font-black bg-white"
                              />
                              <Input
                                value={st.label}
                                onChange={(e) => {
                                  const currentStats = [...((selectedSection.stats && selectedSection.stats.length > 0)
                                    ? selectedSection.stats
                                    : [
                                        { value: "15+ Years", label: "Clinical Excellence", icon: "shield" },
                                        { value: "50,000+", label: "Patients Treated", icon: "user" },
                                        { value: "100%", label: "Evidence-Based Care", icon: "sparkles" },
                                        { value: "4.9 ★", label: "Google Rated", icon: "star" },
                                      ])];
                                  currentStats[idx].label = e.target.value;
                                  updateSelectedSection({ stats: currentStats });
                                }}
                                placeholder="Label (e.g. Clinical Excellence)"
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PACKAGES & PRICING INSPECTOR */}
                  {selectedSection.type === "PACKAGES" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Section Heading</label>
                        <Input
                          value={selectedSection.title || "Health Packages & Diagnostic Profiles"}
                          onChange={(e) => updateSelectedSection({ title: e.target.value })}
                          className="h-10 text-xs rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Section Subtitle</label>
                        <Input
                          value={selectedSection.subtitle || "NABL accredited health checkup packages with free home sample collection."}
                          onChange={(e) => updateSelectedSection({ subtitle: e.target.value })}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700">Checkup Packages</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const list = selectedSection.packages || [];
                              const nextPackages = [
                                ...list,
                                {
                                  name: "New Health Checkup Package",
                                  parameterCount: "50+ Tests",
                                  originalPrice: 2499,
                                  price: 999,
                                  discount: "60% OFF",
                                  fasting: "10-12 Hrs Fasting",
                                  reportTime: "Digital Report in 12 Hrs",
                                  popular: false,
                                  features: ["Complete Blood Count (CBC)", "Lipid Profile", "Liver Function (LFT)", "Kidney Function (KFT)", "Fasting Blood Sugar"],
                                },
                              ];
                              updateSelectedSection({ packages: nextPackages });
                            }}
                            className="h-7 text-[11px] font-bold rounded-lg"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Package
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {((selectedSection.packages && selectedSection.packages.length > 0)
                            ? selectedSection.packages
                            : [
                                {
                                  name: "Executive Full Body Wellness",
                                  parameterCount: "85+ Tests",
                                  originalPrice: 3999,
                                  price: 1499,
                                  discount: "62% OFF",
                                  fasting: "10-12 Hrs Fasting",
                                  reportTime: "Same-Day Report in 6-12 Hrs",
                                  popular: true,
                                  features: ["Complete Hemogram (CBC 24 Params)", "Lipid Profile & Heart Risk", "Liver Function Test (LFT 11 Params)", "Kidney Function Test (KFT)", "Thyroid Profile (TSH)", "HbA1c & Fasting Glucose", "Vitamin D3 & Vitamin B12"],
                                },
                                {
                                  name: "Heart & Diabetes Advanced Care",
                                  parameterCount: "62+ Tests",
                                  originalPrice: 2999,
                                  price: 1199,
                                  discount: "60% OFF",
                                  fasting: "10-12 Hrs Fasting",
                                  reportTime: "Digital Report in 8 Hrs",
                                  popular: false,
                                  features: ["Fasting Blood Sugar & HbA1c", "High-Sensitivity CRP (hs-CRP)", "Complete Lipid Profile (HDL/LDL/VLDL)", "Serum Creatinine & eGFR", "Urine Microalbuminuria"],
                                },
                                {
                                  name: "Senior Citizen Comprehensive Package",
                                  parameterCount: "92+ Tests",
                                  originalPrice: 4999,
                                  price: 1999,
                                  discount: "60% OFF",
                                  fasting: "10-12 Hrs Fasting",
                                  reportTime: "Same-Day Report in 12 Hrs",
                                  popular: false,
                                  features: ["Full Organ Profile (Liver/Kidney/Heart)", "Bone Mineral Profile (Calcium/Phosphorus)", "Arthritis Screen (Uric Acid & RA Factor)", "Electrolytes (Sodium/Potassium/Chloride)", "Urine Routine & Microscopy"],
                                },
                              ]).map((pkg, pIdx) => (
                            <div key={pIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <Input
                                  value={pkg.name}
                                  onChange={(e) => {
                                    const list = [...((selectedSection.packages && selectedSection.packages.length > 0) ? selectedSection.packages : [
                                      { name: "Executive Full Body Wellness", parameterCount: "85+ Tests", originalPrice: 3999, price: 1499, discount: "62% OFF", fasting: "10-12 Hrs Fasting", reportTime: "Same-Day in 6-12 Hrs", popular: true, features: ["CBC", "Lipid", "LFT", "KFT", "TSH", "HbA1c", "Vit D3 & B12"] },
                                      { name: "Heart & Diabetes Care", parameterCount: "62+ Tests", originalPrice: 2999, price: 1199, discount: "60% OFF", fasting: "10-12 Hrs Fasting", reportTime: "In 8 Hrs", popular: false, features: ["Sugar", "HbA1c", "hs-CRP", "Lipid", "KFT"] },
                                      { name: "Senior Citizen Package", parameterCount: "92+ Tests", originalPrice: 4999, price: 1999, discount: "60% OFF", fasting: "10-12 Hrs Fasting", reportTime: "In 12 Hrs", popular: false, features: ["Organ Profile", "Bone Profile", "Uric Acid", "Electrolytes"] },
                                    ])];
                                    list[pIdx].name = e.target.value;
                                    updateSelectedSection({ packages: list });
                                  }}
                                  placeholder="Package Name"
                                  className="h-8 text-xs font-bold bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = (selectedSection.packages || []).filter((_, idx) => idx !== pIdx);
                                    updateSelectedSection({ packages: list });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500">Offer Price (₹)</label>
                                  <Input
                                    type="number"
                                    value={pkg.price || ""}
                                    onChange={(e) => {
                                      const list = [...(selectedSection.packages || [])];
                                      list[pIdx].price = e.target.value ? Number(e.target.value) : undefined;
                                      updateSelectedSection({ packages: list });
                                    }}
                                    placeholder="1499"
                                    className="h-7 text-xs font-bold bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500">Original MRP (₹)</label>
                                  <Input
                                    type="number"
                                    value={pkg.originalPrice || ""}
                                    onChange={(e) => {
                                      const list = [...(selectedSection.packages || [])];
                                      list[pIdx].originalPrice = e.target.value ? Number(e.target.value) : undefined;
                                      updateSelectedSection({ packages: list });
                                    }}
                                    placeholder="3999"
                                    className="h-7 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500">Discount Tag</label>
                                  <Input
                                    value={pkg.discount || ""}
                                    onChange={(e) => {
                                      const list = [...(selectedSection.packages || [])];
                                      list[pIdx].discount = e.target.value;
                                      updateSelectedSection({ packages: list });
                                    }}
                                    placeholder="60% OFF"
                                    className="h-7 text-[10px] font-bold text-emerald-700 bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500">Parameter Count</label>
                                  <Input
                                    value={pkg.parameterCount || ""}
                                    onChange={(e) => {
                                      const list = [...(selectedSection.packages || [])];
                                      list[pIdx].parameterCount = e.target.value;
                                      updateSelectedSection({ packages: list });
                                    }}
                                    placeholder="85+ Tests"
                                    className="h-7 text-[10px] bg-white font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500">Fasting Requirement</label>
                                  <Input
                                    value={pkg.fasting || ""}
                                    onChange={(e) => {
                                      const list = [...(selectedSection.packages || [])];
                                      list[pIdx].fasting = e.target.value;
                                      updateSelectedSection({ packages: list });
                                    }}
                                    placeholder="10-12 Hrs Fasting"
                                    className="h-7 text-[10px] bg-white"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-bold text-slate-700">Highlight as Best Value / Popular:</span>
                                <input
                                  type="checkbox"
                                  checked={pkg.popular === true}
                                  onChange={(e) => {
                                    const list = [...(selectedSection.packages || [])];
                                    list[pIdx].popular = e.target.checked;
                                    updateSelectedSection({ packages: list });
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                />
                              </div>
                            </div>
                          ))}
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

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-800">Show Prices</span>
                          <input
                            type="checkbox"
                            checked={siteData.showPrices !== false}
                            onChange={(e) => setSiteData({ ...siteData, showPrices: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-[11px] text-slate-800">Show Card Button</span>
                          <input
                            type="checkbox"
                            checked={siteData.showServiceButtons === true}
                            onChange={(e) => setSiteData({ ...siteData, showServiceButtons: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                        </div>
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
                              const nextState = {
                                ...siteData,
                                customServices: [...list, { name: "New Clinical Treatment", description: "Comprehensive procedure & specialized care.", icon: "stethoscope" }],
                              };
                              setSiteData(nextState);
                              pushHistory(nextState);
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
                                    const nextState = { ...siteData, customServices: updated };
                                    setSiteData(nextState);
                                    pushHistory(nextState);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Service Photo or Icon Library Picker */}
                              <div className="space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-600">Visual Badge:</span>
                                  <div className="flex items-center gap-2">
                                    {s.image ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...(siteData.customServices || [])];
                                          updated[idx].image = undefined;
                                          const nextState = { ...siteData, customServices: updated };
                                          setSiteData(nextState);
                                          pushHistory(nextState);
                                        }}
                                        className="text-[10px] text-rose-600 font-bold hover:underline"
                                      >
                                        Use Icon Instead
                                      </button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setActiveServiceUploadIdx(idx);
                                          servicePhotoRef.current?.click();
                                        }}
                                        className="h-5 px-1.5 text-[9px] font-bold rounded"
                                      >
                                        <Upload className="w-2.5 h-2.5 mr-1 text-blue-600" /> Upload Image
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {!s.image && (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-h-20 flex-wrap">
                                    {ALL_ICON_KEYS.map((ic) => {
                                      const IComp = ICON_MAP[ic];
                                      return (
                                        <button
                                          key={ic}
                                          type="button"
                                          onClick={() => {
                                            const updated = [...(siteData.customServices || [])];
                                            updated[idx].icon = ic;
                                            const nextState = { ...siteData, customServices: updated };
                                            setSiteData(nextState);
                                            pushHistory(nextState);
                                          }}
                                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                                            (s.icon || "stethoscope") === ic
                                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                          }`}
                                          title={ic}
                                        >
                                          <IComp className="w-3.5 h-3.5" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
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

                        <input
                          ref={servicePhotoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleServicePhotoUpload}
                        />
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
                        <label className="font-bold text-slate-700">Doctor Full Name</label>
                        <Input
                          value={siteData.doctor?.name || ""}
                          onChange={(e) => {
                            const updatedDoc = { ...(siteData.doctor || { name: "" }), name: e.target.value };
                            setSiteData({ ...siteData, doctor: updatedDoc });
                          }}
                          placeholder="e.g. Dr. Vinay Kumar Rai"
                          className="h-10 text-xs rounded-xl font-bold bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-700">Specialty</label>
                          <Input
                            value={siteData.doctor?.specialty || ""}
                            onChange={(e) => {
                              const updatedDoc = { ...(siteData.doctor || { name: "" }), specialty: e.target.value };
                              setSiteData({ ...siteData, doctor: updatedDoc });
                            }}
                            placeholder="e.g. Pediatrician"
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-700">Degrees &amp; Certifications</label>
                          <Input
                            value={siteData.doctor?.degrees || ""}
                            onChange={(e) => {
                              const updatedDoc = { ...(siteData.doctor || { name: "" }), degrees: e.target.value };
                              setSiteData({ ...siteData, doctor: updatedDoc });
                            }}
                            placeholder="e.g. MBBS, MD, DNB"
                            className="h-9 text-xs rounded-xl bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="font-bold text-slate-700">Doctor Portrait Photo</label>
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
                          className="text-xs rounded-xl leading-relaxed bg-white"
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
                                  const nextState = { ...siteData, galleryImages: updated };
                                  setSiteData(nextState);
                                  pushHistory(nextState);
                                }}
                                placeholder="Caption"
                                className="h-7 text-[10px] bg-white rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (siteData.galleryImages || []).filter((_, idx) => idx !== i);
                                  const nextState = { ...siteData, galleryImages: updated };
                                  setSiteData(nextState);
                                  pushHistory(nextState);
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

                  {/* 5. MAP & HOURS INSPECTOR */}
                  {selectedSection.type === "MAP_HOURS" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Section Title</label>
                        <Input
                          value={selectedSection.title || "Clinic Location & Hours"}
                          onChange={(e) => updateSelectedSection({ title: e.target.value })}
                          className="h-10 text-xs rounded-xl font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Clinic Verified Address (For Map Pin)</label>
                        <Textarea
                          value={siteData.clinicAddress || siteData.doctor?.address || ""}
                          onChange={(e) => setSiteData({ ...siteData, clinicAddress: e.target.value })}
                          placeholder="e.g. B-4/32, Safdarjung Enclave, New Delhi, Delhi 110029"
                          rows={3}
                          className="text-xs rounded-xl"
                        />
                        <p className="text-[10px] text-slate-500">Google Map automatically pins to this exact clinic building.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Custom Google Map Embed URL (Optional)</label>
                        <Input
                          value={siteData.mapEmbedUrl || ""}
                          onChange={(e) => setSiteData({ ...siteData, mapEmbedUrl: e.target.value })}
                          placeholder="https://maps.google.com/..."
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. FAQ INSPECTOR */}
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
                              const nextState = {
                                ...siteData,
                                customFaqs: [...list, { question: "New Question?", answer: "Answer details here." }],
                              };
                              setSiteData(nextState);
                              pushHistory(nextState);
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
                                    const nextState = { ...siteData, customFaqs: updated };
                                    setSiteData(nextState);
                                    pushHistory(nextState);
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

                  {/* 7. CTA BANNER INSPECTOR */}
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

                  {/* 8. CUSTOM TEXT INSPECTOR */}
                  {selectedSection.type === "CUSTOM_TEXT" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Section Headline</label>
                        <Input
                          value={selectedSection.title || ""}
                          onChange={(e) => updateSelectedSection({ title: e.target.value })}
                          placeholder="e.g. Special Patient Notice / Accreditations"
                          className="h-10 text-xs rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Content / Story Text</label>
                        <Textarea
                          value={selectedSection.content || ""}
                          onChange={(e) => updateSelectedSection({ content: e.target.value })}
                          rows={6}
                          placeholder="Write detailed announcements, clinical certifications, emergency policies, or patient guidance..."
                          className="text-xs rounded-xl leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* 9. REVIEWS INSPECTOR */}
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
              )}
            </div>
          ) : (
            /* Main Elementor Drawer Tabs */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-5 p-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600">
                <button
                  onClick={() => setSidebarTab("elements")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "elements" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Elements</span>
                </button>
                <button
                  onClick={() => setSidebarTab("structure")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "structure" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Layers className="w-3.5 h-3.5" /> <span>Structure</span>
                </button>
                <button
                  onClick={() => setSidebarTab("navbar")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "navbar" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Navigation className="w-3.5 h-3.5" /> <span>Navbar</span>
                </button>
                <button
                  onClick={() => setSidebarTab("style")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "style" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Palette className="w-3.5 h-3.5" /> <span>Styling</span>
                </button>
                <button
                  onClick={() => setSidebarTab("domain")}
                  className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${sidebarTab === "domain" ? "bg-white text-blue-600 shadow-2xs font-black" : "hover:bg-slate-100"}`}
                >
                  <Globe className="w-3.5 h-3.5" /> <span>Domain</span>
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
                        onClick={() => handleSelectSection(sec.id)}
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

              {/* TAB 3: NAVBAR CUSTOMIZATION */}
              {sidebarTab === "navbar" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinic Header Navigation</h3>
                    <p className="text-[11px] text-slate-500">Toggle navbar menu items and add custom page links.</p>
                  </div>

                  <div className="space-y-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="font-bold text-slate-800">Default Section Links</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Services &amp; Procedures</span>
                        <input
                          type="checkbox"
                          checked={siteData.showServices !== false}
                          onChange={(e) => setSiteData({ ...siteData, showServices: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Patient Reviews</span>
                        <input
                          type="checkbox"
                          checked={siteData.showReviews !== false}
                          onChange={(e) => setSiteData({ ...siteData, showReviews: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Doctor Bio</span>
                        <input
                          type="checkbox"
                          checked={siteData.showDoctorBio !== false}
                          onChange={(e) => setSiteData({ ...siteData, showDoctorBio: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>FAQ Accordion</span>
                        <input
                          type="checkbox"
                          checked={siteData.showFaq !== false}
                          onChange={(e) => setSiteData({ ...siteData, showFaq: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Location &amp; Timings</span>
                        <input
                          type="checkbox"
                          checked={siteData.showMap !== false}
                          onChange={(e) => setSiteData({ ...siteData, showMap: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Navigation Links */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">Custom Nav Links &amp; Pages</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const list = siteData.navLinks || [];
                          setSiteData({
                            ...siteData,
                            navLinks: [...list, { label: "Patient Portal", href: "https://", isExternal: true }],
                          });
                        }}
                        className="h-6 text-[10px] font-bold rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Link
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(siteData.navLinks || []).map((nl, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <Input
                              value={nl.label}
                              onChange={(e) => {
                                const updated = [...(siteData.navLinks || [])];
                                updated[idx].label = e.target.value;
                                setSiteData({ ...siteData, navLinks: updated });
                              }}
                              placeholder="Link Label"
                              className="h-7 text-xs font-bold bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (siteData.navLinks || []).filter((_, i) => i !== idx);
                                setSiteData({ ...siteData, navLinks: updated });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <Input
                            value={nl.href}
                            onChange={(e) => {
                              const updated = [...(siteData.navLinks || [])];
                              updated[idx].href = e.target.value;
                              setSiteData({ ...siteData, navLinks: updated });
                            }}
                            placeholder="URL (e.g. https://... or #contact)"
                            className="h-7 text-[11px] bg-white font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button
                      onClick={() => handleSaveWebsite("Navbar Settings")}
                      disabled={saving}
                      className="w-full h-10 rounded-xl bg-slate-900 text-white font-bold text-xs"
                    >
                      Save Navbar Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: TYPOGRAPHY & GLOBAL STYLING */}
              {sidebarTab === "style" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Typography &amp; Aesthetics</h3>
                    <p className="text-[11px] text-slate-500">Customize fonts, button corner styling, and colors.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Headline Font Family</label>
                      <select
                        value={siteData.fontHeading}
                        onChange={(e) => {
                          const nextState = { ...siteData, fontHeading: e.target.value };
                          setSiteData(nextState);
                          pushHistory(nextState);
                        }}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                      >
                        {FONTS_HEADINGS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Body Text Font Family</label>
                      <select
                        value={siteData.fontBody}
                        onChange={(e) => {
                          const nextState = { ...siteData, fontBody: e.target.value };
                          setSiteData(nextState);
                          pushHistory(nextState);
                        }}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50"
                      >
                        {FONTS_BODY.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Button Corner Radius</label>
                      <select
                        value={siteData.buttonRadius || "2xl"}
                        onChange={(e) => {
                          const nextState = { ...siteData, buttonRadius: e.target.value };
                          setSiteData(nextState);
                          pushHistory(nextState);
                        }}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                      >
                        {BUTTON_RADII.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
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
                      Save Styling &amp; Typography
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 5: DOMAIN SETTINGS */}
              {sidebarTab === "domain" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Free URL &amp; Custom Domain</h3>
                    <p className="text-[11px] text-slate-500">Point your branded domain (e.g. drvinayrai.com).</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-700">Free Instant Subdomain</label>
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
                      Update Subdomain
                    </Button>
                  </div>

                  {/* Branded Domain Manager with Step-by-Step DNS Guide */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-purple-950 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-purple-700" /> Connect Your Own Domain
                      </label>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-emerald-600" /> Free SSL
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Input
                        value={customDomainInput}
                        onChange={(e) => setCustomDomainInput(cleanDomainString(e.target.value))}
                        placeholder="e.g. drvinayrai.com"
                        className="h-9 text-xs font-mono font-bold bg-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          const clean = cleanDomainString(customDomainInput);
                          if (!clean) return;
                          setConnectingDomain(true);
                          try {
                            const res = await fetch("/api/websites/custom-domain", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ domain: clean }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Failed");
                            setCustomDomainStatus({ connectedDomain: data.customDomain, dnsConfigured: data.dnsConfigured });
                            toast({ title: "Domain Linked Successfully! 🌐", description: "Follow the DNS instructions below." });
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          } finally {
                            setConnectingDomain(false);
                          }
                        }}
                        className="w-full h-8 text-[11px] font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                      >
                        {connectingDomain ? "Connecting..." : "Save Custom Domain"}
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-purple-200/80 space-y-2.5">
                      <p className="text-[11px] font-bold text-purple-900">
                        DNS Configuration Steps (GoDaddy, Namecheap, Hostinger, Cloudflare):
                      </p>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Open your domain DNS Manager and add these 2 records:
                      </p>

                      <div className="bg-white rounded-xl border border-purple-100 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-purple-100/60 font-bold text-purple-900">
                            <tr>
                              <th className="p-1.5">Type</th>
                              <th className="p-1.5">Name/Host</th>
                              <th className="p-1.5">Points To (Value)</th>
                              <th className="p-1.5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            <tr>
                              <td className="p-1.5 font-bold text-blue-700">A</td>
                              <td className="p-1.5">@</td>
                              <td className="p-1.5 text-slate-800 font-bold">72.60.201.41</td>
                              <td className="p-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText("72.60.201.41");
                                    toast({ title: "Copied A Record IP: 72.60.201.41" });
                                  }}
                                  className="text-purple-700 hover:underline font-bold"
                                >
                                  Copy
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1.5 font-bold text-purple-700">CNAME</td>
                              <td className="p-1.5">www</td>
                              <td className="p-1.5 text-slate-800 font-bold">domains.gyrex.in</td>
                              <td className="p-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText("domains.gyrex.in");
                                    toast({ title: "Copied CNAME: domains.gyrex.in" });
                                  }}
                                  className="text-purple-700 hover:underline font-bold"
                                >
                                  Copy
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 leading-tight">
                        🔒 <strong>Automatic HTTPS SSL</strong>: Once DNS records propagate, your SSL certificate will be issued automatically within minutes.
                      </div>
                    </div>
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
              onSelectSection={handleSelectSection}
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
