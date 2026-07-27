"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Star, ArrowRight, CheckCircle2, TrendingUp, Users, MessageSquare,
  Search, MapPin, Building2, ChevronRight, Zap, Globe, BarChart3,
  Calendar, Phone, Clock, Shield, Heart, Award, Play, ChevronDown, Layers, Database,
  Cpu, Target, Sparkles, ArrowUpRight, Signal, RefreshCw, Check, Share2, Menu, X,
  ShieldCheck, Calculator, ArrowRightCircle
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

      {/* ── HERO SECTION (GREXA.AI INSPIRED) ── */}
      <section id="overview" className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge: Free Google Profile Booster */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-purple-900 tracking-wide">Free Google Profile Booster</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Your All-in-One Clinic Growth Engine that <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">Delivers Real Patients</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Trusted by 500+ doctors, dermatologists, dentists, and healthcare practices to dominate local Google search and automate patient WhatsApp follow-ups.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/local-seo/free-audit" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-7 h-13 text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 border border-emerald-500">
                  <MessageSquare className="w-5 h-5 text-white" />
                  Free Google Profile Booster
                </Button>
              </Link>
              <Link href="/local-seo/free-audit" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl px-7 h-13 text-base">
                  Book Free Demo
                </Button>
              </Link>
            </div>

            {/* Instant Search Bar Scanner */}
            <div className="pt-6 max-w-xl mx-auto">
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
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
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
              <p className="text-[11px] text-slate-400 mt-2">Instant 60-second scan · Live Google Places API integration</p>
            </div>

          </div>

          {/* Floating Interactive 3D Dashboard Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Heatmap Widget */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">5×5 Geo Rank Heatmap</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Top 3 Rank</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 aspect-square bg-white p-2 rounded-xl border border-slate-200/50">
                  {[1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2, 1, 1, 1, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 3].map((rank, i) => (
                    <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center font-black text-xs text-emerald-700">
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
                    <p className="text-xs font-semibold text-emerald-900">Dr. Vinay Kumar Rai Clinic</p>
                    <p className="text-[11px] text-slate-600 leading-snug">"Thank you for visiting! How was your consultation today?"</p>
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Google Review Output</span>
                  <span className="text-xs font-bold text-emerald-600">+33 Reviews / mo</span>
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
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">500+</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Active Clinics</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600">4.9 ★</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Average Clinic Rating</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
              <span className="text-3xl sm:text-4xl font-black text-blue-600">98%</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">WhatsApp Open Rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
              <span className="text-3xl sm:text-4xl font-black text-purple-600">+70%</span>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Review Conversion</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-PILLAR FEATURE ENGINE CARDS (GREXA.AI INSPIRED) ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Growth Modules</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Built for Maximum Patient Acquisition</h2>
            <p className="text-sm text-slate-600">Automate your entire digital patient growth funnel in one clean platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">1. 5-Star WhatsApp Review Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically dispatches 2-step feedback surveys via WhatsApp after consultations. Converts 70%+ of happy patients into 5-star Google reviews while keeping negative feedback internal.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> 98% Patient Response Rate
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">2. 5×5 Geo-Rank Heatmap Tracker</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Simulates 25 virtual searchers across a 5km radius to discover your clinic's exact position for keywords like "Pediatrician near me" or "Skin Specialist".
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-700">
                <CheckCircle2 className="w-4 h-4" /> Real-time Google Map Pack Audit
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">3. 4-Pillar Competitor Gap Matrix</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Live Google Places API competitor benchmark analyzing review counts, star ratings, and category coverage. Pinpoints the exact review gap required to overtake Rank #1.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-700">
                <CheckCircle2 className="w-4 h-4" /> Exact Review Volume Benchmark
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-3xl border border-purple-100 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">4. 24/7 Automated Booking Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated WhatsApp assistant answers patient FAQs, explains clinic operating hours, and guides patients to book consultations even when your office is closed.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-purple-700">
                <CheckCircle2 className="w-4 h-4" /> Zero After-Hours Leads Lost
              </div>
            </div>

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
            Run a instant 60-second local search audit on Google Maps across a 5km radius around your clinic.
          </p>
          <div className="pt-2">
            <Link href="/local-seo/free-audit">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-8 h-14 text-base shadow-xl flex items-center gap-2.5 mx-auto border border-emerald-400">
                <MessageSquare className="w-5 h-5 fill-white" />
                Run Free 60-Second Clinic Audit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CLINIC OWNER ADVANTAGES & INTERACTIVE ROI CALCULATOR ── */}
      <section id="advantages" className="py-20 bg-white border-b border-slate-200">
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
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 text-center">
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

      {/* ── DOCTOR TESTIMONIALS & CASE STUDY (DR. VINAY KUMAR RAI) ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Verified Clinic Case Study</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trusted by Leading Doctors</h2>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto text-left space-y-6">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400" />)}
            </div>

            <p className="text-base sm:text-lg text-slate-700 italic leading-relaxed">
              "Increased our Google reviews from 45 to 78 in 30 days and hit Rank #2 on Google Maps within a 5km radius. Patient WhatsApp response rates are incredible."
            </p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <div>
                <h4 className="text-base font-bold text-slate-900">Dr. Vinay Kumar Rai</h4>
                <p className="text-xs text-slate-500">Pediatrician · Pediatric Clinic, South Delhi</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Rank #2 on Google Maps
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM CONVERSION CTA BANNER ── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Dominate Local Search in Your Neighborhood?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Join 500+ clinics getting more patients automatically. Claim your 14-day risk-free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-8 h-14 text-base shadow-lg shadow-blue-600/30">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/local-seo/free-audit" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl px-8 h-14 text-base">
                Free Google Profile Booster
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
