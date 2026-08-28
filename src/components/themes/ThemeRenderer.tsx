"use client";

import React, { useState } from "react";
import { ClinicWebsiteData, PageSection } from "./theme-types";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ThemeRenderer({
  data,
  previewMode = false,
  composerMode = false,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onDeleteSection,
  onAddSectionAfter,
}: {
  data: ClinicWebsiteData;
  previewMode?: boolean;
  composerMode?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: "up" | "down") => void;
  onDeleteSection?: (sectionId: string) => void;
  onAddSectionAfter?: (sectionId: string) => void;
}) {
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const primaryColor = data.primaryColor || "#2563EB";
  const secondaryColor = data.secondaryColor || "#0F172A";
  const accentColor = data.accentColor || "#10B981";

  const phone = data.contactPhone || data.doctor?.phone || "";
  const waPhone = (data.whatsappNumber || data.contactPhone || data.doctor?.phone || "").replace(/\D/g, "");
  const cleanWaNumber = waPhone.length === 10 ? "91" + waPhone : waPhone;

  const services = data.customServices && data.customServices.length > 0
    ? data.customServices
    : [
        { name: "General Consultation", description: "Comprehensive clinical health check & evaluation." },
        { name: "Specialized Treatment", description: "Targeted clinical therapy and procedures." },
      ];

  const faqs = data.customFaqs && data.customFaqs.length > 0
    ? data.customFaqs
    : [
        { question: "How do I book an appointment?", answer: "Book online using our booking button or connect with us directly on WhatsApp." },
        { question: "What are your operating hours?", answer: `Mon-Sat: ${data.doctor?.workingHoursStart || "09:00 AM"} - ${data.doctor?.workingHoursEnd || "08:00 PM"}` },
      ];

  const reviews = data.reviews && data.reviews.length > 0
    ? data.reviews
    : [
        { reviewerName: "Priya M.", rating: 5, comment: "Exceptional doctor. Thorough diagnosis and very caring staff.", reviewDate: "2 weeks ago" },
        { reviewerName: "Amit K.", rating: 5, comment: "Best clinical experience. No waiting time and modern equipment.", reviewDate: "1 month ago" },
        { reviewerName: "Sunita R.", rating: 5, comment: "Highly recommended for effective and caring treatment.", reviewDate: "2 months ago" },
      ];

  // Default Sections Sequence
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

  // Section Wrapper with Elementor Hover Controls
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
            ? "ring-3 ring-blue-600 ring-offset-2 z-20"
            : "hover:ring-2 hover:ring-blue-400/80 hover:ring-offset-1"
        }`}
      >
        {/* Elementor Section Action Overlay Header */}
        <div className="absolute top-2 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900 text-white p-1 rounded-xl shadow-xl text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 text-slate-300">
            {section.type.replace("_", " ")}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection?.(section.id);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-blue-400"
            title="Edit Section"
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
      className="min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white"
      style={{
        backgroundColor: "#FFFFFF",
        color: secondaryColor,
      }}
    >
      {/* Announcement Bar */}
      {data.announcementBar && (
        <div
          className="text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-300" />
          <span>{data.announcementBar}</span>
        </div>
      )}

      {/* ── CLINIC NAVIGATION HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {data.siteTitle.charAt(0)}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-slate-900">
                {data.siteTitle}
              </h1>
              {data.tagline && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 max-w-xs truncate">
                  {data.tagline}
                </p>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            {data.showServices && <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>}
            {data.showReviews && <a href="#reviews" className="hover:text-blue-600 transition-colors">Patient Feedback</a>}
            {data.showDoctorBio && <a href="#about" className="hover:text-blue-600 transition-colors">About Doctor</a>}
            {data.showFaq && <a href="#faq" className="hover:text-blue-600 transition-colors">FAQs</a>}
            {data.showMap && <a href="#contact" className="hover:text-blue-600 transition-colors">Location &amp; Timings</a>}
          </nav>

          <div className="flex items-center gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Clinic</span>
              </a>
            )}

            <button
              onClick={() => setOpenBookingModal(true)}
              className="text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{data.ctaButtonText || "Book Appointment"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── DYNAMIC SECTIONS RENDERER (Elementor Ordered Canvas) ── */}
      {activeSections.map((section, index) => {
        // 1. HERO SECTION
        if (section.type === "HERO") {
          return renderSectionContainer(
            section,
            <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                      <span className="flex text-amber-400 font-bold">★★★★★</span>
                      <span>Verified Google Patient Rating</span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
                      {section.title || data.heroHeading}
                    </h2>

                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                      {section.subtitle || data.heroSubheading || "Providing modern healthcare excellence with compassionate patient care and tailored clinical treatments."}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                      <button
                        onClick={() => setOpenBookingModal(true)}
                        className="w-full sm:w-auto text-white text-sm font-bold h-12 px-7 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{section.ctaText || data.ctaButtonText || "Book Appointment"}</span>
                      </button>

                      {cleanWaNumber && (
                        <a
                          href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent("Hello, I would like to inquire about clinic consultation.")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-12 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp Chat</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-lg mx-auto lg:mx-0 text-center">
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <p className="text-xl font-black text-slate-900">100%</p>
                        <p className="text-[11px] text-slate-500 font-semibold">Evidence-Based</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <p className="text-xl font-black text-slate-900">0 min</p>
                        <p className="text-[11px] text-slate-500 font-semibold">Fast Response</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <p className="text-xl font-black text-emerald-600">5.0 ★</p>
                        <p className="text-[11px] text-slate-500 font-semibold">Google Rated</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    {data.showHeroBookingForm ? (
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
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
                            className="h-11 rounded-xl text-xs"
                          />
                          <Input
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="Mobile / WhatsApp Number *"
                            required
                            className="h-11 rounded-xl text-xs"
                          />
                          <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                          >
                            <option value="">Select Treatment / Consultation</option>
                            {services.map((s, idx) => (
                              <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="w-full text-white font-bold text-xs h-11 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Confirm Appointment</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] bg-slate-100 relative group">
                        {data.heroImage || section.image ? (
                          <img src={data.heroImage || section.image || ""} alt={data.siteTitle} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center text-white p-8 text-center space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center font-black text-2xl">
                              {data.siteTitle.charAt(0)}
                            </div>
                            <h4 className="text-xl font-bold">{data.siteTitle}</h4>
                            <p className="text-xs text-slate-300 max-w-xs">{data.doctor?.specialty || "Dedicated Clinical Practice"}</p>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-md border border-white/50 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{data.doctor?.name || data.siteTitle}</p>
                            <p className="text-[11px] text-slate-500">{data.doctor?.specialty || "Senior Specialist"}</p>
                          </div>
                          <button
                            onClick={() => setOpenBookingModal(true)}
                            className="text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Consult
                          </button>
                        </div>
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
            <section id="services" className="py-20 bg-white border-b border-slate-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Specialized Treatments
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {section.title || "Clinical Services & Procedures"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {section.subtitle || "Comprehensive, evidence-based care tailored to your health."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((svc, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">{svc.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs">
                        {svc.price ? (
                          <span className="font-bold text-slate-900">₹{svc.price}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Consult for pricing</span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedService(svc.name);
                            setOpenBookingModal(true);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Book <ArrowRight className="w-3 h-3" />
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

        // 3. REVIEWS SECTION
        if (section.type === "REVIEWS") {
          return renderSectionContainer(
            section,
            <section id="reviews" className="py-20 bg-slate-50 border-b border-slate-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Patient Feedback
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {section.title || "Verified Google Patient Reviews"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {section.subtitle || "Real feedback from patients treated at our clinic."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
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
            <section id="about" className="py-20 bg-white border-b border-slate-100">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 text-center">
                    <div className="w-32 h-32 rounded-3xl bg-slate-800 border-2 border-slate-700 mx-auto overflow-hidden flex items-center justify-center shadow-lg">
                      {data.doctor?.image || data.heroImage ? (
                        <img src={data.doctor?.image || data.heroImage || ""} alt={data.doctor?.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-slate-300">{data.doctor?.name?.charAt(0) || "D"}</span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold mt-4">{data.doctor?.name || "Senior Consultant Doctor"}</h4>
                    <p className="text-xs text-slate-400">{data.doctor?.specialty || "Medical Specialist"}</p>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Medical Professional
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{section.title || "Clinical Philosophy & Background"}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {section.content || data.customBio || `${data.doctor?.name || "Our lead doctor"} is committed to providing modern, patient-first clinical healthcare. Combining extensive diagnostic expertise with compassionate treatment, we ensure every patient receives customized, high-quality care.`}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => setOpenBookingModal(true)}
                        className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-10 px-5 rounded-xl shadow-lg"
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
            <section className="py-16 text-white text-center relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {section.title || "Ready to Book Your Consultation?"}
                </h3>
                <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
                  {section.subtitle || "Schedule your appointment in seconds. Receive instant SMS & WhatsApp confirmation."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setOpenBookingModal(true)}
                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-11 px-7 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{section.ctaText || "Book Appointment Now"}</span>
                  </button>
                  {cleanWaNumber && (
                    <a
                      href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent("Hello, I would like to book an appointment.")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
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
            <section className="py-20 bg-white border-b border-slate-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    Clinic Showcase
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {section.title || "Our Modern Clinical Facilities"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {section.subtitle || "A comfortable, sterile, and patient-first medical environment."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
                  ].map((imgUrl, i) => (
                    <div key={i} className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm aspect-[4/3] bg-slate-100 group">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
            <section id="faq" className="py-20 bg-slate-50 border-b border-slate-100">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-200/80 px-3 py-1 rounded-full">
                    FAQs
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {section.title || "Frequently Asked Questions"}
                  </h3>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
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
          return renderSectionContainer(
            section,
            <section id="contact" className="py-20 bg-white border-b border-slate-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        Visit Our Clinic
                      </span>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        {section.title || "Clinic Location & Hours"}
                      </h3>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700">
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Clinic Address</p>
                          <p className="text-slate-600 mt-0.5">{data.doctor?.address || "Main Market, New Delhi, India"}</p>
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
                    <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl aspect-[16/10] bg-slate-100 relative">
                      <iframe
                        title="Clinic Map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent((data.doctor?.address || data.siteTitle) + " " + (data.doctor?.city || ""))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
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
            <section className="py-16 bg-slate-50 border-b border-slate-100">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
                <h3 className="text-2xl font-bold text-slate-900">{section.title || "Custom Story & Information"}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">{section.content || "Add your customized patient notices, awards, or medical background here."}</p>
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
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {data.siteTitle.charAt(0)}
            </div>
            <span className="font-bold text-white">{data.siteTitle}</span>
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
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1"
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1 shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            onClick={() => setOpenBookingModal(true)}
            className="flex-1 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1 shadow-md"
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
                className="h-11 rounded-xl text-xs"
              />
              <Input
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="WhatsApp / Phone Number *"
                required
                className="h-11 rounded-xl text-xs"
              />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
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
                className="h-11 rounded-xl text-xs"
              />

              <button
                type="submit"
                className="w-full text-white font-bold text-xs h-11 rounded-xl shadow-lg flex items-center justify-center gap-1.5"
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
