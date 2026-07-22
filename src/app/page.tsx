"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Star, ArrowRight, CheckCircle2, TrendingUp, Users, MessageSquare,
  Search, MapPin, Building2, ChevronRight, Zap, Globe, BarChart3,
  Calendar, Phone, Clock, Shield, Heart, Award, Play, ChevronDown, Layers, Database,
  Cpu, Target, Sparkles, ArrowUpRight, Signal, RefreshCw, Check, Share2, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      
      {/* ── NAVBAR ── */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GyrexLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["Overview", "Data Architecture", "Features", "Process"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/local-seo/free-audit">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-11 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all border border-blue-500/30">
                Get Free Audit
              </Button>
            </Link>
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU OVERLAY ── */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col p-6 animate-in slide-in-from-right-full duration-300 md:hidden">
            <div className="flex items-center justify-between mb-8">
              <GyrexLogo size="md" />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-600 hover:text-blue-600 rounded-full bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 text-lg font-medium text-slate-700">
              {["Overview", "Data Architecture", "Features", "Process"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-blue-600 transition-colors border-b border-slate-100 pb-4"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="mt-auto pb-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl h-12 text-base font-semibold border-slate-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/local-seo/free-audit" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold shadow-md shadow-blue-500/20">
                  Get Free Audit
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section id="overview" className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        {/* Soft Background Gradient Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-blue-400/15 to-indigo-400/5 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-12">
            
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6">
              Your clinic deserves <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                more patients
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Automate your patient acquisition, rank higher on Google, and fill your calendar with an all-in-one practice growth engine.
            </p>

            {/* Audit Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    const params = new URLSearchParams();
                    params.set("q", searchQuery);
                    if (selectedPlace?.place_id) params.set("placeId", selectedPlace.place_id);
                    window.location.href = `/local-seo/free-audit?${params.toString()}`;
                  } else {
                    window.location.href = "/local-seo/free-audit";
                  }
                }}
                className="relative bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search your clinic name or location…"
                    className="w-full pl-12 pr-4 h-13 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                  />

                  {/* Dropdown Suggestions */}
                  {showDropdown && searchQuery.length > 1 && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-left"
                    >
                      {isLoadingSuggestions && (
                        <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                          <Activity className="h-4 w-4 animate-spin text-blue-600" /> Searching location profiles…
                        </div>
                      )}
                      {!isLoadingSuggestions && predictions.length === 0 && searchQuery.length > 2 && (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          No matching clinics found. Type your full clinic name.
                        </div>
                      )}
                      {predictions.map((place) => (
                        <button
                          key={place.place_id}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-blue-50/70 transition-colors text-left border-b border-slate-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{place.structured_formatting.main_text}</p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" /> {place.structured_formatting.secondary_text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-13 px-7 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all border border-blue-500/30 shrink-0"
                >
                  <span className="flex items-center gap-2">
                    Get Free Report <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                Free Scan • Comprehensive Data Audit • Results in 60s
              </p>
            </div>
          </div>

          {/* Code-Rendered Interactive Dashboard Mockup (No Image File Needed) */}
          <div className="relative mt-12 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-2xl shadow-blue-900/10">
              
              {/* Mock App Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-semibold text-slate-500 hidden sm:inline">
                    Gyrex Practice Command Center
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Data Layer Active
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Panel 1: Local Geo-Grid Map Rank */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Geo-Grid Rank Heatmap</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Rank #1</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-3">"Dermatologist Near Me"</p>
                    
                    {/* 3x3 Mock Grid */}
                    <div className="grid grid-cols-3 gap-2 my-2">
                      {[1, 1, 1, 1, 2, 1, 1, 1, 3].map((rank, idx) => (
                        <div key={idx} className={`h-9 rounded-lg flex items-center justify-center font-bold text-xs ${rank === 1 ? "bg-emerald-500 text-white shadow-sm" : rank === 2 ? "bg-blue-500 text-white" : "bg-amber-400 text-slate-900"}`}>
                          #{rank}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span>9 Coverage Radius Points</span>
                    <span className="font-semibold text-emerald-600">+4 positions up</span>
                  </p>
                </div>

                {/* Panel 2: WhatsApp Review Automation */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Feedback Flow</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Auto-Sent</span>
                    </div>
                    
                    {/* Mock Chat Bubble */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">WA</div>
                        <span className="text-xs font-bold text-slate-800">City Clinic Bot</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        "Hi Ananya! How was your consultation with Dr. Sharma today?"
                      </p>
                      <div className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                        ★★★★★ Rate 5 Stars on Google
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200/60 flex justify-between text-xs">
                    <span className="text-slate-500">Reviews this month</span>
                    <span className="font-bold text-slate-900">+42 5-Star Reviews</span>
                  </div>
                </div>

                {/* Panel 3: Patient Growth Metrics */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Patient Acquisition</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">+320%</span>
                    </div>
                    
                    <div className="my-4">
                      <p className="text-3xl font-black text-slate-900">842</p>
                      <p className="text-xs text-slate-500 mt-0.5">New Patient Walk-ins (Last 30 Days)</p>
                    </div>

                    {/* Simple Bar Graphic */}
                    <div className="flex items-end gap-1.5 h-16 pt-2">
                      {[35, 45, 40, 60, 75, 90, 100].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`flex-1 rounded-t ${i === 6 ? "bg-blue-600" : "bg-blue-200"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span>Google Map Inquiries</span>
                    <span className="font-semibold text-blue-600">450 Action Clicks</span>
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <section className="border-y border-slate-200/80 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Active Clinics", desc: "Trusting Gyrex Data Layer" },
            { value: "48K+", label: "Verified Reviews", desc: "Generated via WhatsApp Flows" },
            { value: "3.2x", label: "Patient Growth Rate", desc: "Average 90-day increase" },
            { value: "99.4%", label: "Data Accuracy", desc: "Across local mapping indexes" },
          ].map((s) => (
            <div key={s.label} className="p-2">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1">{s.value}</p>
              <p className="text-sm font-bold text-blue-600 mb-0.5">{s.label}</p>
              <p className="text-xs text-slate-500 font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS GYREX? (DATA ARCHITECTURE SECTION) ── */}
      <section id="data-architecture" className="py-28 relative border-b border-slate-200/80 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Layers className="h-4 w-4" /> System Architecture
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
              What is Gyrex?
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed">
              Gyrex is a **data-layer patient acquisition and retention system** engineered specifically for healthcare practices. We map patient search behavior, location schemas, and appointment triggers into a continuous practice growth engine.
            </p>
          </div>

          {/* 3-Tier Code-Rendered Architecture Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Tier 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold mb-6">
                <Database className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Layer 01</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Google Signal Layer</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Direct integration with Google Business Profile APIs to map category hierarchies, sub-specialty tags, and geographical search boundaries.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Specialty Category Alignment</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Geo-Coordinate Signal Sync</li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold mb-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">Layer 02</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">WhatsApp Event Flow</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Real-time appointment webhooks send automated post-visit feedback requests, routing happy patients straight to 5-star Google Reviews.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Automated Consultation Webhooks</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Direct 1-Click Review Routing</li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">Layer 03</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Geo-Grid Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                City-wide rank tracking grid measuring your clinic's search visibility across every neighborhood block in real-time.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Grid Rank Visibility Heatmaps</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Competitor Velocity Comparison</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-28 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Core Modules</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Complete practice acquisition stack
            </h2>
            <p className="text-slate-600 text-base">
              Every system needed to establish local search dominance, capture reviews, and manage patient intake.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="h-6 w-6 text-blue-600" />,
                title: "Google Business Optimization",
                desc: "Align medical categories, keywords, hours, and location signals to rank higher in local search maps."
              },
              {
                icon: <Star className="h-6 w-6 text-amber-500" />,
                title: "WhatsApp Review Automation",
                desc: "Trigger automated WhatsApp messages post-visit, converting happy patients into 5-star Google reviews."
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-emerald-600" />,
                title: "Smart Review Response System",
                desc: "Craft professional, empathetic, and compliant replies to patient feedback at scale."
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
                title: "Geo-Grid Rank Tracker",
                desc: "Monitor your exact search rank across grid points in your city for specialty searches like 'pediatrician near me'."
              },
              {
                icon: <Phone className="h-6 w-6 text-blue-600" />,
                title: "WhatsApp Patient Campaigns",
                desc: "Broadcast care reminders, seasonal health checkups, and clinic announcements with high open rates."
              },
              {
                icon: <Calendar className="h-6 w-6 text-purple-600" />,
                title: "Appointment Workflows",
                desc: "Automated confirmations, reminders, and waitlist management to minimize clinic no-shows."
              },
              {
                icon: <Users className="h-6 w-6 text-rose-500" />,
                title: "Patient Relationship Data",
                desc: "Centralize consultation records, feedback history, and communication logs in one structured CRM."
              },
              {
                icon: <Zap className="h-6 w-6 text-amber-500" />,
                title: "Competitor Benchmark Engine",
                desc: "Track nearby medical practices, their review speed, and keyword rankings in real-time."
              },
              {
                icon: <Activity className="h-6 w-6 text-cyan-600" />,
                title: "Patient Intake Assistant",
                desc: "Deploy a 24/7 web assistant that handles initial inquiries, symptom checklists, and booking requests."
              }
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl border border-slate-200/90 p-7 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── MIDDLE CTA SECTION (RICH BLUE THEME) ── */}
      <section className="py-20 relative overflow-hidden bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-10 sm:p-16 text-center text-white shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
              Stop losing patients to local competitors.
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-10 text-base">
              Run a free 60-second scan of your Google Business Profile to uncover missing keywords, location schema errors, and review bottlenecks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/local-seo/free-audit">
                <Button className="h-13 px-8 rounded-xl font-bold text-base bg-white text-blue-700 hover:bg-blue-50 shadow-xl border border-white">
                  Run Free Clinic Audit <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS / PROCESS ── */}
      <section id="process" className="py-28 relative bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Implementation</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Deploy Gyrex in 3 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Search className="h-6 w-6 text-blue-600" />,
                title: "1. Audit Data Layer",
                desc: "We analyze your Google Business Profile, keyword coverage, and local map rank against top competitors."
              },
              {
                step: "02",
                icon: <Database className="h-6 w-6 text-indigo-600" />,
                title: "2. Sync Data Engine",
                desc: "Connect your clinic profile and WhatsApp flow. Gyrex aligns your medical tags, location schema, and review channels."
              },
              {
                step: "03",
                icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
                title: "3. Track & Scale",
                desc: "Monitor rank improvements, review accumulation, and patient inquiries on your central analytics dashboard."
              }
            ].map((s) => (
              <div key={s.step} className="bg-slate-50 rounded-2xl border border-slate-200 p-8 relative">
                <div className="text-4xl font-black text-blue-200 mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / RESULTS ── */}
      <section className="py-28 border-t border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Proven Impact</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Trusted by medical practices nationwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Rahul Sharma",
                role: "Orthopedic Specialist, Mumbai",
                quote: "We moved from page 3 to the top 3 on Google maps for 'knee specialist near me'. Patient inquiries went up significantly.",
                stat: "+68 Google Reviews in 60 days"
              },
              {
                name: "Dr. Sneha Joshi",
                role: "Dental Practice Director, Pune",
                quote: "The post-appointment WhatsApp feedback workflow streamlined our review growth. Our rating improved from 4.1 to 4.9 naturally.",
                stat: "Rating Increased 4.1 → 4.9"
              },
              {
                name: "Dr. Arjun Mehta",
                role: "Pediatric Clinic Head, Delhi",
                quote: "Gyrex provided an exact data audit showing why our profile was suppressed. Fixing our medical categories changed our local reach within weeks.",
                stat: "Top 3 Local Grid Rank"
              }
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex gap-1 mb-6 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 mb-4">{t.role}</p>
                  <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600">
                    {t.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA SECTION ── */}
      <section className="py-24 relative bg-gradient-to-b from-white to-blue-50/50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Ready to grow your clinic's local reach?
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto mb-10">
            Join 500+ doctors and clinics using Gyrex to optimize local search presence and manage patient engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/local-seo/free-audit">
              <Button className="h-14 px-9 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 border border-blue-500/30">
                Get Your Free Audit
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="h-14 px-9 rounded-xl font-bold text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="mb-4">
                <GyrexLogo size="md" lightText />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured data-layer system engineered for medical practice growth and patient engagement.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link href="/#data-architecture" className="hover:text-white transition">Data Architecture</Link></li>
                <li><Link href="/#features" className="hover:text-white transition">Core Modules</Link></li>
                <li><Link href="/local-seo/free-audit" className="hover:text-white transition">Free Audit Tool</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><Link href="/login" className="hover:text-white transition">Doctor Portal</Link></li>
                <li><Link href="/register" className="hover:text-white transition">Register Practice</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Compliance & Legal</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-white cursor-pointer">Data Security Standard</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 Gyrex Technologies. All rights reserved.</p>
            <p>Built for healthcare professionals</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
