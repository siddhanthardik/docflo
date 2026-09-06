"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, CheckCircle2,
  ArrowRight, ChevronDown, Sparkles, Calculator, Briefcase,
  Building2, Clock, Wallet, Award, Check, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Footer } from "@/components/layout/Footer";

interface PackageItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceQuarterly?: number;
  priceYearly?: number;
  currency: string;
  features?: string[];
}

export default function AffiliatesPublicPage() {
  // Calculator State
  const [clinicsReferred, setClinicsReferred] = useState<number>(10);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Dynamic Packages fetched from Package Manager (/api/packages)
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const paid = data.filter((p: any) => (p.priceMonthly ?? 0) > 0);
          const list = paid.length > 0 ? paid : data;
          setPackages(list);
          const preferred = list.find((p: any) =>
            (p.slug || "").toLowerCase().includes("growth") || (p.name || "").toLowerCase().includes("growth")
          ) || list[0];
          if (preferred) {
            setSelectedPackageId(preferred.id);
          }
        }
      })
      .catch((err) => console.error("Failed to load packages for affiliates:", err))
      .finally(() => setPackagesLoading(false));
  }, []);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const currentPlanMonthlyPrice = selectedPackage
    ? (billingCycle === "yearly"
        ? (selectedPackage.priceYearly ? Math.round(selectedPackage.priceYearly / 12) : Math.round(selectedPackage.priceMonthly * 0.8))
        : selectedPackage.priceMonthly)
    : 0;

  const commissionRate = 0.20;
  const monthlyEarnings = Math.round(clinicsReferred * currentPlanMonthlyPrice * commissionRate);
  const annualEarnings = monthlyEarnings * 12;

  const formatINR = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">

      {/* ── STICKY PARTNER HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="shrink-0 flex items-center">
              <GyrexLogo size="md" />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Partner Program
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Earnings Calculator
            </a>
            <a href="#audiences" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Who Can Join
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/affiliates/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-2 transition-colors hidden sm:inline">
              Partner Login
            </Link>
            <Link href="/affiliates/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 text-sm font-semibold shadow-sm shadow-indigo-600/20">
                Join Free <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-14 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

            {/* Stat chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>20% Recurring Commission</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
                <Wallet className="w-3.5 h-3.5" />
                <span>Direct UPI &amp; Bank Payouts</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
              Earn Predictable Recurring Income by Partnering With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700">
                India&apos;s Healthcare Growth Platform
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Introduce doctors and specialty clinics to Gyrex.
              Earn <span className="font-semibold text-slate-900">20% recurring monthly commission</span> for
              every active subscription — we handle demos, onboarding, and clinic support.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/affiliates/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-105">
                  Become a Partner — It&apos;s Free
                </Button>
              </Link>
              <a href="#calculator" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm bg-white shadow-sm">
                  <Calculator className="w-4 h-4 mr-2 text-indigo-500" />
                  Estimate Your Monthly Payout
                </Button>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">₹0 Joining Fee</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Free to join, instant account approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">20% Recurring</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Earn every month the clinic stays active.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">60-Day Cookie</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Full attribution on every referral.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Bank &amp; UPI</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Monthly settlements on the 1st.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE COMMISSION CALCULATOR ── */}
        <section id="calculator" className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                How Much Can You Earn?
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
                Move the slider, choose a plan, and see your projected monthly payout — live pricing, no guesswork.
              </p>
            </div>

            {/* Light calculator card */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left: Controls */}
              <div className="lg:col-span-7 space-y-7">

                {/* Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-slate-700">Active Clinics Referred</label>
                    <span className="text-2xl font-bold text-indigo-600 font-mono">{clinicsReferred} clinics</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={clinicsReferred}
                    onChange={(e) => setClinicsReferred(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>1</span>
                    <span>10</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Package selection */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Clinic Subscription Plan
                    </label>
                    {/* Billing Cycle Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                          billingCycle === "monthly"
                            ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                          billingCycle === "yearly"
                            ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Annual
                      </button>
                    </div>
                  </div>

                  {packagesLoading ? (
                    <div className="py-8 text-center text-slate-400 font-medium text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading plans...</span>
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs text-center border border-slate-200">
                      No active plans available at the moment.
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${packages.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                      {packages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        const displayPrice = billingCycle === "yearly"
                          ? (pkg.priceYearly ? Math.round(pkg.priceYearly / 12) : Math.round(pkg.priceMonthly * 0.8))
                          : pkg.priceMonthly;

                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`p-4 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-50 shadow-sm ring-2 ring-indigo-200/60"
                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className={`text-xs font-semibold truncate max-w-[110px] ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                                {pkg.name}
                              </p>
                              {isSelected && (
                                <span className="text-[9px] uppercase font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className={`text-xl font-bold mt-0.5 ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>
                              ₹{displayPrice.toLocaleString("en-IN")}
                              <span className="text-xs text-slate-400 font-normal"> /mo</span>
                            </p>
                            {billingCycle === "yearly" && pkg.priceYearly && (
                              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                Billed ₹{pkg.priceYearly.toLocaleString("en-IN")}/yr
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Calculated at 20% recurring monthly commission on active clinic subscriptions.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Live pricing {selectedPackage ? `— ${selectedPackage.name}: ₹${currentPlanMonthlyPrice.toLocaleString("en-IN")}/mo` : "shown above"}.
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Payouts sent on the 1st of every month via NEFT or UPI.</span>
                  </p>
                </div>
              </div>

              {/* Right: Earnings Card */}
              <div className="lg:col-span-5 bg-indigo-600 rounded-2xl p-6 text-center space-y-5">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                  Your Estimated Monthly Payout
                </span>

                <div>
                  <h3 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                    {formatINR(monthlyEarnings)}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium mt-1">
                    per month · {clinicsReferred} clinics · {selectedPackage?.name || "Selected Plan"}
                  </p>
                </div>

                <div className="py-3 px-4 bg-white/10 rounded-xl border border-white/20 text-xs">
                  <span className="text-indigo-200 block mb-0.5">Annualised Income</span>
                  <span className="text-xl font-bold text-white">{formatINR(annualEarnings)} / year</span>
                </div>

                <Link href="/affiliates/register" className="block w-full">
                  <Button className="w-full bg-white hover:bg-indigo-50 text-indigo-700 font-semibold text-sm h-11 rounded-xl shadow-sm transition-all hover:scale-105">
                    Start Earning Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IS THIS PROGRAM FOR? ── */}
        <section id="audiences" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Built for Professionals With Doctor Relationships
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed">
                Whether you visit clinics in-person or deliver digital services, Gyrex gives you an easy way to monetise your network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Persona 1 — Pharma Rep */}
              <div className="bg-white rounded-2xl p-6 border-t-4 border-blue-500 border-x border-b border-x-slate-200/80 border-b-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Pharma &amp; Medical Reps</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Already visiting doctors every week? Introduce Gyrex and earn recurring commissions alongside your existing work — no extra sales pitch needed.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-blue-600">
                  MRs · Area Managers · Diagnostic Reps
                </div>
              </div>

              {/* Persona 2 — Agency */}
              <div className="bg-white rounded-2xl p-6 border-t-4 border-purple-500 border-x border-b border-x-slate-200/80 border-b-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Healthcare Agencies</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Bundle Gyrex with your clinic marketing services. Offer your doctor clients a WhatsApp receptionist, specialty website, and local rank tracking — without building it yourself.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-purple-600">
                  Digital Agencies · Web Designers · Freelancers
                </div>
              </div>

              {/* Persona 3 — Consultant */}
              <div className="bg-white rounded-2xl p-6 border-t-4 border-emerald-500 border-x border-b border-x-slate-200/80 border-b-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Practice Consultants</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Help clinic owners reduce no-shows, grow Google reviews, and convert more patient inquiries. Gyrex makes your consulting recommendations tangible and measurable.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-emerald-600">
                  Hospital Advisors · Clinic Operations Managers
                </div>
              </div>

              {/* Persona 4 — Doctors */}
              <div className="bg-white rounded-2xl p-6 border-t-4 border-amber-500 border-x border-b border-x-slate-200/80 border-b-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Practicing Doctors</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Recommend Gyrex to batchmates, medical association members, and clinic colleagues. Help your peers grow while earning passive income every month they stay subscribed.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-amber-600">
                  Clinic Founders · Medical Association Members
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                How the Partner Program Works
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed">
                We handle the technical setup, live demonstrations, and clinic support — you focus purely on making the introduction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting dashed line on desktop */}
              <div className="hidden md:block absolute top-5 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px border-t-2 border-dashed border-indigo-200 z-0" />

              {/* Step 1 */}
              <div className="relative space-y-4 z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-900">Sign Up Free</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Register your partner account in 60 seconds. Instant dashboard access with your unique referral links and bank settlement options.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative space-y-4 z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-900">Share or Introduce</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Share your referral link with doctors, or introduce clinics directly to our team. Our 60-day cookie ensures you always get credit.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative space-y-4 z-10">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-900">We Demo &amp; Onboard</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Our team runs a live walkthrough with the clinic, sets up their WhatsApp connection, and trains the clinic staff — fully handled by us.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative space-y-4 z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-base flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                  4
                </div>
                <h3 className="text-base font-semibold text-slate-900">Get Paid Monthly</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Receive 20% recurring commission every month on active subscriptions, transferred via NEFT/IMPS or UPI on the 1st.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CLINICS CHOOSE GYREX ── */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-indigo-50/60 to-slate-50 border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Why Doctors Say &ldquo;Yes&rdquo; to Gyrex
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed">
                Gyrex solves real, everyday problems clinics struggle with — making your referral conversations natural and easy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-3 shadow-sm">
                <div className="text-2xl">📍</div>
                <h3 className="text-base font-semibold text-slate-900">Rank #1 on Google Maps Locally</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Most clinics lose patients simply because they rank outside the top 3 on Google Maps in nearby neighbourhoods. Gyrex&apos;s heatmap tracker shows exactly where to improve and guides them to the top.
                </p>
              </div>

              <div className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-3 shadow-sm">
                <div className="text-2xl">💬</div>
                <h3 className="text-base font-semibold text-slate-900">24/7 WhatsApp Patient Assistant</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Clinics miss evening and weekend patient messages. Our WhatsApp assistant answers inquiries around the clock in 6+ languages and books appointments directly — no app installation needed.
                </p>
              </div>

              <div className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-3 shadow-sm">
                <div className="text-2xl">⭐</div>
                <h3 className="text-base font-semibold text-slate-900">More 5-Star Reviews, Automatically</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  After each consultation, Gyrex sends a WhatsApp review invitation to the patient. More positive reviews build clinic reputation and attract new patients without any manual effort.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQS ── */}
        <section id="faq" className="py-16 lg:py-24 bg-white border-b border-slate-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-sm text-slate-500">Everything you need to know before joining.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "How does the 20% recurring commission work?",
                  a: `When a doctor subscribes through your referral link or introduction, you earn 20% of their subscription fee every billing cycle (monthly or annual).${selectedPackage ? ` For example, referring a clinic on the ${selectedPackage.name} plan at ₹${currentPlanMonthlyPrice.toLocaleString("en-IN")}/mo yields ₹${Math.round(currentPlanMonthlyPrice * 0.20).toLocaleString("en-IN")} every month.` : ""} You earn for as long as the clinic remains subscribed.`,
                },
                {
                  q: "How and when are payouts processed?",
                  a: "Commissions are tabulated automatically in your partner portal. Payouts are transferred on the 1st of every month directly to your Indian bank account via NEFT/IMPS or your registered UPI ID (Google Pay, PhonePe, Paytm).",
                },
                {
                  q: "What is the cookie tracking duration?",
                  a: "We use a 60-day first-party attribution window. If a doctor visits through your link and signs up anytime within 60 days, you receive full commission credit — even across multiple visits.",
                },
                {
                  q: "Do I have to provide tech support to the clinic?",
                  a: "Zero tech support required from you. The Gyrex team handles 100% of clinic onboarding, WhatsApp setup, website themes, server hosting, and ongoing customer support.",
                },
                {
                  q: "Is there any cost to join the Partner Program?",
                  a: "None at all. Joining is completely free — no joining fee, no annual renewal, and no minimum referral targets.",
                },
                {
                  q: "Can I refer clinics if I run a digital marketing agency?",
                  a: "Absolutely. Many agencies bundle Gyrex with their existing clinic marketing services to offer WhatsApp automation and local search tracking without building it in-house.",
                },
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold text-slate-900 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-indigo-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA BANNER ── */}
        <section className="py-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Ready to Build Your Recurring Income?
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Join medical representatives, healthcare consultants, and doctors who earn predictable monthly commissions by introducing clinics to Gyrex.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/affiliates/register">
                <Button className="h-12 px-8 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-semibold text-sm shadow-lg transition-all hover:scale-105">
                  Create Free Partner Account <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/affiliates/login">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold text-sm bg-transparent">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
