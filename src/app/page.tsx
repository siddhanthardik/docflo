"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Activity, Star, ArrowRight, CheckCircle2, TrendingUp, Users, MessageSquare,
  Search, MapPin, Building2, ChevronRight, Zap, Globe, BarChart3,
  Calendar, Phone, Clock, Shield, Heart, Award, Play, ChevronDown, Layers, Database,
  Cpu, Target, Sparkles, ArrowUpRight, Signal, RefreshCw, Check, Share2, Menu, X,
  ShieldCheck, Calculator, ArrowRightCircle, CreditCard, Bell, UserCheck, Inbox,
  CheckCircle, Sparkle, Stethoscope, Laptop, Smartphone, Download, Bot, ChevronUp,
  HelpCircle, BadgeCheck, Flame, Palette, Layout, FileText, Monitor, CheckCircle as CheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
}

// Specialty Themes with High-Resolution Photography (Clean Clinic Branding - No Individual Doctor Names)
const SPECIALTY_THEMES = [
  {
    id: "warm-pediatrics",
    name: "Pediatrics & Child Care",
    tag: "Parent-Favorite",
    icon: "🧸",
    color: "#059669",
    secondaryColor: "#F59E0B",
    clinicName: "Little Stars Pediatrics & Child Care",
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
    specialty: "Pediatrics & Neonatal Care",
    headline: "Gentle, Loving Healthcare for Happy, Healthy & Thriving Kids",
    badges: ["🧸 Stress-Free Play Zone", "💉 Pain-Free Vaccines", "🌡️ 24/7 Fever Support"],
    services: ["Newborn & Infant Care", "WHO & IAP Immunization", "Growth & Milestone Tracking", "Childhood Asthma & Allergy"],
  },
  {
    id: "radiant-derma",
    name: "Dermatology & Aesthetics",
    tag: "Luxury Glow",
    icon: "✨",
    color: "#be185d",
    secondaryColor: "#fda4af",
    clinicName: "Lumina Dermatology & Aesthetic Center",
    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
    specialty: "Dermatology & Aesthetics",
    headline: "Science-Backed Skin & Hair Transformations for Radiant Confidence",
    badges: ["✨ US-FDA Laser Tech", "🔬 3D Skin Analysis", "🌿 Chemical-Free Peels"],
    services: ["Acne & Scar Laser Treatment", "HydraFacial Glow", "PRP Hair Restoration", "Anti-Aging & Botox"],
  },
  {
    id: "smile-dental",
    name: "Dental & Orthodontics",
    tag: "High-Converting",
    icon: "🦷",
    color: "#0284c7",
    secondaryColor: "#38bdf8",
    clinicName: "Apex Dental & Implant Centre",
    heroImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80",
    specialty: "Dental & Orthodontics",
    headline: "Pain-Free Modern Dentistry for Your Family's Healthiest Smiles",
    badges: ["🦷 Painless Digital Anesthesia", "⚡ Same-Day Ceramic Crowns", "✨ Invisible Aligners"],
    services: ["Invisalign Clear Aligners", "Laser Teeth Whitening", "Root Canal in 1 Sitting", "Dental Implants"],
  },
  {
    id: "cardiac-care",
    name: "Cardiology & Vascular",
    tag: "Clinical Trust",
    icon: "❤️",
    color: "#b91c1c",
    secondaryColor: "#f87171",
    clinicName: "CareVascular Heart & Vascular Institute",
    heroImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80",
    specialty: "Cardiology & Vascular",
    headline: "Advanced Heart & Vascular Care with Compassionate Precision",
    badges: ["❤️ Emergency Echo in 10 Mins", "🔬 2D/3D Color Doppler", "📊 Lipid Risk Assessment"],
    services: ["Preventive Heart Screening", "Hypertension Clinic", "Post-Angioplasty Follow-up", "Holter & ECG Monitor"],
  },
  {
    id: "miracle-ivf",
    name: "IVF & Reproductive Health",
    tag: "High Empathy",
    icon: "🌸",
    color: "#7c3aed",
    secondaryColor: "#c084fc",
    clinicName: "Bloom Fertility & IVF Center",
    heroImage: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=1000&q=80",
    specialty: "IVF & Reproductive Health",
    headline: "Compassionate, Science-Driven Fertility Care on Your Journey to Parenthood",
    badges: ["🌸 78% First-Cycle Success", "🔬 AI Blastocyst Scoring", "🤝 100% Confidential Care"],
    services: ["Advanced IVF / ICSI Cycles", "Egg & Embryo Freezing", "PCOS Management Clinic", "Recurrent Loss Support"],
  },
  {
    id: "endo-diabetes",
    name: "Diabetology & Endocrine",
    tag: "Chronic Care",
    icon: "🩸",
    color: "#0891b2",
    secondaryColor: "#06b6d4",
    clinicName: "Metabolic Health & Endocrine Clinic",
    heroImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80",
    specialty: "Diabetology & Endocrinology",
    headline: "Evidence-Based Glycemic Control & Hormone Balance Solutions",
    badges: ["📊 Continuous Glucose CGMS", "🩺 Diabetic Foot Screening", "⚖️ Thyroid & Hormone Panels"],
    services: ["HbA1c & Diabetes Reversal", "Thyroid Disorder Clinic", "PCOD / Hormonal Imbalance", "Obesity & Metabolism Care"],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [activeFeatureCategory, setActiveFeatureCategory] = useState<"growth" | "websites" | "operations">("growth");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Dynamic Superadmin Packages State
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Filter core plans: STARTER, GROWTH, PREMIUM
          const filtered = data.filter((p: any) =>
            ["starter", "growth", "premium"].includes(p.slug?.toLowerCase()) ||
            ["STARTER", "GROWTH", "PREMIUM"].includes(p.name?.toUpperCase())
          );
          setPackages(filtered.length > 0 ? filtered : data.filter((p: any) => p.priceMonthly > 0));
        }
      })
      .catch((err) => console.error("Failed to load packages:", err))
      .finally(() => setPackagesLoading(false));
  }, []);

  // Scroll-reveal refs
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const websitesRef = useRef<HTMLDivElement>(null);
  const websitesInView = useInView(websitesRef, { once: true, margin: "-60px" });
  const pricingRef = useRef<HTMLDivElement>(null);
  const pricingInView = useInView(pricingRef, { once: true, margin: "-60px" });
  const faqRef = useRef<HTMLDivElement>(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });

  // Rotating Hero Punchlines
  const punchlines = [
    "Instant 5-Star Reviews on WhatsApp",
    "Tailored Websites for 20 Medical Specialties",
    "24/7 WhatsApp AI Receptionist That Books Appointments",
    "Rank #1 on Google Maps in Your Neighborhood",
  ];
  const [punchlineIndex, setPunchlineIndex] = useState(0);
  const [punchlineFade, setPunchlineFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPunchlineFade(false);
      setTimeout(() => {
        setPunchlineIndex((prev) => (prev + 1) % punchlines.length);
        setPunchlineFade(true);
      }, 350);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive ROI Calculator State
  const [avgFee, setAvgFee] = useState<number>(3000);
  const [newPatients, setNewPatients] = useState<number>(12);
  const monthlyRevenue = avgFee * newPatients;
  const annualRevenue = monthlyRevenue * 12;

  // Google Places Autocomplete Debounced Search
  const fetchPredictions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    try {
      setIsLoadingSuggestions(true);
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      } else {
        setPredictions([]);
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
      setPredictions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedPlace(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 300);
  };

  const handleSelectPlace = (place: PlacePrediction) => {
    setSelectedPlace(place);
    setSearchQuery(place.structured_formatting.main_text);
    setShowDropdown(false);
    handleScan(place);
  };

  const handleScan = (placeToScan?: PlacePrediction) => {
    const target = placeToScan || selectedPlace;
    if (target) {
      router.push(
        `/local-seo/free-audit?placeId=${encodeURIComponent(target.place_id)}&clinicName=${encodeURIComponent(
          target.structured_formatting.main_text
        )}`
      );
    } else if (searchQuery.trim()) {
      router.push(`/local-seo/free-audit?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/local-seo/free-audit");
    }
  };

  const activeTheme = SPECIALTY_THEMES[selectedThemeIndex];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <LandingHeader />

      {/* ── HERO SECTION: CLEAN, HIGH-IMPACT 2-COLUMN SHOWCASE ── */}
      <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Scanner & CTAs (7 Cols) */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              
              <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Dominate Local Search, Fill Your OPD &amp; Build Your{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                  Clinical Brand
                </span>
              </motion.h1>

              {/* Rotating Dynamic Value Hook */}
              <div className="h-9 flex items-center justify-center lg:justify-start">
                <p className={`text-lg sm:text-2xl font-black text-indigo-700 transition-all duration-300 transform ${
                  punchlineFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}>
                  ✨ {punchlines[punchlineIndex]}
                </p>
              </div>

              <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Automate your Google Maps SEO, launch tailored specialty clinic websites, capture patient inquiries 24/7 on WhatsApp, and build an unstoppable 5-star reputation.
              </motion.p>

              {/* 60-Second Instant GBP Audit Scanner */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="pt-2 max-w-xl mx-auto lg:mx-0 relative">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="Enter Clinic Name or City (e.g. Apollo Dental Indiranagar)"
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden font-medium"
                    />
                    {isLoadingSuggestions && (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin absolute right-3" />
                    )}
                  </div>
                  <Button
                    onClick={() => handleScan()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm px-6 h-12 rounded-xl shadow-md transition-transform hover:scale-102 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run Free Audit</span>
                  </Button>
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && predictions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-left divide-y divide-slate-100"
                  >
                    {predictions.map((p) => (
                      <button
                        key={p.place_id}
                        onClick={() => handleSelectPlace(p)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50/60 flex items-start gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{p.structured_formatting.main_text}</p>
                          {p.structured_formatting.secondary_text && (
                            <p className="text-[11px] text-slate-500">{p.structured_formatting.secondary_text}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Quick Trust Highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No Credit Card Required
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> 20 Specialty Themes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> 24/7 WhatsApp AI
                </span>
              </div>

            </div>

            {/* Right Column: High-Res Clinical Hero Showcase (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative max-w-md mx-auto lg:max-w-none"
            >
              <div className="relative rounded-3xl overflow-hidden border-2 border-white shadow-2xl shadow-blue-900/15 aspect-[4/5] max-h-[460px] bg-slate-900">
                <img
                  src="/images/indian_doctors_hero_clean.jpg"
                  alt="Doctor with Practice Growth System"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/doctor_hero_portrait.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    Dr. Siddhant
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Practitioner
                    </span>
                  </p>
                  <p className="text-xs text-slate-300">Specialty Clinical Director</p>
                </div>
              </div>

              {/* Floating Badge 1: Live WhatsApp AI Booking */}
              <div className="absolute -top-3 -right-3 sm:-right-5 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3 z-20 max-w-[240px]">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 relative">
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 leading-none">24/7 AI Receptionist</span>
                  <p className="text-xs font-bold text-slate-900 leading-tight mt-0.5">Appointment Confirmed (4:30 PM)</p>
                </div>
              </div>

              {/* Floating Badge 2: Google Maps #1 Rank */}
              <div className="absolute -bottom-3 -left-3 sm:-left-5 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3 z-20">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                    <span className="text-xs font-black text-slate-800 ml-1">Rank #1</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">+33 Reviews this month</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── METRICS & SOCIAL PROOF BAR ── */}
      <section ref={statsRef} className="bg-white py-8 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">500+</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Active Clinics</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">4.9 ★</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Average Rating</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">98%</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">WhatsApp Open Rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-2xl sm:text-3xl font-black text-purple-600">20</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Specialty Themes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: HEALTHCARE WEBSITES (CLEAN SPECIALTY CLINIC MOCKUPS) ── */}
      <section id="clinic-websites" ref={websitesRef} className="py-16 bg-white relative overflow-hidden border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              High-Converting Websites Built for 20 Medical Specialties
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Launch a custom branded clinic website in minutes. Pre-configured with clinical service menus, trust badges, 1-click WhatsApp booking, and Google 99+ PageSpeed.
            </p>

            {/* Specialty Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {SPECIALTY_THEMES.map((theme, idx) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedThemeIndex === idx
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{theme.icon}</span>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Dynamic Theme Mockup Canvas */}
          <motion.div
            key={activeTheme.id}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto bg-gradient-to-b from-slate-50 to-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6"
          >
            {/* Mockup Top Address Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-slate-500 text-[11px] ml-2 font-semibold">
                  https://{activeTheme.id.replace("-", "")}.gyrex.in (or your clinic custom domain)
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                <Zap className="w-3 h-3 text-emerald-600" /> 99+ PageSpeed
              </span>
            </div>

            {/* Mockup Theme Hero Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: Headlines & Clinical Services */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: activeTheme.color }}>
                  {activeTheme.clinicName}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {activeTheme.headline}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {activeTheme.badges.map((b, i) => (
                    <span key={i} className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-slate-800">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Services Grid */}
                <div className="pt-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Clinical Services &amp; Packages</span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTheme.services.map((svc, i) => (
                      <div key={i} className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: activeTheme.color }} />
                        <span className="truncate">{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    className="text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
                    style={{ backgroundColor: activeTheme.color }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Consultation</span>
                  </button>
                  <button className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-4 py-3 rounded-xl shadow-md flex items-center gap-1.5 transition-transform hover:scale-105">
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp Receptionist</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Clinical Hero Photography (No Overlays) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-lg space-y-3">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                    <img
                      src={activeTheme.heroImage}
                      alt={activeTheme.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                      <span className="text-xs font-bold text-slate-800 ml-1">4.9 Rating</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      120+ Verified Reviews
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ── COMPLETE FEATURE MATRIX SECTION (TIGHT & CLUTTER-FREE) ── */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything Your Clinic Needs to Grow</h2>
            <p className="text-sm text-slate-600">From local Google search domination to specialty websites and automated WhatsApp practice management.</p>
            
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={() => setActiveFeatureCategory("growth")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "growth"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Local SEO &amp; Growth
              </button>
              <button
                onClick={() => setActiveFeatureCategory("websites")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "websites"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Websites &amp; CMS
              </button>
              <button
                onClick={() => setActiveFeatureCategory("operations")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "operations"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Operations &amp; WhatsApp
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* ── GROWTH FEATURES ── */}
            {activeFeatureCategory === "growth" && (<>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">5×5 Geo-Rank Heatmap Tracker</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simulates 25 virtual searchers across a 5km radius to show your clinic&apos;s exact Google Maps position for keywords like &quot;Dermatologist near me&quot;.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real-time Google Map Pack Audit
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Star className="w-5 h-5 fill-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">5-Star WhatsApp Review Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically dispatches 2-step feedback surveys via WhatsApp after consultations. Converts 70%+ of happy patients into 5-star Google reviews.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 98% Patient Response Rate
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">4-Pillar Competitor Gap Matrix</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Live Google Places API competitor benchmark. Pinpoints the exact review count gap required to overtake Rank #1 on Google Maps.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Exact Review Volume Benchmark
                </div>
              </div>
            </>)}

            {/* ── WEBSITES & CMS FEATURES ── */}
            {activeFeatureCategory === "websites" && (<>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">20 Specialty Clinical Themes</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored presets for Pediatrics, Derma, Dental, IVF, Cardiology, Ortho, Diabetology, Ayurveda, and more with clinical service menus.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Specialty Presets
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Full WYSIWYG Blog Composer</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Publish rich patient education playbooks with clinical callout boxes, comparison tables, inline images, and Google E-E-A-T schemas.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SEO &amp; GEO Rich Snippets
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Custom Branded Domains</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full white-label custom domain support (e.g. yourclinic.com) with automated SSL certification and 99+ PageSpeed optimization.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free Automated SSL
                </div>
              </div>
            </>)}

            {/* ── OPERATIONS & WHATSAPP FEATURES ── */}
            {activeFeatureCategory === "operations" && (<>
              <div id="whatsapp-engine" className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Shared WhatsApp Business Inbox</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clinic-wide shared inbox for managing patient conversations, appointment tags, and inquiry logs with multi-staff assignment.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unified Patient Conversations
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Patient Management (CRM)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Centralized patient database with medical profiles, visit histories, practitioner assignments, and full communication logs.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Structured Patient Records
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Appointment Scheduling</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart booking calendar for slot management, consultation scheduling, and practitioner availability.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Effortless Slot Booking
                </div>
              </div>
            </>)}

          </div>

        </div>
      </section>

      {/* ── INTERACTIVE ROI CALCULATOR SECTION ── */}
      <section id="roi-calculator" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Calculate Your Practice&apos;s Additional Annual Revenue
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                See how capturing even 10–15 additional high-ticket consultations per month from Google Maps and 24/7 WhatsApp response compounds your clinic earnings.
              </p>

              {/* Sliders */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Average Consultation / Procedure Fee</span>
                    <span className="text-amber-400 font-mono text-sm">₹{avgFee.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="500"
                    value={avgFee}
                    onChange={(e) => setAvgFee(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Estimated New Patients Gained / Month</span>
                    <span className="text-emerald-400 font-mono text-sm">+{newPatients} Patients / mo</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="50"
                    step="1"
                    value={newPatients}
                    onChange={(e) => setNewPatients(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Output Metric Card */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-3xl p-7 border border-white/20 text-center space-y-3 shadow-xl">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Projected Annual Growth</p>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">
                ₹{annualRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-300">
                +₹{monthlyRevenue.toLocaleString("en-IN")} in additional monthly revenue
              </p>
              <div className="pt-3 border-t border-white/10">
                <Link href="/local-seo/free-audit">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-11 rounded-xl shadow-lg">
                    Unlock This Growth for Your Practice 🚀
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── DYNAMIC SUPERADMIN PRICING SECTION ── */}
      <section id="pricing" ref={pricingRef} className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Invest in Predictable Practice Growth
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Transparent plans configured for solo clinics, busy specialty practices, and hospital networks.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className={`text-xs font-bold transition-colors ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"}`}>
                Billed Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 p-1 transition-colors focus:outline-none"
                style={{ backgroundColor: billingCycle === "yearly" ? "#2563eb" : "#cbd5e1" }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold transition-colors ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-500"}`}>
                  Billed Annually
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200">
                  Save 20%
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Packages Rendered from Database */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {packagesLoading ? (
              <div className="col-span-3 text-center py-12 text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading active plans...</span>
              </div>
            ) : packages.length > 0 ? (
              packages.map((pkg: any) => {
                const isFeatured = pkg.slug?.toLowerCase() === "growth" || pkg.name?.toUpperCase() === "GROWTH";
                const displayPrice = billingCycle === "yearly"
                  ? (pkg.priceYearly ? Math.round(pkg.priceYearly / 12) : Math.round(pkg.priceMonthly * 0.8))
                  : pkg.priceMonthly;

                return (
                  <div
                    key={pkg.id}
                    className={`p-7 rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between space-y-6 relative ${
                      isFeatured
                        ? "border-2 border-blue-600 shadow-2xl ring-4 ring-blue-600/10 md:-translate-y-2"
                        : "border-slate-200/90 shadow-xs hover:shadow-xl"
                    }`}
                  >
                    {isFeatured && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" /> Most Popular Choice
                      </span>
                    )}

                    <div className="space-y-3.5">
                      <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{pkg.description || "Complete healthcare growth plan."}</p>
                      
                      <div className="pt-1">
                        <span className={`text-3xl sm:text-4xl font-black ${isFeatured ? "text-blue-600" : "text-slate-900"}`}>
                          ₹{displayPrice?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold"> / month</span>
                        {billingCycle === "yearly" && pkg.priceYearly && (
                          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                            Billed ₹{pkg.priceYearly?.toLocaleString("en-IN")}/year
                          </p>
                        )}
                      </div>

                      {/* Package Features from Database */}
                      <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                        {pkg.features && pkg.features.length > 0 ? (
                          pkg.features.map((feat: string, fIdx: number) => (
                            <div key={fIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 20 Specialty Clinical Website Themes</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> WhatsApp AI Receptionist &amp; Booking</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 5×5 Geo-Rank Heatmap Tracker</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Automated 5-Star WhatsApp Reviews</div>
                          </>
                        )}
                      </div>
                    </div>

                    <Link href="/register">
                      <Button className={`w-full font-bold text-xs h-11 rounded-xl shadow-md ${
                        isFeatured
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
                          : "bg-slate-900 hover:bg-black text-white"
                      }`}>
                        Get Started Now
                      </Button>
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-400 font-medium text-xs">
                Plans configured in Superadmin panel will display here.
              </div>
            )}
          </div>

          {/* Guarantee Ribbon */}
          <div className="text-center pt-2 text-xs text-slate-500 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 14-Day Money-Back Guarantee
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Cancel Anytime in 1 Click
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-purple-600" /> Instant 2-Minute Setup
            </span>
          </div>

        </div>
      </section>

      {/* ── HIGH-CONVERTING CTA BANNER WITH DOCTOR VISUALS (ABOVE FAQS) ── */}
      <section className="py-14 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Ready to Fill Your Clinic&apos;s Appointment Schedule?
              </h2>
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                Join 500+ doctors across India who dominate Google Maps search, launch custom specialty websites, and convert patient inquiries 24/7 on WhatsApp.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs h-12 px-7 rounded-xl shadow-xl transition-transform hover:scale-105">
                    Start 14-Day Free Trial 🚀
                  </Button>
                </Link>
                <Link href="/local-seo/free-audit">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-xs h-12 px-6 rounded-xl bg-transparent">
                    Get Free 60-Sec Audit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Visual Badge Mockup */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl space-y-4 max-w-sm w-full">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Practice Impact</span>
                    <h4 className="text-base font-black text-white">+70% Google Review Conversion</h4>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Rank #1 on Local Neighborhood Maps</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Multi-Language WhatsApp Receptionist</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 20 Specialty Clinical Website Themes</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (TIGHT & CLUTTER-FREE) ── */}
      <section id="faq" ref={faqRef} className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I connect my own custom domain to my clinic website?",
                a: "Yes! You can connect any custom domain (e.g. yourclinic.com) with 1 click. We provide automated free SSL certification and high-speed global CDN hosting.",
              },
              {
                q: "How does the WhatsApp AI Receptionist work?",
                a: "Our AI Receptionist connects to your WhatsApp Business number via QR code. It answers patient inquiries 24/7 in 6+ languages, explains your treatments, and books appointments directly into your clinic schedule.",
              },
              {
                q: "How does the 5×5 Geo Heatmap improve my Google Maps ranking?",
                a: "The heatmap simulates 25 search queries across a 5km radius to identify exactly where your practice ranks #1 vs where competitors are winning. It provides step-by-step guidance on review targets and local SEO signals to overtake Rank #1.",
              },
              {
                q: "Is there any coding required to build or edit the website?",
                a: "Zero coding required! You can select from 20 specialty presets (Pediatrics, Dermatology, Dental, Cardiology, etc.) and customize your headings, colors, photos, and consultation packages in seconds.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 text-sm hover:bg-slate-100/80 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
