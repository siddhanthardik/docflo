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

  const services = data.customServices && data.customServices.length > 0
    ? data.customServices
    : [
        { name: "Comprehensive Clinical Consultation", description: "Detailed medical evaluation, diagnostic assessment, and personalized care plan." },
        { name: "Specialized Treatment & Care", description: "Targeted clinical therapy, advanced procedure, and recovery monitoring." },
      ];

  const faqs = data.customFaqs && data.customFaqs.length > 0
    ? data.customFaqs
    : [
        { question: "How do I schedule an appointment?", answer: "Click 'Book Appointment' or connect with our reception directly on WhatsApp." },
        { question: "What are the clinic consultation hours?", answer: `Mon-Sat: ${data.doctor?.workingHoursStart || "09:00 AM"} - ${data.doctor?.workingHoursEnd || "08:00 PM"}` },
      ];

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

  // Button Click Handler
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

  // Section Container Wrapper with Elementor Controls
  const renderSectionContainer = (section: PageSection, children: React.ReactNode, index: number) => {
    if (!composerMode) return <React.Fragment key={section.id}>{children}</React.Fragment>;

    const isSelected = selectedSectionId === section.id;

    return (
      <div
        key={section.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSection?.(section.id);
        }}
        className={`relative group transition-all duration-200 ${
          isSelected
            ? "ring-4 ring-blue-600 ring-offset-2 z-20"
            : "hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
        }`}
      >
        <div className="absolute top-3 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md text-white px-2 py-1 rounded-xl shadow-2xl text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 text-blue-300">
            {section.type.replace("_", " ")}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection?.(section.id);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-blue-400"
            title="Edit in Inspector"
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
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
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
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-300"
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
              className="p-1 hover:bg-rose-900 rounded-lg text-rose-400"
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
        themeId === "serene-glow"
          ? "bg-[#FAF8F5]"
          : themeId === "ayurveda-earth"
          ? "bg-[#FDFBF7]"
          : "bg-white"
      }`}
      style={{ color: secondaryColor }}
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
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
                  <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-slate-900">
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

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
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
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 ${buttonRadiusClass} text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all`}
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

      {/* ── DYNAMIC SECTIONS RENDERER WITH CANVA-GRADE CUSTOMIZATION ── */}
      {activeSections.map((section, index) => {
        // Section Design Overrides
        const d = section.design || {};
        const customBg = section.bgColor || d.bgColor;
        const paddingClass = d.paddingSize === "compact" ? "py-12" : d.paddingSize === "spacious" ? "py-28" : "py-20";

        // 1. HERO SECTION
        if (section.type === "HERO") {
          const heroHeadline = section.title !== undefined ? section.title : data.heroHeading;
          const heroSub = section.subtitle !== undefined ? section.subtitle : data.heroSubheading;
          const heroVariant = d.layoutVariant || (themeId === "apex-clinical" || themeId === "executive-private" ? "full_width" : "split");

          // HERO VARIANT: FULL WIDTH LUXURY AMBIENT SLIDER
          if (heroVariant === "full_width" || themeId === "apex-clinical" || themeId === "executive-private") {
            return renderSectionContainer(
              section,
              <section className={`relative min-h-[580px] flex items-center justify-center text-center text-white overflow-hidden bg-slate-950 ${paddingClass} px-4`}>
                <div className="absolute inset-0 z-0">
                  {sliderImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        activeSlide === i ? "opacity-40 scale-100" : "opacity-0 scale-105"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                  {section.badgeText && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
                      <span>{section.badgeText}</span>
                    </div>
                  )}

                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
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

          // HERO VARIANT: MODERN SPLIT WITH MULTI-IMAGE CAROUSEL
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
                    : "bg-slate-50/60"
                  : ""
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    {section.badgeText && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                        <span>{section.badgeText}</span>
                      </div>
                    )}

                    <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900 ${
                      data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                    }`}>
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

                        {sliderImages.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                            {sliderImages.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlide(i);
                                }}
                                className={`h-1.5 rounded-full transition-all ${activeSlide === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                              />
                            ))}
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

        // 2. SERVICES SECTION
        if (section.type === "SERVICES") {
          return renderSectionContainer(
            section,
            <section
              id="services"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <h3 className={`text-3xl font-black text-slate-900 tracking-tight ${
                    data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                  }`}>
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
                          !d.cardBg ? "bg-slate-50/70 border-slate-200/80 hover:border-blue-300" : "border-slate-200"
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
                              <h4 className="text-base font-bold text-slate-900 leading-snug">{svc.name}</h4>
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

        // 4. DOCTOR BIO SECTION
        if (section.type === "DOCTOR_BIO") {
          return renderSectionContainer(
            section,
            <section
              id="about"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${buttonRadiusClass} p-8 sm:p-12 text-white shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center`}>
                  <div className="md:col-span-4 text-center">
                    <div className={`w-32 h-32 ${buttonRadiusClass} bg-slate-800 border-2 border-slate-700 mx-auto overflow-hidden flex items-center justify-center shadow-lg`}>
                      {data.doctor?.image ? (
                        <img src={data.doctor.image} alt={data.doctor?.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-slate-300">{data.doctor?.name?.charAt(0) || "D"}</span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold mt-4">{data.doctor?.name || "Consultant Doctor"}</h4>
                    <p className="text-xs text-slate-400">{data.doctor?.specialty || "Medical Specialist"}</p>
                    {data.doctor?.degrees && (
                      <p className="text-[11px] text-blue-400 font-medium mt-0.5">{data.doctor.degrees}</p>
                    )}
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <h3 className="text-2xl font-black tracking-tight">{section.title || "Clinical Philosophy & Background"}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {section.content || data.customBio || `${data.doctor?.name || "Our lead doctor"} is committed to providing modern, patient-first clinical healthcare. Combining extensive diagnostic expertise with compassionate treatment, we ensure every patient receives customized, high-quality care.`}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => setOpenBookingModal(true)}
                        className={`bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-10 px-5 ${buttonRadiusClass} shadow-lg`}
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

        // 6. GALLERY WIDGET (100% Dynamic)
        if (section.type === "GALLERY") {
          return renderSectionContainer(
            section,
            <section
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
