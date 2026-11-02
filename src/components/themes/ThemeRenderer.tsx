"use client";

import React, { useState, useEffect } from "react";
import { getThemePreset } from "@/components/themes/theme-presets";
import { ClinicWebsiteData, PageSection, SectionType } from "./theme-types";
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
  GripVertical,
  Copy,
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

export interface EditableInlineTextProps {
  value?: string | null;
  onChange: (val: string) => void;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "blockquote";
  placeholder?: string;
  composerMode?: boolean;
  multiline?: boolean;
  style?: React.CSSProperties;
}

export function EditableInlineText({
  value,
  onChange,
  className = "",
  tag = "span",
  placeholder = "Click to type...",
  composerMode = false,
  multiline = false,
  style,
}: EditableInlineTextProps) {
  const Tag = tag;

  if (!composerMode) {
    return <Tag className={className} style={style}>{value || ""}</Tag>;
  }

  const raw = value && value.trim().length > 0 ? value : placeholder;
  const isPlaceholder = !value || value.trim().length === 0;

  const safeHtml = (raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      tabIndex={0}
      className={`${className} outline-none transition-all cursor-text rounded-xs px-1 -mx-1 hover:ring-1 hover:ring-blue-400/80 focus:ring-2 focus:ring-blue-600 focus:bg-blue-50/20 ${
        isPlaceholder ? "italic opacity-60 text-slate-400" : ""
      }`}
      style={style}
      title="Click to edit directly on canvas"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        if (isPlaceholder && e.currentTarget.innerText === placeholder) {
          e.currentTarget.innerText = "";
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.innerText?.trim() ?? "";
        if (!text && placeholder) {
          e.currentTarget.innerText = placeholder;
        }
        if (text !== (value || "")) {
          onChange(text);
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

export function ThemeRenderer({
  data,
  previewMode = false,
  composerMode = false,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onDeleteSection,
  onDuplicateSection,
  onDropNewSection,
  onReorderSection,
  onOpenInsertModal,
  onUpdateSection,
  onUpdateSiteData,
}: {
  data: ClinicWebsiteData;
  previewMode?: boolean;
  composerMode?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: "up" | "down") => void;
  onDeleteSection?: (sectionId: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onDropNewSection?: (type: SectionType, targetIndex: number) => void;
  onReorderSection?: (sourceIndex: number, destinationIndex: number) => void;
  onOpenInsertModal?: (targetIndex: number) => void;
  onUpdateSection?: (sectionId: string, patch: Partial<PageSection>) => void;
  onUpdateSiteData?: (patch: Partial<ClinicWebsiteData>) => void;
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
  const cardRadiusClass = data.buttonRadius === "none" ? "rounded-none" : "rounded-2xl sm:rounded-3xl";

  const phone = data.doctor?.phone || data.contactPhone || "";
  const waPhone = (data.doctor?.phone || data.whatsappNumber || data.contactPhone || "").replace(/\D/g, "");
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

  // Visual Drop Target / In-Between Section Inserter
  const renderDropZone = (targetIndex: number) => {
    if (!composerMode) return null;

    return (
      <div
        key={`dropzone_${targetIndex}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setAttribute("data-drag-over", "true");
        }}
        onDragLeave={(e) => {
          e.currentTarget.removeAttribute("data-drag-over");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.removeAttribute("data-drag-over");

          const newWidgetType = e.dataTransfer.getData("application/x-gyrex-widget") as SectionType;
          const reorderSourceIndex = e.dataTransfer.getData("application/x-gyrex-reorder");

          if (newWidgetType) {
            onDropNewSection?.(newWidgetType, targetIndex);
          } else if (reorderSourceIndex) {
            const srcIdx = parseInt(reorderSourceIndex, 10);
            if (!isNaN(srcIdx)) {
              onReorderSection?.(srcIdx, targetIndex);
            }
          }
        }}
        className="relative group/drop py-1.5 transition-all flex items-center justify-center cursor-pointer data-[drag-over=true]:bg-blue-100/90 data-[drag-over=true]:py-5 rounded-xl mx-4"
        onClick={() => onOpenInsertModal?.(targetIndex)}
      >
        <div className="w-full h-0.5 border-t-2 border-dashed border-transparent group-hover/drop:border-blue-400 group-data-[drag-over=true]/drop:border-blue-600 flex items-center justify-center transition-all">
          <div className="opacity-0 group-hover/drop:opacity-100 group-data-[drag-over=true]/drop:opacity-100 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-3 rounded-full shadow-lg flex items-center gap-1.5 transition-all transform group-hover/drop:scale-100 scale-90 z-30">
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Section Here</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper to ensure pills/badges only render when valid and not containing hardcoded/unsupported claims
  const isBadgeVisible = (text?: string) => {
    if (!text || !text.trim()) return false;
    const lower = text.toLowerCase();
    if (lower.includes("nabh") || lower.includes("nabl accredited")) return false;
    return true;
  };

  // Animation, Hover, and Dynamic Style Helpers for Sections
  const getAnimationProps = (section: PageSection) => {
    const d = section.design;
    if (!d || !d.animationType || d.animationType === "none") return {};

    const duration = d.animationDuration || 0.6;
    const delay = d.animationDelay || 0;

    let initial: any = { opacity: 0 };
    let animate: any = { opacity: 1 };

    switch (d.animationType) {
      case "fadeIn":
        initial = { opacity: 0 };
        animate = { opacity: 1 };
        break;
      case "fadeInUp":
        initial = { opacity: 0, y: 35 };
        animate = { opacity: 1, y: 0 };
        break;
      case "fadeInDown":
        initial = { opacity: 0, y: -35 };
        animate = { opacity: 1, y: 0 };
        break;
      case "slideInLeft":
        initial = { opacity: 0, x: -50 };
        animate = { opacity: 1, x: 0 };
        break;
      case "slideInRight":
        initial = { opacity: 0, x: 50 };
        animate = { opacity: 1, x: 0 };
        break;
      case "zoomIn":
        initial = { opacity: 0, scale: 0.92 };
        animate = { opacity: 1, scale: 1 };
        break;
      case "bounce":
        initial = { opacity: 0, scale: 0.8 };
        animate = { opacity: 1, scale: [0.8, 1.05, 1] };
        break;
    }

    return {
      initial,
      animate,
      transition: { duration, delay, ease: "easeOut" as const },
    };
  };

  const getHoverClasses = (hoverEffect?: string) => {
    switch (hoverEffect) {
      case "lift":
        return "hover:-translate-y-1.5 transition-transform duration-300";
      case "scale":
        return "hover:scale-[1.02] transition-transform duration-300";
      case "glow":
        return "hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300";
      default:
        return "";
    }
  };

  const getSectionInlineStyles = (section: PageSection) => {
    const d = section.design || {};
    const styles: React.CSSProperties = {};
    if (d.paddingTop !== undefined) styles.paddingTop = `${d.paddingTop}px`;
    if (d.paddingBottom !== undefined) styles.paddingBottom = `${d.paddingBottom}px`;
    if (d.paddingX !== undefined) {
      styles.paddingLeft = `${d.paddingX}px`;
      styles.paddingRight = `${d.paddingX}px`;
    }
    const bg = d.bgColor || section.bgColor;
    if (bg) styles.backgroundColor = bg;
    if (d.borderRadius && d.borderRadius !== "none") {
      styles.borderRadius = d.borderRadius === "full" ? "9999px" : d.borderRadius === "2xl" ? "1rem" : d.borderRadius === "xl" ? "0.75rem" : d.borderRadius === "lg" ? "0.5rem" : "0.375rem";
    }
    if (d.borderWidth !== undefined && d.borderWidth > 0) {
      styles.borderWidth = `${d.borderWidth}px`;
      styles.borderStyle = (d.borderStyle as any) || "solid";
      if (d.borderColor) styles.borderColor = d.borderColor;
    }
    if (d.boxShadow && d.boxShadow !== "none") {
      if (d.boxShadow === "sm") styles.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
      else if (d.boxShadow === "md") styles.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";
      else if (d.boxShadow === "lg") styles.boxShadow = "0 10px 15px -3px rgb(0 0 0 / 0.1)";
      else if (d.boxShadow === "xl") styles.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.1)";
      else if (d.boxShadow === "glow") styles.boxShadow = "0 0 25px -2px rgba(59, 130, 246, 0.4)";
    }
    return styles;
  };

  // Section Container Wrapper with Elementor Non-Continuous (Dashed) Border & Floating Handle
  const renderSectionContainer = (section: PageSection, children: React.ReactNode, index: number) => {
    const animProps = getAnimationProps(section);
    const hoverClass = getHoverClasses(section.design?.hoverEffect);
    const inlineStyles = getSectionInlineStyles(section);

    const animatedContent = animProps.initial ? (
      <motion.div
        key={`anim_${section.id}`}
        initial={animProps.initial}
        animate={animProps.animate}
        transition={animProps.transition}
        className={`w-full ${hoverClass}`}
        style={inlineStyles}
      >
        {children}
      </motion.div>
    ) : (
      <div className={`w-full ${hoverClass}`} style={inlineStyles}>
        {children}
      </div>
    );

    if (!composerMode) return <React.Fragment key={section.id}>{animatedContent}</React.Fragment>;

    const isSelected = selectedSectionId === section.id;

    return (
      <React.Fragment key={section.id}>
        {index === 0 && renderDropZone(0)}
        <div
          id={section.id}
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
            {/* 6-dot Drag Grip Handle */}
            <div
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("application/x-gyrex-reorder", index.toString());
              }}
              className="p-1 hover:bg-blue-700 rounded cursor-grab active:cursor-grabbing text-white"
              title="Drag to Reorder Section"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

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

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateSection?.(section.id);
              }}
              className="p-1 hover:bg-blue-700 rounded text-white"
              title="Duplicate Section"
            >
              <Copy className="w-3.5 h-3.5" />
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

          {animatedContent}
        </div>
        {renderDropZone(index + 1)}
      </React.Fragment>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative selection:bg-blue-500 selection:text-white ${
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
      {composerMode && activeSections.length === 0 && renderDropZone(0)}
      {activeSections.map((section, index) => {
        const d = section.design || {};
        const customBg = section.bgColor || d.bgColor;
        const paddingClass = d.paddingSize === "compact" ? "py-12" : d.paddingSize === "spacious" ? "py-28" : "py-20";

        // 1. HERO SECTION (100% Dynamic - Zero Hardcoded Badges)
        if (section.type === "HERO") {
          const heroHeadline = section.title !== undefined ? section.title : data.heroHeading;
          const heroSub = section.subtitle !== undefined ? section.subtitle : data.heroSubheading;
          const isFullWidthTheme = themeId === "apex-clinical" || themeId === "executive-private" || themeId === "ophthalmology-vision";
          // Allow explicit heroStyle to override theme defaults: SPLIT, FULL_WIDTH, BENTO, MINIMAL, REVERSED_SPLIT
          const heroVariant = section.heroStyle || (isFullWidthTheme ? "FULL_WIDTH" : "SPLIT");

          // HERO VARIANT: FULL_WIDTH (Luxury Ambient Slider / Background Photo)
          if (heroVariant === "FULL_WIDTH") {
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
                  {(isBadgeVisible(section.badgeText) || composerMode) ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
                      <EditableInlineText
                        value={section.badgeText || ""}
                        onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                        placeholder="Badge text (optional)..."
                        composerMode={composerMode}
                      />
                    </div>
                  ) : null}

                  <EditableInlineText
                    value={heroHeadline || ""}
                    onChange={(val) => {
                      onUpdateSection?.(section.id, { title: val });
                      onUpdateSiteData?.({ heroHeading: val });
                    }}
                    tag="h2"
                    className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                    placeholder="Enter Hero Headline..."
                    composerMode={composerMode}
                  />

                  {((heroSub && heroSub.trim().length > 0) || composerMode) ? (
                    <EditableInlineText
                      value={heroSub || ""}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { subtitle: val });
                        onUpdateSiteData?.({ heroSubheading: val });
                      }}
                      tag="p"
                      multiline={true}
                      className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
                      placeholder="Enter Hero Subheading..."
                      composerMode={composerMode}
                    />
                  ) : null}

                  {/* ZERO HARDCODING: Dynamic Feature highlight badges */}
                  {(() => {
                    const isHighlightsVisible = section.showHighlights !== false && data.showHighlights !== false;
                    if (!isHighlightsVisible) return null;
                    const rawHighlights = section.heroHighlights !== undefined ? section.heroHighlights : data.heroHighlights;
                    if (!rawHighlights || rawHighlights.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 pb-1">
                        {rawHighlights.map((item, hIdx) => {
                          if (!item.text && !item.icon) return null;
                          return (
                            <div
                              key={hIdx}
                              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-xs text-xs font-bold"
                            >
                              {item.icon && <span className="text-base">{item.icon}</span>}
                              <span>{item.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ZERO HARDCODING: Render CTA buttons only if showHeroActions is not explicitly false */}
                  {data.showHeroActions !== false && section.showHeroActions !== false && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                      <button
                        onClick={() => handleCtaClick(section.ctaAction || data.ctaButtonAction, data.primaryCtaLink)}
                        className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-8 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-4 h-4" />
                        <EditableInlineText
                          value={section.ctaText || data.ctaButtonText || "Book Appointment"}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { ctaText: val });
                            onUpdateSiteData?.({ ctaButtonText: val });
                          }}
                          composerMode={composerMode}
                        />
                      </button>

                      <button
                        onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                        className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <EditableInlineText
                          value={data.secondaryCtaText || "WhatsApp Chat"}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { secondaryCtaText: val });
                            onUpdateSiteData?.({ secondaryCtaText: val });
                          }}
                          composerMode={composerMode}
                        />
                      </button>
                    </div>
                  )}

                  {sliderImages.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {sliderImages.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlide(dotIdx);
                          }}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            activeSlide === dotIdx ? "w-7 bg-white shadow-md" : "w-2 bg-white/40 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>,
              index
            );
          }

          // HERO VARIANT: MINIMAL (Centered Clean Typography & Badges)
          if (heroVariant === "MINIMAL") {
            const minHeightClass = d.heroHeight === "compact" ? "py-16" : d.heroHeight === "tall" ? "py-32" : d.heroHeight === "fullscreen" ? "min-h-[calc(100vh-70px)] flex flex-col justify-center py-20" : "py-24";

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`relative overflow-hidden ${minHeightClass} border-b border-slate-100 ${
                  !customBg ? "bg-white" : ""
                } text-center`}
              >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  {(isBadgeVisible(section.badgeText) || composerMode) && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                      <EditableInlineText
                        value={section.badgeText || ""}
                        onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                        placeholder="Badge text (optional)..."
                        composerMode={composerMode}
                      />
                    </div>
                  )}

                  <EditableInlineText
                    value={heroHeadline || ""}
                    onChange={(val) => {
                      onUpdateSection?.(section.id, { title: val });
                      onUpdateSiteData?.({ heroHeading: val });
                    }}
                    tag="h1"
                    className={`text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}
                    placeholder="Enter Hero Headline..."
                    composerMode={composerMode}
                  />

                  {((heroSub && heroSub.trim().length > 0) || composerMode) && (
                    <EditableInlineText
                      value={heroSub || ""}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { subtitle: val });
                        onUpdateSiteData?.({ heroSubheading: val });
                      }}
                      tag="p"
                      multiline={true}
                      className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
                      placeholder="Enter Hero Subheading..."
                      composerMode={composerMode}
                    />
                  )}

                  {/* Doctor credential quick strip if available */}
                  {data.doctor?.name && (
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">{data.doctor.name}</span>
                      {data.doctor.degrees && <span className="text-slate-400">•</span>}
                      {data.doctor.degrees && <span className="font-medium text-slate-600">{data.doctor.degrees}</span>}
                      {data.doctor.specialty && <span className="text-slate-400">•</span>}
                      {data.doctor.specialty && <span className="font-semibold text-blue-700">{data.doctor.specialty}</span>}
                    </div>
                  )}

                  {/* ZERO HARDCODING: Dynamic Feature highlight badges */}
                  {(() => {
                    const isHighlightsVisible = section.showHighlights !== false && data.showHighlights !== false;
                    if (!isHighlightsVisible) return null;
                    const rawHighlights = section.heroHighlights !== undefined ? section.heroHighlights : data.heroHighlights;
                    if (!rawHighlights || rawHighlights.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 pb-1">
                        {rawHighlights.map((item, hIdx) => {
                          if (!item.text && !item.icon) return null;
                          return (
                            <div
                              key={hIdx}
                              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-800 shadow-2xs text-xs font-bold"
                            >
                              {item.icon && <span className="text-base">{item.icon}</span>}
                              <span>{item.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {data.showHeroActions !== false && section.showHeroActions !== false && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                      <button
                        onClick={() => handleCtaClick(section.ctaAction || data.ctaButtonAction, data.primaryCtaLink)}
                        className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-8 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-4 h-4" />
                        <EditableInlineText
                          value={section.ctaText || data.ctaButtonText || "Book Appointment"}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { ctaText: val });
                            onUpdateSiteData?.({ ctaButtonText: val });
                          }}
                          composerMode={composerMode}
                        />
                      </button>

                      <button
                        onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                        className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <EditableInlineText
                          value={data.secondaryCtaText || "WhatsApp Chat"}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { secondaryCtaText: val });
                            onUpdateSiteData?.({ secondaryCtaText: val });
                          }}
                          composerMode={composerMode}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </section>,
              index
            );
          }

          // HERO VARIANT: BENTO (Headline + Direct Booking Hub + Stats)
          if (heroVariant === "BENTO") {
            const bentoHeightClass = d.heroHeight === "compact" ? "py-12" : d.heroHeight === "tall" ? "py-24" : "py-16";

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`relative overflow-hidden ${bentoHeightClass} border-b border-slate-100 ${
                  !customBg ? "bg-slate-50/80" : ""
                }`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left Bento Cell: Branding & Headlines */}
                    <div className={`lg:col-span-7 bg-white ${cardRadiusClass} p-8 sm:p-10 border border-slate-200/80 shadow-md flex flex-col justify-between space-y-6`}>
                      <div className="space-y-4">
                        {(isBadgeVisible(section.badgeText) || composerMode) && (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <EditableInlineText
                              value={section.badgeText || ""}
                              onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                              placeholder="Badge text (optional)..."
                              composerMode={composerMode}
                            />
                          </div>
                        )}
                        <EditableInlineText
                          value={heroHeadline || ""}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { title: val });
                            onUpdateSiteData?.({ heroHeading: val });
                          }}
                          tag="h1"
                          className={`text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}
                          placeholder="Enter Hero Headline..."
                          composerMode={composerMode}
                        />
                        {((heroSub && heroSub.trim().length > 0) || composerMode) && (
                          <EditableInlineText
                            value={heroSub || ""}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { subtitle: val });
                              onUpdateSiteData?.({ heroSubheading: val });
                            }}
                            tag="p"
                            multiline={true}
                            className="text-base sm:text-lg text-slate-600 leading-relaxed"
                            placeholder="Enter Hero Subheading..."
                            composerMode={composerMode}
                          />
                        )}
                      </div>

                      {/* Doctor quick badge or stats pill */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            🩺
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{data.doctor?.name || "Senior Consultant"}</p>
                            <p className="text-[11px] text-slate-500">{data.doctor?.specialty || data.tagline || "Clinical Excellence"}</p>
                          </div>
                        </div>

                        {data.showHeroActions !== false && section.showHeroActions !== false && (
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Bento Cell: Instant Booking Slot Card */}
                    <div className={`lg:col-span-5 bg-white ${cardRadiusClass} p-6 sm:p-8 border border-slate-200 shadow-xl flex flex-col justify-center space-y-4`}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                          Direct OPD Booking
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">Schedule Consultation</h3>
                        <p className="text-xs text-slate-500">Fast confirmation directly to your phone.</p>
                      </div>

                      <form onSubmit={handleBookingSubmit} className="space-y-3">
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
                          className={`w-full text-white font-bold text-xs h-11 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Confirm Appointment Slot</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // HERO VARIANT: EDITORIAL (High Authority Doctor Portrait + Magazine Layout)
          if (heroVariant === "EDITORIAL") {
            const edHeight = d.heroHeight === "compact" ? "py-12" : d.heroHeight === "tall" ? "py-28" : "py-20";
            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`relative overflow-hidden ${edHeight} border-b border-slate-100 ${!customBg ? "bg-[#FAF8F5]" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-5 relative">
                      <div className="relative mx-auto max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                        <img
                          src={section.image || data.doctor?.image || sliderImages[0] || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-5 text-white">
                          <p className="font-bold text-base">{data.doctor?.name || "Senior Consultant Specialist"}</p>
                          <p className="text-xs text-slate-300 mt-0.5">{data.doctor?.degrees || "MBBS, MD"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                      {(isBadgeVisible(section.badgeText) || composerMode) && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                          <EditableInlineText
                            value={section.badgeText || ""}
                            onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                            placeholder="Badge text (optional)..."
                            composerMode={composerMode}
                          />
                        </div>
                      )}
                      <EditableInlineText
                        value={heroHeadline || ""}
                        onChange={(val) => {
                          onUpdateSection?.(section.id, { title: val });
                          onUpdateSiteData?.({ heroHeading: val });
                        }}
                        tag="h1"
                        className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-serif italic"
                        placeholder="Enter Hero Headline..."
                        composerMode={composerMode}
                      />
                      {((heroSub && heroSub.trim().length > 0) || composerMode) && (
                        <EditableInlineText
                          value={heroSub || ""}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { subtitle: val });
                            onUpdateSiteData?.({ heroSubheading: val });
                          }}
                          tag="p"
                          multiline={true}
                          className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl"
                          placeholder="Enter Hero Subheading..."
                          composerMode={composerMode}
                        />
                      )}
                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                        <button
                          onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL")}
                          className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Calendar className="w-4 h-4" />
                          <EditableInlineText
                            value={section.ctaText || "Book Priority Consultation"}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { ctaText: val });
                              onUpdateSiteData?.({ ctaButtonText: val });
                            }}
                            composerMode={composerMode}
                          />
                        </button>
                        <button
                          onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                          className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-6 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <EditableInlineText
                            value={data.secondaryCtaText || "WhatsApp Clinic"}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { secondaryCtaText: val });
                              onUpdateSiteData?.({ secondaryCtaText: val });
                            }}
                            composerMode={composerMode}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // HERO VARIANTS: SPLIT (Half-Image Right) & REVERSED_SPLIT (Half-Image Left)
          const isReversed = heroVariant === "REVERSED_SPLIT";
          const splitHeroHeightClass =
            d.heroHeight === "compact"
              ? "min-h-[440px] py-10"
              : d.heroHeight === "tall"
              ? "min-h-[700px] py-20"
              : d.heroHeight === "fullscreen"
              ? "min-h-[calc(100vh-70px)] sm:min-h-screen py-24 flex flex-col justify-center"
              : "min-h-[580px] py-14 flex flex-col justify-center";

          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`relative overflow-hidden ${splitHeroHeightClass} border-b border-slate-100 ${
                !customBg
                  ? themeId === "serene-glow"
                    ? "bg-[#FAF8F5]"
                    : themeId === "ayurveda-earth"
                    ? "bg-[#FDFBF7]"
                    : themeId === "warm-pediatrics"
                    ? "bg-gradient-to-b from-emerald-50/80 via-amber-50/40 to-sky-50/30"
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${isReversed ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""}`}>
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    {/* ZERO HARDCODING: Render badge ONLY if valid and not hardcoded accreditation pill */}
                    {(isBadgeVisible(section.badgeText) || composerMode) ? (
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs ${
                        themeId === "warm-pediatrics"
                          ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-200/50"
                          : "bg-white border border-slate-200 text-slate-800"
                      }`}>
                        <EditableInlineText
                          value={section.badgeText || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                          placeholder="Badge text (optional)..."
                          composerMode={composerMode}
                        />
                      </div>
                    ) : null}

                    <EditableInlineText
                      value={heroHeadline || ""}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { title: val });
                        onUpdateSiteData?.({ heroHeading: val });
                      }}
                      tag="h2"
                      className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${
                        themeId === "executive-private" ? "text-white" : "text-slate-900"
                      } ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}
                      placeholder="Enter Hero Headline..."
                      composerMode={composerMode}
                    />

                    {((heroSub && heroSub.trim().length > 0) || composerMode) && (
                      <EditableInlineText
                        value={heroSub || ""}
                        onChange={(val) => {
                          onUpdateSection?.(section.id, { subtitle: val });
                          onUpdateSiteData?.({ heroSubheading: val });
                        }}
                        tag="p"
                        multiline={true}
                        className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                        placeholder="Enter Hero Subheading..."
                        composerMode={composerMode}
                      />
                    )}

                    {/* ZERO HARDCODING: Dynamic Feature highlight badges (fully editable, removable, custom icon & text) */}
                    {(() => {
                      const isHighlightsVisible = section.showHighlights !== false && data.showHighlights !== false;
                      if (!isHighlightsVisible) return null;

                      const rawHighlights = section.heroHighlights !== undefined 
                        ? section.heroHighlights 
                        : data.heroHighlights !== undefined 
                        ? data.heroHighlights 
                        : (themeId === "warm-pediatrics" ? [
                            { icon: "🧸", text: "Stress-Free Play Zone" },
                            { icon: "💉", text: "Pain-Free Vaccines" },
                            { icon: "🌡️", text: "24/7 Fever Support" },
                          ] : []);

                      if (!rawHighlights || rawHighlights.length === 0) return null;

                      const colClass = rawHighlights.length === 1
                        ? "grid-cols-1 max-w-xs"
                        : rawHighlights.length === 2
                        ? "grid-cols-2 max-w-md"
                        : rawHighlights.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-4";

                      return (
                        <div className={`grid ${colClass} gap-2 pt-1 pb-1`}>
                          {rawHighlights.map((item, hIdx) => {
                            if (!item.text && !item.icon) return null;
                            return (
                              <div
                                key={hIdx}
                                className={`bg-white/90 backdrop-blur-xs border rounded-2xl p-2.5 text-center shadow-2xs transition-all hover:scale-[1.02] ${
                                  themeId === "warm-pediatrics"
                                    ? hIdx === 0 ? "border-amber-200" : hIdx === 1 ? "border-emerald-200" : "border-sky-200"
                                    : "border-slate-200/80"
                                }`}
                              >
                                {item.icon && <span className="text-base">{item.icon}</span>}
                                <p className="text-[11px] font-black text-slate-800 leading-tight mt-0.5">{item.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {data.showHeroActions !== false && section.showHeroActions !== false && (
                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                        <button
                          onClick={() => handleCtaClick(section.ctaAction || data.ctaButtonAction, data.primaryCtaLink)}
                          className={`w-full sm:w-auto text-white text-sm font-bold h-12 px-7 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Calendar className="w-4 h-4" />
                          <EditableInlineText
                            value={section.ctaText || data.ctaButtonText || "Book Appointment"}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { ctaText: val });
                              onUpdateSiteData?.({ ctaButtonText: val });
                            }}
                            composerMode={composerMode}
                          />
                        </button>

                        <button
                          onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                          className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-6 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <EditableInlineText
                            value={data.secondaryCtaText || "WhatsApp Chat"}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { secondaryCtaText: val });
                              onUpdateSiteData?.({ secondaryCtaText: val });
                            }}
                            composerMode={composerMode}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5">
                    {(data.showHeroBookingForm || section.showHeroBookingForm) ? (
                      <div className={`bg-white ${cardRadiusClass} p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5`}>
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
                      <div className={`${cardRadiusClass} overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] bg-slate-100 relative group`}>
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
                          <>
                            <div className="absolute inset-0 z-20 flex items-center justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlide((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
                                }}
                                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-800 flex items-center justify-center pointer-events-auto hover:bg-white transition-transform hover:scale-105"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlide((prev) => (prev + 1) % sliderImages.length);
                                }}
                                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-800 flex items-center justify-center pointer-events-auto hover:bg-white transition-transform hover:scale-105"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Dots */}
                            <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
                              {sliderImages.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSlide(dotIdx);
                                  }}
                                  className={`h-1.5 rounded-full transition-all ${
                                    activeSlide === dotIdx ? "w-5 bg-white shadow-sm" : "w-1.5 bg-white/60 hover:bg-white"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
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
                          <EditableInlineText
                            value={st.value}
                            onChange={(val) => {
                              const nextStats = statsList.map((item, i) => i === sIdx ? { ...item, value: val } : item);
                              onUpdateSection?.(section.id, { stats: nextStats });
                            }}
                            tag="p"
                            className="text-xl sm:text-2xl font-black tracking-tight leading-none"
                            placeholder="Value"
                            composerMode={composerMode}
                          />
                          <EditableInlineText
                            value={st.label}
                            onChange={(val) => {
                              const nextStats = statsList.map((item, i) => i === sIdx ? { ...item, label: val } : item);
                              onUpdateSection?.(section.id, { stats: nextStats });
                            }}
                            tag="p"
                            className={`text-xs font-semibold mt-1 ${themeId === "apex-clinical" ? "text-slate-300" : "text-slate-500"}`}
                            placeholder="Label"
                            composerMode={composerMode}
                          />
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
                  {isBadgeVisible(section.badgeText) && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                      {section.badgeText}
                    </span>
                  )}
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
                      className={`${cardRadiusClass} p-7 flex flex-col justify-between transition-all duration-200 relative ${
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
                  {(isBadgeVisible(section.badgeText) || composerMode) && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block">
                      <EditableInlineText
                        value={section.badgeText || ""}
                        onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                        placeholder="Badge text (optional)..."
                        composerMode={composerMode}
                      />
                    </span>
                  )}
                  <EditableInlineText
                    value={section.title || "Clinical Services & Procedures"}
                    onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                    tag="h3"
                    className={`text-3xl font-black tracking-tight ${
                      themeId === "executive-private" ? "text-amber-100" : "text-slate-900"
                    } ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}
                    placeholder="Enter Services Title..."
                    composerMode={composerMode}
                  />
                  {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                    <EditableInlineText
                      value={section.subtitle || ""}
                      onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                      tag="p"
                      className="text-sm text-slate-500"
                      placeholder="Optional services section subtitle..."
                      composerMode={composerMode}
                    />
                  )}
                </div>

                {(() => {
                  const svcStyle = section.servicesStyle || d.servicesStyle || "GRID_3COL";
                  const handleSvcChange = (idx: number, patch: Partial<(typeof services)[number]>) => {
                    const next = services.map((s, i) => (i === idx ? { ...s, ...patch } : s));
                    onUpdateSiteData?.({ services: next });
                  };

                  // 1. 4-COLUMN COMPACT GRID
                  if (svcStyle === "GRID_4COL") {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {services.map((svc, idx) => {
                          const IconComponent = (svc.icon && ICON_MAP[svc.icon.toLowerCase()]) || Stethoscope;
                          return (
                            <div
                              key={idx}
                              style={d.cardBg ? { backgroundColor: d.cardBg } : undefined}
                              className={`p-5 ${cardRadiusClass} border hover:shadow-lg transition-all space-y-3 flex flex-col justify-between ${
                                !d.cardBg ? "bg-slate-50/70 border-slate-200/80 hover:border-blue-300" : "border-slate-200"
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div>
                                  <EditableInlineText
                                    value={svc.name}
                                    onChange={(val) => handleSvcChange(idx, { name: val })}
                                    tag="h4"
                                    className="text-sm font-bold text-slate-900 leading-snug"
                                    placeholder="Service Name"
                                    composerMode={composerMode}
                                  />
                                  {svc.duration && <p className="text-[10px] text-slate-400 mt-0.5">{svc.duration} mins</p>}
                                </div>
                                <EditableInlineText
                                  value={svc.description}
                                  onChange={(val) => handleSvcChange(idx, { description: val })}
                                  tag="p"
                                  multiline={true}
                                  className="text-xs text-slate-600 line-clamp-3 leading-relaxed"
                                  placeholder="Service description..."
                                  composerMode={composerMode}
                                />
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                                {data.showPrices !== false && (svc.price || composerMode) ? (
                                  <span className="font-bold text-slate-900">
                                    ₹
                                    <EditableInlineText
                                      value={svc.price ? String(svc.price) : ""}
                                      onChange={(val) => handleSvcChange(idx, { price: val ? Number(val) || (val as any) : undefined })}
                                      placeholder="0"
                                      composerMode={composerMode}
                                    />
                                  </span>
                                ) : <span />}
                                <button
                                  onClick={() => {
                                    setSelectedService(svc.name);
                                    setOpenBookingModal(true);
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                                >
                                  <span>Consult</span> <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 2. BENTO SHOWCASE (Featured large spotlight + side cards)
                  if (svcStyle === "BENTO") {
                    const heroSvc = services[0];
                    const companionSvcs = services.slice(1, 4);
                    const HeroIcon = (heroSvc?.icon && ICON_MAP[heroSvc.icon.toLowerCase()]) || Stethoscope;

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {heroSvc && (
                          <div className={`lg:col-span-6 p-8 ${cardRadiusClass} bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden`}>
                            <div className="space-y-4 relative z-10">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-block">
                                Featured Clinical Specialization
                              </span>
                              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                <HeroIcon className="w-7 h-7" />
                              </div>
                              <h4 className="text-2xl font-black text-white leading-tight">{heroSvc.name}</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">{heroSvc.description}</p>
                            </div>
                            <div className="pt-4 border-t border-white/15 flex items-center justify-between relative z-10">
                              {heroSvc.price && (
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Consultation Fee</p>
                                  <p className="text-2xl font-black text-white">₹{heroSvc.price}</p>
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedService(heroSvc.name);
                                  setOpenBookingModal(true);
                                }}
                                className="bg-white text-slate-900 font-bold text-xs h-10 px-5 rounded-xl shadow-lg hover:bg-slate-100 flex items-center gap-1.5 transition-transform hover:scale-105"
                              >
                                <span>Book Dedicated Slot</span> <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="lg:col-span-6 flex flex-col gap-4">
                          {companionSvcs.map((svc, idx) => {
                            const CompIcon = (svc.icon && ICON_MAP[svc.icon.toLowerCase()]) || Stethoscope;
                            return (
                              <div
                                key={idx}
                                className={`p-5 ${cardRadiusClass} bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-4`}
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-2xs"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <CompIcon className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-bold text-slate-900 truncate">{svc.name}</h5>
                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{svc.description}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {svc.price && <p className="text-sm font-black text-slate-900">₹{svc.price}</p>}
                                  <button
                                    onClick={() => {
                                      setSelectedService(svc.name);
                                      setOpenBookingModal(true);
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1 ml-auto"
                                  >
                                    <span>Consult</span> <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // 3. EDITORIAL SPLIT LIST (Left Spotlight + Right List)
                  if (svcStyle === "SPLIT_LIST") {
                    const spotlight = services[0];
                    const others = services.slice(1);
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {spotlight && (
                          <div className={`lg:col-span-5 p-7 ${cardRadiusClass} bg-slate-50 border border-slate-200 shadow-sm space-y-5 sticky top-24`}>
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 inline-block">
                              Core Treatment Spotlight
                            </span>
                            <h4 className="text-2xl font-black text-slate-900 leading-snug">{spotlight.name}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{spotlight.description}</p>
                            {spotlight.price && (
                              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Standard OPD Fee</span>
                                <span className="text-lg font-black text-slate-900">₹{spotlight.price}</span>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setSelectedService(spotlight.name);
                                setOpenBookingModal(true);
                              }}
                              className={`w-full text-white font-bold text-xs h-11 ${buttonRadiusClass} shadow-md flex items-center justify-center gap-1.5`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Book Immediate Slot</span>
                            </button>
                          </div>
                        )}

                        <div className="lg:col-span-7 divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          {others.map((svc, idx) => (
                            <div key={idx} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                              <div className="space-y-1 min-w-0">
                                <h5 className="text-sm font-bold text-slate-900">{svc.name}</h5>
                                <p className="text-xs text-slate-500 line-clamp-2">{svc.description}</p>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                {svc.price && <span className="text-sm font-black text-slate-900">₹{svc.price}</span>}
                                <button
                                  onClick={() => {
                                    setSelectedService(svc.name);
                                    setOpenBookingModal(true);
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <span>Book</span> <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 4. MINIMAL LIST (Clean hospital table-like rows)
                  if (svcStyle === "MINIMAL_LIST") {
                    return (
                      <div className="max-w-4xl mx-auto divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {services.map((svc, idx) => (
                          <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-slate-900">{svc.name}</h4>
                                {svc.duration && (
                                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                                    {svc.duration}m
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">{svc.description}</p>
                            </div>
                            <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                              {data.showPrices !== false && svc.price && (
                                <span className="text-base font-black text-slate-900">₹{svc.price}</span>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedService(svc.name);
                                  setOpenBookingModal(true);
                                }}
                                className={`text-xs font-bold px-4 py-2 ${buttonRadiusClass} text-white shadow-xs inline-flex items-center gap-1`}
                                style={{ backgroundColor: primaryColor }}
                              >
                                <span>Book</span> <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // 5. ICON CARDS (Glowing Centered Badge Cards)
                  if (svcStyle === "ICON_CARDS") {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map((svc, idx) => {
                          const IconComponent = (svc.icon && ICON_MAP[svc.icon.toLowerCase()]) || Stethoscope;
                          return (
                            <div
                              key={idx}
                              className={`p-7 ${cardRadiusClass} bg-white border border-slate-200/90 shadow-2xs hover:shadow-xl transition-all space-y-4 text-center flex flex-col justify-between`}
                            >
                              <div className="space-y-3 flex flex-col items-center">
                                <div
                                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-md ring-4 ring-blue-50"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <IconComponent className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-slate-900">{svc.name}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                              </div>
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                {data.showPrices !== false && svc.price ? (
                                  <span className="font-bold text-slate-900">₹{svc.price}</span>
                                ) : <span />}
                                <button
                                  onClick={() => {
                                    setSelectedService(svc.name);
                                    setOpenBookingModal(true);
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                                >
                                  <span>Consult</span> <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 6. DEFAULT 3-COLUMN CLINICAL GRID
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.map((svc, idx) => {
                        const IconComponent = (svc.icon && ICON_MAP[svc.icon.toLowerCase()]) || Stethoscope;
                        return (
                          <div
                            key={idx}
                            style={d.cardBg ? { backgroundColor: d.cardBg } : undefined}
                            className={`p-6 ${cardRadiusClass} border hover:shadow-lg transition-all space-y-4 flex flex-col justify-between ${
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
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                    <img src={svc.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <IconComponent className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <EditableInlineText
                                    value={svc.name}
                                    onChange={(val) => handleSvcChange(idx, { name: val })}
                                    tag="h4"
                                    className={`text-base font-bold leading-snug ${themeId === "executive-private" ? "text-amber-100" : "text-slate-900"}`}
                                    placeholder="Service Name"
                                    composerMode={composerMode}
                                  />
                                  {svc.duration && (
                                    <p className="text-[11px] text-slate-400 font-medium">{svc.duration} mins</p>
                                  )}
                                </div>
                              </div>

                              <EditableInlineText
                                value={svc.description}
                                onChange={(val) => handleSvcChange(idx, { description: val })}
                                tag="p"
                                multiline={true}
                                className="text-xs text-slate-600 leading-relaxed"
                                placeholder="Service description..."
                                composerMode={composerMode}
                              />
                            </div>

                            {(data.showPrices !== false && (svc.price || composerMode)) || data.showServiceButtons ? (
                              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-xs">
                                {data.showPrices !== false && (svc.price || composerMode) ? (
                                  <span className="font-bold text-slate-900">
                                    ₹
                                    <EditableInlineText
                                      value={svc.price ? String(svc.price) : ""}
                                      onChange={(val) => handleSvcChange(idx, { price: val ? Number(val) || (val as any) : undefined })}
                                      placeholder="0"
                                      composerMode={composerMode}
                                    />
                                  </span>
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
                  );
                })()}
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
                  <EditableInlineText
                    value={section.title || "Verified Patient Feedback"}
                    onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                    tag="h3"
                    className={`text-3xl font-black text-slate-900 tracking-tight ${
                      data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                    }`}
                    placeholder="Reviews Section Heading..."
                    composerMode={composerMode}
                  />
                  {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                    <EditableInlineText
                      value={section.subtitle || ""}
                      onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                      tag="p"
                      className="text-sm text-slate-500"
                      placeholder="Optional reviews subtitle..."
                      composerMode={composerMode}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className={`p-6 sm:p-7 ${cardRadiusClass} bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow space-y-4`}>
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

        // 4. DOCTOR BIO SECTION (Multi-Layout & 100% Fully Editable)
        if (section.type === "DOCTOR_BIO") {
          const doctorName = section.doctorName || data.doctor?.name || "Consultant Doctor";
          const doctorSpecialty = section.doctorSpecialty || data.doctor?.specialty || "Medical Specialist";
          const doctorDegrees = section.doctorDegrees || data.doctor?.degrees || "";
          const doctorImage = section.doctorImage || section.image || data.doctor?.image || "";
          const bioContent = section.content || data.customBio || `${doctorName} is dedicated to providing compassionate, evidence-based healthcare. Combining clinical expertise with modern medical standards, ${doctorName} ensures optimal patient outcomes.`;
          const bioHeadline = section.title || `Meet ${doctorName}`;
          const ctaBtnText = section.ctaText || "Consult Doctor Today";
          const ctaBtnAction = section.ctaAction || "BOOKING_MODAL";
          const bioStyle = section.bioStyle || d.bioStyle || "CARD";

          // Card Background Color & Luminance Contrast Calculation
          const cardBgColor = d.cardBg || section.cardBg || (themeId === "executive-private" ? "#0F172A" : "#FFFFFF");
          
          const isDarkCard = (() => {
            if (cardBgColor === "primary") return true;
            if (cardBgColor.startsWith("#")) {
              const hex = cardBgColor.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const luminance = (r * 299 + g * 587 + b * 114) / 1000;
              return luminance < 140;
            }
            return cardBgColor.includes("slate-9") || cardBgColor.includes("black") || cardBgColor.includes("slate-8");
          })();

          const cardComputedStyle: React.CSSProperties = cardBgColor === "primary"
            ? { backgroundColor: primaryColor }
            : cardBgColor.startsWith("#")
            ? { backgroundColor: cardBgColor }
            : {};

          // ── Bio Style 2: SPLIT_EDITORIAL (Editorial Two-Column - Clean & Spacious) ──
          if (bioStyle === "SPLIT_EDITORIAL") {
            return renderSectionContainer(
              section,
              <section
                id="about"
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Large Portrait Frame */}
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">
                        {doctorImage ? (
                          <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-24 h-24 stroke-1" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent text-white">
                          <EditableInlineText
                            value={doctorName}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { doctorName: val });
                              onUpdateSiteData?.({ doctor: { ...data.doctor, name: val } });
                            }}
                            tag="p"
                            className="text-lg font-black"
                            placeholder="Doctor Name"
                            composerMode={composerMode}
                          />
                          <EditableInlineText
                            value={doctorSpecialty}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { doctorSpecialty: val });
                              onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", specialty: val } });
                            }}
                            tag="p"
                            className="text-xs text-slate-300 font-medium"
                            placeholder="Specialty"
                            composerMode={composerMode}
                          />
                          {(doctorDegrees || composerMode) && (
                            <EditableInlineText
                              value={doctorDegrees}
                              onChange={(val) => {
                                onUpdateSection?.(section.id, { doctorDegrees: val });
                                onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", degrees: val } });
                              }}
                              tag="p"
                              className="text-[11px] text-blue-300 font-semibold mt-0.5"
                              placeholder="Degrees"
                              composerMode={composerMode}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Narrative Story & Actions */}
                    <div className="lg:col-span-7 space-y-6">
                      {(isBadgeVisible(section.badgeText) || composerMode) && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                          <EditableInlineText
                            value={section.badgeText || ""}
                            onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                            placeholder="Badge text (optional)..."
                            composerMode={composerMode}
                          />
                        </span>
                      )}

                      <div className="space-y-2">
                        <EditableInlineText
                          value={bioHeadline}
                          onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                          tag="h2"
                          className={`text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight ${data.fontHeading === "Playfair Display" ? "font-serif italic" : ""}`}
                          placeholder="Meet the Doctor"
                          composerMode={composerMode}
                        />
                        <p className="text-sm font-bold text-blue-600">
                          {doctorSpecialty} {doctorDegrees ? `• ${doctorDegrees}` : ""}
                        </p>
                      </div>

                      <EditableInlineText
                        value={bioContent}
                        onChange={(val) => {
                          onUpdateSection?.(section.id, { content: val });
                          onUpdateSiteData?.({ customBio: val });
                        }}
                        tag="p"
                        multiline={true}
                        className="text-base text-slate-600 leading-relaxed whitespace-pre-line"
                        placeholder="Click to type doctor bio and clinical background..."
                        composerMode={composerMode}
                      />

                      <div className="pt-2">
                        <button
                          onClick={() => handleCtaClick(ctaBtnAction, section.ctaAction)}
                          className={`font-bold text-sm h-12 px-8 ${buttonRadiusClass} text-white shadow-xl flex items-center gap-2 transition-transform hover:scale-105`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Calendar className="w-4 h-4" />
                          <EditableInlineText
                            value={ctaBtnText}
                            onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                            composerMode={composerMode}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // ── Bio Style 3: MINIMAL (Centered Authority) ──
          if (bioStyle === "MINIMAL") {
            return renderSectionContainer(
              section,
              <section
                id="about"
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""} text-center`}
              >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  <div className="w-36 h-36 rounded-full mx-auto overflow-hidden shadow-xl ring-4 ring-blue-500/10 border-4 border-white">
                    {doctorImage ? (
                      <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-16 h-16 stroke-1" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(isBadgeVisible(section.badgeText) || composerMode) && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                        <EditableInlineText
                          value={section.badgeText || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                          placeholder="Badge text (optional)..."
                          composerMode={composerMode}
                        />
                      </span>
                    )}
                    <EditableInlineText
                      value={doctorName}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { doctorName: val });
                        onUpdateSiteData?.({ doctor: { ...data.doctor, name: val } });
                      }}
                      tag="h2"
                      className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
                      placeholder="Doctor Name"
                      composerMode={composerMode}
                    />
                    <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                      <EditableInlineText
                        value={doctorSpecialty}
                        onChange={(val) => {
                          onUpdateSection?.(section.id, { doctorSpecialty: val });
                          onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", specialty: val } });
                        }}
                        tag="span"
                        placeholder="Specialty"
                        composerMode={composerMode}
                      />
                      {(doctorDegrees || composerMode) && (
                        <>
                          <span>•</span>
                          <EditableInlineText
                            value={doctorDegrees}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { doctorDegrees: val });
                              onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", degrees: val } });
                            }}
                            tag="span"
                            className="text-blue-600 font-bold"
                            placeholder="Degrees"
                            composerMode={composerMode}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <EditableInlineText
                    value={bioContent}
                    onChange={(val) => {
                      onUpdateSection?.(section.id, { content: val });
                      onUpdateSiteData?.({ customBio: val });
                    }}
                    tag="p"
                    multiline={true}
                    className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
                    placeholder="Click to type doctor bio..."
                    composerMode={composerMode}
                  />

                  <div className="pt-2">
                    <button
                      onClick={() => handleCtaClick(ctaBtnAction, section.ctaAction)}
                      className={`font-bold text-sm h-12 px-8 ${buttonRadiusClass} text-white shadow-xl inline-flex items-center gap-2 transition-transform hover:scale-105`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Calendar className="w-4 h-4" />
                      <EditableInlineText
                        value={ctaBtnText}
                        onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                        composerMode={composerMode}
                      />
                    </button>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // ── Bio Style 4: BENTO (3-Cell Profile Hub) ──
          if (bioStyle === "BENTO") {
            return renderSectionContainer(
              section,
              <section
                id="about"
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-slate-50/70" : ""}`}
              >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Bento Cell 1: Doctor Photo & Core Tag */}
                    <div className={`lg:col-span-4 bg-white ${cardRadiusClass} p-8 border border-slate-200/80 shadow-md flex flex-col items-center justify-center text-center space-y-4`}>
                      <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100">
                        {doctorImage ? (
                          <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-20 h-20 stroke-1" />
                          </div>
                        )}
                      </div>
                      <div>
                        <EditableInlineText
                          value={doctorName}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { doctorName: val });
                            onUpdateSiteData?.({ doctor: { ...data.doctor, name: val } });
                          }}
                          tag="h3"
                          className="text-xl font-black text-slate-900"
                          placeholder="Doctor Name"
                          composerMode={composerMode}
                        />
                        <EditableInlineText
                          value={doctorSpecialty}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { doctorSpecialty: val });
                            onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", specialty: val } });
                          }}
                          tag="p"
                          className="text-xs text-slate-500 font-semibold"
                          placeholder="Specialty"
                          composerMode={composerMode}
                        />
                        {(doctorDegrees || composerMode) && (
                          <EditableInlineText
                            value={doctorDegrees}
                            onChange={(val) => {
                              onUpdateSection?.(section.id, { doctorDegrees: val });
                              onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", degrees: val } });
                            }}
                            tag="p"
                            className="text-[11px] text-blue-600 font-bold mt-0.5"
                            placeholder="Degrees"
                            composerMode={composerMode}
                          />
                        )}
                      </div>
                    </div>

                    {/* Bento Cell 2: Philosophy, Bio Story & Direct Booking */}
                    <div className={`lg:col-span-8 bg-white ${cardRadiusClass} p-8 sm:p-10 border border-slate-200/80 shadow-md flex flex-col justify-between space-y-6`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <EditableInlineText
                            value={bioHeadline}
                            onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                            tag="h2"
                            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                            placeholder="Bio Headline"
                            composerMode={composerMode}
                          />
                          {(isBadgeVisible(section.badgeText) || composerMode) && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              <EditableInlineText
                                value={section.badgeText || ""}
                                onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                                placeholder="Badge text..."
                                composerMode={composerMode}
                              />
                            </span>
                          )}
                        </div>
                        <EditableInlineText
                          value={bioContent}
                          onChange={(val) => {
                            onUpdateSection?.(section.id, { content: val });
                            onUpdateSiteData?.({ customBio: val });
                          }}
                          tag="p"
                          multiline={true}
                          className="text-sm text-slate-600 leading-relaxed whitespace-pre-line"
                          placeholder="Click to type bio story..."
                          composerMode={composerMode}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleCtaClick(ctaBtnAction, section.ctaAction)}
                          className={`font-bold text-xs h-11 px-7 ${buttonRadiusClass} text-white shadow-md flex items-center gap-2 transition-transform hover:scale-105`}
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <EditableInlineText
                            value={ctaBtnText}
                            onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                            composerMode={composerMode}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // ── Bio Style 1: CARD (Default Elevated Card - 100% Fully Color-Customizable) ──
          return renderSectionContainer(
            section,
            <section
              id="about"
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`${paddingClass} border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
            >
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  style={cardComputedStyle}
                  className={`${cardRadiusClass} ${
                    isDarkCard
                      ? "text-white shadow-2xl border border-slate-800"
                      : "text-slate-900 shadow-xl border border-slate-200"
                  } p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center transition-all`}
                >
                  <div className="md:col-span-4 text-center">
                    <div className={`w-36 h-36 rounded-2xl mx-auto overflow-hidden flex items-center justify-center shadow-lg ${
                      isDarkCard ? "bg-slate-800 border-2 border-slate-700" : "bg-slate-100 border-2 border-slate-200"
                    }`}>
                      {doctorImage ? (
                        <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-4xl font-black ${isDarkCard ? "text-slate-300" : "text-slate-700"}`}>{doctorName.charAt(0) || "D"}</span>
                      )}
                    </div>
                    <EditableInlineText
                      value={doctorName}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { doctorName: val });
                        onUpdateSiteData?.({ doctor: { ...data.doctor, name: val } });
                      }}
                      tag="h4"
                      className={`text-lg font-bold mt-4 ${isDarkCard ? "text-white" : "text-slate-900"}`}
                      placeholder="Doctor Name"
                      composerMode={composerMode}
                    />
                    <EditableInlineText
                      value={doctorSpecialty}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { doctorSpecialty: val });
                        onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", specialty: val } });
                      }}
                      tag="p"
                      className={`text-xs ${isDarkCard ? "text-slate-400" : "text-slate-500"}`}
                      placeholder="Specialty"
                      composerMode={composerMode}
                    />
                    {(doctorDegrees || composerMode) && (
                      <EditableInlineText
                        value={doctorDegrees}
                        onChange={(val) => {
                          onUpdateSection?.(section.id, { doctorDegrees: val });
                          onUpdateSiteData?.({ doctor: { ...data.doctor, name: data.doctor?.name || doctorName || "Consultant Doctor", degrees: val } });
                        }}
                        tag="p"
                        className={`text-[11px] font-medium mt-0.5 ${isDarkCard ? "text-blue-400" : "text-blue-600"}`}
                        placeholder="Degrees"
                        composerMode={composerMode}
                      />
                    )}
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    {(isBadgeVisible(section.badgeText) || composerMode) && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border inline-block ${
                        isDarkCard ? "bg-white/10 text-white border-white/20" : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        <EditableInlineText
                          value={section.badgeText || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                          placeholder="Badge text (optional)..."
                          composerMode={composerMode}
                        />
                      </span>
                    )}
                    <EditableInlineText
                      value={bioHeadline}
                      onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                      tag="h3"
                      className={`text-2xl font-black tracking-tight ${isDarkCard ? "text-white" : "text-slate-900"}`}
                      placeholder="Bio Headline"
                      composerMode={composerMode}
                    />
                    <EditableInlineText
                      value={bioContent}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { content: val });
                        onUpdateSiteData?.({ customBio: val });
                      }}
                      tag="p"
                      multiline={true}
                      className={`text-sm leading-relaxed ${isDarkCard ? "text-slate-300" : "text-slate-600"} whitespace-pre-line`}
                      placeholder="Click to type doctor bio..."
                      composerMode={composerMode}
                    />
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => handleCtaClick(ctaBtnAction, section.ctaAction)}
                        className={`font-bold text-xs h-10 px-6 ${buttonRadiusClass} shadow-lg transition-transform hover:scale-105 ${
                          isDarkCard
                            ? "bg-white text-slate-900 hover:bg-slate-100"
                            : "bg-slate-900 text-white hover:bg-black"
                        }`}
                      >
                        <EditableInlineText
                          value={ctaBtnText}
                          onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                          composerMode={composerMode}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>,
            index
          );
        }

        // 5. CTA CONVERSION BANNER & FORM CONTAINER
        if (section.type === "CTA_BANNER") {
          // If this is a Form Container block
          if (section.hasForm || section.formFields || section.formTitle) {
            const formTitle = section.formTitle || section.title || "Request an Appointment / Consultation";
            const formSub = section.formSubtitle || section.subtitle || "Leave your contact details and our patient care coordinator will call you back within 15 minutes.";
            const btnText = section.formButtonText || section.ctaText || "Submit Appointment Request";

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : { backgroundColor: primaryColor }}
                className="py-16 text-slate-900 relative overflow-hidden"
              >
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className={`p-8 sm:p-10 ${cardRadiusClass} bg-white border border-slate-200 shadow-2xl space-y-6 text-left`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 inline-block">
                        Direct OPD Inquiry Form
                      </span>
                      <EditableInlineText
                        value={formTitle}
                        onChange={(val) => onUpdateSection?.(section.id, { formTitle: val, title: val })}
                        tag="h3"
                        className="text-2xl font-black text-slate-900 tracking-tight"
                        placeholder="Enter Form Title..."
                        composerMode={composerMode}
                      />
                      {((formSub && formSub.trim().length > 0) || composerMode) && (
                        <EditableInlineText
                          value={formSub || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { formSubtitle: val, subtitle: val })}
                          tag="p"
                          multiline={true}
                          className="text-xs text-slate-500 leading-relaxed"
                          placeholder="Enter Form Subtitle..."
                          composerMode={composerMode}
                        />
                      )}
                    </div>

                    <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Patient Full Name *</label>
                        <Input
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          required
                          className={`h-11 ${buttonRadiusClass} text-xs mt-1 bg-slate-50`}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Phone / WhatsApp Number *</label>
                          <Input
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            required
                            className={`h-11 ${buttonRadiusClass} text-xs mt-1 bg-slate-50`}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Select Department</label>
                          <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className={`w-full h-11 px-3 ${buttonRadiusClass} border border-slate-200 text-xs font-medium bg-slate-50 mt-1`}
                          >
                            <option value="">General Consultation</option>
                            {services.map((s, idx) => (
                              <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Preferred Timing / Clinical Query</label>
                        <Input
                          placeholder="e.g. Evening slot, second opinion, fever"
                          className={`h-11 ${buttonRadiusClass} text-xs mt-1 bg-slate-50`}
                        />
                      </div>
                      <button
                        type="submit"
                        className={`w-full text-white font-bold text-xs h-11 ${buttonRadiusClass} shadow-lg flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] cursor-pointer`}
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-4 h-4" />
                        <EditableInlineText
                          value={btnText}
                          onChange={(val) => onUpdateSection?.(section.id, { formButtonText: val, ctaText: val })}
                          composerMode={composerMode}
                        />
                      </button>
                    </form>
                  </div>
                </div>
              </section>,
              index
            );
          }

          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : { backgroundColor: primaryColor }}
              className="py-16 text-white text-center relative overflow-hidden"
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <EditableInlineText
                  value={section.title || "Ready to Book Your Consultation?"}
                  onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                  tag="h3"
                  className="text-2xl sm:text-4xl font-black tracking-tight"
                  placeholder="Enter Banner Headline..."
                  composerMode={composerMode}
                />
                {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                  <EditableInlineText
                    value={section.subtitle || ""}
                    onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                    tag="p"
                    multiline={true}
                    className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed"
                    placeholder="Enter Banner Subtitle..."
                    composerMode={composerMode}
                  />
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL", data.primaryCtaLink)}
                    className={`w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-11 px-7 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <EditableInlineText
                      value={section.ctaText || "Book Appointment Now"}
                      onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                      composerMode={composerMode}
                    />
                  </button>
                  <button
                    onClick={() => handleCtaClick(data.secondaryCtaAction || "WHATSAPP", data.secondaryCtaLink)}
                    className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 ${buttonRadiusClass} shadow-xl flex items-center justify-center gap-2`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <EditableInlineText
                      value={data.secondaryCtaText || "Chat on WhatsApp"}
                      onChange={(val) => {
                        onUpdateSection?.(section.id, { secondaryCtaText: val });
                        onUpdateSiteData?.({ secondaryCtaText: val });
                      }}
                      composerMode={composerMode}
                    />
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
                    <div key={i} className={`${cardRadiusClass} overflow-hidden border border-slate-200 shadow-sm aspect-[4/3] bg-slate-100 relative group`}>
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
                  <EditableInlineText
                    value={section.title || "Frequently Asked Questions"}
                    onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                    tag="h3"
                    className={`text-3xl font-black text-slate-900 tracking-tight ${
                      data.fontHeading === "Playfair Display" ? "font-serif italic" : ""
                    }`}
                    placeholder="FAQ Section Title..."
                    composerMode={composerMode}
                  />
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => {
                    const handleFaqChange = (patch: Partial<typeof faq>) => {
                      const next = faqs.map((f, i) => (i === idx ? { ...f, ...patch } : f));
                      onUpdateSiteData?.({ faqs: next });
                    };

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
                      >
                        <button
                          onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-600"
                        >
                          <EditableInlineText
                            value={faq.question}
                            onChange={(val) => handleFaqChange({ question: val })}
                            tag="span"
                            className="flex-1 text-left"
                            placeholder="Question..."
                            composerMode={composerMode}
                          />
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? "rotate-180" : ""}`}
                          />
                        </button>
                        {(activeFaq === idx || composerMode) && (
                          <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                            <EditableInlineText
                              value={faq.answer}
                              onChange={(val) => handleFaqChange({ answer: val })}
                              tag="div"
                              multiline={true}
                              className="text-xs text-slate-600 leading-relaxed"
                              placeholder="Answer description..."
                              composerMode={composerMode}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Clinic Address</p>
                          <p className="text-slate-600 mt-0.5">{clinicAddressText}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
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
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
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
                    <div className={`${cardRadiusClass} overflow-hidden border border-slate-200 shadow-xl aspect-[16/10] bg-slate-100 relative`}>
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

        // 9. CUSTOM TEXT & MULTI-COLUMN LAYOUT BLOCK
        if (section.type === "CUSTOM_TEXT") {
          const colLayout = section.columnLayout || d.columnLayout || (section.columnsCount === 2 ? "2col_5050" : section.columnsCount === 3 ? "3col" : section.isQuote ? "quote" : "1col");
          const textAlign = d.textAlign || "center";
          const alignClass = textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center";

          // A. DIVIDER BLOCK
          if (colLayout === "divider" || section.content === "---") {
            const bStyle = d.borderStyle || "solid";
            const bWidth = d.borderWidth || 1;
            const bColor = d.borderColor || "#E2E8F0";
            return renderSectionContainer(
              section,
              <div
                style={customBg ? { backgroundColor: customBg } : undefined}
                className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              >
                <hr
                  style={{
                    borderStyle: bStyle,
                    borderWidth: `${bWidth}px 0 0 0`,
                    borderColor: bColor,
                  }}
                  className="w-full"
                />
              </div>,
              index
            );
          }

          // B. QUOTE BLOCK
          if (colLayout === "quote" || section.isQuote) {
            const quoteText = section.content || section.title || "The greatest medical care is delivered when clinical expertise meets compassionate listening.";
            const author = section.quoteAuthor || section.doctorName || data.doctor?.name || "Dr. Vinay Kumar Rai";
            const role = section.quoteRole || section.doctorSpecialty || data.doctor?.specialty || "Senior Consultant Specialist";
            const isDarkCard = customBg && (customBg === "#0F172A" || customBg === "#09090B" || customBg.startsWith("#0") || customBg.startsWith("#1"));

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`py-16 border-b border-slate-100 ${!customBg ? "bg-slate-50/70" : ""}`}
              >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className={`p-8 sm:p-12 ${cardRadiusClass} border relative overflow-hidden text-center space-y-6 ${
                    isDarkCard ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200/90 shadow-sm text-slate-900"
                  }`}>
                    {/* Decorative Quotation Mark */}
                    <div className="text-6xl sm:text-7xl font-serif text-blue-500/20 select-none leading-none -mb-6">
                      “
                    </div>
                    <EditableInlineText
                      value={quoteText}
                      onChange={(val) => onUpdateSection?.(section.id, { content: val, title: val })}
                      tag="blockquote"
                      multiline={true}
                      className={`text-xl sm:text-2xl font-medium italic leading-relaxed max-w-2xl mx-auto ${
                        isDarkCard ? "text-slate-100" : "text-slate-800"
                      } ${data.fontHeading === "Playfair Display" ? "font-serif" : ""}`}
                      placeholder="Click to type inspiring patient quote or testimonial..."
                      composerMode={composerMode}
                    />
                    <div className="pt-2 flex flex-col items-center justify-center space-y-1">
                      <EditableInlineText
                        value={author}
                        onChange={(val) => onUpdateSection?.(section.id, { quoteAuthor: val })}
                        tag="p"
                        className={`font-bold text-sm tracking-wide ${isDarkCard ? "text-white" : "text-slate-900"}`}
                        placeholder="Quote Author"
                        composerMode={composerMode}
                      />
                      <EditableInlineText
                        value={role}
                        onChange={(val) => onUpdateSection?.(section.id, { quoteRole: val })}
                        tag="p"
                        className={`text-xs ${isDarkCard ? "text-slate-400" : "text-slate-500"}`}
                        placeholder="Author Role / Title"
                        composerMode={composerMode}
                      />
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // C. 2 COLUMNS 50/50
          if (colLayout === "2col_5050") {
            const cols = section.columns && section.columns.length >= 2 ? section.columns : [
              {
                title: section.title || "Specialized Diagnostic Care",
                content: section.content || "Left column specialized treatments paired with detailed clinical guidance and evidence-based protocols.",
                ctaText: section.ctaText,
                ctaUrl: section.ctaAction,
              },
              {
                title: section.subtitle || "Patient-Centered Outcomes",
                content: "Personalized follow-ups, transparent pricing, and continuous health monitoring for you and your family.",
                ctaText: "Learn More",
                ctaUrl: "#services",
              },
            ];

            const handleColumnChange = (colIdx: number, patch: Partial<NonNullable<PageSection["columns"]>[number]>) => {
              const current = section.columns && section.columns.length >= 2 ? [...section.columns] : [...cols];
              current[colIdx] = { ...current[colIdx], ...patch };
              onUpdateSection?.(section.id, { columns: current });
            };

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`py-16 border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  {(section.title || composerMode) && (
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                      <EditableInlineText
                        value={section.title || ""}
                        onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                        tag="h3"
                        className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                        placeholder="Section Heading (optional)..."
                        composerMode={composerMode}
                      />
                      {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                        <EditableInlineText
                          value={section.subtitle || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                          tag="p"
                          className="text-sm text-slate-500"
                          placeholder="Section Subtitle (optional)..."
                          composerMode={composerMode}
                        />
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {cols.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-7 sm:p-8 ${cardRadiusClass} bg-slate-50 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4`}
                      >
                        <div className="space-y-3">
                          {(col.badge || composerMode) && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
                              <EditableInlineText
                                value={col.badge || ""}
                                onChange={(val) => handleColumnChange(cIdx, { badge: val })}
                                placeholder="Badge..."
                                composerMode={composerMode}
                              />
                            </span>
                          )}
                          <EditableInlineText
                            value={col.title}
                            onChange={(val) => handleColumnChange(cIdx, { title: val })}
                            tag="h4"
                            className="text-xl font-bold text-slate-900"
                            placeholder="Column Heading"
                            composerMode={composerMode}
                          />
                          <EditableInlineText
                            value={col.content}
                            onChange={(val) => handleColumnChange(cIdx, { content: val })}
                            tag="p"
                            multiline={true}
                            className="text-sm text-slate-600 leading-relaxed whitespace-pre-line"
                            placeholder="Click to type column content..."
                            composerMode={composerMode}
                          />
                        </div>
                        {(col.ctaText || composerMode) && (
                          <div className="pt-2">
                            <button
                              onClick={() => handleCtaClick(col.ctaUrl || "BOOKING_MODAL")}
                              className={`text-xs font-bold px-4 py-2 rounded-lg text-white shadow-xs inline-flex items-center gap-1.5`}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <EditableInlineText
                                value={col.ctaText || "Learn More"}
                                onChange={(val) => handleColumnChange(cIdx, { ctaText: val })}
                                composerMode={composerMode}
                              />
                              <ArrowRight className="w-3 h-3" />
                            </button>
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

          // D. 2 COLUMNS 25/75 (Sidebar + Main Content)
          if (colLayout === "2col_2575") {
            const col1 = (section.columns && section.columns[0]) || {
              title: "Quick Highlights",
              content: "Verified clinical accreditations, digital reports, and direct WhatsApp consultations.",
            };
            const col2 = (section.columns && section.columns[1]) || {
              title: section.title || "Comprehensive Clinical Approach",
              content: section.content || "Our clinical staff is dedicated to precise diagnoses, patient comfort, and holistic health plans designed to restore your long-term wellness.",
            };

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`py-16 border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className={`lg:col-span-4 p-6 ${cardRadiusClass} bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Sidebar Info
                      </span>
                      <h4 className="text-lg font-bold text-slate-900">{col1.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{col1.content}</p>
                    </div>
                    <div className="lg:col-span-8 space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{col2.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{col2.content}</p>
                      {section.ctaText && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL")}
                            className={`text-xs font-bold px-5 py-2.5 rounded-lg text-white shadow-md inline-flex items-center gap-1.5`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <span>{section.ctaText}</span> <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // E. 2 COLUMNS 75/25 (Main Content + Sidebar Card)
          if (colLayout === "2col_7525") {
            const col1 = (section.columns && section.columns[0]) || {
              title: section.title || "Patient Care Standards",
              content: section.content || "Experience advanced clinical consultations supported by cutting-edge medical technology and empathetic bedside care.",
            };
            const col2 = (section.columns && section.columns[1]) || {
              title: "Consultation Notice",
              content: "Appointments are scheduled to ensure zero waiting time. Emergency inquiries accepted 24/7.",
            };

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`py-16 border-b border-slate-100 ${!customBg ? "bg-white" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{col1.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{col1.content}</p>
                      {section.ctaText && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL")}
                            className={`text-xs font-bold px-5 py-2.5 rounded-lg text-white shadow-md inline-flex items-center gap-1.5`}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <span>{section.ctaText}</span> <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`lg:col-span-4 p-6 ${cardRadiusClass} bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3`}>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Notice
                      </span>
                      <h4 className="text-lg font-bold text-slate-900">{col2.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{col2.content}</p>
                    </div>
                  </div>
                </div>
              </section>,
              index
            );
          }

          // F. 3 COLUMNS EQUAL
          if (colLayout === "3col" || colLayout === "3col_hero") {
            const cols = section.columns && section.columns.length >= 3 ? section.columns : [
              {
                title: "1. Diagnostic Precision",
                content: "Thorough physical examination backed by advanced point-of-care laboratory screening.",
              },
              {
                title: "2. Evidence-Based Plan",
                content: "Personalized clinical treatment recommendations explained in clear, transparent language.",
              },
              {
                title: "3. Continuous Recovery",
                content: "Dedicated follow-ups, remote WhatsApp advice, and preventive wellness checks.",
              },
            ];

            return renderSectionContainer(
              section,
              <section
                style={customBg ? { backgroundColor: customBg } : undefined}
                className={`py-16 border-b border-slate-100 ${!customBg ? "bg-slate-50/60" : ""}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                  {(section.title || composerMode) && (
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                      <EditableInlineText
                        value={section.title || "Our Clinical Principles"}
                        onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                        tag="h3"
                        className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                        placeholder="Section Heading..."
                        composerMode={composerMode}
                      />
                      {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                        <EditableInlineText
                          value={section.subtitle || ""}
                          onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                          tag="p"
                          className="text-sm text-slate-500"
                          placeholder="Section Subtitle (optional)..."
                          composerMode={composerMode}
                        />
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cols.map((col, idx) => {
                      const handle3ColChange = (patch: Partial<typeof col>) => {
                        const current = section.columns && section.columns.length >= 3 ? [...section.columns] : [...cols];
                        current[idx] = { ...current[idx], ...patch };
                        onUpdateSection?.(section.id, { columns: current });
                      };

                      return (
                        <div
                          key={idx}
                          className={`p-6 sm:p-7 ${cardRadiusClass} bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3`}
                        >
                          <EditableInlineText
                            value={col.title}
                            onChange={(val) => handle3ColChange({ title: val })}
                            tag="h4"
                            className="text-lg font-bold text-slate-900"
                            placeholder="Column Heading"
                            composerMode={composerMode}
                          />
                          <EditableInlineText
                            value={col.content}
                            onChange={(val) => handle3ColChange({ content: val })}
                            tag="p"
                            multiline={true}
                            className="text-xs text-slate-600 leading-relaxed whitespace-pre-line"
                            placeholder="Column content..."
                            composerMode={composerMode}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>,
              index
            );
          }

          // G. DEFAULT 1 COLUMN / STORY TEXT
          return renderSectionContainer(
            section,
            <section
              style={customBg ? { backgroundColor: customBg } : undefined}
              className={`py-16 border-b border-slate-100 ${!customBg ? "bg-slate-50/50" : ""}`}
            >
              <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 ${alignClass}`}>
                {(isBadgeVisible(section.badgeText) || composerMode) && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block">
                    <EditableInlineText
                      value={section.badgeText || ""}
                      onChange={(val) => onUpdateSection?.(section.id, { badgeText: val })}
                      placeholder="Badge text..."
                      composerMode={composerMode}
                    />
                  </span>
                )}
                <EditableInlineText
                  value={section.title || "Custom Story & Information"}
                  onChange={(val) => onUpdateSection?.(section.id, { title: val })}
                  tag="h3"
                  className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                  placeholder="Enter Title..."
                  composerMode={composerMode}
                />
                {((section.subtitle && section.subtitle.trim().length > 0) || composerMode) && (
                  <EditableInlineText
                    value={section.subtitle || ""}
                    onChange={(val) => onUpdateSection?.(section.id, { subtitle: val })}
                    tag="p"
                    className="text-sm sm:text-base text-slate-500 font-medium"
                    placeholder="Optional subtitle..."
                    composerMode={composerMode}
                  />
                )}
                {((section.content && section.content.trim().length > 0) || composerMode) && (
                  <EditableInlineText
                    value={section.content || ""}
                    onChange={(val) => onUpdateSection?.(section.id, { content: val })}
                    tag="p"
                    multiline={true}
                    className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto whitespace-pre-line"
                    placeholder="Click to type custom text or story..."
                    composerMode={composerMode}
                  />
                )}
                {/* Video Player Embed if provided */}
                {section.videoUrl && (
                  <div className="pt-4 max-w-2xl mx-auto">
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                      <iframe
                        src={section.videoUrl.replace("watch?v=", "embed/")}
                        title="Video Player"
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
                {(section.ctaText || composerMode) && (
                  <div className="pt-3">
                    <button
                      onClick={() => handleCtaClick(section.ctaAction || "BOOKING_MODAL")}
                      className={`text-xs font-bold px-6 py-2.5 rounded-lg text-white shadow-md inline-flex items-center gap-1.5`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <EditableInlineText
                        value={section.ctaText || "Learn More"}
                        onChange={(val) => onUpdateSection?.(section.id, { ctaText: val })}
                        composerMode={composerMode}
                      />
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
        <div
          className={`md:hidden ${
            composerMode ? "sticky bottom-0 left-0 right-0 z-20" : "fixed bottom-0 left-0 right-0 z-50"
          } bg-white border-t border-slate-200 p-2.5 px-4 flex items-center justify-between gap-2 shadow-2xl`}
        >
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


      {/* ── FLOATING WHATSAPP RECEPTIONIST WIDGET ── */}
      {cleanWaNumber && (
        <aside
          aria-label="WhatsApp Contact"
          className={composerMode ? "absolute bottom-6 right-6 z-20" : "fixed bottom-6 right-6 z-40"}
        >
          <a
            href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(`Hello, I would like to book an appointment with ${data.doctor?.name || data.siteTitle || "the Doctor"}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-600/40 hover:scale-105 transition-all duration-300 border-2 border-white ring-4 ring-black/5 cursor-pointer"
            title="Chat on WhatsApp"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 fill-white text-[#25D366]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 leading-none">WhatsApp</span>
              <span className="text-xs font-black text-white leading-tight">Chat with Clinic</span>
            </div>
          </a>
        </aside>
      )}

      {/* ── INSTANT APPOINTMENT BOOKING MODAL ── */}
      {openBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 relative">
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
