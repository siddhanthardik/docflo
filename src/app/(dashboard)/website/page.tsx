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
  Link2,
  Unlink,
  Sparkles,
  ArrowRight,
  Brush,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export interface PrebuiltTheme {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: string;
  sampleServices: Array<{ name: string; description: string; price?: number }>;
  sampleReviews: Array<{ reviewerName: string; rating: number; comment: string; reviewDate: string }>;
}

export const PREBUILT_THEMES: PrebuiltTheme[] = [
  {
    id: "apex-clinical",
    name: "Apex Multi-Specialty",
    category: "Polyclinic, Hospitals & Consulting Physicians",
    badge: "Most Popular",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Authoritative royal blue and crisp clinical layout engineered for general physicians, consulting specialists, and multi-bed polyclinics.",
    primaryColor: "#2563EB",
    secondaryColor: "#0F172A",
    accentColor: "#10B981",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    heroHeadline: "Leading Clinical Healthcare & Dedicated Patient Care",
    heroSubtitle: "Delivering modern diagnostic precision, comprehensive outpatient consultations, and patient-first medical excellence.",
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
    sampleServices: [
      { name: "Comprehensive Health Checkup", description: "Full physical examination, blood panel review, and lifestyle wellness plan.", price: 1500 },
      { name: "Specialist Outpatient Consultation", description: "Detailed diagnostic evaluation and customized medication protocol.", price: 1000 },
      { name: "Chronic Disease Management", description: "Ongoing management for hypertension, diabetes, and cardiovascular wellness.", price: 1200 },
    ],
    sampleReviews: [
      { reviewerName: "Rajesh Sharma", rating: 5, comment: "Very thorough consultation. The doctor took the time to explain everything clearly.", reviewDate: "1 week ago" },
      { reviewerName: "Anita Verma", rating: 5, comment: "Minimal wait time and very courteous staff. Highly recommended clinic.", reviewDate: "3 weeks ago" },
    ],
  },
  {
    id: "serene-glow",
    name: "Serene Glow Aesthetics",
    category: "Dermatology, Cosmetology & Skin Clinics",
    badge: "Luxury Editorial",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Luxury rose, pearl tones, and refined editorial typography tailored for skin specialists, laser cosmetology, and aesthetic wellness.",
    primaryColor: "#BE185D",
    secondaryColor: "#1E1B4B",
    accentColor: "#F43F5E",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    heroHeadline: "Advanced Clinical Dermatology & Radiant Skin Care",
    heroSubtitle: "Evidence-based clinical skin treatments, anti-aging therapies, and personalized aesthetic procedures for natural rejuvenation.",
    heroImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    sampleServices: [
      { name: "Clinical Acne & Scar Laser Therapy", description: "Targeted laser resurfacing and dermatological peel protocols.", price: 3500 },
      { name: "Hydra-Infusion Medi-Facial", description: "Deep dermal hydration, pore extraction, and peptide serum infusion.", price: 2800 },
      { name: "Anti-Aging & Collagen Rejuvenation", description: "Non-invasive skin tightening and natural youth restoration treatment.", price: 5000 },
    ],
    sampleReviews: [
      { reviewerName: "Sneha Kapoor", rating: 5, comment: "My skin cleared up within 4 weeks! Best dermatologist in the city.", reviewDate: "2 weeks ago" },
      { reviewerName: "Pooja Malhotra", rating: 5, comment: "Luxurious clinic ambiance and genuine treatment advice without pushing unnecessary products.", reviewDate: "1 month ago" },
    ],
  },
  {
    id: "minimal-luxe",
    name: "Minimal Luxe Dental",
    category: "Dentistry, Orthodontics & Smile Studios",
    badge: "Modern Precision",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Precision cyan and obsidian palette crafted for dental surgeons, implantologists, clear aligner specialists, and smile studios.",
    primaryColor: "#0284C7",
    secondaryColor: "#0F172A",
    accentColor: "#14B8A6",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    heroHeadline: "Modern Precision Dentistry & Beautiful Smiles",
    heroSubtitle: "Painless root canals, digital smile designing, invisible aligners, and dental implants with state-of-the-art technology.",
    heroImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
    sampleServices: [
      { name: "Laser Teeth Whitening", description: "1-hour instant shade lightening with gentle enamel protection.", price: 4000 },
      { name: "Invisible Teeth Aligners Consultation", description: "3D digital intraoral scan and customized invisible aligner plan.", price: 1500 },
      { name: "Single-Sitting Root Canal (RCT)", description: "Painless computerized rotary endodontics with precision crown fitting.", price: 4500 },
    ],
    sampleReviews: [
      { reviewerName: "Karan Mehta", rating: 5, comment: "Completely painless RCT! Modern clinic with futuristic equipment.", reviewDate: "5 days ago" },
      { reviewerName: "Ritu Singhania", rating: 5, comment: "Got my aligners here. Incredible transformation in just 6 months.", reviewDate: "3 weeks ago" },
    ],
  },
  {
    id: "warm-pediatrics",
    name: "Warm Pediatrics & Family",
    category: "Pediatrics, Child Care & Neonatology",
    badge: "Approachable & Warm",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Comforting mint emerald and amber tones with welcoming cards, parent emergency quick-actions, and child vaccination guides.",
    primaryColor: "#059669",
    secondaryColor: "#1E293B",
    accentColor: "#F59E0B",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    heroHeadline: "Gentle Pediatric Care for Your Child's Healthy Growth",
    heroSubtitle: "Comprehensive infant wellness checks, childhood vaccination schedules, growth milestone tracking, and emergency pediatric guidance.",
    heroImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    sampleServices: [
      { name: "Newborn & Infant Wellness Check", description: "Milestone evaluation, nutrition guidance, and physical examination.", price: 1000 },
      { name: "Childhood Vaccination Program", description: "IAP-recommended immunization schedules with gentle administration.", price: 800 },
      { name: "Pediatric Allergy & Respiratory Care", description: "Specialized nebulization, wheezing management, and allergy assessment.", price: 1200 },
    ],
    sampleReviews: [
      { reviewerName: "Neha & Rahul Gupta", rating: 5, comment: "The doctor is so patient with our 2-year-old. Best pediatrician in town!", reviewDate: "1 week ago" },
      { reviewerName: "Meenakshi Das", rating: 5, comment: "Very reassuring doctor. Available on WhatsApp for urgent baby queries.", reviewDate: "2 weeks ago" },
    ],
  },
  {
    id: "vitality-rehab",
    name: "Vitality Rehab & Ortho",
    category: "Orthopedics, Physiotherapy & Sports Medicine",
    badge: "Active Dynamic",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    description: "High-energy teal and slate structure focused on movement recovery, joint pain relief, posture correction, and sports rehabilitation.",
    primaryColor: "#0D9488",
    secondaryColor: "#18181B",
    accentColor: "#E11D48",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    heroHeadline: "Restore Mobility, Relieve Pain & Move Freely",
    heroSubtitle: "Advanced orthopedic physical therapy, spine rehabilitation, joint mobility restoration, and sports injury recovery programs.",
    heroImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
    sampleServices: [
      { name: "Targeted Spine & Back Pain Rehab", description: "Electro-therapy, spinal decompression, and core stabilization routines.", price: 1200 },
      { name: "Sports Injury Physiotherapy", description: "Ligament strain recovery, muscle conditioning, and movement therapy.", price: 1500 },
      { name: "Post-Surgery Joint Mobility Program", description: "Customized physical rehabilitation for knee and shoulder replacements.", price: 1800 },
    ],
    sampleReviews: [
      { reviewerName: "Vikram Chauhan", rating: 5, comment: "Recovered from severe shoulder pain in 6 sessions. Exceptional physio!", reviewDate: "3 days ago" },
      { reviewerName: "Deepak Saini", rating: 5, comment: "Very professional therapist. Helped me resume running without knee pain.", reviewDate: "2 weeks ago" },
    ],
  },
];

export default function WebsiteStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingGbp, setSyncingGbp] = useState(false);
  const [mainView, setMainView] = useState<"store" | "customizer" | "domain">("store");
  const [customizerTab, setCustomizerTab] = useState<"branding" | "hero" | "services" | "bio" | "sections">("branding");

  // Live Demo Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<PrebuiltTheme | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Custom Domain state
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
        if (data.website.customDomain) {
          setCustomDomainInput(data.website.customDomain);
          setCustomDomainStatus({ connectedDomain: data.website.customDomain, dnsConfigured: true });
        }
        if (forceSync) {
          toast({
            title: "Synced with Google Business Profile & Settings! 🔄",
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

  // Apply a Prebuilt Theme from the Store
  const handleApplyTheme = (theme: PrebuiltTheme) => {
    setSiteData((prev) => ({
      ...prev,
      themeId: theme.id,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      fontHeading: theme.fontHeading,
      fontBody: theme.fontBody,
      heroHeading: prev.heroHeading || theme.heroHeadline,
      heroSubheading: prev.heroSubheading || theme.heroSubtitle,
      customServices: (prev.customServices && prev.customServices.length > 0) ? prev.customServices : theme.sampleServices,
    }));

    setMainView("customizer");
    toast({
      title: `"${theme.name}" Theme Selected! 🎨`,
      description: "Now customizing with your clinic information.",
    });
  };

  // Launch Interactive Theme Live Demo
  const handleLaunchDemo = (theme: PrebuiltTheme) => {
    setPreviewTheme(theme);
    setPreviewModalOpen(true);
  };

  // Free URL Availability Check
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

  // Connect Custom Domain
  const handleConnectCustomDomain = async () => {
    if (!customDomainInput.trim()) {
      toast({ title: "Domain Required", description: "Please enter your domain name (e.g. www.drvinaykumar.com)", variant: "destructive" });
      return;
    }

    try {
      setConnectingDomain(true);
      const res = await fetch("/api/websites/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomainInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect domain");

      setCustomDomainStatus({ connectedDomain: data.customDomain, dnsConfigured: data.dnsConfigured });
      toast({
        title: "Domain Saved & Verified! 🌐",
        description: data.message,
      });
    } catch (err: any) {
      toast({ title: "Domain Connection Failed", description: err.message, variant: "destructive" });
    } finally {
      setConnectingDomain(false);
    }
  };

  // Disconnect Custom Domain
  const handleDisconnectDomain = async () => {
    try {
      setConnectingDomain(true);
      const res = await fetch("/api/websites/custom-domain", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect");

      setCustomDomainInput("");
      setCustomDomainStatus({ connectedDomain: null, dnsConfigured: false });
      toast({ title: "Custom Domain Disconnected", description: "Your website will now serve via your free Gyrex URL." });
    } catch (err: any) {
      toast({ title: "Disconnect Error", description: err.message, variant: "destructive" });
    } finally {
      setConnectingDomain(false);
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
    const activeUrl = customDomainStatus.connectedDomain
      ? `https://${customDomainStatus.connectedDomain}`
      : `https://${siteData.subdomain}.gyrex.in`;
    navigator.clipboard.writeText(activeUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
    toast({ title: "Website Link Copied! 📋", description: "Link copied to clipboard." });
  };

  // Prepare Live Demo Preview Data
  const getDemoData = (): ClinicWebsiteData => {
    if (previewTheme) {
      return {
        subdomain: siteData.subdomain,
        themeId: previewTheme.id,
        primaryColor: previewTheme.primaryColor,
        secondaryColor: previewTheme.secondaryColor,
        accentColor: previewTheme.accentColor,
        fontHeading: previewTheme.fontHeading,
        fontBody: previewTheme.fontBody,
        siteTitle: siteData.siteTitle !== "Clinic" ? siteData.siteTitle : `Dr. ${siteData.doctor?.name || "Vinay Kumar"} Clinic`,
        tagline: previewTheme.category,
        heroHeading: previewTheme.heroHeadline,
        heroSubheading: previewTheme.heroSubtitle,
        heroImage: siteData.heroImage || previewTheme.heroImage,
        heroStyle: "IMAGE_ONLY",
        showHeroBookingForm: siteData.showHeroBookingForm,
        announcementBar: "Now open for online consultations and clinic visits.",
        ctaButtonText: "Book Appointment",
        ctaButtonAction: "BOOKING_MODAL",
        whatsappNumber: siteData.whatsappNumber || "9876543210",
        contactPhone: siteData.contactPhone || "+91 98765 43210",
        showServices: true,
        showReviews: true,
        showDoctorBio: true,
        showFaq: true,
        showMap: true,
        showStickyBar: true,
        customServices: previewTheme.sampleServices,
        customFaqs: [
          { question: "How do I book an appointment?", answer: "Click 'Book Appointment' or chat directly with our front desk on WhatsApp." },
          { question: "What are your clinic hours?", answer: "Mon-Sat from 09:00 AM to 08:00 PM. Emergency on-call available." },
        ],
        customBio: `Our clinic combines clinical expertise with compassionate care to ensure the best health outcomes for every patient.`,
        doctor: siteData.doctor || {
          name: "Dr. Vinay Kumar Rai",
          clinicName: "Premier Clinic",
          specialty: previewTheme.category,
          phone: "+91 98765 43210",
          address: "Main Medical Center, New Delhi",
          city: "New Delhi",
          workingHoursStart: "09:00 AM",
          workingHoursEnd: "08:00 PM",
        },
        reviews: previewTheme.sampleReviews,
      };
    }
    return siteData;
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1500px] mx-auto space-y-8 pb-28 font-sans">
      {/* ── TOP EXECUTIVE COMMAND BAR ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live &amp; Google Indexed
            </span>
            <span className="text-xs font-medium text-slate-400">
              Active Theme: <strong className="text-slate-800 capitalize">{siteData.themeId.replace("-", " ")}</strong>
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
            <span className="text-xs text-slate-400 font-medium">Live Website:</span>
            {customDomainStatus.connectedDomain ? (
              <a
                href={`https://${customDomainStatus.connectedDomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 font-mono inline-flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 transition-colors"
              >
                https://{customDomainStatus.connectedDomain} <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <a
                href={`https://${siteData.subdomain}.gyrex.in`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 font-mono inline-flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 transition-colors"
              >
                https://{siteData.subdomain}.gyrex.in <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={copyLiveUrl}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Copy Website Link"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Hub */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            disabled={syncingGbp}
            onClick={() => fetchWebsiteData(true)}
            className="h-11 px-4 rounded-2xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${syncingGbp ? "animate-spin text-blue-600" : ""}`} />
            <span>{syncingGbp ? "Syncing Profile..." : "Sync from Google Profile"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPreviewTheme(PREBUILT_THEMES.find((t) => t.id === siteData.themeId) || PREBUILT_THEMES[0]);
              setPreviewModalOpen(true);
            }}
            className="h-11 px-5 rounded-2xl border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Preview My Website</span>
          </Button>

          <Button
            onClick={() => handleSaveWebsite()}
            disabled={saving}
            className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Publishing..." : "Publish Website Live"}</span>
          </Button>
        </div>
      </div>

      {/* ── 3 MAIN STORE VIEWS NAVIGATION (Shopify Style) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setMainView("store")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            mainView === "store"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Palette className="w-4 h-4 text-indigo-400" />
          <span>Prebuilt Themes Store (5 Themes)</span>
        </button>

        <button
          onClick={() => setMainView("customizer")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            mainView === "customizer"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Brush className="w-4 h-4 text-blue-400" />
          <span>Visual Website Customizer</span>
        </button>

        <button
          onClick={() => setMainView("domain")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            mainView === "domain"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Domain &amp; URL Settings</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VIEW 1: PREBUILT THEMES STORE (Shopify Style Marketplace)   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mainView === "store" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 sm:p-8 rounded-3xl border border-blue-100">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md">
                Prebuilt Medical Themes
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Choose a Prebuilt Theme for Your Clinic
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                Every theme is engineered for specific medical disciplines with high patient conversion rates. You can test live demos before applying.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-slate-500">New themes added bi-weekly</span>
            </div>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREBUILT_THEMES.map((theme) => {
              const isSelected = siteData.themeId === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`bg-white rounded-3xl border-2 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between ${
                    isSelected ? "border-blue-600 ring-4 ring-blue-600/10" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Visual Card Mockup Frame */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 group">
                      <img
                        src={theme.heroImage}
                        alt={theme.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border w-fit ${theme.badgeColor}`}>
                          {theme.badge}
                        </span>
                        <h3 className="text-lg font-black mt-1 leading-tight">{theme.name}</h3>
                        <p className="text-xs text-slate-200 line-clamp-1">{theme.category}</p>
                      </div>

                      {/* Palette Dots */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: theme.primaryColor }} />
                        <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: theme.secondaryColor }} />
                        <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: theme.accentColor }} />
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                        {theme.description}
                      </p>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Included Features</p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">✓ WhatsApp Appointment</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">✓ Google Reviews</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">✓ Procedure Pricing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 pt-0 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleLaunchDemo(theme)}
                      className="flex-1 h-11 text-xs font-bold rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Live Preview</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleApplyTheme(theme)}
                      className={`flex-1 h-11 text-xs font-bold rounded-2xl text-white shadow-md flex items-center justify-center gap-1.5 transition-all ${
                        isSelected ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-black"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" /> Selected
                        </>
                      ) : (
                        <>
                          <span>Use Theme</span> <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VIEW 2: VISUAL WEBSITE CUSTOMIZER                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mainView === "customizer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-150">
          {/* Left Customizer Navigation Rail (3.5 Cols) */}
          <div className="lg:col-span-4 space-y-3 sticky top-24">
            <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-xs space-y-1">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Customizer Sections
              </div>

              {[
                { id: "branding", label: "Colors & Typography", icon: Palette, badge: "Brand Identity" },
                { id: "hero", label: "Header & Hero Banner", icon: Layout, badge: "First Impression" },
                { id: "services", label: "Treatments & Procedures", icon: Stethoscope, badge: "Clinical" },
                { id: "bio", label: "Doctor Bio & Experience", icon: ShieldCheck, badge: "E-E-A-T" },
                { id: "sections", label: "Section Visibility", icon: Layers, badge: "Layout" },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = customizerTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCustomizerTab(item.id as any)}
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

            {/* Change Theme Quick Trigger */}
            <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
              <p className="text-xs font-bold">Want to try a different look?</p>
              <p className="text-[11px] text-blue-700">You can switch prebuilt themes anytime with 1 click.</p>
              <Button
                type="button"
                size="sm"
                onClick={() => setMainView("store")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl w-full mt-2"
              >
                Browse Theme Store
              </Button>
            </div>
          </div>

          {/* Right Customizer Panel (8.5 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. BRANDING & COLORS */}
            {customizerTab === "branding" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    Visual Brand
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Brand Colors &amp; Styling</h3>
                  <p className="text-xs text-slate-500">Fine-tune the palette of your selected theme.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Theme Color</label>
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
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dark Contrast Color</label>
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
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Accent Action Color</label>
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
                    onClick={() => handleSaveWebsite("Branding & Colors")}
                    disabled={saving}
                    className="h-11 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Colors"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 2. HERO & HEADER */}
            {customizerTab === "hero" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    Homepage Hero
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Header &amp; Welcome Banner</h3>
                  <p className="text-xs text-slate-500">Edit the primary headline and clinic photo patients see first.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic Name</label>
                    <Input
                      value={siteData.siteTitle}
                      onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                      className="h-11 text-xs rounded-xl font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty Tagline</label>
                    <Input
                      value={siteData.tagline || ""}
                      onChange={(e) => setSiteData({ ...siteData, tagline: e.target.value })}
                      placeholder="e.g. Leading Dermatology &amp; Skin Clinic"
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
                    Hero Section Image / Clinic Photo
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
                      <p className="text-[11px] text-slate-500">Selected photo will be displayed in the hero section.</p>
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
                    <p className="text-[11px] text-slate-500">If disabled, the hero displays your large clinic photo with CTA buttons instead.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteData.showHeroBookingForm || false}
                    onChange={(e) => setSiteData({ ...siteData, showHeroBookingForm: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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

            {/* 3. SERVICES & TREATMENTS */}
            {customizerTab === "services" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                      Clinical Procedures
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Services &amp; Clinical Treatments</h3>
                    <p className="text-xs text-slate-500">Add or edit procedures offered at your clinic.</p>
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

            {/* 4. DOCTOR BIO */}
            {customizerTab === "bio" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Doctor Profile
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Doctor Bio &amp; Medical Background</h3>
                  <p className="text-xs text-slate-500">Provide medical certifications, qualifications, and patient care philosophy.</p>
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

            {/* 5. SECTIONS */}
            {customizerTab === "sections" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                    Layout Controls
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Page Section Visibility</h3>
                  <p className="text-xs text-slate-500">Toggle sections on or off to match your desired layout.</p>
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
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VIEW 3: DOMAIN & URL SETTINGS                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {mainView === "domain" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Free URL Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Free Included URL
              </span>
              <h3 className="text-xl font-bold text-slate-900">Your Free Gyrex Clinic URL</h3>
              <p className="text-xs text-slate-500">
                Your patients can access your clinic portal immediately at this address with free SSL encryption.
              </p>
            </div>

            <div className="max-w-xl space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Website URL Name</label>
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. dr-vinay-kumar-rai"
                    className="h-12 pl-4 pr-24 rounded-2xl text-sm font-mono font-bold border-slate-300"
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
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
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

          {/* Custom Branded Domain Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                Custom Domain
              </span>
              <h3 className="text-xl font-bold text-slate-900">Connect Your Own Branded Domain</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your domain (e.g. <strong>www.drvinaykumar.com</strong>) with automated On-Demand SSL certificates.
              </p>
            </div>

            {customDomainStatus.connectedDomain && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Custom Domain Connected</span>
                  </div>
                  <a
                    href={`https://${customDomainStatus.connectedDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-bold text-slate-900 hover:underline font-mono inline-flex items-center gap-1"
                  >
                    https://{customDomainStatus.connectedDomain} <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </a>
                  <p className="text-[11px] text-emerald-700 font-medium">Automatic Let&apos;s Encrypt SSL active.</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnectDomain}
                  disabled={connectingDomain}
                  className="h-10 px-4 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect Domain</span>
                </Button>
              </div>
            )}

            <div className="max-w-xl space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Enter Your Domain</label>
              <div className="flex items-center gap-2.5">
                <Input
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. www.drvinaykumar.com"
                  className="h-12 px-4 rounded-2xl text-sm font-mono font-bold border-slate-300"
                />
                <Button
                  type="button"
                  onClick={handleConnectCustomDomain}
                  disabled={connectingDomain}
                  className="h-12 px-6 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all shrink-0"
                >
                  {connectingDomain ? "Verifying..." : "Connect Domain"}
                </Button>
              </div>
            </div>

            {/* DNS Instructions */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Settings className="w-4 h-4 text-blue-600" /> DNS Setup Instructions (GoDaddy / Hostinger / Namecheap)
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">Step 1: Add CNAME Record (Recommended for www subdomains)</p>
                  <div className="grid grid-cols-3 gap-3 p-2.5 bg-slate-50 rounded-xl font-mono text-[11px]">
                    <div><span className="text-slate-400">Type:</span> <strong>CNAME</strong></div>
                    <div><span className="text-slate-400">Host / Name:</span> <strong>www</strong></div>
                    <div><span className="text-slate-400">Points To:</span> <strong>domains.gyrex.in</strong></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">Step 2: Add A-Record (For root domain e.g. drvinaykumar.com)</p>
                  <div className="grid grid-cols-3 gap-3 p-2.5 bg-slate-50 rounded-xl font-mono text-[11px]">
                    <div><span className="text-slate-400">Type:</span> <strong>A</strong></div>
                    <div><span className="text-slate-400">Host / Name:</span> <strong>@</strong></div>
                    <div><span className="text-slate-400">Points To:</span> <strong>72.60.201.41</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HIGH-FIDELITY LIVE THEME PREVIEW MODAL ── */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white p-4 rounded-t-3xl flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Live Interactive Theme Demo:</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                {previewTheme?.name} ({previewTheme?.category})
              </span>
            </div>

            {/* Device Switchers */}
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
              {previewTheme && (
                <Button
                  onClick={() => {
                    handleApplyTheme(previewTheme);
                    setPreviewModalOpen(false);
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Use This Theme
                </Button>
              )}

              <button
                onClick={() => setPreviewModalOpen(false)}
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
              <ThemeRenderer data={getDemoData()} previewMode={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
