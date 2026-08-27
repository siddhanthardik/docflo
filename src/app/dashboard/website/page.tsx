"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData } from "@/components/themes/theme-types";
import {
  Globe,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const THEME_PRESETS = [
  {
    id: "apex-clinical",
    name: "Apex Clinical",
    specialty: "Polyclinic & Hospital",
    primary: "#2563EB",
    secondary: "#0F172A",
    accent: "#10B981",
    desc: "Authoritative Royal Blue, high-trust polyclinics & general medicine.",
  },
  {
    id: "serene-glow",
    name: "Serene Glow",
    specialty: "Dermatology & Cosmetics",
    primary: "#BE185D",
    secondary: "#1E1B4B",
    accent: "#F43F5E",
    desc: "Luxury Rose & Emerald, tailored for skin clinics & cosmetic aesthetics.",
  },
  {
    id: "minimal-luxe",
    name: "Minimal Luxe Dental",
    specialty: "Dentistry & Orthodontics",
    primary: "#0284C7",
    secondary: "#0F172A",
    accent: "#14B8A6",
    desc: "Obsidian & Mint Cyan precision for dental practices & smile care.",
  },
  {
    id: "warm-pediatrics",
    name: "Warm Pediatrics",
    specialty: "Pediatrics & Child Care",
    primary: "#059669",
    secondary: "#1E293B",
    accent: "#F59E0B",
    desc: "Friendly pastel emerald & amber, warm approachable cards for parents.",
  },
  {
    id: "vitality-rehab",
    name: "Vitality Rehab",
    specialty: "Ortho & Physiotherapy",
    primary: "#0D9488",
    secondary: "#18181B",
    accent: "#E11D48",
    desc: "Athletic teal & energy charcoal for sports recovery & physiotherapy.",
  },
];

const COLOR_PRESETS = [
  { name: "Medical Royal Blue", primary: "#2563EB", secondary: "#0F172A", accent: "#10B981" },
  { name: "Healing Emerald", primary: "#059669", secondary: "#064E3B", accent: "#F59E0B" },
  { name: "Luxury Cosmetic Rose", primary: "#BE185D", secondary: "#1E1B4B", accent: "#F43F5E" },
  { name: "Oceanic Dental Cyan", primary: "#0284C7", secondary: "#0F172A", accent: "#14B8A6" },
  { name: "Charcoal Athletic", primary: "#0D9488", secondary: "#18181B", accent: "#E11D48" },
];

export default function WebsiteStudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState("branding");

  // Subdomain validation state
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{ available?: boolean; checking?: boolean; reason?: string }>({});

  // Website State
  const [siteData, setSiteData] = useState<ClinicWebsiteData>({
    subdomain: "my-clinic",
    themeId: "apex-clinical",
    primaryColor: "#2563EB",
    secondaryColor: "#0F172A",
    accentColor: "#10B981",
    fontHeading: "Plus Jakarta Sans",
    fontBody: "Inter",
    siteTitle: "Premier Medical Clinic",
    tagline: "Comprehensive Healthcare Excellence",
    heroHeading: "Advanced Healthcare & Personalized Patient Care",
    heroSubheading: "Delivering compassionate clinical consultations, evidence-based treatments, and high patient satisfaction.",
    heroImage: null,
    heroStyle: "SPLIT_FORM",
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

  const fetchWebsiteData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/website");
      const data = await res.json();

      if (data.website) {
        setSiteData(data.website);
        setSubdomainInput(data.website.subdomain || "");
      } else if (data.doctor) {
        // Auto-generate recommendations from doctor profile
        const doc = data.doctor;
        const clinicName = doc.clinicName || doc.name || "Clinic";
        const cleanSub = (clinicName).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

        setSiteData((prev) => ({
          ...prev,
          siteTitle: clinicName,
          subdomain: cleanSub.slice(0, 25),
          tagline: `Top-rated ${doc.specialty || "Medical"} Care in ${doc.city || "Delhi"}`,
          heroHeading: `Comprehensive ${doc.specialty || "Medical"} Care at ${clinicName}`,
          heroSubheading: `Led by ${doc.name}. Providing evidence-based treatments and personalized care in ${doc.city || "your area"}.`,
          contactPhone: doc.phone || "",
          whatsappNumber: doc.phone || "",
          doctor: doc,
          customServices: doc.services?.map((s: any) => ({ name: s.name, description: s.description || "" })) || [],
          reviews: doc.reviews || [],
        }));
        setSubdomainInput(cleanSub.slice(0, 25));
      }
    } catch (err: any) {
      toast({ title: "Failed to load website data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  // Subdomain Availability Check
  const checkSubdomain = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSubdomainStatus({ available: false, reason: "Must be at least 3 characters." });
      return;
    }

    try {
      setSubdomainStatus({ checking: true });
      const res = await fetch(`/api/websites/check-subdomain?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSubdomainStatus({ available: data.available, reason: data.reason });
      if (data.available) {
        setSiteData((prev) => ({ ...prev, subdomain: data.slug }));
      }
    } catch (e) {
      setSubdomainStatus({ available: false, reason: "Error checking subdomain." });
    }
  };

  // Local Hero Image Select
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
      toast({ title: "Hero Photo Uploaded! 📸", description: "Image saved to website." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  // Save Website
  const handleSaveWebsite = async () => {
    if (!siteData.subdomain) {
      toast({ title: "Subdomain Required", description: "Please enter your clinic website subdomain name.", variant: "destructive" });
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
        title: "Clinic Website Published! 🚀",
        description: `Your site is live at https://${siteData.subdomain}.gyrex.in`,
      });
    } catch (err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
            <Globe className="w-3.5 h-3.5 text-blue-600" /> Free Multi-Theme Website Studio
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clinic Website Builder &amp; Multi-Theme Engine
          </h1>
          <p className="text-xs text-slate-500">
            Live URL: <a href={`https://${siteData.subdomain}.gyrex.in`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline font-mono">https://{siteData.subdomain}.gyrex.in</a>
          </p>
        </div>

        {/* Action Controls & Device Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Device Toggles */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setDeviceView("desktop")}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${deviceView === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView("tablet")}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${deviceView === "tablet" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView("mobile")}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${deviceView === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <a href={`https://${siteData.subdomain}.gyrex.in`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="h-10 text-xs font-bold rounded-xl">
              <Eye className="w-3.5 h-3.5 mr-1" /> Open Live Site <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>

          <Button
            onClick={handleSaveWebsite}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
            {saving ? "Publishing..." : "Publish Website"}
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Control Panel + Right Live Device Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Customizer Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-slate-100 p-1 rounded-2xl h-11">
              <TabsTrigger value="branding" className="rounded-xl text-xs font-bold gap-1">
                <Globe className="w-3 h-3" /> Subdomain
              </TabsTrigger>
              <TabsTrigger value="themes" className="rounded-xl text-xs font-bold gap-1">
                <Palette className="w-3 h-3 text-indigo-600" /> Themes
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-xl text-xs font-bold gap-1">
                <Layout className="w-3 h-3 text-emerald-600" /> Content
              </TabsTrigger>
              <TabsTrigger value="sections" className="rounded-xl text-xs font-bold gap-1">
                <Layers className="w-3 h-3 text-amber-600" /> Sections
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Subdomain & Domain Setup */}
            <TabsContent value="branding" className="space-y-5 mt-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Claim Free Subdomain URL</h3>
                  <p className="text-xs text-slate-500">Your website will be immediately accessible on this URL.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="e.g. dr-anukriti-skin"
                      className="h-10 text-xs font-mono rounded-xl font-bold"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => checkSubdomain(subdomainInput)}
                      className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-900 text-white shrink-0"
                    >
                      Check
                    </Button>
                  </div>

                  {subdomainStatus.available === true && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" /> Available! https://{subdomainInput}.gyrex.in
                    </div>
                  )}

                  {subdomainStatus.available === false && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <AlertCircle className="w-4 h-4" /> {subdomainStatus.reason}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic Name</label>
                    <Input
                      value={siteData.siteTitle}
                      onChange={(e) => setSiteData({ ...siteData, siteTitle: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty Tagline</label>
                    <Input
                      value={siteData.tagline || ""}
                      onChange={(e) => setSiteData({ ...siteData, tagline: e.target.value })}
                      placeholder="e.g. Advanced Dermatology & Aesthetic Care"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Announcement Marquee</label>
                    <Input
                      value={siteData.announcementBar || ""}
                      onChange={(e) => setSiteData({ ...siteData, announcementBar: e.target.value })}
                      placeholder="e.g. Now open for evening consultations."
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Themes & Color Palette */}
            <TabsContent value="themes" className="space-y-5 mt-4">
              {/* Theme Picker */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Select Medical Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                        siteData.themeId === th.id
                          ? "border-blue-600 bg-blue-50/40 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{th.name}</span>
                        {siteData.themeId === th.id && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{th.desc}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: th.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: th.secondary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: th.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Harmonies */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Brand Color Harmony</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className="p-2 rounded-xl border border-slate-200 text-left space-y-1 hover:border-slate-400 bg-slate-50"
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{preset.name}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Primary</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={siteData.primaryColor}
                        onChange={(e) => setSiteData({ ...siteData, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono">{siteData.primaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Secondary</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={siteData.secondaryColor}
                        onChange={(e) => setSiteData({ ...siteData, secondaryColor: e.target.value })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono">{siteData.secondaryColor}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Accent</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={siteData.accentColor}
                        onChange={(e) => setSiteData({ ...siteData, accentColor: e.target.value })}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono">{siteData.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Hero & Main Content */}
            <TabsContent value="content" className="space-y-5 mt-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Hero Section &amp; CTAs</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Headline</label>
                  <Input
                    value={siteData.heroHeading}
                    onChange={(e) => setSiteData({ ...siteData, heroHeading: e.target.value })}
                    className="h-10 text-xs rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hero Subtitle</label>
                  <Textarea
                    value={siteData.heroSubheading || ""}
                    onChange={(e) => setSiteData({ ...siteData, heroSubheading: e.target.value })}
                    rows={2}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Hero Photo Upload */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinic / Doctor Photo
                  </label>
                  <div className="flex items-center gap-3">
                    {siteData.heroImage && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={siteData.heroImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 text-xs font-bold rounded-xl"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> Select Photo from Computer
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleHeroImageSelect}
                    />
                  </div>
                </div>

                {/* CTA Action */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CTA Button Text</label>
                    <Input
                      value={siteData.ctaButtonText}
                      onChange={(e) => setSiteData({ ...siteData, ctaButtonText: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">CTA Action</label>
                    <select
                      value={siteData.ctaButtonAction}
                      onChange={(e) => setSiteData({ ...siteData, ctaButtonAction: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="BOOKING_MODAL">Instant Booking Modal</option>
                      <option value="WHATSAPP">Direct WhatsApp Consultation</option>
                      <option value="PHONE">Direct Telephone Call</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Section Toggles */}
            <TabsContent value="sections" className="space-y-5 mt-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Website Sections Visibility</h3>
                <div className="space-y-3 divide-y divide-slate-100 text-xs">
                  {[
                    { key: "showServices", label: "Specialized Services & Treatments Grid" },
                    { key: "showReviews", label: "Verified Google Reviews & 5-Star Badge" },
                    { key: "showDoctorBio", label: "Doctor Bio & Clinical Experience Card" },
                    { key: "showFaq", label: "Interactive FAQ Accordion (Google Schema)" },
                    { key: "showMap", label: "Google Map Embed & Clinic Operating Hours" },
                    { key: "showStickyBar", label: "Mobile Sticky Action Bar (Call / WhatsApp / Book)" },
                  ].map((sec) => (
                    <div key={sec.key} className="flex items-center justify-between pt-3">
                      <span className="font-semibold text-slate-800">{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={(siteData as any)[sec.key]}
                        onChange={(e) => setSiteData({ ...siteData, [sec.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Live Device Simulator (7 Columns) */}
        <div className="lg:col-span-7 sticky top-24">
          <div className="bg-slate-900 p-4 rounded-3xl shadow-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Interactive Simulator
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                https://{siteData.subdomain}.gyrex.in
              </span>
            </div>

            {/* Viewport Frame */}
            <div
              className={`mx-auto bg-white rounded-2xl overflow-y-auto shadow-inner border border-slate-200 transition-all duration-300 ${
                deviceView === "desktop"
                  ? "w-full h-[750px]"
                  : deviceView === "tablet"
                  ? "w-[540px] h-[700px]"
                  : "w-[360px] h-[650px]"
              }`}
            >
              <ThemeRenderer data={siteData} previewMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
