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

      {/* ── DATA-DRIVEN GROWTH / MOBILE MOCKUP SECTION ────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-14 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* LEFT: Smartphone Graphic with Floating Performance Badges */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Center Phone Container */}
            <div className="w-[240px] sm:w-[260px] h-[480px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative z-10 flex flex-col">
              
              {/* Phone Speaker Notch */}
              <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Inside Screen */}
              <div className="bg-[#F8FAFC] flex-1 rounded-[28px] overflow-hidden flex flex-col relative text-left">
                
                {/* Search Bar */}
                <div className="p-3 bg-white border-b border-slate-200">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded-full text-[10px]">
                    <span className="font-extrabold text-[#4285F4]">G</span>
                    <span className="text-slate-600 font-medium truncate">best doctor near me</span>
                    <Search className="w-3 h-3 text-slate-400 ml-auto" />
                  </div>
                </div>

                {/* Google Map Mockup */}
                <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full opacity-40" viewBox="0 0 200 200">
                    <path d="M0,50 Q100,60 200,40" stroke="#CBD5E1" strokeWidth="8" fill="none" />
                    <path d="M50,0 Q60,100 40,200" stroke="#CBD5E1" strokeWidth="8" fill="none" />
                    <path d="M120,0 L180,200" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                    <path d="M0,140 Q100,120 200,160" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                  </svg>
                  {/* Red Location Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                    <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Clinic Card at bottom */}
                <div className="p-3 bg-white border-t border-slate-200 space-y-1 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Your Clinic</h4>
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                        <span>5.0</span>
                        <span>★★★★★</span>
                        <span className="text-slate-400 font-normal">(128)</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      🏥
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium">0.4 km • Open</p>
                </div>

              </div>
            </div>

            {/* FLOATING CARD 1: Top Left - Visibility Score Low */}
            <div className="absolute -top-3 sm:top-4 -left-2 sm:-left-6 z-20 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 sm:p-3.5 w-36 sm:w-40 text-left">
              <span className="text-[10px] text-slate-500 font-semibold block">Visibility Score</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">Low</span>
              <svg className="w-full h-8 mt-1 text-red-500" viewBox="0 0 100 30" fill="none">
                <path d="M5,5 L35,15 L65,10 L95,25" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* FLOATING CARD 2: Bottom Left - Directions +31% */}
            <div className="absolute -bottom-3 sm:bottom-6 -left-2 sm:-left-6 z-20 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 sm:p-3.5 w-36 sm:w-40 text-left">
              <span className="text-[10px] text-slate-500 font-semibold block">Directions</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-black text-slate-900">+31%</span>
                <span className="text-[9px] text-slate-400">vs last month</span>
              </div>
              <svg className="w-full h-8 mt-1 text-emerald-500" viewBox="0 0 100 30" fill="none">
                <path d="M5,25 L35,18 L65,22 L95,8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* FLOATING CARD 3: Top Right - Calls +42% */}
            <div className="absolute -top-3 sm:top-4 -right-2 sm:-right-6 z-20 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 sm:p-3.5 w-36 sm:w-40 text-left">
              <span className="text-[10px] text-slate-500 font-semibold block">Calls</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-black text-slate-900">+42%</span>
                <span className="text-[9px] text-slate-400">vs last month</span>
              </div>
              <svg className="w-full h-8 mt-1 text-emerald-500" viewBox="0 0 100 30" fill="none">
                <path d="M5,25 L35,20 L65,12 L95,5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* FLOATING CARD 4: Bottom Right - Bookings +35% */}
            <div className="absolute -bottom-3 sm:bottom-6 -right-2 sm:-right-6 z-20 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 sm:p-3.5 w-36 sm:w-40 text-left">
              <span className="text-[10px] text-slate-500 font-semibold block">Bookings</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-black text-slate-900">+35%</span>
                <span className="text-[9px] text-slate-400">vs last month</span>
              </div>
              <svg className="w-full h-8 mt-1 text-emerald-500" viewBox="0 0 100 30" fill="none">
                <path d="M5,25 L35,22 L65,10 L95,6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

          </div>

          {/* RIGHT: Value Proposition & Checklist */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            <div className="space-y-3">
              <span className="text-xs font-black text-[#1A56DB] uppercase tracking-wider block">
                DATA-DRIVEN GROWTH
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.2]">
                We Help Clinics <span className="text-[#1A56DB]">Get Found.</span><br />
                You Help Patients <span className="text-[#1A56DB]">Get Better.</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                Gyrex helps clinics like yours improve their online presence, attract the right patients, and grow sustainably.
              </p>
            </div>

            {/* Checkpoints */}
            <div className="space-y-3.5 pt-2">
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Trusted by doctors & clinics across India
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Transparent process & actionable insights
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-bold text-slate-800">
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
