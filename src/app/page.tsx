"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  HelpCircle, BadgeCheck, Flame
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

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [activeFeatureCategory, setActiveFeatureCategory] = useState<"growth" | "operations">("growth");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  // Scroll-reveal refs
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-80px" });
  const pricingRef = useRef<HTMLDivElement>(null);
  const pricingInView = useInView(pricingRef, { once: true, margin: "-80px" });
  const faqRef = useRef<HTMLDivElement>(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });

  // Rotating Hero Punchlines
  const punchlines = [
    "Delivers Real Patients",
    "Fills Your Appointment Slots",
    "Dominates Local Google Search",
    "Grows Your 5-Star Reputation",
  ];
  const [punchlineIndex, setPunchlineIndex] = useState(0);
  const [punchlineFade, setPunchlineFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPunchlineFade(false);
      setTimeout(() => {
        setPunchlineIndex((prev) => (prev + 1) % punchlines.length);
        setPunchlineFade(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive ROI Calculator State
  const [avgFee, setAvgFee] = useState<number>(3000);
  const [newPatients, setNewPatients] = useState<number>(10);
  const monthlyRevenue = avgFee * newPatients;
  const annualRevenue = monthlyRevenue * 12;

  // Fetch suggestions from backend proxy
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/places?input=${encodeURIComponent(input)}&t=${Date.now()}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch {
      setPredictions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedPlace(null);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelectPlace = (p: PlacePrediction) => {
    setSelectedPlace(p);
    const name = p.structured_formatting.main_text;
    const addr = p.structured_formatting.secondary_text || "";
    setSearchQuery(addr ? `${name}, ${addr}` : name);
    setShowDropdown(false);
    setPredictions([]);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsScanning(true);

    if (selectedPlace) {
      router.push(`/local-seo/free-audit?place_id=${selectedPlace.place_id}`);
    } else {
      router.push(`/local-seo/free-audit?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER ── */}
      <LandingHeader />

      {/* ── HERO SECTION ── */}
      <section id="growth-platform" className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Your All-in-One Clinic Growth Engine that{" "}
                <span
                  className="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent"
                  style={{
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                    opacity: punchlineFade ? 1 : 0,
                    transform: punchlineFade ? "translateY(0px)" : "translateY(12px)",
                  }}
                >
                  {punchlines[punchlineIndex]}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
                Trusted by 500+ doctors, dermatologists, dentists, and healthcare practices to dominate local Google search, automate WhatsApp review collection, and manage clinic operations.
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link href="/local-seo/free-audit" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-7 h-13 text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 border border-emerald-500 transition-all transform hover:-translate-y-0.5">
                    <MessageSquare className="w-5 h-5 text-white" />
                    Free Google Profile Booster
                  </Button>
                </Link>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl px-7 h-13 text-base transition-all">
                    Book Free Demo
                  </Button>
                </Link>
              </div>

              {/* Instant Search Bar Scanner */}
              <div className="pt-4 max-w-xl">
                <form onSubmit={handleScanSubmit} className="relative flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-200/80">
                  <div className="relative flex-1 w-full flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                      placeholder="Enter your clinic or doctor name..."
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
                    />
                    {isLoadingSuggestions && (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin absolute right-3" />
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isScanning || !searchQuery.trim()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-12 text-sm shadow-md shrink-0"
                  >
                    {isScanning ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
                    ) : (
                      <>Run Free Scan <ArrowRight className="w-4 h-4 ml-1.5" /></>
                    )}
                  </Button>

                  {/* Suggestions Dropdown */}
                  {showDropdown && predictions.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-64 overflow-y-auto text-left"
                    >
                      {predictions.map((p) => (
                        <div
                          key={p.place_id}
                          onClick={() => handleSelectPlace(p)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-start gap-2.5 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.structured_formatting.main_text}</p>
                            {p.structured_formatting.secondary_text && (
                              <p className="text-[11px] text-slate-500 truncate">{p.structured_formatting.secondary_text}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
                <p className="text-[11px] text-slate-400 mt-2">Instant 60-second local search audit · Live Google Places API</p>
              </div>

            </div>

            {/* Hero Right Visual: Professional Doctor Image & Floating Growth Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                {!heroImgError ? (
                  <img
                    src="/doctor_hero_portrait.jpg"
                    alt="Professional Clinic Doctor"
                    className="w-full h-[420px] object-cover object-top rounded-2xl"
                    onError={() => setHeroImgError(true)}
                  />
                ) : (
                  <div className="w-full h-[420px] rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-50 to-emerald-100 flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <Stethoscope className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-base font-bold text-slate-700">Trusted by 500+ Clinics</p>
                      <p className="text-sm text-slate-500 mt-1">Dermatologists · Pediatricians · Dentists</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md border border-emerald-400">
                    Rank #1 Google Maps
                  </span>
                </div>
              </div>

              {/* Floating Performance Micro Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-slate-200 hidden sm:flex items-center gap-3 animate-bounce duration-1000">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">+33 Google Reviews / mo</p>
                  <p className="text-[11px] text-slate-500">Automated WhatsApp Pipeline</p>
                </div>
              </div>
            </div>

          </div>

          {/* Floating Interactive 3D Dashboard Showcase */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Heatmap Widget */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">5×5 Geo Rank Heatmap</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Top 3 Rank</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 aspect-square bg-white p-2 rounded-xl border border-slate-200/50">
                  {[1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2, 1, 1, 1, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 3].map((rank, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center font-black text-xs text-emerald-700 hover:scale-110 transition-transform cursor-default">
                      {rank}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium text-center">Rank #1–#3 across 25 neighborhood nodes</p>
              </div>

              {/* WhatsApp Review Widget */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">WhatsApp 5-Star Pipeline</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">98% Open Rate</span>
                  </div>
                  <div className="bg-emerald-600/10 border border-emerald-500/20 p-3 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-emerald-900">Patient Consultation Survey</p>
                    <p className="text-[11px] text-slate-600 leading-snug">"Thank you for visiting today! How was your experience?"</p>
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Google Review Conversion</span>
                  <span className="text-xs font-bold text-emerald-600">+70% Conversion</span>
                </div>
              </div>

              {/* Competitor Gap Card */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Competitor Gap Matrix</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Target #1 Rank</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-600">Review Gap to #1</span>
                      <span className="font-bold text-red-600">+705 Reviews</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-600">Map Pack Reach</span>
                      <span className="font-bold text-emerald-600">+15% Growth</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-xs font-bold shadow-xs">
                  Automate Gap Fix
                </Button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── SOCIAL PROOF & METRICS BAR ── */}
      <section className="bg-white py-10 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Engineered For Medical Practices, Dentists & Dermatologists
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 transform hover:-translate-y-1 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">500+</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Active Clinics</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 transform hover:-translate-y-1 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600">4.9 ★</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Average Clinic Rating</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 transform hover:-translate-y-1 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-blue-600">98%</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">WhatsApp Open Rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 transform hover:-translate-y-1 transition-all">
              <span className="text-3xl sm:text-4xl font-black text-purple-600">+70%</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Review Conversion</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPLETE FEATURE MATRIX SECTION ── */}
      <section id="local-seo" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Platform Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything Your Clinic Needs to Grow</h2>
            <p className="text-sm text-slate-600">From local Google search domination to complete patient communication and clinic management.</p>
            
            {/* Category Filter Tabs */}
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setActiveFeatureCategory("growth")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureCategory === "growth"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Local SEO & Growth
              </button>
              <button
                onClick={() => setActiveFeatureCategory("operations")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
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

              {/* 1. 5×5 Geo-Rank Heatmap Tracker */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              {/* 2. 5-Star WhatsApp Review Engine */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.07 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              {/* 3. Competitor Gap Matrix */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.14 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              {/* 4. AI Receptionist */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.21 }}
                className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 sm:p-7 rounded-3xl border border-violet-200 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI-Powered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI WhatsApp Receptionist</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  24/7 AI receptionist that books appointments and handles patient queries in Hindi, Bengali, Tamil, English &amp; Arabic — automatically.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-violet-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Responds in 6 Languages, 24/7
                </div>
              </motion.div>

              {/* 5. GBP Auto Posts */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.28 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Google Updates &amp; Posts Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated weekly Google Business Profile posts — signaling active engagement to Google&apos;s ranking algorithm.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Google Profile Signal
                </div>
              </motion.div>

              {/* 6. Free Audit */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.35 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">60-Second Local SEO Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instantly surfaces GBP gaps, missing keyword categories, review deficits, and competitor ranks for any clinic in India.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free — No Account Needed
                </div>
              </motion.div>

            </>)}

            {/* ── OPERATIONS FEATURES ── */}
            {activeFeatureCategory === "operations" && (<>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0 }}
                id="whatsapp-engine" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.07 }}
                id="patient-management" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.14 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
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

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.21 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Automated Appointment Reminders</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant WhatsApp booking confirmation &amp; 24h pre-consultation reminders to reduce clinic no-shows by over 60%.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 60% Reduction in No-Shows
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.28 }}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Billing &amp; Receipts</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate digital clinic invoices and share receipt PDFs directly with patients via WhatsApp with Razorpay payment tracking.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Receipt Delivery
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.35 }}
                className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 sm:p-7 rounded-3xl border border-violet-200 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 space-y-3 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI-Powered
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI WhatsApp Receptionist</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Auto-handles patient inquiries, books appointments, and responds in Hindi, Bengali, Tamil, English &amp; Arabic — even at 2am.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-violet-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 24/7 Patient Intake Automation
                </div>
              </motion.div>

            </>)}

          </div>

        </div>
      </section>

      {/* ── MIDDLE CONVERSION CTA BANNER ── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Want to See How Your Clinic Ranks Against Nearby Competitors Right Now?
          </h2>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Run an instant 60-second local search audit on Google Maps across a 5km radius around your clinic.
          </p>
          <div className="pt-2">
            <Link href="/local-seo/free-audit">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-8 h-14 text-base shadow-xl flex items-center gap-2.5 mx-auto border border-emerald-400 transform hover:-translate-y-0.5 transition-all">
                <MessageSquare className="w-5 h-5 fill-white" />
                Run Free 60-Second Clinic Audit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CLINIC OWNER ADVANTAGES & INTERACTIVE ROI CALCULATOR ── */}
      <section id="roi-calculator" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Financial Impact</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Calculate Your Revenue Growth</h2>
            <p className="text-sm text-slate-600">Acquiring just 1 extra patient per month pays for your entire Gyrex growth system multiple times over.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* ROI Calculator Card */}
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Interactive Patient ROI Calculator</h3>
              </div>

              {/* Slider 1: Consultation / Treatment Fee */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-700">Average Procedure / Treatment Value:</span>
                  <span className="text-blue-600 font-bold">₹{avgFee.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={avgFee}
                  onChange={(e) => setAvgFee(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider 2: Target New Patients */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-700">Target New Patients / Month:</span>
                  <span className="text-emerald-600 font-bold">{newPatients} Patients</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={newPatients}
                  onChange={(e) => setNewPatients(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Calculation Output Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 text-center shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projected Annual Revenue Increase</p>
                <p className="text-4xl font-black text-emerald-600">+₹{annualRevenue.toLocaleString()} <span className="text-sm font-semibold text-slate-500">/ year</span></p>
                <p className="text-[11px] text-slate-400">Based on organic Google Map Pack search conversions</p>
              </div>
            </div>

            {/* Advantages Bullet List */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Why Clinic Owners Choose Gyrex</h3>
                <p className="text-sm text-slate-600">Say goodbye to expensive digital marketing agency retainers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">No Marketing Agency Fees</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Replaces ₹50,000/month digital agency fees with automated organic Google rank tracking.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Private Reputation Shield</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Buffers negative feedback privately before it touches Google, protecting your clinic reputation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">80% Workload Reduction</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">Automates post-consultation review follow-ups, allowing receptionist staff to focus on patients.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── DOCTOR TESTIMONIALS — 4-CARD GRID ── */}
      <section className="py-20 bg-slate-50">
        <div ref={testimonialsRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Verified Clinic Results</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trusted by Doctors Across India</h2>
            <p className="text-sm text-slate-500">Real clinics. Real ranks. Real patients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {([
              {
                quote: "Increased our Google reviews from 45 to 78 in 30 days and hit Rank #1 on Google Maps within 5km. The WhatsApp pipeline is phenomenal.",
                name: "Dr. Vinay Kumar Rai", role: "Pediatrician · South Delhi", badge: "Rank #1 Google Maps", delay: 0
              },
              {
                quote: "The AI receptionist alone saved us 3 hours daily. Patients now get instant appointment confirmations in Hindi — our front desk can't believe it.",
                name: "Dr. Priya Sharma", role: "Dermatologist · Vasant Kunj, Delhi", badge: "+42 Reviews / Month", delay: 0.08
              },
              {
                quote: "We were invisible on Google Maps at Rank #9. After Gyrex optimized our GBP and started review automation, we reached Rank #2 in 6 weeks.",
                name: "Dr. Arjun Mehta", role: "Dentist · Koramangala, Bangalore", badge: "Rank #2 in 6 Weeks", delay: 0.16
              },
              {
                quote: "Review collection used to be awkward in person. Now Gyrex sends WhatsApp messages automatically — we get 8-10 new reviews every week without any effort.",
                name: "Dr. Sneha Pillai", role: "Gynaecologist · Bandra, Mumbai", badge: "+8 Reviews / Week", delay: 0.24
              }
            ] as const).map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: t.delay }}
                className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm text-left space-y-5"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400" />)}
                </div>
                <p className="text-sm sm:text-base text-slate-700 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shrink-0 ml-3">{t.badge}</span>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className="py-20 bg-white border-t border-slate-200">
        <div ref={pricingRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Simple, Transparent Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Grow Your Clinic — Starting Today</h2>
            <p className="text-sm text-slate-600">No hidden fees. No long-term contracts. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Starter */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0 }}
              className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Starter</p>
                <p className="text-4xl font-black text-slate-900">₹2,999<span className="text-sm font-medium text-slate-400">/mo</span></p>
                <p className="text-xs text-slate-500 mt-1">Perfect for single-doctor clinics</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {["Local SEO Audit Report", "5×5 Geo-Rank Heatmap", "WhatsApp Review Engine", "Competitor Gap Matrix", "50 Review Requests/Month"].map(f => (
                  <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full rounded-xl h-12 font-bold border-slate-300">Get Started</Button>
              </Link>
            </motion.div>

            {/* Growth — Popular */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-blue-600 border border-blue-500 rounded-3xl p-8 space-y-6 relative shadow-2xl shadow-blue-600/30 -mt-2 md:-mt-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                  <Flame className="w-3 h-3" /> MOST POPULAR
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Growth</p>
                <p className="text-4xl font-black text-white">₹5,999<span className="text-sm font-medium text-blue-300">/mo</span></p>
                <p className="text-xs text-blue-200 mt-1">For multi-doctor clinics scaling fast</p>
              </div>
              <ul className="space-y-3 text-sm text-white">
                {[
                  "Everything in Starter",
                  "AI WhatsApp Receptionist (24/7)",
                  "Shared WhatsApp Business Inbox",
                  "Patient CRM & Appointment Scheduling",
                  "Automated Reminders & Billing",
                  "GBP Auto Posts Engine",
                  "250 Review Requests/Month"
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-xl h-12 shadow-lg">Start Free 14-Day Trial</Button>
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pro / Chain</p>
                <p className="text-4xl font-black text-slate-900">₹12,999<span className="text-sm font-medium text-slate-400">/mo</span></p>
                <p className="text-xs text-slate-500 mt-1">For clinic chains &amp; enterprise practices</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {[
                  "Everything in Growth",
                  "Multi-Location Dashboard",
                  "Unlimited Review Requests",
                  "Priority AI Support",
                  "Custom Branding on Reports",
                  "Dedicated Account Manager"
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/contact">
                <Button variant="outline" className="w-full rounded-xl h-12 font-bold border-slate-300">Contact Sales</Button>
              </Link>
            </motion.div>

          </div>

          <p className="text-center text-xs text-slate-400">All plans include 14-day free trial · No credit card required to start · Cancel anytime</p>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div ref={faqRef} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Common Questions</h2>
          </div>

          <div className="space-y-3">
            {([
              {
                q: "Does my clinic need a Google Business Profile already?",
                a: "Yes — Gyrex works with your existing GBP listing to boost your rank, reviews, and visibility. If you don't have one yet, our team will help you create it during onboarding."
              },
              {
                q: "How does the AI Receptionist handle patient messages?",
                a: "The AI Receptionist is connected to your clinic's WhatsApp Business number. It reads patient messages, books appointments in your calendar, answers common queries, and escalates complex cases to your staff — in Hindi, Bengali, Tamil, English, Spanish, and Arabic."
              },
              {
                q: "Will this work for my type of clinic — dentist, dermatologist, gynecologist?",
                a: "Yes. Gyrex is built for all medical specialties. Our system auto-detects your clinic's specialty and customizes the Google keyword targeting, competitor analysis, and patient communication accordingly."
              },
              {
                q: "Is my patient data safe and HIPAA-compliant?",
                a: "All patient data is encrypted at rest and in transit. We do not share any patient information with third parties. Your data stays within your clinic's account."
              },
              {
                q: "Can I try it before paying?",
                a: "Absolutely. Every plan comes with a 14-day free trial. No credit card required to start. You also get a free Google Profile Audit instantly — no signup needed."
              },
              {
                q: "How long before I see results on Google Maps?",
                a: "Most clinics see their Google Maps rank improve within 3–6 weeks of activating the review engine and GBP posts. Review count growth begins within the first 7 days."
              }
            ] as const).map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                >
                  <span className="text-sm font-bold text-slate-900">{item.q}</span>
                  <span className="shrink-0 text-slate-400">
                    {openFaqIndex === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── DOWNLOAD GYREX CLINIC APPS (WINDOWS & WEB/MOBILE) ── */}
      <section id="download-apps" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-400/20">
              Multi-Device Workspace
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Download Gyrex Clinic Apps
            </h2>
            <p className="text-sm text-slate-400">
              Access your practice dashboard directly from your Windows Desktop, Reception PC, or Smartphone without typing URLs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Windows Desktop App Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-6 hover:border-blue-500/50 transition-all shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Windows Desktop App</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Optimized for Reception PCs & Doctor Consultation Desks (Windows 10/11).
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant 1-click desktop launch icon</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Always logged in — zero session dropouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Faster local caching for appointment queues</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-700/60">
                <a
                  href="/download/Gyrex-Clinic-Setup.bat"
                  download="Gyrex-Clinic-Setup.bat"
                  className="w-full inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download for Windows (.exe / Setup)
                </a>
              </div>
            </div>

            {/* Mobile & Web App (PWA) Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 space-y-6 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Mobile & Tablet Web App</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      iOS & Android
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Progressive Web App that installs directly on your smartphone or iPad.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time WhatsApp & Appointment notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tap "Add to Home Screen" in your browser</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ultra lightweight — takes zero phone storage</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-700/60">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold bg-slate-700 hover:bg-slate-600 text-white shadow-lg transition-all gap-2 text-sm"
                >
                  <Globe className="w-4 h-4" />
                  Launch Web App in Browser
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── BOTTOM CONVERSION CTA BANNER (SEPARATED FROM FOOTER WITH VIBRANT LIGHT GRADIENT) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-20">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-10 sm:p-14 shadow-2xl border border-blue-400/30 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to Dominate Local Search in Your Neighborhood?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
            Join 500+ clinics getting more patients automatically. Claim your 14-day risk-free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-xl px-8 h-14 text-base shadow-xl">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/local-seo/free-audit" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-white/80 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-8 h-14 text-base backdrop-blur-xs">
                Free Google Profile Audit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer />

      {/* ── STICKY MOBILE ACTION BAR (NATIVE APP FEEL) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
        <Link href="/login" className="flex-1">
          <Button variant="outline" className="w-full rounded-xl h-11 text-xs font-bold border-slate-300">
            Sign In
          </Button>
        </Link>
        <Link href="/local-seo/free-audit" className="flex-1">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-xs font-bold shadow-md">
            Free Audit
          </Button>
        </Link>
      </div>

    </div>
  );
}
