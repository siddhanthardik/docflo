"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getThemePreset, THEME_PRESETS } from "@/components/themes/theme-presets";
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
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Bookmark,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SPECIALTIES } from "@/lib/specialties";
import { useToast } from "@/components/ui/use-toast";
import { QuickStartWizardModal } from "@/components/composer/QuickStartWizardModal";
import { MedicalStockModal } from "@/components/composer/MedicalStockModal";
import { StudioDrawer } from "@/components/composer/StudioDrawer";
import { StudioCanvas } from "@/components/composer/StudioCanvas";
import { StudioInspector } from "@/components/composer/StudioInspector";
import { SavedBlockItem } from "@/types/builder-blocks";

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
  { id: "gastrosurg-advanced", name: "GastroSurg Advanced", category: "General Surgery & GI Surgery", primary: "#0F766E", secondary: "#0F172A", accent: "#D97706" },
  { id: "kinetic-physio", name: "KineticPhysio Pro", category: "Physiotherapy & Sports Rehab", primary: "#0284C7", secondary: "#0F172A", accent: "#EA580C" },
  { id: "endometabolic-care", name: "EndoMeta Care", category: "Diabetology & Endocrinology", primary: "#1E3A8A", secondary: "#0F172A", accent: "#0284C7" },
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
  const [insertTargetIndex, setInsertTargetIndex] = useState<number | null>(null);
  const [quickStartModalOpen, setQuickStartModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTargetField, setStockTargetField] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlockItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gyrex_saved_blocks");
      if (stored) setSavedBlocks(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSaveSectionAsBlock = (section: PageSection) => {
    const newSaved: SavedBlockItem = {
      id: `saved_${Date.now()}`,
      name: `${section.title || section.type.replace("_", " ")} Block`,
      targetType: section.type,
      createdAt: new Date().toLocaleDateString(),
      section: JSON.parse(JSON.stringify(section)),
    };
    const updated = [newSaved, ...savedBlocks];
    setSavedBlocks(updated);
    try {
      localStorage.setItem("gyrex_saved_blocks", JSON.stringify(updated));
    } catch {}
    toast({
      title: "Block Saved to Library! 💾",
      description: "You can reuse it anytime from the 'Saved Blocks' tab.",
    });
  };

  const handleDeleteSavedBlock = (id: string) => {
    const updated = savedBlocks.filter((b) => b.id !== id);
    setSavedBlocks(updated);
    try {
      localStorage.setItem("gyrex_saved_blocks", JSON.stringify(updated));
    } catch {}
    toast({ title: "Block Removed from Library" });
  };

  const handleInsertSectionFromDrawer = (sectionPartial: Partial<PageSection>) => {
    const newId = `sec_${Date.now()}`;
    const newSection: PageSection = {
      id: newId,
      type: sectionPartial.type || "CUSTOM_TEXT",
      ...sectionPartial,
    };
    const list = [...(siteData.sections || [])];
    if (insertTargetIndex !== null && insertTargetIndex >= 0 && insertTargetIndex <= list.length) {
      list.splice(insertTargetIndex, 0, newSection);
      setInsertTargetIndex(null);
    } else {
      list.push(newSection);
    }
    const nextState = { ...siteData, sections: list };
    setSiteData(nextState);
    pushHistory(nextState);
    handleSelectSection(newId);
    toast({
      title: `Added ${newSection.type.replace("_", " ")} Block! ✨`,
      description: "Customized content inspector ready.",
    });
  };

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
          sections: ((data.website.sections && data.website.sections.length > 0) ? data.website.sections : [
            { id: "sec_hero", type: "HERO", badgeText: "" },
            { id: "sec_services", type: "SERVICES" },
            { id: "sec_reviews", type: "REVIEWS" },
            { id: "sec_bio", type: "DOCTOR_BIO" },
            { id: "sec_cta", type: "CTA_BANNER" },
            { id: "sec_faq", type: "FAQ" },
            { id: "sec_map", type: "MAP_HOURS" },
          ]).map((s: PageSection) => {
            if (s.badgeText && (s.badgeText.toLowerCase().includes("nabh") || s.badgeText.toLowerCase().includes("nabl accredited"))) {
              return { ...s, badgeText: "" };
            }
            return s;
          }),
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
    } else if (field === "service") {
      const serviceHeadlines = [
        `Specialized ${specialty} Consultations & Procedures`,
        `Advanced Diagnostic & Interventional Care`,
        `Comprehensive Health Assessments & Preventive Programs`,
      ];
      const serviceSubtitles = [
        `Delivering gold-standard treatment regimens and dedicated clinical attention.`,
        `State-of-the-art diagnostic facilities and customized patient recovery plans.`,
      ];
      const pickedHeadline = serviceHeadlines[Math.floor(Math.random() * serviceHeadlines.length)];
      const pickedSubtitle = serviceSubtitles[Math.floor(Math.random() * serviceSubtitles.length)];
      updateSelectedSection({ title: pickedHeadline, subtitle: pickedSubtitle });
      toast({ title: "✨ AI Service Copy Generated!" });
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

  const handleDuplicateSection = (sectionId: string) => {
    const list = [...(siteData.sections || [])];
    const index = list.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const source = list[index];
    const clone: PageSection = JSON.parse(JSON.stringify(source));
    clone.id = `sec_${source.type.toLowerCase()}_${Date.now()}`;
    if (clone.title) clone.title = `${clone.title} (Copy)`;

    list.splice(index + 1, 0, clone);
    const nextState = { ...siteData, sections: list };
    setSiteData(nextState);
    pushHistory(nextState);
    handleSelectSection(clone.id);
    toast({ title: `Duplicated ${source.type.replace("_", " ")} Block ⧉` });
  };

  const handleDropNewSection = (type: SectionType, targetIndex: number) => {
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

    const list = [...(siteData.sections || [])];
    const safeIndex = Math.max(0, Math.min(list.length, targetIndex));
    list.splice(safeIndex, 0, newSection);

    const nextState = { ...siteData, sections: list };
    setSiteData(nextState);
    pushHistory(nextState);
    handleSelectSection(newId);
    toast({ title: `Dropped ${type.replace("_", " ")} onto Canvas! 🎯`, description: `Inserted at position #${safeIndex + 1}.` });
  };

  const handleReorderSection = (sourceIndex: number, targetIndex: number) => {
    const list = [...(siteData.sections || [])];
    if (sourceIndex < 0 || sourceIndex >= list.length) return;
    if (targetIndex < 0 || targetIndex > list.length) return;

    const [removed] = list.splice(sourceIndex, 1);
    const destination = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
    list.splice(destination, 0, removed);

    const nextState = { ...siteData, sections: list };
    setSiteData(nextState);
    pushHistory(nextState);
    toast({ title: `Reordered ${removed.type.replace("_", " ")} Block 🔄` });
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
      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("docflo_unsaved_website_draft", JSON.stringify(siteData));
            } catch (e) {}
          }
          throw new Error("Your login session timed out. Your edits have been safely cached in your browser. Please log in in another tab or refresh to publish.");
        }
        throw new Error(data.error || "Failed to save website");
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("docflo_unsaved_website_draft");
        } catch (e) {}
      }

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
    <div className="fixed inset-0 z-50 flex flex-col w-screen h-screen overflow-hidden font-sans bg-slate-100">
      {/* ── TOP WEBSITE STUDIO HEADER (EXLY-STYLE) ── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-xs select-none">
        {/* Left: Exit, Save Draft, Publish */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
            title="Exit Studio to Dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Edit Page</span>
          </Link>

          <Button
            onClick={() => handleSaveWebsite("Draft")}
            disabled={saving}
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Save className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>{saving ? "Saving..." : "Save draft"}</span>
          </Button>

          <Button
            onClick={() => setPublishModalOpen(true)}
            size="sm"
            className="h-9 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>Publish</span>
          </Button>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewport("desktop")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === "desktop"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === "tablet"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewport === "mobile"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
              historyIndex > 0
                ? "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50"
            }`}
            title="Undo Changes (Rollback)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <a
            href={`https://${siteData.subdomain}.gyrex.in`}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
            title="View Live Website"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">View Live</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setIsSidebarCollapsed(false);
              setSelectedSectionId(null);
              setSidebarTab("domain");
            }}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Domain & Clinic Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY: LEFT PALETTE (390px) + CENTER LIVE VISUAL CANVAS ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── 56px PRIMARY ICON RAIL (EXLY-STYLE DOCKED RAIL) ── */}
        <aside className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-2.5 shrink-0 z-30 select-none shadow-xs">
          <button
            type="button"
            onClick={() => {
              if (!isSidebarCollapsed && sidebarTab === "elements" && !selectedSectionId) {
                setIsSidebarCollapsed(true);
              } else {
                setIsSidebarCollapsed(false);
                setSelectedSectionId(null);
                setSidebarTab("elements");
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !selectedSectionId && sidebarTab === "elements" && !isSidebarCollapsed
                ? "bg-purple-700 text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Blocks & Design Blocks (⊞)"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isSidebarCollapsed && sidebarTab === "structure" && !selectedSectionId) {
                setIsSidebarCollapsed(true);
              } else {
                setIsSidebarCollapsed(false);
                setSelectedSectionId(null);
                setSidebarTab("structure");
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !selectedSectionId && sidebarTab === "structure" && !isSidebarCollapsed
                ? "bg-purple-700 text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Page Structure & Layers (🥞)"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isSidebarCollapsed && sidebarTab === "style" && !selectedSectionId) {
                setIsSidebarCollapsed(true);
              } else {
                setIsSidebarCollapsed(false);
                setSelectedSectionId(null);
                setSidebarTab("style");
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !selectedSectionId && sidebarTab === "style" && !isSidebarCollapsed
                ? "bg-purple-700 text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Theme & Global Styling (🎨)"
          >
            <Palette className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isSidebarCollapsed && sidebarTab === "navbar" && !selectedSectionId) {
                setIsSidebarCollapsed(true);
              } else {
                setIsSidebarCollapsed(false);
                setSelectedSectionId(null);
                setSidebarTab("navbar");
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !selectedSectionId && sidebarTab === "navbar" && !isSidebarCollapsed
                ? "bg-purple-700 text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Clinic Navigation & Custom Links (🚩)"
          >
            <Navigation className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isSidebarCollapsed && sidebarTab === "domain" && !selectedSectionId) {
                setIsSidebarCollapsed(true);
              } else {
                setIsSidebarCollapsed(false);
                setSelectedSectionId(null);
                setSidebarTab("domain");
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              !selectedSectionId && sidebarTab === "domain" && !isSidebarCollapsed
                ? "bg-purple-700 text-white shadow-md font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Custom Domain & Subdomain (🌐)"
          >
            <Globe className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand Drawer" : "Collapse Drawer"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </aside>

        {/* ── EXPANDABLE DRAWER / INSPECTOR (340px) ── */}
        {!isSidebarCollapsed && (
          <aside className="w-[340px] sm:w-[360px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-md transition-all">
            {selectedSection ? (
              <StudioInspector
                selectedSection={selectedSection}
                siteData={siteData}
                saving={saving}
                onUpdateSection={updateSelectedSection}
                onUpdateDesign={updateSelectedSectionDesign}
                onSaveWebsite={handleSaveWebsite}
                onClose={() => setSelectedSectionId(null)}
                onSaveAsBlock={handleSaveSectionAsBlock}
                onDeleteSection={handleDeleteSection}
                onGenerateAiCopy={generateAiCopy}
              />
          ) : (
            /* Main Studio Drawer Panel */
            <div className="flex-1 flex flex-col overflow-hidden">
              {sidebarTab !== "elements" && (
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    {sidebarTab === "structure" && <><Layers className="w-4 h-4 text-purple-600" /> Page Structure</>}
                    {sidebarTab === "navbar" && <><Navigation className="w-4 h-4 text-purple-600" /> Clinic Navigation</>}
                    {sidebarTab === "style" && <><Palette className="w-4 h-4 text-purple-600" /> Themes &amp; Styling</>}
                    {sidebarTab === "domain" && <><Globe className="w-4 h-4 text-purple-600" /> Domain &amp; Free URL</>}
                  </h3>
                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="Close Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TAB 1: BLOCKS, DESIGN BLOCKS & SAVED BLOCKS (EXLY-STYLE) */}
              {sidebarTab === "elements" && (
                <StudioDrawer
                  isOpen={true}
                  onClose={() => setIsSidebarCollapsed(true)}
                  onInsertSection={handleInsertSectionFromDrawer}
                  savedBlocks={savedBlocks}
                  onDeleteSavedBlock={handleDeleteSavedBlock}
                />
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
      )}

        {/* ── CENTER LIVE VISUAL CANVAS WITH PANNING & ZOOMING (STUDIO CANVAS) ── */}
        <StudioCanvas
          siteData={siteData}
          selectedSectionId={selectedSectionId}
          viewport={viewport}
          onSelectSection={handleSelectSection}
          onMoveSection={handleMoveSection}
          onDeleteSection={handleDeleteSection}
          onDuplicateSection={handleDuplicateSection}
          onDropNewSection={handleDropNewSection}
          onReorderSection={handleReorderSection}
          onOpenInsertModal={(idx) => {
            setInsertTargetIndex(idx ?? null);
            setIsSidebarCollapsed(false);
            setSelectedSectionId(null);
            setSidebarTab("elements");
          }}
        />
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



      {/* ── 5-MINUTE MAGIC QUICKSTART WIZARD MODAL ── */}
      <QuickStartWizardModal
        isOpen={quickStartModalOpen}
        onClose={() => setQuickStartModalOpen(false)}
        currentData={siteData}
        onApplySynthesizedSite={(synthesized: any) => {
          const formatted: ClinicWebsiteData = {
            ...siteData,
            ...synthesized,
            doctor: synthesized.doctor || synthesized.doctorInfo || siteData.doctor,
            sections: synthesized.sections || siteData.sections,
            customServices: synthesized.customServices || siteData.customServices,
            customFaqs: synthesized.customFaqs || siteData.customFaqs,
            galleryImages: synthesized.galleryImages || siteData.galleryImages,
          };
          setSiteData(formatted);
          pushHistory(formatted);
          setSelectedSectionId("sec_hero");
          setSidebarTab("elements");
          toast({
            title: "🎉 Clinic Website Auto-Built in 45s!",
            description: "Imported Google photos, verified reviews, doctor biography, and WhatsApp booking.",
          });
        }}
      />

      {/* ── MEDICAL STOCK PHOTOS MODAL ── */}
      <MedicalStockModal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setStockTargetField(null);
        }}
        onSelectPhoto={(url) => {
          if (stockTargetField === "hero") {
            const nextState = { ...siteData, heroImage: url };
            setSiteData(nextState);
            pushHistory(nextState);
            toast({ title: "Hero Banner Photo Updated 📸" });
          } else if (stockTargetField === "doctor") {
            const nextState = { ...siteData, doctor: { ...(siteData.doctor || { name: "Doctor" }), image: url } };
            setSiteData(nextState);
            pushHistory(nextState);
            toast({ title: "Doctor Portrait Photo Updated 🩺" });
          } else if (stockTargetField === "gallery") {
            const currentGallery = siteData.galleryImages || [];
            const nextState = { ...siteData, galleryImages: [...currentGallery, { url, caption: "Modern Clinic Facilities" }] };
            setSiteData(nextState);
            pushHistory(nextState);
            toast({ title: "Photo Added to Clinic Gallery 📸" });
          } else if (stockTargetField && stockTargetField.startsWith("service_")) {
            const sIdx = parseInt(stockTargetField.split("_")[1], 10);
            if (!isNaN(sIdx) && siteData.customServices && siteData.customServices[sIdx]) {
              const updated = [...siteData.customServices];
              updated[sIdx].image = url;
              const nextState = { ...siteData, customServices: updated };
              setSiteData(nextState);
              pushHistory(nextState);
              toast({ title: "Treatment Photo Updated 🩺" });
            }
          }
        }}
        title="Choose from Verified Medical Stock Photography"
      />


    </div>
  );
}
