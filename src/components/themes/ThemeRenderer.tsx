import { getThemePreset } from "@/components/themes/theme-presets";
"use client";

import React, { useState, useEffect } from "react";
import { ClinicWebsiteData, PageSection } from "./theme-types";
import { motion } from "framer-motion";
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Award,
  ArrowRight,
  ExternalLink,
  X,
  Stethoscope,
  Building2,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Activity,
  Smile,
  Baby,
  Eye,
  Pill,
  Syringe,
  Cross,
  Dna,
  Microscope,
  Thermometer,
  FlaskConical,
  Bandage,
  Ambulance,
  Bed,
  User,
  Check,
  Star,
  Layers,
  Palette,
  Leaf,
  Flame,
  Glasses,
  Heart,
  Brain,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ICON_MAP: Record<string, any> = {
  stethoscope: Stethoscope,
  heart: HeartPulse,
  activity: Activity,
  smile: Smile,
  baby: Baby,
  eye: Eye,
  pill: Pill,
  shield: ShieldCheck,
  sparkles: Sparkles,
  syringe: Syringe,
  cross: Cross,
  dna: Dna,
  microscope: Microscope,
  thermometer: Thermometer,
  flask: FlaskConical,
  bandage: Bandage,
  ambulance: Ambulance,
  bed: Bed,
  user: User,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  leaf: Leaf,
  glasses: Glasses,
  brain: Brain,
  crown: Crown,
};

const RADIUS_CLASSES: Record<string, string> = {
  "full": "rounded-full",
  "2xl": "rounded-2xl",
  "xl": "rounded-xl",
  "lg": "rounded-lg",
  "md": "rounded-md",
  "none": "rounded-none",
};

export function ThemeRenderer({
  data,
  previewMode = false,
  composerMode = false,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onDeleteSection,
}: {
  data: ClinicWebsiteData;
  previewMode?: boolean;
  composerMode?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: "up" | "down") => void;
  onDeleteSection?: (sectionId: string) => void;
}) {
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Hero Slider State
  const [activeSlide, setActiveSlide] = useState(0);

  const themeId = data.themeId || "apex-clinical";
  const primaryColor = data.primaryColor || "#2563EB";
  const secondaryColor = data.secondaryColor || "#0F172A";
  const accentColor = data.accentColor || "#10B981";
  const buttonRadiusClass = RADIUS_CLASSES[data.buttonRadius || "2xl"] || "rounded-2xl";

  const phone = data.contactPhone || data.doctor?.phone || "";
  const waPhone = (data.whatsappNumber || data.contactPhone || data.doctor?.phone || "").replace(/\D/g, "");
  const cleanWaNumber = waPhone.length === 10 ? "91" + waPhone : waPhone;

  const clinicAddressText = data.clinicAddress || data.doctor?.address || "Safdarjung Enclave, New Delhi, India";

  const preset = getThemePreset(themeId);
  const services: Array<{ name: string; description: string; duration?: number | string; price?: number; icon?: string; image?: string }> = data.customServices && data.customServices.length > 0
    ? data.customServices
    : preset.services;

  const faqs = data.customFaqs && data.customFaqs.length > 0
    ? data.customFaqs
    : preset.faqs;

  const reviews = data.reviews && data.reviews.length > 0
    ? data.reviews
    : [
        { reviewerName: "Priya M.", rating: 5, comment: "Exceptional doctor. Thorough diagnosis and very caring staff.", reviewDate: "2 weeks ago" },
        { reviewerName: "Amit K.", rating: 5, comment: "Best clinical experience. No waiting time and modern equipment.", reviewDate: "1 month ago" },
      ];

  // Hero Slider Images
  const sliderImages = data.heroSliderImages && data.heroSliderImages.length > 0
    ? data.heroSliderImages
    : data.heroImage
    ? [data.heroImage]
    : [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
      ];

  // Gallery Images (100% dynamic)
  const galleryList = (data.galleryImages && data.galleryImages.length > 0)
    ? data.galleryImages
    : [
        { url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80", caption: "Consultation Suite" },
        { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80", caption: "Clinical Care Room" },
        { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80", caption: "Reception Lounge" },
      ];

  // Auto rotate slider
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Dynamic Sections Sequence
  const activeSections: PageSection[] = data.sections && data.sections.length > 0
    ? data.sections.filter((s) => s.isVisible !== false)
    : [
        { id: "sec_hero", type: "HERO" },
        { id: "sec_stats", type: "STATS_RIBBON" as const },
        ...(data.showServices !== false ? [{ id: "sec_services", type: "SERVICES" as const }] : []),
        ...(data.showReviews !== false ? [{ id: "sec_reviews", type: "REVIEWS" as const }] : []),
        ...(data.showDoctorBio !== false ? [{ id: "sec_bio", type: "DOCTOR_BIO" as const }] : []),
        { id: "sec_cta", type: "CTA_BANNER" as const, title: "Ready to Consult with Our Specialist?", subtitle: "Book your appointment online or chat directly with our clinic on WhatsApp." },
        ...(data.showFaq !== false ? [{ id: "sec_faq", type: "FAQ" as const }] : []),
        ...(data.showMap !== false ? [{ id: "sec_map", type: "MAP_HOURS" as const }] : []),
      ];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    if (data.ctaButtonAction === "WHATSAPP" && cleanWaNumber) {
      const msg = encodeURIComponent(
        `Hello ${data.siteTitle},\n\nI would like to book an appointment.\nName: ${patientName}\nPhone: ${patientPhone}\nService: ${selectedService || "General Consultation"}\nDate: ${preferredDate || "Earliest Available"}`
      );
      window.open(`https://wa.me/${cleanWaNumber}?text=${msg}`, "_blank");
    }

    setBookingSuccess(true);
  };

  const handleCtaClick = (action?: string, link?: string | null) => {
    if (action === "CUSTOM_URL" && link) {
      window.open(link, "_blank");
    } else if (action === "WHATSAPP" && cleanWaNumber) {
      window.open(`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent("Hello, I would like to book an appointment.")}`, "_blank");
    } else if (action === "PHONE" && phone) {
      window.location.href = `tel:${phone}`;
    } else {
      setOpenBookingModal(true);
    }
  };

  // Section Container Wrapper with Elementor Non-Continuous (Dashed) Border & Floating Handle
  const renderSectionContainer = (section: PageSection, children: React.ReactNode, index: number) => {
    if (!composerMode) return <React.Fragment key={section.id}>{children}</React.Fragment>;

    const isSelected = selectedSectionId === section.id;

    return (
      <div
        id={section.id}
        key={section.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSection?.(section.id);
        }}
        className={`relative group transition-all duration-200 ${
          isSelected
            ? "border-2 border-dashed border-blue-600 bg-blue-50/5 ring-4 ring-blue-500/10 z-20"
            : "hover:border-2 hover:border-dashed hover:border-blue-400"
        }`}
      >
        {/* Elementor Floating Control Handle */}
        <div className={`absolute top-2 right-4 z-30 flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-1 rounded-t-lg shadow-xl text-xs transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider px-1 text-white">
            {section.type.replace("_", " ")}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection?.(section.id);
            }}
            className="p-1 hover:bg-blue-700 rounded text-white"
            title="Edit in Elementor Panel"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveSection?.(section.id, "up");
              }}
              className="p-1 hover:bg-blue-700 rounded text-white"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {index < activeSections.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveSection?.(section.id, "down");
              }}
              className="p-1 hover:bg-blue-700 rounded text-white"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {activeSections.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection?.(section.id);
              }}
              className="p-1 hover:bg-rose-600 rounded text-white"
              title="Delete Section"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {children}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-blue-500 selection:text-white ${
        data.fontHeading === "Playfair Display" ? "font-serif" : "font-sans"
      } ${
        themeId === "endometabolic-care" || themeId === "kinetic-physio" || themeId === "gastrosurg-advanced"
          ? "bg-[#F0FDFA]"
          : themeId === "uropulse-advanced" || themeId === "acculab-diagnostics"
          ? "bg-[#F0F9FF]"
          : themeId === "nutrilife-dietetics"
          ? "bg-[#F0FDF4]"
          : themeId === "sculpt-aesthetics"
          ? "bg-[#FAFAFA]"
          : themeId === "blossom-gynae"
          ? "bg-[#FFF5F7]"
          : themeId === "serene-glow"
          ? "bg-[#FAF8F5]"
          : themeId === "ayurveda-earth"
          ? "bg-[#FDFBF7]"
          : themeId === "ophthalmology-vision"
          ? "bg-[#F0F9FF]"
          : themeId === "executive-private"
          ? "bg-[#0A0A0A] text-slate-100"
          : "bg-white"
      }`}
      style={{ color: themeId === "executive-private" ? "#F8FAFC" : secondaryColor }}
    >
      {/* ── TOP ANNOUNCEMENT BAR (Strictly Conditional) ── */}
      {data.showAnnouncementBar === true && data.announcementBar && data.announcementBar.trim().length > 0 ? (
        <div
          className="text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 text-white shadow-2xs"
          style={{ backgroundColor: secondaryColor }}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-300" />
          <span>{data.announcementBar}</span>
        </div>
      ) : null}

      {/* ── CLINIC NAVIGATION HEADER (Logo or Monogram Name Isolation) ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-2xs ${
        themeId === "executive-private"
          ? "bg-black/90 border-amber-900/30 text-white"
          : "bg-white/95 border-slate-100"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="" className="h-12 max-w-[200px] object-contain" />
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 ${buttonRadiusClass} text-white flex items-center justify-center font-black text-lg shadow-md shrink-0`}
                  style={{ backgroundColor: primaryColor }}
                >
                  {data.siteTitle?.charAt(0) || "C"}
                </div>
                <div>
                  <h1 className={`text-base sm:text-lg font-black tracking-tight leading-none ${themeId === "executive-private" ? "text-white" : "text-slate-900"}`}>
                    {data.siteTitle}
                  </h1>
                  {data.tagline && data.tagline.trim().length > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 max-w-xs truncate">
                      {data.tagline}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <nav className={`hidden md:flex items-center gap-6 text-xs font-bold ${themeId === "executive-private" ? "text-slate-300" : "text-slate-600"}`}>
            {data.showServices && <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>}
            {data.showReviews && <a href="#reviews" className="hover:text-blue-600 transition-colors">Reviews</a>}
            {data.showDoctorBio && <a href="#about" className="hover:text-blue-600 transition-colors">About Doctor</a>}
            {data.showFaq && <a href="#faq" className="hover:text-blue-600 transition-colors">FAQs</a>}
            {data.showMap && <a href="#contact" className="hover:text-blue-600 transition-colors">Location &amp; Timings</a>}
            {data.navLinks && data.navLinks.map((nl, idx) => (
              <a
                key={idx}
                href={nl.href}
                target={nl.isExternal ? "_blank" : undefined}
                rel={nl.isExternal ? "noreferrer" : undefined}
                className="hover:text-blue-600 transition-colors"
              >
                {nl.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 ${buttonRadiusClass} border transition-all ${
                  themeId === "executive-private" ? "border-slate-800 text-slate-200 hover:bg-slate-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Clinic</span>
              </a>
            )}

            <button
              onClick={() => handleCtaClick(data.ctaButtonAction, data.primaryCtaLink)}
              className={`text-white text-xs font-bold px-4 py-2.5 ${buttonRadiusClass} shadow-md transition-all flex items-center gap-1.5`}
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{data.ctaButtonText || "Book Appointment"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── DYNAMIC SECTIONS RENDERER ── */}
      {activeSections.map((section, index) => {
        const d = section.design || {};
        const customBg = section.bgColor || d.bgColor;
        const paddingClass = d.paddingSize === "compact" ? "py-12" : d.paddingSize === "spacious" ? "py-28" : "py-20";

        // 1. HERO SECTION (100% Dynamic - Zero Hardcoded Badges)
        if (section.type === "HERO") {
          const heroHeadline = section.title !== undefined ? section.title : data.heroHeading;
          const heroSub = section.subtitle !== undefined ? section.subtitle : data.heroSubheading;
          const isFullWidthTheme = themeId === "apex-clinical" || themeId === "executive-private" || themeId === "ophthalmology-vision";

          // HERO VARIANT 1: FULL-WIDTH LUXURY AMBIENT SLIDER
          if (isFullWidthTheme) {
            const rawOpacity = d.imageOpacity !== undefined ? d.imageOpacity : 85;
            const heroOpacity = Math.max(0.1, Math.min(1, rawOpacity / 100));
            const heroPos = d.imagePosition || "center";
            const posClass = heroPos === "top" ? "object-top" : heroPos === "bottom" ? "object-bottom" : heroPos === "left" ? "object-left" : heroPos === "right" ? "object-right" : "object-center";
            const heroHeightClass = d.heroHeight === "compact" ? "min-h-[440px]" : d.heroHeight === "tall" ? "min-h-[700px]" : d.heroHeight === "fullscreen" ? "min-h-screen" : "min-h-[580px]";
            const overlayClass = d.overlayDarkness === "none" ? "bg-black/10" : d.overlayDarkness === "subtle" ? "bg-black/30" : d.overlayDarkness === "dark" ? "bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" : "bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent";

            return renderSectionContainer(
              section,
              <section className={`relative ${heroHeightClass} flex items-center justify-center text-center text-white overflow-hidden ${
                themeId === "ophthalmology-vision" ? "bg-sky-950" : "bg-slate-950"
              } ${paddingClass} px-4`}>
                <div className="absolute inset-0 z-0">
                  {sliderImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      style={{ opacity: activeSlide === i ? heroOpacity : 0 }}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        activeSlide === i ? "scale-100" : "scale-105"
                      }`}
                    >
                      <img src={imgUrl} alt="" className={`w-full h-full object-cover ${posClass}`} />
                    </div>
                  ))}
                  <div className={`absolute inset-0 ${overlayClass}`} />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                  {/* ZERO HARDCODING: Render badge ONLY if user entered badgeText */}
                  {section.badgeText && section.badgeText.trim().length > 0 ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
                      <span>{section.badgeText}</span>
                    </div>
                  ) : null}

                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                    {heroHeadline}
                  </h2>

                  {heroSub && heroSub.trim().length > 0 && (
                    <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                      {heroSub}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => handleCtaClick(section.ctaAction || data.ctaButtonAction, data.primaryCtaLink)}
                      className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-8 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{section.ctaText || data.ctaButtonText || "Book Appointment"}</span>
                    </button>

                    <button
                      onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                      className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{data.secondaryCtaText || "WhatsApp Chat"}</span>
                    </button>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // HERO VARIANT 2: ASYMMETRIC / SPLIT
          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`relative overflow-hidden pt-12 pb-20 border-b border-slate-100 ${
                !customBg
                  ? themeId === "serene-glow"
                    ? "bg-[#FAF8F5]"
                    : themeId === "ayurveda-earth"
                    ? "bg-[#FDFBF7]"
                    : themeId === "warm-pediatrics"
                    ? "bg-emerald-50/40"
                    : themeId === "minimal-luxe"
                    ? "bg-cyan-50/30"
                    : themeId === "cardiocare-executive"
                    ? "bg-rose-50/30"
                    : themeId === "neuropsych-horizon"
                    ? "bg-purple-50/30"
                    : "bg-slate-50/60"
                  : ""
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    {/* ZERO HARDCODING: Render badge ONLY if user entered badgeText */}
                    {section.badgeText && section.badgeText.trim().length > 0 ? (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                        <span>{section.badgeText}</span>
                      </div>
                    ) : null}

                    <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${
                      themeId === "executive-private" ? "text-white" : "text-slate-900"
                    } ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}>
                      {heroHeadline}
                    </h2>

                    {heroSub && heroSub.trim().length > 0 && (
                      <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        {heroSub}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                      <button
                        onClick={() => handleCtaClick(section.ctaAction || data.ctaButtonAction, data.primaryCtaLink)}
                        className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{section.ctaText || data.ctaButtonText || "Book Appointment"}</span>
                      </button>

                      <button
                        onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                        className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-6 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{data.secondaryCtaText || "WhatsApp Chat"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    {data.showHeroBookingForm ? (
                      <div className={`bg-white ${buttonRadiusClass} p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5`}>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                            Instant Booking
                          </span>
                          <h3 className="text-xl font-bold text-slate-900">Schedule Consultation</h3>
                          <p className="text-xs text-slate-500">Fast confirmation directly to your phone.</p>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                          <Input
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Patient Full Name *"
                            required
                            className={`h-11 ${buttonRadiusClass} text-xs`}
                          />
                          <Input
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="Mobile / WhatsApp Number *"
                            required
                            className={`h-11 ${buttonRadiusClass} text-xs`}
                          />
                          <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className={`w-full h-11 px-3 ${buttonRadiusClass} border border-slate-200 text-xs font-medium bg-white`}
                          >
                            <option value="">Select Treatment / Consultation</option>
                            {services.map((s, idx) => (
                              <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className={`w-full text-white font-bold text-xs h-11 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-1.5`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Confirm Appointment</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className={`${buttonRadiusClass} overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] bg-slate-100 relative group`}>
                        {sliderImages.map((imgUrl, i) => (
                          <div
                            key={i}
                            className={`absolute inset-0 transition-opacity duration-700 ${
                              activeSlide === i ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-98"
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}

                        {sliderImages.length > 1 && (
                          <div className="absolute inset-0 z-20 flex items-center justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
                              }}
                              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-800 flex items-center justify-center pointer-events-auto hover:bg-white"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSlide((prev) => (prev + 1) % sliderImages.length);
                              }}
                              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-800 flex items-center justify-center pointer-events-auto hover:bg-white"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>,
            index
          );
        }

        // 1.5. STATS & TRUST METRICS RIBBON (Theme 1-20: All Distinct Bespoke Layout Themes)
        if (section.type === "STATS_RIBBON") {
          const statsList = section.stats && section.stats.length > 0
            ? section.stats
            : preset.stats;

          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`py-8 border-y border-slate-100 ${
                !customBg
                  ? themeId === "apex-clinical"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-900"
                  : ""
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {statsList.map((st, sIdx) => {
                    const StIcon = (st.icon && ICON_MAP[st.icon.toLowerCase()]) || ShieldCheck;
                    return (
                      <div key={sIdx} className="flex items-center gap-3.5 p-3 rounded-xl">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <StIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-black tracking-tight leading-none">{st.value}</p>
                          <p className={`text-xs font-semibold mt-1 ${themeId === "apex-clinical" ? "text-slate-300" : "text-slate-500"}`}>{st.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 1.8. HEALTH PACKAGES & PRICING WIDGET (AccuLab & Global)
        if (section.type === "PACKAGES") {
          const pkgList = section.packages && section.packages.length > 0
            ? section.packages
            : [
                {
                  name: "Executive Full Body Wellness",
                  parameterCount: "85+ Tests Included",
                  originalPrice: 3999,
                  price: 1499,
                  discount: "62% OFF",
                  fasting: "10-12 Hrs Fasting",
                  reportTime: "Same-Day in 6-12 Hrs",
                  popular: true,
                  features: ["Complete Hemogram (CBC 24 Params)", "Lipid Profile & Heart Risk (Total, HDL, LDL, Triglycerides)", "Liver Function Test (LFT 11 Params)", "Kidney Function Test (KFT with eGFR)", "Thyroid Profile (TSH)", "HbA1c & Fasting Blood Glucose", "Vitamin D3 & Vitamin B12"],
                },
                {
                  name: "Heart & Diabetes Advanced Care",
                  parameterCount: "62+ Tests Included",
                  originalPrice: 2999,
                  price: 1199,
                  discount: "60% OFF",
                  fasting: "10-12 Hrs Fasting",
                  reportTime: "Digital Report in 8 Hrs",
                  popular: false,
                  features: ["Fasting Blood Sugar & HbA1c Average", "High-Sensitivity CRP (hs-CRP)", "Complete Lipid Profile (HDL/LDL/VLDL)", "Serum Creatinine & Urea", "Urine Microalbuminuria Screen"],
                },
                {
                  name: "Senior Citizen Comprehensive Care",
                  parameterCount: "92+ Tests Included",
                  originalPrice: 4999,
                  price: 1999,
                  discount: "60% OFF",
                  fasting: "10-12 Hrs Fasting",
                  reportTime: "Same-Day in 12 Hrs",
                  popular: false,
                  features: ["Full Organ Profile (Liver, Kidney, Heart)", "Bone Mineral Profile (Calcium & Phosphorus)", "Arthritis Screen (Uric Acid & RA Factor)", "Electrolyte Panel (Sodium & Potassium)", "Complete Urine Routine & Microscopy"],
                },
              ];

          return renderSectionContainer(
            section,
            <section
              id="packages"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-slate-50/70" : ""}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                    NABL Accredited Preventive Profiles
                  </span>
                  <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                    data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                  }`}>
                    {section.title || "Health Packages & Diagnostic Profiles"}
                  </h3>
                  {section.subtitle && (
                    <p className="text-sm text-slate-500">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                  {pkgList.map((pkg, idx) => (
                    <div
                      key={idx}
                      className={`${buttonRadiusClass} p-7 flex flex-col justify-between transition-all duration-200 relative ${
                        pkg.popular
                          ? "bg-white border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-500/10 scale-102"
                          : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                          Most Popular / Best Value
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {pkg.parameterCount || "Comprehensive Profile"}
                          </span>
                          {pkg.discount && (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {pkg.discount}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-snug">{pkg.name}</h4>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-slate-900">₹{pkg.price || 1499}</span>
                            {pkg.originalPrice && (
                              <span className="text-sm text-slate-400 line-through font-semibold">₹{pkg.originalPrice}</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 py-2 border-y border-slate-100">
                          {pkg.fasting && (
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>{pkg.fasting}</span>
                            </div>
                          )}
                          {pkg.reportTime && (
                            <div className="flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{pkg.reportTime}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Key Tests Included:</p>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {(pkg.features && pkg.features.length > 0 ? pkg.features : ["Complete Blood Count (CBC)", "Lipid Profile", "Liver Function Test", "Kidney Function Test", "Blood Sugar"]).map((f, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span className="text-xs">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 mt-6">
                        <button
                          onClick={() => {
                            setSelectedService(pkg.name);
                            setOpenBookingModal(true);
                          }}
                          className={`w-full font-bold text-xs h-11 ${buttonRadiusClass} shadow-md flex items-center justify-center gap-1.5 transition-all ${
                            pkg.popular
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                              : "bg-slate-900 hover:bg-black text-white"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book Home Collection</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 2. SERVICES SECTION
        if (section.type === "SERVICES") {
          return renderSectionContainer(
            section,
            <section
              id="services"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${
                !customBg
                  ? themeId === "executive-private"
                    ? "bg-neutral-950 text-white"
                    : themeId === "ophthalmology-vision"
                    ? "bg-sky-50/50"
                    : "bg-white"
                  : ""
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h3 className={`text-3xl font-black tracking-tight ${
                    themeId === "executive-private" ? "text-amber-100" : "text-slate-900"
                  } ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}>
                    {section.title || "Clinical Services & Procedures"}
                  </h3>
                  {section.subtitle && section.subtitle.trim().length > 0 && (
                    <p className="text-sm text-slate-500">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((svc, idx) => {
                    const IconComponent = (svc.icon && ICON_MAP[svc.icon.toLowerCase()]) || Stethoscope;
                    return (
                      <div
                        key={idx}
                        style={d.cardBg ? { backgroundColor: d.cardBg } : undefined}
                        className={`p-6 ${buttonRadiusClass} border hover:shadow-lg transition-all space-y-4 flex flex-col justify-between ${
                          themeId === "executive-private"
                            ? "bg-neutral-900 border-amber-900/40 text-slate-200"
                            : !d.cardBg
                            ? "bg-slate-50/70 border-slate-200/80 hover:border-blue-300"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {svc.image ? (
                              <div className={`w-12 h-12 ${buttonRadiusClass} overflow-hidden bg-slate-100 border border-slate-200 shrink-0`}>
                                <img src={svc.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div
                                className={`w-11 h-11 ${buttonRadiusClass} flex items-center justify-center text-white font-bold shadow-xs shrink-0`}
                                style={{ backgroundColor: primaryColor }}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <h4 className={`text-base font-bold leading-snug ${themeId === "executive-private" ? "text-amber-100" : "text-slate-900"}`}>{svc.name}</h4>
                              {svc.duration && (
                                <p className="text-[11px] text-slate-400 font-medium">{svc.duration} mins</p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                        </div>

                        {(data.showPrices !== false && svc.price) || data.showServiceButtons ? (
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
                            {data.showPrices !== false && svc.price ? (
                              <span className="font-bold text-slate-900">₹{svc.price}</span>
                            ) : (
                              <span />
                            )}
                            {data.showServiceButtons && (
                              <button
                                onClick={() => {
                                  setSelectedService(svc.name);
                                  setOpenBookingModal(true);
                                }}
                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                              >
                                <span>Consult</span> <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 3. REVIEWS SECTION
        if (section.type === "REVIEWS") {
          return renderSectionContainer(
            section,
            <section
              id="reviews"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-slate-50" : ""}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                    data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                  }`}>
                    {section.title || "Verified Patient Feedback"}
                  </h3>
                  {section.subtitle && section.subtitle.trim().length > 0 && (
                    <p className="text-sm text-slate-500">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className={`p-6 ${buttonRadiusClass} bg-white border border-slate-200 shadow-2xs space-y-4`}>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold tracking-wider">
                          {"★".repeat(rev.rating || 5)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified Patient
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &ldquo;{rev.comment || "Extremely satisfied with the treatment and compassionate approach of the doctor."}&rdquo;
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                        <span className="font-bold text-slate-900">{rev.reviewerName}</span>
                        <span className="text-slate-400 text-[11px]">{String(rev.reviewDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 4. DOCTOR BIO SECTION (100% Customizable Inner Card & Text)
        if (section.type === "DOCTOR_BIO") {
          const doctorName = data.doctor?.name || "Consultant Doctor";
          const doctorSpecialty = data.doctor?.specialty || "Medical Specialist";
          const doctorDegrees = data.doctor?.degrees || "";
          const bioContent = section.content || data.customBio || `${doctorName} is dedicated to providing compassionate, evidence-based healthcare. Combining clinical expertise with modern medical standards, ${doctorName} ensures optimal patient outcomes.`;

          // Inner Card Material Style from Design Config
          const cardBgStyle = d.cardBg === "#FFFFFF"
            ? "bg-white text-slate-900 border border-slate-200 shadow-xl"
            : d.cardBg === "#FAF8F5"
            ? "bg-[#FAF8F5] text-slate-900 border border-amber-200/80 shadow-xl"
            : d.cardBg === "#F8FAFC"
            ? "bg-slate-50 text-slate-900 border border-slate-200 shadow-xl"
            : d.cardBg === "primary"
            ? "text-white shadow-2xl"
            : "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl";

          const isLightCard = d.cardBg === "#FFFFFF" || d.cardBg === "#FAF8F5" || d.cardBg === "#F8FAFC";

          return renderSectionContainer(
            section,
            <section
              id="about"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  style={d.cardBg && d.cardBg !== "primary" && !d.cardBg.startsWith("#") ? undefined : d.cardBg === "primary" ? { backgroundColor: primaryColor } : undefined}
                  className={`${cardBgStyle} ${buttonRadiusClass} p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center`}
                >
                  <div className="md:col-span-4 text-center">
                    <div className={`w-32 h-32 ${buttonRadiusClass} mx-auto overflow-hidden flex items-center justify-center shadow-lg ${
                      isLightCard ? "bg-slate-100 border-2 border-slate-200" : "bg-slate-800 border-2 border-slate-700"
                    }`}>
                      {data.doctor?.image ? (
                        <img src={data.doctor.image} alt={doctorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-4xl font-black ${isLightCard ? "text-slate-700" : "text-slate-300"}`}>{doctorName.charAt(0) || "D"}</span>
                      )}
                    </div>
                    <h4 className={`text-lg font-bold mt-4 ${isLightCard ? "text-slate-900" : "text-white"}`}>{doctorName}</h4>
                    <p className={`text-xs ${isLightCard ? "text-slate-500" : "text-slate-400"}`}>{doctorSpecialty}</p>
                    {doctorDegrees && (
                      <p className={`text-[11px] font-medium mt-0.5 ${isLightCard ? "text-blue-600" : "text-blue-400"}`}>{doctorDegrees}</p>
                    )}
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <h3 className={`text-2xl font-black tracking-tight ${isLightCard ? "text-slate-900" : "text-white"}`}>
                      {section.title || "Clinical Philosophy & Background"}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isLightCard ? "text-slate-600" : "text-slate-300"}`}>
                      {bioContent}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => setOpenBookingModal(true)}
                        className={`font-bold text-xs h-10 px-5 ${buttonRadiusClass} shadow-lg transition-transform hover:scale-105 ${
                          isLightCard
                            ? "bg-slate-900 text-white hover:bg-black"
                            : "bg-white text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        Consult Doctor Today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>,
            index
          );
        }

        // 5. CTA CONVERSION BANNER
        if (section.type === "CTA_BANNER") {
          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : { backgroundColor: primaryColor }}
              className="py-16 text-white text-center relative overflow-hidden"
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {section.title || "Ready to Book Your Consultation?"}
                </h3>
                {section.subtitle && section.subtitle.trim().length > 0 && (
                  <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
                    {section.subtitle}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL", data.primaryCtaLink)}
                    className={`w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-11 px-7 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{section.ctaText || "Book Appointment Now"}</span>
                  </button>
                  <button
                    onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                    className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{data.secondaryCtaText || "Chat on WhatsApp"}</span>
                  </button>
                </div>
              </div>
            </section>,
            index
          );
        }

        // 6. GALLERY WIDGET
        if (section.type === "GALLERY") {
          return renderSectionContainer(
            section,
            <section
              id="gallery"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                    data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                  }`}>
                    {section.title || "Our Modern Clinical Facilities"}
                  </h3>
                  {section.subtitle && section.subtitle.trim().length > 0 && (
                    <p className="text-sm text-slate-500">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleryList.map((item, i) => (
                    <div key={i} className={`${buttonRadiusClass} overflow-hidden border border-slate-200 shadow-sm aspect-[4/3] bg-slate-100 relative group`}>
                      <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {item.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-xs font-bold">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 7. FAQ ACCORDION
        if (section.type === "FAQ") {
          return renderSectionContainer(
            section,
            <section
              id="faq"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-slate-50" : ""}`}
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-2">
                  <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                    data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                  }`}>
                    {section.title || "Frequently Asked Questions"}
                  </h3>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`bg-white ${buttonRadiusClass} border border-slate-200 shadow-2xs overflow-hidden`}
                    >
                      <button
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-600"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`}
                        />
                      </button>
                      {activeFaq === idx && (
                        <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>,
            index
          );
        }

        // 8. MAP & HOURS SECTION
        if (section.type === "MAP_HOURS") {
          const mapQuery = encodeURIComponent(clinicAddressText);
          const mapSrc = data.mapEmbedUrl || `https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

          return renderSectionContainer(
            section,
            <section
              id="contact"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-2">
                      <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                        data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                      }`}>
                        {section.title || "Clinic Location & Hours"}
                      </h3>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className={`flex items-start gap-3 p-4 ${buttonRadiusClass} bg-slate-50 border border-slate-200`}>
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Clinic Address</p>
                          <p className="text-slate-600 mt-0.5">{clinicAddressText}</p>
                        </div>
                      </div>

                      <div className={`flex items-start gap-3 p-4 ${buttonRadiusClass} bg-slate-50 border border-slate-200`}>
                        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Consultation Timings</p>
                          <p className="text-slate-600 mt-0.5">
                            Mon–Sat: {data.doctor?.workingHoursStart || "09:00 AM"} – {data.doctor?.workingHoursEnd || "08:00 PM"}
                          </p>
                          <p className="text-[11px] text-amber-600 font-semibold mt-1">Sunday: Emergency / By Prior Appointment</p>
                        </div>
                      </div>

                      {phone && (
                        <div className={`flex items-start gap-3 p-4 ${buttonRadiusClass} bg-slate-50 border border-slate-200`}>
                          <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900">Direct Telephone</p>
                            <p className="text-slate-600 mt-0.5">{phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className={`${buttonRadiusClass} overflow-hidden border border-slate-200 shadow-xl aspect-[16/10] bg-slate-100 relative`}>
                      <iframe
                        title="Clinic Map"
                        src={mapSrc}
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>,
            index
          );
        }

        // 9. CUSTOM TEXT BLOCK
        if (section.type === "CUSTOM_TEXT") {
          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`py-16 border-b border-slate-100 ${!customBg ? "bg-slate-50" : ""}`}
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
                <h3 className="text-2xl font-bold text-slate-900">{section.title || "Custom Story & Information"}</h3>
                {section.content && section.content.trim().length > 0 && (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">{section.content}</p>
                )}
              </div>
            </section>,
            index
          );
        }

        return null;
      })}

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="" className="h-8 max-w-[140px] object-contain rounded" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {data.siteTitle?.charAt(0) || "C"}
                </div>
                <span className="font-bold text-white">{data.siteTitle}</span>
              </div>
            )}
          </div>
          <p>© {new Date().getFullYear()} {data.siteTitle}. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Powered by Gyrex Healthcare Engine
          </p>
        </div>
      </footer>

      {/* ── MOBILE STICKY ACTION BAR ── */}
      {data.showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-2.5 px-4 flex items-center justify-between gap-2 shadow-2xl">
          {phone && (
            <a
              href={`tel:${phone}`}
              className={`flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs h-10 ${buttonRadiusClass} flex items-center justify-center gap-1`}
            >
              <Phone className="w-3.5 h-3.5 text-slate-700" />
              <span>Call</span>
            </a>
          )}

          {cleanWaNumber && (
            <a
              href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent("Hello, I would like to book an appointment.")}`}
              target="_blank"
              rel="noreferrer"
              className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 ${buttonRadiusClass} flex items-center justify-center gap-1 shadow-md`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            onClick={() => handleCtaClick(data.ctaButtonAction, data.primaryCtaLink)}
            className={`flex-1 text-white font-bold text-xs h-10 ${buttonRadiusClass} flex items-center justify-center gap-1 shadow-md`}
            style={{ backgroundColor: primaryColor }}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book</span>
          </button>
        </div>
      )}

      {/* ── INSTANT APPOINTMENT BOOKING MODAL ── */}
      {openBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white ${buttonRadiusClass} max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 relative`}>
            <button
              onClick={() => setOpenBookingModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Direct Clinic Appointment
              </span>
              <h3 className="text-xl font-bold text-slate-900">Book Your Consultation</h3>
              <p className="text-xs text-slate-500">{data.siteTitle} • {data.doctor?.specialty || "Clinic"}</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient Full Name *"
                required
                className={`h-11 ${buttonRadiusClass} text-xs`}
              />
              <Input
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="WhatsApp / Phone Number *"
                required
                className={`h-11 ${buttonRadiusClass} text-xs`}
              />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`w-full h-11 px-3 ${buttonRadiusClass} border border-slate-200 text-xs font-medium bg-white`}
              >
                <option value="">Select Treatment / Consultation</option>
                {services.map((s, idx) => (
                  <option key={idx} value={s.name}>{s.name}</option>
                ))}
              </select>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className={`h-11 ${buttonRadiusClass} text-xs`}
              />

              <button
                type="submit"
                className={`w-full text-white font-bold text-xs h-11 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-1.5`}
                style={{ backgroundColor: primaryColor }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Confirm Consultation</span>
              </button>
            </form>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold text-center">
                Appointment request received! We will confirm your timing on WhatsApp shortly.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
