"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Activity, MapPin, Building2, CheckCircle2, ArrowRight, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
}

export default function FreeAuditPage() {
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Simple Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">Docflo</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none -z-10" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[80px] opacity-50 pointer-events-none -z-10" />

        <div className="w-full max-w-2xl mx-auto text-center z-10 mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <ShieldAlert className="w-4 h-4" /> 100% Free SEO Audit
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Discover Why Your Clinic Isn't Getting More Patients
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Enter your clinic's name below. Our AI will instantly analyze your Google Business Profile and local SEO rankings to reveal exactly how much revenue you're missing out on.
          </p>

          <form onSubmit={handleScan} className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search your clinic name or location…"
                className="w-full pl-12 pr-4 h-14 rounded-xl bg-slate-50 text-slate-900 text-base placeholder:text-slate-400 border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                disabled={isScanning}
                autoComplete="off"
                autoFocus
              />

              {showDropdown && searchQuery.length > 1 && (
                <div ref={dropdownRef} className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-left">
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
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isScanning || !searchQuery.trim()}
              className="h-14 px-8 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60 shrink-0"
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5 animate-spin" /> Analysing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Scan Now <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Detailed 15-point check</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Instant results</span>
          </div>
        </div>
      </main>
    </div>
  );
}
