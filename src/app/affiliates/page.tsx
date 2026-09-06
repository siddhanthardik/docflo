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

  // Dynamic Packages fetched from Superadmin Package Manager (/api/packages)
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Filter active paid packages
          const paid = data.filter((p: any) => (p.priceMonthly ?? 0) > 0);
          const list = paid.length > 0 ? paid : data;
          setPackages(list);
          // Prefer 'Growth' or first available package
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

  const commissionRate = 0.20; // 20%
  const monthlyEarnings = Math.round(clinicsReferred * currentPlanMonthlyPrice * commissionRate);
  const annualEarnings = monthlyEarnings * 12;

  const formatINR = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── STICKY PARTNER HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="shrink-0 flex items-center">
              <GyrexLogo size="xl" />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Partner Program
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Earnings Calculator
            </a>
            <a href="#audiences" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Who Can Join
            </a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/affiliates/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors">
              Partner Login
            </Link>
            <Link href="/affiliates/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 text-sm font-semibold shadow-md shadow-indigo-600/20">
                Join Free <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-bold shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>20% Recurring Lifetime Commission • Direct Indian Bank / UPI Payouts</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
              Earn Predictable Recurring Income by Partnering With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700">
                India&apos;s Healthcare Growth Platform
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Introduce doctors, dental clinics, and specialty practices to Gyrex. 
              Earn <span className="font-bold text-slate-900">20% recurring monthly commission</span> for 
              every active subscription. We handle the demos, onboarding, and 24/7 clinic support.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/affiliates/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-transform hover:scale-105">
                  Become a Partner in 60 Seconds
                </Button>
              </Link>
              <a href="#calculator" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-7 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm bg-white shadow-sm">
                  <Calculator className="w-4 h-4 mr-2 text-indigo-600" />
                  Estimate Your Monthly Payout
                </Button>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">₹0 Joining Fee</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Free to join with instant account approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">20% Recurring Cut</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Earn every month the doctor stays subscribed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">60-Day Cookie</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Full multi-touch attribution on every lead.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Bank &amp; UPI Payouts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Monthly settlements directly on the 1st.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE COMMISSION CALCULATOR (DYNAMIC FROM PACKAGE MANAGER) ── */}
        <section id="calculator" className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                Transparent Economics
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                How Much Can You Earn?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                All package pricing is synchronized directly from our central Package Manager with zero ambiguity.
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-900/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Interactive Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-200">Active Clinics Referred</label>
                    <span className="text-2xl font-black text-indigo-400 font-mono">{clinicsReferred} clinics</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={clinicsReferred}
                    onChange={(e) => setClinicsReferred(parseInt(e.target.value))}
                    className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>1 clinic</span>
                    <span>10 clinics</span>
                    <span>25 clinics</span>
                    <span>50 clinics</span>
                  </div>
                </div>

                {/* Dynamic Packages from Superadmin Package Manager */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-bold text-slate-200">
                      Clinic Subscription Package
                    </label>
                    
                    {/* Billing Cycle Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-800 rounded-lg border border-slate-700 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-3 py-1 rounded-md font-bold transition-all ${
                          billingCycle === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-3 py-1 rounded-md font-bold transition-all ${
                          billingCycle === "yearly" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Annual Plan
                      </button>
                    </div>
                  </div>

                  {packagesLoading ? (
                    <div className="py-8 text-center text-slate-400 font-medium text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading official packages from Superadmin...</span>
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="p-4 bg-slate-800/80 rounded-xl text-slate-400 text-xs text-center border border-slate-700">
                      No active paid packages configured in Superadmin yet.
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
                            className={`p-3.5 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-500/20 text-white shadow-md ring-2 ring-indigo-400/30"
                                : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold uppercase tracking-wide truncate max-w-[120px]">{pkg.name}</p>
                              {isSelected && (
                                <span className="text-[9px] uppercase font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-black text-white mt-1">
                              ₹{displayPrice.toLocaleString("en-IN")}
                              <span className="text-xs text-slate-400 font-normal"> /mo</span>
                            </p>
                            {billingCycle === "yearly" && pkg.priceYearly && (
                              <p className="text-[10px] text-emerald-400 font-medium">
                                Billed ₹{pkg.priceYearly.toLocaleString("en-IN")}/yr
                              </p>
                            )}
                            {pkg.description && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                                {pkg.description}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Calculated at 20% recurring monthly commission on active clinic subscriptions.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Synchronized with official Superadmin package manager rates ({selectedPackage ? `${selectedPackage.name}: ₹${currentPlanMonthlyPrice.toLocaleString("en-IN")}/mo` : "live rates"}).</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Payouts sent automatically on the 1st of every month via direct NEFT or UPI.</span>
                  </p>
                </div>
              </div>

              {/* Right: Projected Income Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-5 shadow-inner">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Your Estimated Passive Payout</span>
                
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {formatINR(monthlyEarnings)}
                  </h3>
                  <p className="text-xs text-indigo-300 font-semibold mt-1">
                    per month ({clinicsReferred} clinics on {selectedPackage?.name || "Selected Plan"})
                  </p>
                </div>

                <div className="py-3 px-4 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <span className="text-slate-400 block">Annualized Passive Income</span>
                  <span className="text-lg font-black text-emerald-400">{formatINR(annualEarnings)} / year</span>
                </div>

                <Link href="/affiliates/register" className="block w-full">
                  <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-indigo-500/25">
                    Start Earning Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IS THIS PROGRAM FOR? ── */}
        <section id="audiences" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                Ideal Partners
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                Built for Professionals With Doctor Relationships
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Whether you visit clinics in-person or deliver digital services, Gyrex gives you an easy way to monetize your network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Persona 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pharma &amp; Medical Reps</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  You are already visiting doctors and clinics every week. Introduce a solution that solves their biggest headache—empty appointment slots and missed WhatsApp inquiries.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600">
                  Ideal for: MRs, Area Managers, Diagnostic Reps
                </div>
              </div>

              {/* Persona 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Healthcare Agencies</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Provide your doctor clients with 24/7 WhatsApp receptionist automation, 20 specialty website themes, and 5×5 local rank tracking without hiring software developers.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-purple-600">
                  Ideal for: Digital Agencies, Web Designers, Freelancers
                </div>
              </div>

              {/* Persona 3 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Practice Consultants</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Advise hospital administrators and clinic owners on proven operational tech. Gyrex increases patient conversion, reduces OPD no-shows, and grows 5-star Google reviews.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600">
                  Ideal for: Hospital Advisors, Clinic Operations Managers
                </div>
              </div>

              {/* Persona 4 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Practicing Doctors</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Recommend Gyrex to fellow batchmates, medical association members, and clinic colleagues. Help your peers digitize their patient inquiries while earning recurring income.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-amber-600">
                  Ideal for: Clinic Founders, Medical Association Members
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                Simple 4-Step Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                How the Partner Program Works
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                We handle the technical setup, live clinic demonstrations, and ongoing customer support so you can focus solely on introductions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="relative space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sign Up Free</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Register your partner account in 60 seconds. Instant dashboard access with your unique referral links and bank settlement options.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Share or Introduce</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Share your link with doctors, or introduce clinics directly to our sales specialists. Our 60-day cookie ensures you receive attribution.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">We Demo &amp; Onboard</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our product specialists run live 1-on-1 walkthroughs with the clinic, connect their WhatsApp QR code, and train their clinic staff.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  4
                </div>
                <h3 className="text-lg font-bold text-slate-900">Get Paid Monthly</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive 20% recurring commissions every single month on active subscriptions, transferred via direct NEFT/IMPS or UPI on the 1st.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CLINICS BUY GYREX (WHAT YOU ARE SELLING) ── */}
        <section className="py-16 lg:py-24 bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/20">
                Effortless Conversions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                Why Doctors Readily Say &quot;Yes&quot; to Gyrex
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2">
                Gyrex solves real, tangible practice growth bottlenecks that doctors struggle with every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  📍
                </div>
                <h3 className="text-base font-bold text-white">5×5 Google Maps Geo-Rank Domination</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Doctors lose 70% of local patient calls if they drop outside the top 3 on Google Maps. Our geo-heatmap tracker identifies neighborhood gaps and guides them to Rank #1.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  💬
                </div>
                <h3 className="text-base font-bold text-white">24/7 WhatsApp Practice Receptionist</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Clinics miss evening and weekend patient inquiries. Our Baileys QR-connected assistant answers patient inquiries 24/7 in 6+ languages and books appointments directly.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  ⭐
                </div>
                <h3 className="text-base font-bold text-white">Automated 5-Star Review Engine</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatically triggers WhatsApp review invitations after patient consultations, multiplying positive Google reviews and shielding the clinic against unfair ratings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQS ── */}
        <section id="faq" className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                Got Questions?
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Partner Program FAQs</h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "How does the 20% recurring commission work?",
                  a: `When a doctor subscribes through your referral link or introduction, you earn 20% of their subscription fee every single billing cycle (monthly or yearly). Commissions apply directly to all active packages configured in Gyrex Package Manager${selectedPackage ? ` (for example, referring a clinic on the ${selectedPackage.name} plan at ₹${currentPlanMonthlyPrice.toLocaleString("en-IN")}/mo yields ₹${Math.round(currentPlanMonthlyPrice * 0.20).toLocaleString("en-IN")} every month)` : ""}. You earn for as long as the clinic remains active.`,
                },
                {
                  q: "How and when are payouts processed?",
                  a: "Commissions are tabulated automatically inside your partner portal. Payouts are transferred on the 1st of every month directly to your Indian bank account via NEFT/IMPS or your registered UPI ID (Google Pay, PhonePe, Paytm).",
                },
                {
                  q: "What is the cookie tracking duration?",
                  a: "Our multi-touch attribution engine uses a 60-day first-party cookie and browser storage window. If a doctor visits through your link, browses the site, and signs up anytime within 60 days, you will receive full commission credit.",
                },
                {
                  q: "Do I have to provide tech support to the clinic?",
                  a: "Zero tech support required on your end. The Gyrex team handles 100% of the clinic onboarding, WhatsApp QR setup, specialty website themes, server hosting, and customer support.",
                },
                {
                  q: "Is there any cost to join the Gyrex Partner Program?",
                  a: "None. Becoming a partner is 100% free with no joining fee, no annual renewal fees, and no minimum referral targets.",
                },
                {
                  q: "Can I refer clinics if I already run a digital marketing agency?",
                  a: "Absolutely! Many healthcare agencies white-label or bundle Gyrex with their existing clinic marketing services to add immediate WhatsApp automation and local search tracking for their doctor clients.",
                },
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 text-sm hover:bg-slate-100/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openFaqIndex === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA BANNER ── */}
        <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Ready to Build Your Healthcare Recurring Income?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join hundreds of medical representatives, healthcare marketers, and consultants who earn predictable commissions with Gyrex.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/affiliates/register">
                <Button className="h-12 px-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-transform hover:scale-105">
                  Create Free Partner Account <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/affiliates/login">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-white/20 text-white hover:bg-white/10 font-bold text-sm bg-transparent">
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
