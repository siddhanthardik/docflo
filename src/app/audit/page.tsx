"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import {
  Search,
  Users,
  TrendingUp,
  Star,
  MapPin,
  Building2,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Clock,
  Lock,
  MessageCircle,
  X,
  RefreshCcw,
  Check
} from "lucide-react";

export default function AuditLandingPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    clinicName: "",
    specialization: "",
    mobileNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [platformWhatsapp, setPlatformWhatsapp] = useState("919999999999");

  // Audit Status Check Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusPhone, setStatusPhone] = useState("");
  const [statusResult, setStatusResult] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetch("/api/platform/whatsapp-number")
      .then((res) => res.json())
      .then((data) => {
        if (data?.whatsappNumber) {
          setPlatformWhatsapp(data.whatsappNumber);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim()) {
      setErrorMsg("Please enter your Full Name and Mobile Number.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          phone: formData.mobileNumber.trim(),
          clinicName: formData.specialization
            ? `${formData.clinicName || formData.fullName} (${formData.specialization})`
            : formData.clinicName || formData.fullName,
          specialization: formData.specialization,
          leadSource: "landing_audit_exact",
          landingPage: "/audit",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit audit request.");

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusPhone.trim()) return;
    setCheckingStatus(true);
    setStatusResult(null);

    try {
      window.open(
        `https://wa.me/${platformWhatsapp}?text=Hi%20Gyrex%2C%20I%20want%20to%20check%20the%20audit%20status%20for%20my%20number%3A%20${encodeURIComponent(statusPhone)}`,
        "_blank"
      );
      setShowStatusModal(false);
    } catch {
      setStatusResult("Unable to check status right now. Please message us on WhatsApp.");
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* ── TOP HEADER / NAVBAR ────────────────────────────────────────────── */}
      <header className="w-full bg-white border-b border-slate-100 py-3.5 px-4 sm:px-8 lg:px-14 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
        <Link href="/" className="flex items-center gap-2">
          <GyrexLogo size="md" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            Already applied?
          </span>
          <button
            onClick={() => setShowStatusModal(true)}
            className="border border-[#1A56DB] text-[#1A56DB] hover:bg-blue-50/80 transition-all font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow-2xs cursor-pointer"
          >
            Check Audit Status
          </button>
        </div>
      </header>

      {/* ── FULL HERO SECTION (WITH SEAMLESS DOCTOR BACKGROUND) ───────────── */}
      <section className="relative overflow-hidden bg-[#F8FAFF] border-b border-slate-100">
        
        {/* Full Hero Doctor Background - Desktop & Tablet */}
        <div 
          className="absolute inset-0 hidden md:block bg-no-repeat bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: "url('/images/audit-hero-doctor-full.jpg')",
            backgroundPosition: "center 20%",
          }}
        >
          {/* Subtle gradient overlays to ensure left text & right form pop with ultra clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFF] via-[#F8FAFF]/40 to-transparent w-[50%]" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#F8FAFF] via-[#F8FAFF]/50 to-transparent left-auto w-[45%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFF]/40 via-transparent to-[#F8FAFF]/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* LEFT COLUMN: Headline & Stopwatch Badge */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="space-y-1 max-w-xl">
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0F172A] tracking-tight leading-[1.12]">
                  Patients Kam<br />
                  Nahin Hain..<br />
                  <span className="inline-flex tracking-tight font-black mr-2">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-[#EA4335]">o</span>
                    <span className="text-[#FBBC05]">o</span>
                    <span className="text-[#4285F4]">g</span>
                    <span className="text-[#34A853]">l</span>
                    <span className="text-[#EA4335]">e</span>
                  </span>
                  pe <span className="text-[#1A56DB]">Aap</span><br />
                  <span className="text-[#1A56DB]">Kam Dikhte ho.</span>
                </h1>

                {/* Blue Underline Bar */}
                <div className="w-14 h-1.5 bg-[#1A56DB] rounded-full mt-4" />
              </div>

              {/* Stopwatch Badge */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-3.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 shadow-lg shadow-slate-200/50">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1A56DB] shrink-0">
                    <Clock className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                      Get <span className="text-[#1A56DB] font-extrabold">Free</span> audit
                    </p>
                    <p className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                      in <span className="text-[#1A56DB] font-extrabold">60</span> seconds
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Doctor Visual (visible only on small screens) */}
              <div className="block md:hidden pt-4">
                <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                  <img
                    src="/images/audit-hero-doctor-full.jpg"
                    alt="Doctor at Gyrex Clinic"
                    className="w-full h-48 object-cover object-top"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Floating Lead Capture Form */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 p-6 sm:p-7 relative overflow-hidden">
                
                {/* Form Header */}
                <div className="mb-5 text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Get Your <span className="text-[#1A56DB]">Free Audit</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Discover how visible your clinic is online
                  </p>
                </div>

                {submitted ? (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Audit Request Received!</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Thank you, <strong>Dr. {formData.fullName}</strong>. We are generating your clinic visibility audit and sending it straight to your WhatsApp right now.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${platformWhatsapp}?text=Hi%20Gyrex%2C%20I%20just%20submitted%20my%20clinic%20audit%20request%20for%20Dr.%20${encodeURIComponent(formData.fullName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4 h-4" /> Open Instant WhatsApp Audit
                    </a>

                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ fullName: "", clinicName: "", specialization: "", mobileNumber: "" });
                      }}
                      className="text-xs text-slate-400 font-semibold hover:text-slate-600 underline block mx-auto pt-1"
                    >
                      Submit another clinic
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                    {errorMsg && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                        {errorMsg}
                      </div>
                    )}

                    {/* Field 1: Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Field 2: Clinic / Hospital Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Clinic / Hospital Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter clinic name"
                        value={formData.clinicName}
                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Field 3: Specialization */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Specialization
                      </label>
                      <input
                        type="text"
                        placeholder="Enter specialization"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Field 4: Mobile Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter mobile number"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/[^\d+]/g, "") })}
                        className="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#1A56DB] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? (
                        <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing Audit...</>
                      ) : (
                        "Get Free Audit Now"
                      )}
                    </button>

                    {/* Security Footer Note */}
                    <div className="pt-1 text-center">
                      <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400" /> Your information is secure and confidential.
                      </p>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4-COLUMN BENEFIT / FEATURE BAR ───────────────────────────────── */}
      <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-8 lg:px-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          {/* Benefit 1: Google Visibility */}
          <div className="p-4 sm:px-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto mb-2.5">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Google Visibility</h3>
            <p className="text-xs text-slate-500 leading-snug">
              See how easily patients find you online
            </p>
          </div>

          {/* Benefit 2: More Patients */}
          <div className="p-4 sm:px-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto mb-2.5">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">More Patients</h3>
            <p className="text-xs text-slate-500 leading-snug">
              Reach the right patients in your area
            </p>
          </div>

          {/* Benefit 3: More Bookings */}
          <div className="p-4 sm:px-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto mb-2.5">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">More Bookings</h3>
            <p className="text-xs text-slate-500 leading-snug">
              Increase appointments and consultations
            </p>
          </div>

          {/* Benefit 4: Better Reputation */}
          <div className="p-4 sm:px-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mx-auto mb-2.5">
              <Star className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Better Reputation</h3>
            <p className="text-xs text-slate-500 leading-snug">
              Build trust with reviews and ratings
            </p>
          </div>

        </div>
      </section>

      {/* ── WHAT YOU GET IN YOUR FREE AUDIT SECTION ──────────────────────── */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 lg:px-14 bg-[#F8FAFC]/50">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              What You Get in Your <span className="text-[#1A56DB]">Free Audit?</span>
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-start text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Local SEO Analysis</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                How visible your clinic is in local search
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-start text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Google Business Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Complete analysis of your listing & optimization
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-start text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Reviews & Reputation</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Insights on ratings, reviews & patient trust
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow duration-300 flex flex-col justify-start text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Performance Insights</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Actionable steps to get more patients
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── DATA-DRIVEN GROWTH / SMARTPHONE & METRICS SECTION (PIXEL PERFECT) ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-14 bg-white border-t border-slate-100 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* LEFT: Complete Smartphone Mockup + 4 Flanking Metric Cards */}
          <div className="lg:col-span-7 flex items-center justify-center">
            
            {/* SVG Definitions for Wave Gradients & Marker Arrows */}
            <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
              <defs>
                {/* Red Downward Gradient */}
                <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
                {/* Green Upward Gradient */}
                <linearGradient id="greenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                {/* Red Arrowhead */}
                <marker id="redArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M 1 1 L 7 4 L 1 7 Z" fill="#EF4444" />
                </marker>
                {/* Green Arrowhead */}
                <marker id="greenArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M 1 1 L 7 4 L 1 7 Z" fill="#10B981" />
                </marker>
              </defs>
            </svg>

            <div className="w-full flex flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-5">
              
              {/* ── LEFT 2 CARDS ── */}
              <div className="flex flex-col justify-between gap-5 sm:gap-6 w-[130px] sm:w-[155px] shrink-0">
                
                {/* CARD 1: Visibility Score Low */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-100 shadow-xl shadow-slate-200/60 text-left transition-transform hover:-translate-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                    Visibility Score
                  </span>
                  <span className="text-base sm:text-xl font-black text-slate-900 block mt-1">
                    Low
                  </span>
                  <div className="mt-2 w-full h-10 sm:h-12 overflow-visible">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path
                        d="M 5,8 Q 30,5 45,22 T 85,25 L 94,33 L 94,40 L 5,40 Z"
                        fill="url(#redAreaGrad)"
                      />
                      <path
                        d="M 5,8 Q 30,5 45,22 T 85,25 L 94,33"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#redArrow)"
                      />
                    </svg>
                  </div>
                </div>

                {/* CARD 2: Directions +31% */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-100 shadow-xl shadow-slate-200/60 text-left transition-transform hover:-translate-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                    Directions
                  </span>
                  <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                    +31%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                    vs last month
                  </span>
                  <div className="mt-1 w-full h-10 sm:h-12 overflow-visible">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path
                        d="M 5,34 Q 35,32 55,18 T 85,20 L 94,8 L 94,40 L 5,40 Z"
                        fill="url(#greenAreaGrad)"
                      />
                      <path
                        d="M 5,34 Q 35,32 55,18 T 85,20 L 94,8"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#greenArrow)"
                      />
                    </svg>
                  </div>
                </div>

              </div>

              {/* ── CENTER: THE SMARTPHONE MOCKUP ── */}
              <div className="w-[190px] sm:w-[230px] lg:w-[240px] shrink-0">
                <div className="bg-slate-900 rounded-[38px] sm:rounded-[44px] p-2 sm:p-2.5 shadow-2xl shadow-slate-400/50 border-[4px] sm:border-[5px] border-slate-900 relative">
                  
                  {/* Notch / Speaker Island */}
                  <div className="w-14 sm:w-16 h-3 sm:h-3.5 bg-slate-900 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1.5" />
                    <div className="w-6 h-1 bg-slate-800 rounded-full" />
                  </div>

                  {/* Inside Smartphone Screen */}
                  <div className="bg-[#FAFBFD] rounded-[28px] sm:rounded-[34px] overflow-hidden flex flex-col text-left border border-slate-200/50">
                    
                    {/* Top Google Branding & Search Header */}
                    <div className="p-2 sm:p-2.5 bg-white border-b border-slate-100 space-y-1.5">
                      
                      {/* Centered Colorful Google Logo */}
                      <div className="text-center">
                        <span className="font-black text-sm sm:text-base tracking-tight inline-flex">
                          <span className="text-[#4285F4]">G</span>
                          <span className="text-[#EA4335]">o</span>
                          <span className="text-[#FBBC05]">o</span>
                          <span className="text-[#4285F4]">g</span>
                          <span className="text-[#34A853]">l</span>
                          <span className="text-[#EA4335]">e</span>
                        </span>
                      </div>

                      {/* Google Search Bar Pill */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs">
                        <Search className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="text-[9px] sm:text-[10px] text-slate-700 font-medium truncate flex-1">
                          best doctor near me
                        </span>
                        <span className="text-[10px] shrink-0">🎙️</span>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 overflow-hidden pt-0.5">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">All</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded-full">Doctors</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded-full truncate">Clinics</span>
                      </div>

                    </div>

                    {/* Google Business Profile Listing Card */}
                    <div className="p-1.5 bg-white border-b border-slate-100 shadow-xs">
                      <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-[10px] sm:text-[11px] font-black text-slate-900 truncate">
                            Your Clinic
                          </h4>
                          <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-extrabold">
                            <span>5.0</span>
                            <span className="tracking-tighter">★★★★★</span>
                            <span className="text-slate-400 font-normal text-[8px]">(129)</span>
                          </div>
                          <p className="text-[8px] text-slate-500 font-medium truncate">
                            0.4 km • Open
                          </p>
                        </div>

                        {/* Clinic Thumbnail Photo */}
                        <img
                          src="/images/clinic-card-thumb.jpg"
                          alt="Your Clinic"
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover shrink-0 border border-white shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Google Map Mockup Background with Big 3D Pin */}
                    <div className="h-32 sm:h-36 bg-[#E8ECEF] relative overflow-hidden flex items-center justify-center">
                      
                      {/* Stylized Google Maps Road Vectors */}
                      <svg className="w-full h-full opacity-60" viewBox="0 0 200 200">
                        <rect x="0" y="0" width="200" height="200" fill="#F4F3F0" />
                        <path d="M 0,40 Q 80,45 200,30" stroke="#FFFFFF" strokeWidth="12" fill="none" />
                        <path d="M 0,40 Q 80,45 200,30" stroke="#E5E3DF" strokeWidth="14" fill="none" />
                        <path d="M 40,0 Q 45,90 30,200" stroke="#FFFFFF" strokeWidth="12" fill="none" />
                        <path d="M 140,0 L 170,200" stroke="#FFFFFF" strokeWidth="16" fill="none" />
                        <path d="M 0,130 Q 90,120 200,150" stroke="#FFFFFF" strokeWidth="14" fill="none" />
                        <rect x="60" y="60" width="50" height="50" rx="6" fill="#D2EBD2" opacity="0.7" />
                        <rect x="15" y="80" width="20" height="35" rx="4" fill="#E8E8E8" />
                        <rect x="140" y="70" width="40" height="30" rx="4" fill="#E8E8E8" />
                      </svg>

                      {/* Big Red 3D Location Pin */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="relative">
                          {/* Pulsing Beacon Circle */}
                          <div className="absolute -inset-1 rounded-full bg-red-400/40 animate-ping" />
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 relative z-10 border-2 border-white">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                          </div>
                        </div>
                        {/* Pin Shadow */}
                        <div className="w-4 h-1.5 bg-slate-900/30 rounded-full blur-[1px] mt-0.5" />
                      </div>

                    </div>

                  </div>

                </div>
              </div>

              {/* ── RIGHT 2 CARDS ── */}
              <div className="flex flex-col justify-between gap-5 sm:gap-6 w-[130px] sm:w-[155px] shrink-0">
                
                {/* CARD 3: Calls +42% */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-100 shadow-xl shadow-slate-200/60 text-left transition-transform hover:-translate-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                    Calls
                  </span>
                  <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                    +42%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                    vs last month
                  </span>
                  <div className="mt-1 w-full h-10 sm:h-12 overflow-visible">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path
                        d="M 5,34 Q 35,30 55,16 T 85,18 L 94,6 L 94,40 L 5,40 Z"
                        fill="url(#greenAreaGrad)"
                      />
                      <path
                        d="M 5,34 Q 35,30 55,16 T 85,18 L 94,6"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#greenArrow)"
                      />
                    </svg>
                  </div>
                </div>

                {/* CARD 4: Bookings +35% */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-100 shadow-xl shadow-slate-200/60 text-left transition-transform hover:-translate-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                    Bookings
                  </span>
                  <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
                    +35%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                    vs last month
                  </span>
                  <div className="mt-1 w-full h-10 sm:h-12 overflow-visible">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path
                        d="M 5,34 Q 35,32 55,20 T 85,16 L 94,8 L 94,40 L 5,40 Z"
                        fill="url(#greenAreaGrad)"
                      />
                      <path
                        d="M 5,34 Q 35,32 55,20 T 85,16 L 94,8"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        markerEnd="url(#greenArrow)"
                      />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT: Value Proposition & Checklist (Matching Reference Exactly) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            <div className="space-y-3">
              <span className="text-xs font-black text-[#1A56DB] uppercase tracking-wider block">
                DATA-DRIVEN GROWTH
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.18]">
                We Help Clinics <span className="text-[#1A56DB]">Get Found.</span><br />
                You Help Patients <span className="text-[#1A56DB]">Get Better.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
                Gyrex helps clinics like yours improve their online presence, attract the right patients, and grow sustainably.
              </p>
            </div>

            {/* Checkpoints with Solid Royal Blue Checkmark Circles */}
            <div className="space-y-3.5 pt-2">
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Trusted by doctors & clinics across India
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  Transparent process & actionable insights
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  100% Free. No hidden charges.
                </span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── ROYAL BLUE FOOTER BAR (MATCHING EXACT REFERENCE) ─────────────── */}
      <footer className="w-full bg-[#0A47C2] py-8 px-6 sm:px-12 text-white mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          
          {/* Left Side: 100% Free Audit with Shield Icon */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-tight">100% Free Audit</h4>
              <p className="text-xs text-blue-100 mt-0.5">
                No cost. No obligation. Just valuable insights.
              </p>
            </div>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden sm:block w-px h-10 bg-white/20" />

          {/* Right Side: Gyrex Branding & Tagline */}
          <div className="flex flex-col sm:items-start items-center">
            <GyrexLogo size="md" lightText={true} />
            <p className="text-xs text-blue-100 mt-1">
              Building visibility. Building trust. Building growth.
            </p>
          </div>

        </div>
      </footer>

      {/* ── CHECK AUDIT STATUS MODAL ─────────────────────────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 text-left">
            
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Check Your Audit Status</h3>
              <p className="text-xs text-slate-500">
                Enter your mobile number to get the live audit report link on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your 10-digit number"
                  value={statusPhone}
                  onChange={(e) => setStatusPhone(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] focus:bg-white"
                />
              </div>

              {statusResult && (
                <p className="text-xs text-rose-600 font-semibold">{statusResult}</p>
              )}

              <button
                type="submit"
                disabled={checkingStatus}
                className="w-full h-12 bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {checkingStatus ? (
                  <><RefreshCcw className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><MessageCircle className="w-4 h-4" /> Check Audit on WhatsApp</>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
