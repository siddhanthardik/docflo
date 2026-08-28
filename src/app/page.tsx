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
  HelpCircle, BadgeCheck, Flame, Palette, Layout, FileText, Monitor, CheckCircle as CheckIcon,
  Smile, Baby, Eye, Pill, HeartPulse, Bone, Droplets, Sparkle as ToothIcon
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

// Specialty Themes with High-Resolution Photography
const SPECIALTY_THEMES = [
  {
    id: "warm-pediatrics",
    name: "Pediatrics & Child Care",
    tag: "Parent-Favorite",
    icon: "🧸",
    color: "#059669",
    secondaryColor: "#F59E0B",
    doctorName: "Dr. Vinay Kumar Rai",
    doctorPhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
    specialty: "Senior Pediatrician & Neonatologist",
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
    doctorName: "Dr. Ananya Sharma",
    doctorPhoto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
    specialty: "Cosmetic Dermatologist & Trichologist",
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
    doctorName: "Dr. Rohan Malhotra",
    doctorPhoto: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80",
    specialty: "MDS Orthodontist & Implant Specialist",
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
    doctorName: "Dr. Rajeshwar Sen",
    doctorPhoto: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80",
    specialty: "DM Senior Interventional Cardiologist",
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
    doctorName: "Dr. Meenakshi Sundaram",
    doctorPhoto: "https://images.unsplash.com/photo-1594824813593-906d4e410b01?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80",
    specialty: "Reproductive Endocrinologist & Fertility Specialist",
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
    doctorName: "Dr. K. S. Mukherjee",
    doctorPhoto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    heroImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80",
    specialty: "Consultant Endocrinologist & Diabetologist",
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

  // Scroll-reveal refs
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const websitesRef = useRef<HTMLDivElement>(null);
  const websitesInView = useInView(websitesRef, { once: true, margin: "-80px" });
  const pricingRef = useRef<HTMLDivElement>(null);
  const pricingInView = useInView(pricingRef, { once: true, margin: "-80px" });
  const faqRef = useRef<HTMLDivElement>(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });

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

      {/* ── HERO SECTION: 2-COLUMN DYNAMIC MEDICAL SHOWCASE WITH HIGH-RES IMAGERY ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-blue-400/15 to-indigo-400/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[250px] bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines, Scanner & Value Hooks (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Top Pill Badge */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-full px-4 py-1.5 shadow-2xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-xs font-bold text-blue-900">
                  The Complete Practice Growth OS for Modern Doctors
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Dominate Local Search, Fill Your OPD &amp; Build Your{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                  Clinical Brand
                </span>
              </motion.h1>

              {/* Rotating Dynamic Value Hook */}
              <div className="h-10 flex items-center justify-center lg:justify-start">
                <p className={`text-lg sm:text-2xl font-black text-indigo-700 transition-all duration-300 transform ${
                  punchlineFade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}>
                  ✨ {punchlines[punchlineIndex]}
                </p>
              </div>

              <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Automate your Google Maps SEO, launch tailored specialty clinic websites, capture patient inquiries 24/7 on WhatsApp, and build an unstoppable 5-star reputation.
              </motion.p>

              {/* 60-Second Instant GBP Audit Scanner */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="pt-2 max-w-xl mx-auto lg:mx-0 relative">
                <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col sm:flex-row gap-2">
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

              {/* Quick Micro Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No Credit Card Required
                </span>
                <span className="flex items-center gap-1.5 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> 20 Specialty Themes
                </span>
                <span className="flex items-center gap-1.5 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> 24/7 WhatsApp AI
                </span>
              </div>

            </div>

            {/* Right Column: Real Clinical Doctor Hero Imagery & Floating Metric Badges (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative max-w-md mx-auto lg:max-w-none"
            >
              {/* Doctor Main Portrait Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/80 shadow-2xl shadow-blue-900/15 bg-gradient-to-tr from-blue-900 to-indigo-900 aspect-[4/5] max-h-[500px]">
                <img
                  src="/images/indian_doctors_hero_clean.jpg"
                  alt="Doctor with Gyrex Practice Growth System"
                  className="w-full h-full object-cover object-top filter contrast-105"
                  onError={(e) => {
                    // Fallback to doctor hero portrait
                    (e.target as HTMLImageElement).src = "/doctor_hero_portrait.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Doctor Bio Overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <p className="text-sm font-black flex items-center gap-1.5">
                    Dr. Siddhant
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Practitioner
                    </span>
                  </p>
                  <p className="text-xs text-slate-300">Specialty Clinical Director • Gyrex Powered Practice</p>
                </div>
              </div>

              {/* Floating Performance Badge 1: WhatsApp Booking Notification */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -top-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3 z-20 max-w-[260px]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0 relative">
                  <MessageSquare className="w-5 h-5 fill-white" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 leading-none">24/7 AI Receptionist</span>
                  <p className="text-xs font-bold text-slate-900 leading-tight mt-0.5">New Consultation Confirmed (4:30 PM)</p>
                </div>
              </motion.div>

              {/* Floating Performance Badge 2: Google Maps #1 Rank Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                    <span className="text-xs font-black text-slate-800 ml-1">Rank #1</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">+33 Google Reviews / mo</p>
                </div>
              </motion.div>

            </motion.div>

          </div>

          {/* ── INTERACTIVE 3D PLATFORM DASHBOARD SHOWCASE ── */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. 5×5 Geo Rank Heatmap Widget */}
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">5×5 Geo Rank Heatmap</span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Top 3 Rank</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 aspect-square bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {[1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2, 1, 1, 1, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 3].map((rank, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center font-black text-xs text-emerald-700 hover:scale-110 transition-transform cursor-default">
                      {rank}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium text-center">Rank #1–#3 across 25 neighborhood catchment nodes</p>
              </div>

              {/* 2. WhatsApp 5-Star Review Pipeline Widget */}
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">WhatsApp 5-Star Engine</span>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">98% Open Rate</span>
                  </div>
                  <div className="bg-emerald-600/10 border border-emerald-500/20 p-3 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-emerald-950">Patient Post-Consultation Survey</p>
                    <p className="text-[11px] text-slate-600 leading-snug">"Thank you for visiting today! How was your consultation with the doctor?"</p>
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Google Review Velocity</span>
                  <span className="text-xs font-black text-emerald-600">+70% Conversion</span>
                </div>
              </div>

              {/* 3. Specialty Website & AI Receptionist Widget */}
              <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Specialty Website &amp; AI</span>
                    <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Custom Domain</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Google PageSpeed</span>
                      <span className="font-black text-emerald-600">99 / 100 ⚡</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">AI Receptionist Status</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Online 24/7
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Specialty Theme</span>
                      <span className="font-bold text-purple-700">20 Presets</span>
                    </div>
                  </div>
                </div>
                <Link href="#clinic-websites">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Explore 20 Themes</span>
                  </Button>
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── METRICS & SOCIAL PROOF BAR ── */}
      <section ref={statsRef} className="bg-white py-12 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
            Engineered For Medical Practices, Dentists, Dermatologists &amp; Specialty Clinics
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">500+</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">Active Clinics</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.1 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600">4.9 ★</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">Average Rating</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-3xl sm:text-4xl font-black text-blue-600">98%</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">WhatsApp Open Rate</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.3 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
              <span className="text-3xl sm:text-4xl font-black text-purple-600">20</span>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">Specialty Themes</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION: HEALTHCARE WEBSITE BUILDER WITH RICH IMAGERY & DUAL DEVICE PREVIEW ── */}
      <section id="clinic-websites" ref={websitesRef} className="py-24 bg-white relative overflow-hidden border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-indigo-100">
              <Layout className="w-3.5 h-3.5 text-indigo-600" /> Healthcare Website Builder
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              High-Converting Websites Built for 20 Medical Specialties
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Launch a blazing-fast, custom branded clinic website in minutes. Pre-configured with clinical service menus, patient review trust badges, 1-click WhatsApp booking, and Google 99+ PageSpeed.
            </p>

            {/* Interactive Theme Switcher Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {SPECIALTY_THEMES.map((theme, idx) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedThemeIndex === idx
                      ? "bg-slate-900 text-white shadow-lg scale-105"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{theme.icon}</span>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Dynamic Theme Mockup Canvas with Real Clinical Photos */}
          <motion.div
            key={activeTheme.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="max-w-6xl mx-auto bg-gradient-to-b from-slate-50 to-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl space-y-8"
          >
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-slate-500 text-[11px] ml-2 font-semibold">
                  https://{activeTheme.id.replace("-", "")}.gyrex.in (or your own custom domain)
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                <Zap className="w-3 h-3 text-emerald-600" /> 99+ PageSpeed
              </span>
            </div>

            {/* Mockup Theme Hero with Real Photography */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Headlines & Services */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${activeTheme.color}15`, color: activeTheme.color }}>
                  <span>{activeTheme.icon}</span>
                  <span>{activeTheme.specialty}</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                  {activeTheme.headline}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeTheme.badges.map((b, i) => (
                    <span key={i} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-slate-800">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Services Pills */}
                <div className="pt-2">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">Featured Clinical Procedures</span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTheme.services.map((svc, i) => (
                      <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: activeTheme.color }} />
                        <span className="truncate">{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    className="text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: activeTheme.color }}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Consultation</span>
                  </button>
                  <button className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>WhatsApp Receptionist</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Real Doctor Photo & Clinic Hero Mockup */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Doctor Visual Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                    <img
                      src={activeTheme.heroImage}
                      alt={activeTheme.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Floating Doctor Thumbnail */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2.5 text-white">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-slate-200">
                        <img
                          src={activeTheme.doctorPhoto}
                          alt={activeTheme.doctorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-black leading-tight text-white">{activeTheme.doctorName}</h4>
                        <p className="text-[10px] text-slate-200 leading-tight">{activeTheme.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                      <span className="text-xs font-bold text-slate-800 ml-1">4.9 Rating</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      120+ Google Reviews
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* 4 Feature Pillars for Website Builder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <h4 className="text-base font-bold text-slate-900">Custom Branded Domain</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Connect your personal domain (e.g. drvinaykumar.com) with automatic free SSL security.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <Palette className="w-6 h-6 text-purple-600" />
              <h4 className="text-base font-bold text-slate-900">Zero-Code Elementor Builder</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Customize hero headlines, color palettes, clinical services, and packages in real time.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <Bot className="w-6 h-6 text-emerald-600" />
              <h4 className="text-base font-bold text-slate-900">24/7 WhatsApp Receptionist</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Floating pulse widget and hero booking CTAs link directly to your practice WhatsApp line.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <Zap className="w-6 h-6 text-amber-600" />
              <h4 className="text-base font-bold text-slate-900">Google 99+ PageSpeed &amp; SEO</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Built on Next.js Turbopack with automated MedicalBusiness Schema for instant Google ranking.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── COMPLETE FEATURE MATRIX SECTION ── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-100">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Full Growth Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything Your Clinic Needs to Grow</h2>
            <p className="text-sm text-slate-600">From local Google search domination to specialty websites and automated WhatsApp practice management.</p>
            
            {/* Category Filter Tabs (3 Tabs) */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => setActiveFeatureCategory("growth")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "growth"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Local SEO &amp; Growth
              </button>
              <button
                onClick={() => setActiveFeatureCategory("websites")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "websites"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Websites &amp; CMS
              </button>
              <button
                onClick={() => setActiveFeatureCategory("operations")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "operations"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Operations &amp; WhatsApp
              </button>
            </div>
          </div>

          {/* Feature Grid — categorized & animated */}
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* ── GROWTH FEATURES ── */}
            {activeFeatureCategory === "growth" && (<>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">5×5 Geo-Rank Heatmap Tracker</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simulates 25 virtual searchers across a 5km radius to show your clinic&apos;s exact Google Maps position for keywords like &quot;Dermatologist near me&quot;.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real-time Google Map Pack Audit
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.07 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Star className="w-5 h-5 fill-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">5-Star WhatsApp Review Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically dispatches 2-step feedback surveys via WhatsApp after consultations. Converts 70%+ of happy patients into 5-star Google reviews.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 98% Patient Response Rate
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.14 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">4-Pillar Competitor Gap Matrix</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Live Google Places API competitor benchmark. Pinpoints the exact review count gap required to overtake Rank #1 on Google Maps.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Exact Review Volume Benchmark
                </div>
              </motion.div>
            </>)}

            {/* ── WEBSITES & CMS FEATURES ── */}
            {activeFeatureCategory === "websites" && (<>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">20 Specialty Clinical Themes</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored presets for Pediatrics, Derma, Dental, IVF, Cardiology, Ortho, Diabetology, Ayurveda, and more with clinical service menus.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Specialty Presets
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.07 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Full WYSIWYG Blog Composer</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Publish rich patient education playbooks with clinical callout boxes, comparison tables, inline images, and Google E-E-A-T schemas.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SEO &amp; GEO Rich Snippets
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Custom Branded Domains</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full white-label custom domain support (e.g. drvinaykumar.com) with automated SSL certification and 99+ PageSpeed optimization.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free Automated SSL
                </div>
              </motion.div>
            </>)}

            {/* ── OPERATIONS & WHATSAPP FEATURES ── */}
            {activeFeatureCategory === "operations" && (<>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                id="whatsapp-engine" className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Shared WhatsApp Business Inbox</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clinic-wide shared inbox for managing patient conversations, appointment tags, and inquiry logs with multi-staff assignment.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unified Patient Conversations
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.07 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Patient Management (CRM)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Centralized patient database with medical profiles, visit histories, practitioner assignments, and full communication logs.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Structured Patient Records
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Appointment Scheduling</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart booking calendar for slot management, consultation scheduling, and practitioner availability.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Effortless Slot Booking
                </div>
              </motion.div>
            </>)}

          </div>

        </div>
      </section>

      {/* ── INTERACTIVE ROI CALCULATOR SECTION ── */}
      <section id="roi-calculator" className="py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-400/30">
                <Calculator className="w-3.5 h-3.5" /> Interactive Growth Calculator
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Calculate Your Practice&apos;s Additional Annual Revenue
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                See how capturing even 10–15 additional high-ticket consultations per month from Google Maps and 24/7 WhatsApp response compounds your clinic earnings.
              </p>

              {/* Sliders */}
              <div className="space-y-5 pt-2">
                <div className="space-y-2">
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

                <div className="space-y-2">
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
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center space-y-4 shadow-xl">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Projected Annual Growth</p>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">
                ₹{annualRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-300">
                +₹{monthlyRevenue.toLocaleString("en-IN")} in additional monthly revenue
              </p>
              <div className="pt-4 border-t border-white/10">
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

      {/* ── PRICING SECTION: 3-TIER BALANCED UI/UX ── */}
      <section id="pricing" ref={pricingRef} className="py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-100">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Transparent Practice Plans
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Invest in Predictable Practice Growth
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Transparent plans tailored for solo clinics, busy specialty practices, and multi-location hospital networks.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
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

          {/* 3-Tier Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* TIER 1: Starter Practice */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                  🌱 Solo Clinic
                </div>
                <h3 className="text-xl font-black text-slate-900">Starter Practice</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Essential Google Maps visibility and basic WhatsApp patient communication.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{billingCycle === "yearly" ? "1,999" : "2,499"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 3×3 Geo-Rank Heatmap Scanner</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 5-Star WhatsApp Review Engine (50/mo)</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Subdomain Clinic Website (e.g. drname.gyrex.in)</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Patient CRM &amp; OPD Booking Calendar</div>
                  <div className="flex items-center gap-2.5 text-slate-400"><X className="w-4 h-4 text-slate-300 shrink-0" /> Custom Branded Domain</div>
                  <div className="flex items-center gap-2.5 text-slate-400"><X className="w-4 h-4 text-slate-300 shrink-0" /> 24/7 WhatsApp AI Receptionist</div>
                </div>
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full font-bold text-xs h-12 rounded-xl border-slate-300 hover:bg-slate-50 text-slate-900">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>

            {/* TIER 2: Growth & Domination (Featured) */}
            <div className="bg-gradient-to-b from-white to-blue-50/40 p-8 rounded-3xl border-2 border-blue-600 shadow-2xl ring-4 ring-blue-600/10 flex flex-col justify-between space-y-6 relative md:-translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Most Popular Choice
              </span>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                  🚀 Specialty Practice
                </div>
                <h3 className="text-xl font-black text-slate-900">Growth &amp; Domination</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full practice OS with 20 Specialty Website themes, 24/7 AI receptionist &amp; automated 5-star review engine.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-black text-blue-600">
                    ₹{billingCycle === "yearly" ? "3,999" : "4,999"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-200/60 text-xs text-slate-800 font-semibold">
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> 5×5 Geo-Rank Heatmap Tracker (25 Nodes)</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> 20 Specialty Clinical Website Themes</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Custom Branded Domain + Free SSL</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> 24/7 WhatsApp AI Receptionist (6 Languages)</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Unlimited 5-Star WhatsApp Reviews</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Full WYSIWYG Patient Education Blog</div>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-12 rounded-xl shadow-lg shadow-blue-500/20">
                  Launch Growth Plan 🚀
                </Button>
              </Link>
            </div>

            {/* TIER 3: Elite & Multi-Location */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                  🏥 Multi-Location / Chain
                </div>
                <h3 className="text-xl font-black text-slate-900">Elite &amp; Multi-Clinic</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enterprise growth suite for hospital chains and multi-practitioner centers.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-black text-slate-900">
                    ₹{billingCycle === "yearly" ? "7,999" : "9,999"}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold"> / month</span>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Multi-Location GBP Sync (Up to 5 Clinics)</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Multiple Doctor Sub-Domains &amp; Portals</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Dedicated Account Manager &amp; Custom Onboarding</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Custom WhatsApp Flow Integrations</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> Priority 24/7 Phone &amp; SLA Support</div>
                </div>
              </div>
              <Link href="/contact">
                <Button variant="outline" className="w-full font-bold text-xs h-12 rounded-xl border-slate-300 hover:bg-slate-50 text-slate-900">
                  Talk to Enterprise Sales
                </Button>
              </Link>
            </div>

          </div>

          {/* Bottom Trust Guarantee */}
          <div className="text-center pt-6 text-xs text-slate-500 flex items-center justify-center gap-6 flex-wrap">
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

      {/* ── FAQ SECTION ── */}
      <section id="faq" ref={faqRef} className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-blue-100">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> FAQs
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I connect my own custom domain to my clinic website?",
                a: "Yes! You can connect any custom domain (e.g. drvinaykumar.com or citydental.in) with 1 click. We provide automated free SSL certification and high-speed global CDN hosting.",
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
