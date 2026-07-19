"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Activity, MapPin, Building2, ArrowRight, Check,
  Star, Users, TrendingUp, ShieldCheck, ChevronDown
} from "lucide-react";

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
}

const TRUST_BADGES = [
  { icon: ShieldCheck, text: "100% Free" },
  { icon: Star, text: "Healthcare Focused" },
  { icon: TrendingUp, text: "Real Google Data" },
  { icon: Users, text: "No Account Needed" },
];

const VALUE_PROPS = [
  {
    num: "01",
    title: "Find your Google Business Profile",
    desc: "We scan your live GBP and benchmark you against local competitors in real time.",
  },
  {
    num: "02",
    title: "See why you're not ranking",
    desc: "Every visibility gap is backed by evidence — no guesswork, no AI-inflated scores.",
  },
  {
    num: "03",
    title: "Get your free diagnostic report",
    desc: "A 10-section consultant-level report delivered instantly to your screen.",
  },
];

export default function FreeAuditPage() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);

  // Lead capture state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Google Places autocomplete ──────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) { setPredictions([]); return; }
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
    const label = p.structured_formatting.secondary_text
      ? `${p.structured_formatting.main_text}, ${p.structured_formatting.secondary_text}`
      : p.structured_formatting.main_text;
    setSearchQuery(label);
    setShowDropdown(false);
    setPredictions([]);
  };

  // ── Outside click ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!searchQuery.trim()) { setFormError("Please search and select your clinic."); return; }
    if (!name.trim()) { setFormError("Please enter your name."); return; }
    if (!phone.trim() || phone.trim().length < 8) { setFormError("Please enter a valid phone number."); return; }

    setIsScanning(true);
    try {
      // 1. Create Lead first
      const leadRes = await fetch("/api/audit/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          placeId: selectedPlace?.place_id,
          clinicName: selectedPlace?.structured_formatting.main_text,
        }),
      });
      const leadData = await leadRes.json();
      if (!leadRes.ok || !leadData.lead?.id) {
        setFormError("Failed to capture lead. Please try again.");
        setIsScanning(false);
        return;
      }

      // 2. Start Scan linked to Lead
      const res = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadData.lead.id,
          searchQuery,
          placeId: selectedPlace?.place_id,
          name: selectedPlace?.structured_formatting.main_text,
          address: selectedPlace?.structured_formatting.secondary_text,
        }),
      });
      const data = await res.json();
      if (data.auditId) {
        router.push(`/local-seo/free-audit/scan/${data.auditId}`);
      } else {
        setFormError("Failed to start scan. Please try again.");
        setIsScanning(false);
      }
    } catch {
      setFormError("Connection error. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans text-zinc-900 flex flex-col">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100 z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-300/40">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-zinc-900">DocFlo</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Free • No Credit Card
          </span>
          <Link href="/login" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block">Log in</Link>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT: Value proposition */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-600 mb-5">
                Google Business Profile Diagnostic
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight tracking-tight mb-4">
                Is your clinic{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">invisible</span>
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-amber-300/60 rounded -z-0" />
                </span>{" "}
                on{" "}
                <span className="inline-flex tracking-tight">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </span>
                ?
              </h1>

              <p className="text-base text-zinc-500 leading-relaxed max-w-md">
                Get a consultant-grade Google Business Profile audit — completely free. We show you exactly why nearby competitors are outranking you and what to fix first.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-5">
              {VALUE_PROPS.map((vp, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-zinc-400">{vp.num}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{vp.title}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed mt-0.5">{vp.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {TRUST_BADGES.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg shadow-sm text-xs font-semibold text-zinc-600">
                  <Icon className="w-3.5 h-3.5 text-indigo-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Form card */}
          <div>
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-900/10 overflow-hidden">

              {/* Card header */}
              <div className="px-8 py-6 border-b border-zinc-100 bg-gradient-to-br from-indigo-600 to-violet-600">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">
                  Get your free GBP report
                </p>
                <h2 className="text-xl font-black text-white">
                  Analyse your Google Business Profile
                </h2>
                <p className="text-sm text-indigo-200 mt-1 font-medium">
                  Takes 60 seconds. Results are instant.
                </p>
              </div>

              <form onSubmit={handleScan} className="px-8 py-8 space-y-6">

                {/* Step 1: GBP Search */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                    Find your business on Google
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Start typing your clinic name…"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                      disabled={isScanning}
                      autoComplete="off"
                      className="w-full pl-10 pr-4 h-12 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                    />

                    {/* Dropdown */}
                    {showDropdown && searchQuery.length > 1 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
                        {isLoadingSuggestions && (
                          <div className="px-4 py-3 text-sm text-zinc-500 flex items-center gap-2">
                            <Activity className="h-4 w-4 animate-spin text-indigo-500" />
                            Searching…
                          </div>
                        )}
                        {predictions.map((place) => (
                          <button
                            key={place.place_id}
                            type="button"
                            onClick={() => handleSelectPlace(place)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left border-b border-zinc-50 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{place.structured_formatting.main_text}</p>
                              {place.structured_formatting.secondary_text && (
                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {place.structured_formatting.secondary_text}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                        {!isLoadingSuggestions && predictions.length === 0 && searchQuery.length > 1 && (
                          <div className="px-4 py-3 text-sm text-zinc-400">No results found. Try a different name.</div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedPlace && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-800 truncate">{selectedPlace.structured_formatting.main_text} selected</span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 font-medium pl-1">Type the name, then pick your clinic from the list.</p>
                </div>

                {/* Step 2: Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                    Your name
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Priya Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isScanning}
                    className="w-full px-4 h-12 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                  />
                </div>

                {/* Step 3: Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                    WhatsApp / Phone number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 h-12 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 shrink-0">
                      🇮🇳 +91 <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      disabled={isScanning}
                      className="flex-1 px-4 h-12 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-rose-500 text-sm font-semibold">{formError}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full h-13 py-3.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isScanning ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin" />
                      Scanning your profile…
                    </>
                  ) : (
                    <>
                      Get My Free Report
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-zinc-400 font-medium">
                  No credit card. No spam. No account required.
                </p>
              </form>
            </div>

            {/* Social proof strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />Live Google data</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />Healthcare-specific benchmarks</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />Competitor comparison</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
