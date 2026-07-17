"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Star, ArrowRight, CheckCircle2, TrendingUp, Users, MessageSquare,
  Search, MapPin, Building2, ChevronRight, Zap, Globe, Bot, BarChart3,
  Calendar, Phone, Clock, Shield, Heart, Award, Play, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
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

  // Fetch suggestions from our backend proxy (no Maps JS SDK needed)
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
    // Debounce 300ms
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

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsScanning(true);
    const params = new URLSearchParams({ q: searchQuery });
    if (selectedPlace) {
      params.set("placeId", selectedPlace.place_id);
      params.set("name", selectedPlace.structured_formatting.main_text);
      params.set("address", selectedPlace.structured_formatting.secondary_text || "");
    }
    setTimeout(() => router.push(`/report?${params.toString()}`), 1200);
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
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── NAVBAR ── */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Activity className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Docflo</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "Blog"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link href="/free-audit">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 h-9 text-sm font-semibold shadow-sm">
                Get Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24">
        {/* Gradient BG */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Trusted by 500+ Doctors Across India
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Your clinic deserves<br />
            <span style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              more patients
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Docflo is the AI-powered patient acquisition platform built exclusively for doctors, clinics, and healthcare professionals. Get discovered. Get chosen. Grow.
          </p>

          {/* Search Box with Autocomplete */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleScan}
              className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search your clinic name or location…"
                  className="w-full pl-12 pr-4 h-12 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                  disabled={isScanning}
                  autoComplete="off"
                />

                {/* Dropdown suggestions */}
                {showDropdown && searchQuery.length > 1 && (
                  <div ref={dropdownRef}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    {isLoadingSuggestions && (
                      <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-spin text-blue-500" /> Searching Google Business Profiles…
                      </div>
                    )}
                    {!isLoadingSuggestions && predictions.length === 0 && searchQuery.length > 2 && (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No matching clinics found. Try a different name.
                      </div>
                    )}
                    {predictions.map((place) => (
                      <button
                        key={place.place_id}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{place.structured_formatting.main_text}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {place.structured_formatting.secondary_text}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center mt-1">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">GBP</span>
                        </div>
                      </button>
                    ))}
                    {selectedPlace && predictions.length === 0 && (
                      <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> {selectedPlace.structured_formatting.main_text} selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isScanning || !searchQuery.trim()}
                className="h-12 px-6 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-60"
              >
                {isScanning ? (
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 animate-spin" /> Analysing…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Get Free Report <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-400 mt-3">
              Free • No credit card • Results in 60 seconds
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Active Clinics" },
            { value: "48K+", label: "Reviews Generated" },
            { value: "3.2x", label: "Avg. Patient Growth" },
            { value: "4.8★", label: "Average Rating Uplift" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-slate-900 mb-1">{s.value}</p>
              <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">The complete patient acquisition<br />system for healthcare</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Not just a review tool. Not just an SEO plugin. Docflo is your full-stack AI marketing team — built specifically for the medical industry.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="h-6 w-6 text-blue-600" />,
                color: "bg-blue-50",
                title: "Google Business Profile AI",
                desc: "Automatically optimize your medical categories, keywords, description, and photos. Our AI writes GBP content that ranks for 'near me' searches in your specialty.",
                tag: "Top Feature",
              },
              {
                icon: <Star className="h-6 w-6 text-amber-500" />,
                color: "bg-amber-50",
                title: "Automated Review Generation",
                desc: "After each appointment, Docflo sends a personalized WhatsApp message requesting a review. Convert happy patients into 5-star reviews on autopilot.",
                tag: "",
              },
              {
                icon: <Bot className="h-6 w-6 text-indigo-500" />,
                color: "bg-indigo-50",
                title: "AI Review Response Engine",
                desc: "Automatically craft medically-appropriate, empathetic replies to every patient review — positive or negative — maintaining your professional brand at scale.",
                tag: "",
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
                color: "bg-blue-50",
                title: "Local SEO Rank Tracker",
                desc: "See exactly where your clinic ranks for key medical searches like 'dermatologist near me' or 'best paediatrician in [city]'. Track weekly rank changes on a map.",
                tag: "",
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-green-600" />,
                color: "bg-green-50",
                title: "WhatsApp Patient Campaigns",
                desc: "Run targeted WhatsApp campaigns for health awareness, appointment reminders, and wellness tips. HIPAA-conscious, high open-rate patient communication.",
                tag: "",
              },
              {
                icon: <Calendar className="h-6 w-6 text-blue-500" />,
                color: "bg-blue-50",
                title: "Smart Appointment Manager",
                desc: "Reduce no-shows by up to 60% with automated reminder workflows. Manage appointments, waitlists, and follow-ups all in one intelligent dashboard.",
                tag: "",
              },
              {
                icon: <Users className="h-6 w-6 text-purple-500" />,
                color: "bg-purple-50",
                title: "Patient CRM & Intelligence",
                desc: "Build a comprehensive patient database with visit history, communication logs, and lifetime value insights. Know your patients better than ever.",
                tag: "",
              },
              {
                icon: <Zap className="h-6 w-6 text-orange-500" />,
                color: "bg-orange-50",
                title: "Competitor Intelligence",
                desc: "Monitor what nearby clinics are doing on Google — their keywords, review velocity, and ranking positions. Stay ahead of the competition effortlessly.",
                tag: "New",
              },
              {
                icon: <Phone className="h-6 w-6 text-blue-600" />,
                color: "bg-blue-50",
                title: "AI Chatbot for Patient Intake",
                desc: "Deploy an intelligent chatbot on your website that answers FAQs, screens patients, collects symptoms, and books appointments — available 24/7.",
                tag: "",
              },
            ].map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl border border-slate-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center`}>
                    {f.icon}
                  </div>
                  {f.tag && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{f.tag}</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Up and running in 3 steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "01",
                icon: <Search className="h-7 w-7 text-blue-600" />,
                title: "Audit Your Profile",
                desc: "Enter your clinic name. We scan your Google Business Profile, analyse your competitors, and identify every issue costing you patients.",
              },
              {
                step: "02",
                icon: <Zap className="h-7 w-7 text-blue-600" />,
                title: "Docflo Fixes Everything",
                desc: "Our AI engine rewrites your GBP, sets up automated review requests, and deploys your local SEO strategy — all within 24 hours of signup.",
              },
              {
                step: "03",
                icon: <TrendingUp className="h-7 w-7 text-blue-600" />,
                title: "Watch Patients Arrive",
                desc: "Track your ranking improvements, review growth, and appointment increases weekly in your dedicated analytics dashboard.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 mt-2">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Results</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Real doctors. Real growth.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Dr. Rahul Sharma", role: "Orthopedic Surgeon, Mumbai", quote: "We were on page 3 for 'bone specialist near me'. Within 6 weeks on Docflo, we hit the top 3. Patient walk-ins increased by 40%.", rating: 5, initials: "RS", reviews: "+68 reviews in 2 months" },
              { name: "Dr. Sneha Joshi", role: "Dental Clinic Owner, Pune", quote: "The AI review replies alone saved me hours every week. Now I respond to every patient automatically and professionally. My rating went from 4.1 to 4.9.", rating: 5, initials: "SJ", reviews: "Rating: 4.1 → 4.9" },
              { name: "Dr. Arjun Mehta", role: "Paediatrician, Delhi", quote: "I tried Practo, JustDial — nothing moved the needle. Docflo gave me a complete audit showing exactly what was wrong. Fixed everything in 48 hours.", rating: 5, initials: "AM", reviews: "Ranked #1 in 4 weeks" },
            ].map((t) => (
              <div key={t.name} className="bg-slate-900 rounded-2xl p-8 text-white">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-200 leading-relaxed mb-6 text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="text-xs text-blue-400 font-bold border-t border-slate-700 pt-4">
                  {t.reviews}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Less than a coffee a day</h2>
          <p className="text-slate-600 mb-12">Compare what you're spending vs what you could be getting.</p>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="text-left">Option</div>
              <div>Monthly Cost</div>
              <div>Results</div>
            </div>
            {[
              { label: "Marketing Agency", cost: "₹20,000+", result: "Slow & Generic", bad: true },
              { label: "Practo / JustDial", cost: "₹10,000+", result: "Listing Only", bad: true },
              { label: "Full-time Staff", cost: "₹30,000+", result: "1 Person's Capacity", bad: true },
              { label: "Docflo AI", cost: "from ₹833", result: "AI-Powered Growth", bad: false },
            ].map((row) => (
              <div key={row.label} className={`grid grid-cols-3 px-6 py-4 text-sm border-b border-slate-50 last:border-0 ${!row.bad ? "bg-blue-50 font-bold" : ""}`}>
                <div className={`text-left ${row.bad ? "text-slate-600" : "text-blue-700"}`}>{row.label}</div>
                <div className={`text-center ${row.bad ? "text-rose-500" : "text-blue-700"}`}>{row.cost}</div>
                <div className={`text-center ${row.bad ? "text-slate-400" : "text-blue-600"} flex items-center justify-center gap-1`}>
                  {!row.bad && <CheckCircle2 className="h-4 w-4" />}
                  {row.result}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base font-semibold shadow-md"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Get My Free Audit <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/register">
              <Button variant="outline" className="rounded-xl px-8 h-12 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Docflo</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                The AI-powered patient acquisition platform built exclusively for healthcare professionals.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-3">Product</h4>
                {["Features", "Pricing", "GBP Audit", "Changelog"].map((l) => (
                  <p key={l} className="text-slate-400 hover:text-white cursor-pointer mb-2">{l}</p>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Company</h4>
                {["About Us", "Blog", "Careers", "Press"].map((l) => (
                  <p key={l} className="text-slate-400 hover:text-white cursor-pointer mb-2">{l}</p>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Legal</h4>
                {["Privacy Policy", "Terms of Service", "HIPAA Policy", "Refund Policy"].map((l) => (
                  <p key={l} className="text-slate-400 hover:text-white cursor-pointer mb-2">{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">© 2026 Docflo Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="text-slate-500 text-xs">Made with ❤️ for healthcare professionals in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
