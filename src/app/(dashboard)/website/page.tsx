"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData } from "@/components/themes/theme-types";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const THEME_PRESETS = [
  {
    id: "apex-clinical",
    name: "Apex Clinical",
    specialty: "Polyclinic & Hospitals",
    primary: "#2563EB",
    secondary: "#0F172A",
    accent: "#10B981",
    badge: "Enterprise Authority",
    desc: "Engineered for comprehensive clinical practices, multi-specialty polyclinics, and high-trust medical centers.",
  },
  {
    id: "serene-glow",
    name: "Serene Aesthetics",
    specialty: "Dermatology & Cosmetic",
    primary: "#BE185D",
    secondary: "#1E1B4B",
    accent: "#F43F5E",
    badge: "Luxury Aesthetics",
    desc: "Luxury rose and pearl tones with elegant typography tailored for skin specialists, cosmetology, and aesthetic wellness.",
  },
  {
    id: "minimal-luxe",
    name: "Minimal Luxe Dental",
    specialty: "Dentistry & Smile Studios",
    primary: "#0284C7",
    secondary: "#0F172A",
    accent: "#14B8A6",
    badge: "Modern Precision",
    desc: "Precision obsidian and cyan palette designed for dental surgeons, orthodontists, and modern smile clinics.",
  },
  {
    id: "warm-pediatrics",
    name: "Warm Pediatrics",
    specialty: "Pediatrics & Child Care",
    primary: "#059669",
    secondary: "#1E293B",
    accent: "#F59E0B",
    badge: "Family Healthcare",
    desc: "Approachable emerald and warm amber theme with welcoming layout and reassuring parent emergency quick-actions.",
  },
  {
    id: "vitality-rehab",
    name: "Vitality Rehab & Ortho",
    specialty: "Orthopedics & Physio",
    primary: "#0D9488",
    secondary: "#18181B",
    accent: "#E11D48",
    badge: "Active Dynamic",
    desc: "High-energy teal and dark charcoal structure focused on movement recovery, rehabilitation, and injury management.",
  },
];

const COLOR_PRESETS = [
  { name: "Clinical Royal Blue", primary: "#2563EB", secondary: "#0F172A", accent: "#10B981" },
  { name: "Healing Emerald", primary: "#059669", secondary: "#064E3B", accent: "#F59E0B" },
  { name: "Luxury Cosmetic Rose", primary: "#BE185D", secondary: "#1E1B4B", accent: "#F43F5E" },
  { name: "Cyan Precision", primary: "#0284C7", secondary: "#0F172A", accent: "#14B8A6" },
  { name: "Charcoal Athletic", primary: "#0D9488", secondary: "#18181B", accent: "#E11D48" },
  { name: "Deep Indigo Elegance", primary: "#4F46E5", secondary: "#0F172A", accent: "#EC4899" },
];

const NAV_SECTIONS = [
  { id: "url", label: "Website URL & Domain", icon: Globe, badge: "Infrastructure" },
  { id: "theme", label: "Themes & Branding", icon: Palette, badge: "Identity" },
  { id: "header", label: "Header & Hero Section", icon: Layout, badge: "First Impression" },
  { id: "services", label: "Services & Treatments", icon: Stethoscope, badge: "Clinical" },
  { id: "bio", label: "Doctor Bio & Credentials", icon: ShieldCheck, badge: "E-E-A-T" },
  { id: "sections", label: "Page Section Manager", icon: Layers, badge: "Layout" },
];

export default function WebsiteStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [activeSection, setActiveSection] = useState("url");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Website URL validation state
  const [urlInput, setUrlInput] = useState("");
  const [urlStatus, setUrlStatus] = useState<{ available?: boolean; checking?: boolean; reason?: string }>({});

  // Website State
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
  });

  const fetchWebsiteData = async (forceSync = false) => {
    try {
      if (forceSync) setSyncingGbp(true);
      else setLoading(true);

      const res = await fetch(`/api/website${forceSync ? "?sync=true" : ""}`);
      const data = await res.json();

      if (data.website) {
        setSiteData(data.website);
        setUrlInput(data.website.subdomain || "");
        if (forceSync) {
          toast({
            title: "Synced with Google Business Profile & Settings! 🔄",
            description: "Updated latest clinic address, hours, reviews, services, and doctor details.",
          });
        }
      }
    } catch (err: any) {
      toast({ title: "Failed to load website configuration", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setSyncingGbp(false);
    }
  };

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  // URL Availability Check
  const checkUrlAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setUrlStatus({ available: false, reason: "Website URL name must be at least 3 characters." });
      return;
    }

    try {
      setUrlStatus({ checking: true });
      const res = await fetch(`/api/websites/check-subdomain?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setUrlStatus({ available: data.available, reason: data.reason });
      if (data.available) {
        setSiteData((prev) => ({ ...prev, subdomain: data.slug }));
      }
    } catch (e) {
      setUrlStatus({ available: false, reason: "Error validating website URL availability." });
    }
  };

  // Local Image Upload
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
      toast({ title: "Hero Photo Uploaded 📸", description: "Image attached to website." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  // Save Website
  const handleSaveWebsite = async (sectionName?: string) => {
    if (!siteData.subdomain) {
      toast({ title: "Website URL Required", description: "Please specify your clinic website URL name.", variant: "destructive" });
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
        description: `Website active at https://${siteData.subdomain}.gyrex.in`,
      });
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(`https://${siteData.subdomain}.gyrex.in`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
    toast({ title: "Website URL Copied! 📋", description: "Link copied to clipboard." });
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1500px] mx-auto space-y-8 pb-28 font-sans">
      {/* ── TOP CORPORATE COMMAND BAR ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active &amp; Indexed
            </span>
            <span className="text-xs font-medium text-slate-400">
              Medical Theme: <strong className="text-slate-800 capitalize">{siteData.themeId.replace("-", " ")}</strong>
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Free SSL Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Clinic Website Studio
          </h1>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs text-slate-400 font-medium">Public Portal:</span>
            <a
              href={`https://${siteData.subdomain}.gyrex.in`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 font-mono inline-flex items-center gap-1 bg-blue-50/70 hover:bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 transition-colors"
            >
              https://{siteData.subdomain}.gyrex.in <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={copyLiveUrl}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Copy Website Link"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Corporate Header Action Hub */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            disabled={syncingGbp}
            onClick={() => fetchWebsiteData(true)}
            className="h-11 px-4 rounded-2xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${syncingGbp ? "animate-spin text-blue-600" : ""}`} />
            <span>{syncingGbp ? "Syncing Profile..." : "Sync from Google Profile"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreviewModal(true)}
            className="h-11 px-5 rounded-2xl border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview Website</span>
          </Button>

          <Button
            onClick={() => handleSaveWebsite()}
            disabled={saving}
            className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Publishing..." : "Publish Website Live"}</span>
          </Button>
        </div>
      </div>

      {/* ── 2-COLUMN ENTERPRISE WORKSPACE LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SLEEK CORPORATE NAVIGATION RAIL (3.5 Columns) */}
        <div className="lg:col-span-4 space-y-3 sticky top-24">
          <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Configuration Modules
            </div>

            {NAV_SECTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{item.label}</p>
                      <p className={`text-[10px] font-medium ${isActive ? "text-slate-400" : "text-slate-400"}`}>{item.badge}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? "text-slate-400" : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise Healthcare Engine
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Websites are powered by high-speed Server-Side Rendering (SSR), structured Google medical schemas, and 1-click WhatsApp patient appointment dispatch.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: MODULE CONFIGURATION CANVAS (8.5 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 1: WEBSITE URL & DOMAIN */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "url" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Domain Infrastructure
                </span>
                <h3 className="text-xl font-bold text-slate-900">Official Clinic Website Address</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your patients will access your clinic portal at this address. You can update your URL name or connect a custom domain.
                </p>
              </div>

              <div className="max-w-xl space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Website URL Name
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="e.g. dr-vinay-kumar-rai"
                      className="h-12 pl-4 pr-24 rounded-2xl text-sm font-mono font-bold border-slate-300 focus:ring-slate-900"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      .gyrex.in
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => checkUrlAvailability(urlInput)}
                    className="h-12 px-6 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all"
                  >
                    Verify Name
                  </Button>
                </div>

                {urlStatus.available === true && (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>URL Available: <strong>https://{urlInput}.gyrex.in</strong></span>
                  </div>
                )}

                {urlStatus.available === false && (
                  <div className="flex items-center gap-2 text-xs text-rose-800 font-bold bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{urlStatus.reason}</span>
                  </div>
                )}
              </div>

              {/* Infrastructure Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Free SSL Security
                  </div>
                  <p className="text-[11px] text-slate-500">256-bit encryption active on all patient consultations.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Globe className="w-4 h-4 text-blue-600" /> Google Search Ready
                  </div>
                  <p className="text-[11px] text-slate-500">Structured MedicalBusiness schema for local search.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-indigo-600" /> Custom Domain Ready
                  </div>
                  <p className="text-[11px] text-slate-500">Supports CNAME point to your own branded domain.</p>
                </div>
              </div>

              {/* Section Footer Save Action */}
              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleSaveWebsite("Website URL")}
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save URL Settings"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 2: THEMES & BRANDING */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "theme" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Theme Selector */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    Visual Identity
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Select Medical Theme</h3>
                  <p className="text-xs text-slate-500">
                    Each theme has been designed for specific medical categories and patient demographics.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {THEME_PRESETS.map((th) => (
                    <div
                      key={th.id}
                      onClick={() =>
                        setSiteData({
                          ...siteData,
                          themeId: th.id,
                          primaryColor: th.primary,
                          secondaryColor: th.secondary,
                          accentColor: th.accent,
                        })
                      }
                      className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                        siteData.themeId === th.id
                          ? "border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                            {th.badge}
                          </span>
                          {siteData.themeId === th.id && (
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900">{th.name}</h4>
                        <p className="text-[11px] font-semibold text-blue-600">{th.specialty}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{th.desc}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                        <span className="text-[11px] font-bold text-slate-400">Palette Preview</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full shadow-xs" style={{ backgroundColor: th.primary }} />
                          <div className="w-5 h-5 rounded-full shadow-xs" style={{ backgroundColor: th.secondary }} />
                          <div className="w-5 h-5 rounded-full shadow-xs" style={{ backgroundColor: th.accent }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Colors */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Custom Brand Palette</h3>
                  <p className="text-xs text-slate-500">Pick a pre-designed harmony or fine-tune exact hex color codes.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSiteData({
                          ...siteData,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent,
                        })
                      }
                      className="p-3 rounded-2xl border border-slate-200 text-left space-y-2 hover:border-slate-400 bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 truncate">{preset.name}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Accent</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                      <input
                        type="color"
                        value={siteData.primaryColor}
                        onChange={(e) => setSiteData({ ...siteData, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-xl border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-800">{siteData.primaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dark Contrast</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                      <input
                        type="color"
                        value={siteData.secondaryColor}
                        onChange={(e) => setSiteData({ ...siteData, secondaryColor: e.target.value })}
                        className="w-8 h-8 rounded-xl border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-800">{siteData.secondaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Button Highlight</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                      <input
                        type="color"
                        value={siteData.accentColor}
                        onChange={(e) => setSiteData({ ...siteData, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-xl border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-800">{siteData.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                  <Button
                    onClick={() => handleSaveWebsite("Themes & Colors")}
                    disabled={saving}
                    className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Theme & Colors"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 3: HEADER & HERO */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "header" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  First Impression
                </span>
                <h3 className="text-xl font-bold text-slate-900">Header &amp; Hero Headline</h3>
                <p className="text-xs text-slate-500">Configure what patients see immediately when landing on your clinic portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic Display Name</label>
                  <Input
                    value={siteData.siteTitle}
                    onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                    className="h-11 text-xs rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty Sub-Tagline</label>
                  <Input
                    value={siteData.tagline || ""}
                    onChange={(e) => setSiteData({ ...siteData, tagline: e.target.value })}
                    placeholder="e.g. Leading Pediatrics &amp; Child Care Clinic"
                    className="h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Headline (Main Statement)</label>
                <Input
                  value={siteData.heroHeading}
                  onChange={(e) => setSiteData({ ...siteData, heroHeading: e.target.value })}
                  className="h-12 text-sm font-bold rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Subtitle / Description</label>
                <Textarea
                  value={siteData.heroSubheading || ""}
                  onChange={(e) => setSiteData({ ...siteData, heroSubheading: e.target.value })}
                  rows={3}
                  className="text-xs rounded-2xl leading-relaxed"
                />
              </div>

              {/* Photo Selector */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hero Image / Clinic Photo
                </label>
                <div className="flex items-center gap-4">
                  {siteData.heroImage ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src={siteData.heroImage} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      No Photo
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 text-xs font-bold rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-1.5 text-blue-600" /> Select Image from Local Computer
                    </Button>
                    <p className="text-[11px] text-slate-500">Selected photo will be displayed prominently in the hero section placeholder.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleHeroImageSelect}
                    />
                  </div>
                </div>
              </div>

              {/* Header Booking Form Option */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">Show Instant Booking Form inside Hero Section</span>
                  <p className="text-[11px] text-slate-500">If disabled, the hero displays your large clinic photo with direct CTA buttons instead.</p>
                </div>
                <input
                  type="checkbox"
                  checked={siteData.showHeroBookingForm || false}
                  onChange={(e) => setSiteData({ ...siteData, showHeroBookingForm: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* CTA & Announcement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CTA Button Text</label>
                  <Input
                    value={siteData.ctaButtonText}
                    onChange={(e) => setSiteData({ ...siteData, ctaButtonText: e.target.value })}
                    className="h-11 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CTA Action Target</label>
                  <select
                    value={siteData.ctaButtonAction}
                    onChange={(e) => setSiteData({ ...siteData, ctaButtonAction: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="BOOKING_MODAL">Instant Booking Form (Direct to CRM)</option>
                    <option value="WHATSAPP">WhatsApp Direct Chat</option>
                    <option value="PHONE">Direct Telephone Call</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Top Announcement Marquee Banner
                </label>
                <Input
                  value={siteData.announcementBar || ""}
                  onChange={(e) => setSiteData({ ...siteData, announcementBar: e.target.value })}
                  placeholder="e.g. Dr. Vinay Kumar Rai is available for evening consultations this week."
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleSaveWebsite("Header & Hero")}
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Header & Hero"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 4: SERVICES & TREATMENTS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "services" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                    Clinical Procedures
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Services &amp; Clinical Treatments</h3>
                  <p className="text-xs text-slate-500">Manage procedures, consultation durations, and fee details.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = siteData.customServices || [];
                    setSiteData({
                      ...siteData,
                      customServices: [...current, { name: "New Clinical Treatment", description: "Treatment description and procedure details." }],
                    });
                  }}
                  className="h-9 text-xs font-bold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Service
                </Button>
              </div>

              <div className="space-y-4 pt-2">
                {(siteData.customServices || []).map((svc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Input
                        value={svc.name}
                        onChange={(e) => {
                          const updated = [...(siteData.customServices || [])];
                          updated[idx].name = e.target.value;
                          setSiteData({ ...siteData, customServices: updated });
                        }}
                        placeholder="Service / Treatment Name"
                        className="h-10 text-xs font-bold rounded-xl bg-white"
                      />
                      <Input
                        type="number"
                        value={svc.price || ""}
                        onChange={(e) => {
                          const updated = [...(siteData.customServices || [])];
                          updated[idx].price = e.target.value ? Number(e.target.value) : undefined;
                          setSiteData({ ...siteData, customServices: updated });
                        }}
                        placeholder="Price (₹)"
                        className="h-10 text-xs w-32 rounded-xl bg-white shrink-0 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (siteData.customServices || []).filter((_, i) => i !== idx);
                          setSiteData({ ...siteData, customServices: updated });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Textarea
                      value={svc.description}
                      onChange={(e) => {
                        const updated = [...(siteData.customServices || [])];
                        updated[idx].description = e.target.value;
                        setSiteData({ ...siteData, customServices: updated });
                      }}
                      placeholder="Short description of procedure and expected recovery..."
                      rows={2}
                      className="text-xs rounded-xl bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleSaveWebsite("Services")}
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Services"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 5: DOCTOR BIO & CREDENTIALS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "bio" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Doctor Profile
                </span>
                <h3 className="text-xl font-bold text-slate-900">Doctor Bio &amp; Medical Qualifications</h3>
                <p className="text-xs text-slate-500">Provide medical certifications, clinical experience, and patient care philosophy.</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Philosophy &amp; Background</label>
                <Textarea
                  value={siteData.customBio || ""}
                  onChange={(e) => setSiteData({ ...siteData, customBio: e.target.value })}
                  placeholder="Detailed doctor background, clinical philosophy, and patient care commitment..."
                  rows={6}
                  className="text-xs rounded-2xl leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleSaveWebsite("Doctor Bio")}
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Doctor Bio"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SECTION 6: SECTION MANAGER */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeSection === "sections" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                  Layout Controls
                </span>
                <h3 className="text-xl font-bold text-slate-900">Page Section Manager</h3>
                <p className="text-xs text-slate-500">Enable or disable homepage modules to customize your clinic layout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    key: "showServices",
                    icon: Stethoscope,
                    title: "Services & Treatments Grid",
                    desc: "Displays clinical procedures with pricing and instant book triggers.",
                  },
                  {
                    key: "showReviews",
                    icon: Star,
                    title: "Google Reviews & 5-Star Rating",
                    desc: "Live patient feedback and Google Maps rating trust badge.",
                  },
                  {
                    key: "showDoctorBio",
                    icon: ShieldCheck,
                    title: "Doctor Bio & Credentials Card",
                    desc: "Doctor credentials, verified medical badge, and experience.",
                  },
                  {
                    key: "showFaq",
                    icon: HelpCircle,
                    title: "Interactive FAQ Accordion",
                    desc: "Expandable patient questions & answers with Google FAQ schema.",
                  },
                  {
                    key: "showMap",
                    icon: MapPin,
                    title: "Map Embed & Operating Hours",
                    desc: "Interactive clinic map, address, and consultation schedule.",
                  },
                  {
                    key: "showStickyBar",
                    icon: Smartphone,
                    title: "Mobile Sticky Action Bar",
                    desc: "Fixed bottom bar on mobile with Call Now, WhatsApp, and Book.",
                  },
                ].map((sec) => {
                  const Icon = sec.icon;
                  const isChecked = (siteData as any)[sec.key];
                  return (
                    <div
                      key={sec.key}
                      onClick={() => setSiteData({ ...siteData, [sec.key]: !isChecked })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isChecked ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-slate-50/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isChecked ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900">{sec.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{sec.desc}</p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0 mt-0.5"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleSaveWebsite("Section Settings")}
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Section Settings"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HIGH-FIDELITY APPLE-STYLE PREVIEW MODAL ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white p-4 rounded-t-3xl flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Live Device Preview:</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                https://{siteData.subdomain}.gyrex.in
              </span>
            </div>

            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${previewDevice === "desktop" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${previewDevice === "tablet" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Tablet className="w-3.5 h-3.5" /> Tablet
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${previewDevice === "mobile" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleSaveWebsite();
                }}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Publish Live
              </Button>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 p-4 rounded-b-3xl overflow-y-auto flex items-center justify-center">
            <div
              className={`bg-white rounded-2xl overflow-y-auto shadow-2xl transition-all duration-300 ${
                previewDevice === "desktop"
                  ? "w-full h-full max-h-[85vh]"
                  : previewDevice === "tablet"
                  ? "w-[768px] h-full max-h-[85vh]"
                  : "w-[390px] h-full max-h-[85vh]"
              }`}
            >
              <ThemeRenderer data={siteData} previewMode={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
