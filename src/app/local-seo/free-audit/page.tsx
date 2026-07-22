"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

import {
  Search, Activity, MapPin, Building2, ArrowRight, Check,
  ChevronDown
} from "lucide-react";

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
}

const ALL_COUNTRY_CODES = [
  { code: "+91", iso: "IN" },
  { code: "+1", iso: "US" },
  { code: "+1", iso: "CA" },
  { code: "+44", iso: "GB" },
  { code: "+971", iso: "AE" },
  { code: "+61", iso: "AU" },
  { code: "+65", iso: "SG" },
  { code: "+966", iso: "SA" },
  { code: "+49", iso: "DE" },
  { code: "+33", iso: "FR" },
  { code: "+93", iso: "AF" },
  { code: "+355", iso: "AL" },
  { code: "+213", iso: "DZ" },
  { code: "+54", iso: "AR" },
  { code: "+374", iso: "AM" },
  { code: "+43", iso: "AT" },
  { code: "+994", iso: "AZ" },
  { code: "+973", iso: "BH" },
  { code: "+880", iso: "BD" },
  { code: "+32", iso: "BE" },
  { code: "+975", iso: "BT" },
  { code: "+55", iso: "BR" },
  { code: "+359", iso: "BG" },
  { code: "+855", iso: "KH" },
  { code: "+56", iso: "CL" },
  { code: "+86", iso: "CN" },
  { code: "+57", iso: "CO" },
  { code: "+385", iso: "HR" },
  { code: "+357", iso: "CY" },
  { code: "+420", iso: "CZ" },
  { code: "+45", iso: "DK" },
  { code: "+20", iso: "EG" },
  { code: "+372", iso: "EE" },
  { code: "+251", iso: "ET" },
  { code: "+358", iso: "FI" },
  { code: "+995", iso: "GE" },
  { code: "+233", iso: "GH" },
  { code: "+30", iso: "GR" },
  { code: "+852", iso: "HK" },
  { code: "+36", iso: "HU" },
  { code: "+354", iso: "IS" },
  { code: "+62", iso: "ID" },
  { code: "+964", iso: "IQ" },
  { code: "+353", iso: "IE" },
  { code: "+972", iso: "IL" },
  { code: "+39", iso: "IT" },
  { code: "+81", iso: "JP" },
  { code: "+962", iso: "JO" },
  { code: "+7", iso: "KZ" },
  { code: "+254", iso: "KE" },
  { code: "+965", iso: "KW" },
  { code: "+961", iso: "LB" },
  { code: "+60", iso: "MY" },
  { code: "+960", iso: "MV" },
  { code: "+356", iso: "MT" },
  { code: "+52", iso: "MX" },
  { code: "+212", iso: "MA" },
  { code: "+977", iso: "NP" },
  { code: "+31", iso: "NL" },
  { code: "+64", iso: "NZ" },
  { code: "+234", iso: "NG" },
  { code: "+47", iso: "NO" },
  { code: "+968", iso: "OM" },
  { code: "+92", iso: "PK" },
  { code: "+51", iso: "PE" },
  { code: "+63", iso: "PH" },
  { code: "+48", iso: "PL" },
  { code: "+351", iso: "PT" },
  { code: "+974", iso: "QA" },
  { code: "+40", iso: "RO" },
  { code: "+7", iso: "RU" },
  { code: "+381", iso: "RS" },
  { code: "+27", iso: "ZA" },
  { code: "+82", iso: "KR" },
  { code: "+34", iso: "ES" },
  { code: "+94", iso: "LK" },
  { code: "+46", iso: "SE" },
  { code: "+41", iso: "CH" },
  { code: "+886", iso: "TW" },
  { code: "+66", iso: "TH" },
  { code: "+90", iso: "TR" },
  { code: "+380", iso: "UA" },
  { code: "+598", iso: "UY" },
  { code: "+84", iso: "VN" },
  { code: "+263", iso: "ZW" },
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
    desc: "Every visibility gap is backed by evidence — zero guesswork, real live data benchmarks.",
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
  const [countryCode, setCountryCode] = useState("+91");
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
    if (!phone.trim() || phone.trim().length < 6) { setFormError("Please enter a valid phone number."); return; }

    const fullPhone = `${countryCode} ${phone.trim()}`;

    setIsScanning(true);
    try {
      // 1. Create Lead first
      const leadRes = await fetch("/api/audit/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: fullPhone,
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <GyrexLogo size="md" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
            Healthcare Diagnostic Tool
          </span>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Log in</Link>
        </div>
      </header>

      {/* ── Main Section ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 md:py-12">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* LEFT: Value proposition */}
          <div className="space-y-6 pt-2">
            <div>
              {/* SINGLE PROMINENT 100% FREE BADGE */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 mb-4 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                100% FREE • Google Business Profile Diagnostic
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.12] tracking-tight mb-4">
                Is your clinic{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">invisible</span>
                  <span className="absolute bottom-1 left-0 w-full h-2.5 bg-amber-300/70 rounded -z-0" />
                </span>{" "}
                on{" "}
                <span className="inline-flex tracking-tight font-extrabold">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </span>
                ?
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                Get a consultant-grade Google Business Profile audit. We show you exactly why nearby competitors are outranking you and what to fix first.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {VALUE_PROPS.map((vp, i) => (
                <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-blue-600">{vp.num}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{vp.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{vp.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT: Form card */}
          <div className="w-full">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">

              {/* Card header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Analyse your Google Business Profile
                </h2>
                <p className="text-xs text-blue-100 mt-1 font-medium">
                  Takes 60 seconds. Results are instant.
                </p>
              </div>

              <form onSubmit={handleScan} className="px-6 py-6 space-y-5">

                {/* Step 1: GBP Search */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                    Find your business on Google
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Start typing your clinic name…"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                      disabled={isScanning}
                      autoComplete="off"
                      className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                    />

                    {/* Dropdown */}
                    {showDropdown && searchQuery.length > 1 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-left">
                        {isLoadingSuggestions && (
                          <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                            <Activity className="h-4 w-4 animate-spin text-blue-600" />
                            Searching…
                          </div>
                        )}
                        {predictions.map((place) => (
                          <button
                            key={place.place_id}
                            type="button"
                            onClick={() => handleSelectPlace(place)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{place.structured_formatting.main_text}</p>
                              {place.structured_formatting.secondary_text && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {place.structured_formatting.secondary_text}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                        {!isLoadingSuggestions && predictions.length === 0 && searchQuery.length > 1 && (
                          <div className="px-4 py-3 text-sm text-slate-400">No results found. Try a different name.</div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedPlace && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-800 truncate">{selectedPlace.structured_formatting.main_text} selected</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 font-medium pl-1">Type the name, then pick your clinic from the list.</p>
                </div>

                {/* Step 2: Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                    Your name
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Priya Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isScanning}
                    className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                  />
                </div>

                {/* Step 3: Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                    WhatsApp / Phone number
                  </label>
                  <div className="flex gap-2">
                    {/* Compact ISO + Dial Code Select Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={isScanning}
                        className="appearance-none px-3 pr-7 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                      >
                        {ALL_COUNTRY_CODES.map((c, i) => (
                          <option key={`${c.iso}-${c.code}-${i}`} value={c.code}>
                            {c.iso} {c.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      disabled={isScanning}
                      className="flex-1 px-4 h-11 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-rose-600 text-xs font-semibold">{formError}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full h-12 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
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

                <p className="text-center text-xs text-slate-400 font-medium">
                  No credit card required. No spam. Instant diagnostic.
                </p>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
