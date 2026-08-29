"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, MessageSquare, ShieldCheck, TrendingUp, Heart, Zap, Target,
  Globe, Award, BarChart3, CheckCircle2, Clock, Stethoscope, Building2,
  Sparkles, ArrowRight, Shield, Layers, Users, Activity, Bot, Palette,
  Compass, Check, Star, Lock, QrCode, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-grow pt-20">
        
        {/* ── 1. HERO SECTION: PURPOSE & FOUNDING PHILOSOPHY ── */}
        <section className="relative w-full min-h-[520px] lg:min-h-[580px] flex items-center justify-center overflow-hidden bg-slate-950">
          {/* Background Hero Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/indian_doctors_hero_clean.jpg"
              alt="Gyrex Healthcare Team"
              fill
              className="object-cover object-center lg:object-[center_25%]"
              priority
            />
            {/* Gradient Overlays for High Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 z-10" />
          </div>

          {/* Hero Content */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div className="max-w-3xl space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>The Story Behind Gyrex</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Engineered for Modern Doctors, Built for{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                  Patient Trust
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                We founded Gyrex to solve a single fundamental challenge: Helping exceptional doctors get discovered on Google Maps, build a strong clinical brand, and automate everyday practice operations without technical complexity.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-lg transition-transform hover:scale-105">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
                <Link href="/#clinic-websites">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-xs h-11 px-6 rounded-xl bg-transparent">
                    Explore 20 Clinic Themes
                  </Button>
                </Link>
              </div>

            </div>
          </div>

          {/* Floating Metric Badges Bar at Bottom of Hero */}
          <div className="absolute bottom-0 inset-x-0 z-20 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 py-3.5 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-black text-cyan-400">500+</div>
                  <div className="text-[11px] text-slate-400">Active Clinics</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-400">98%</div>
                  <div className="text-[11px] text-slate-400">WhatsApp Open Rate</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-black text-purple-300">20</div>
                  <div className="text-[11px] text-slate-400">Specialty Themes</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-black text-amber-400">4.9 ★</div>
                  <div className="text-[11px] text-slate-400">Doctor Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. THE FOUNDER'S STORY: WHY I BUILT GYREX ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>The Genesis</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Why I Built Gyrex: Bridging the Gap Between Medical Expertise and Digital Practice Growth
              </h2>

              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  The journey of Gyrex started with a deeply frustrating observation in the Indian healthcare landscape.
                </p>
                <p>
                  Across every city and neighborhood, we met brilliant doctors with decades of rigorous medical training, gold medals, and genuine compassion for their patients. Yet, their OPD waiting rooms were often half-empty. Meanwhile, heavily commercialized corporate chains with average medical care were dominating Google search results, monopolizing patient inquiries, and ranking #1 simply because they had specialized digital marketing teams.
                </p>
                <p>
                  When independent doctors attempted to bridge this gap, they were met with predatory digital marketing agencies that charged exorbitant monthly retainers, delivered generic WordPress websites that took 8 seconds to load, and provided zero transparency on local Google rankings.
                </p>
                <p className="font-semibold text-slate-900">
                  Doctors did not spend a decade in medical school to become digital marketers, SEO technicians, or website coders.
                </p>
                <p>
                  That realization sparked the creation of <strong>Gyrex</strong>: an automated, all-in-one practice growth system engineered specifically for healthcare providers. We combined 5×5 Geo-Rank Local SEO, custom specialty websites with 99+ PageSpeed, a 24/7 multilingual WhatsApp AI receptionist, and automated 5-star review collection into a single, intuitive platform that works quietly in the background while doctors focus 100% on healing patients.
                </p>
              </div>
            </div>

            {/* Visual Highlight Card */}
            <div className="lg:col-span-5">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-2xl space-y-6 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-cyan-400 flex items-center justify-center border border-blue-400/30">
                  <Stethoscope className="w-6 h-6" />
                </div>
                
                <h3 className="text-2xl font-black text-white leading-snug">
                  &ldquo;Our goal is not to change how doctors practice medicine. Our goal is to make everything around patient care effortless.&rdquo;
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No marketing agencies or technical jargon</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated Google Maps ranking &amp; review collection</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>24/7 patient inquiry handling on WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>20 Specialty Clinical Website Themes ready in 2 mins</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3. WHY THIS PLATFORM WAS NEEDED: THE HEALTHCARE DILEMMA ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xs my-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why This Platform Was Needed
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Modern patients search on Google Maps, check reviews, and expect instant responses on WhatsApp. The old fragmented way of running a clinic is broken.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* The Old Fragmented Way */}
            <div className="p-7 rounded-3xl bg-rose-50/50 border border-rose-200/80 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                <X className="w-3.5 h-3.5" />
                <span>The Fragmented Old Way</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Expensive marketing agencies charging monthly retainers with zero verifiable ROI.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Slow, bloated websites that fail Google Core Web Vitals and lack specialty medical menus.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Missed patient inquiries after clinic hours and on weekends when front desk is closed.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Low review velocity — satisfied patients forget to review on Google after leaving OPD.</span>
                </li>
              </ul>
            </div>

            {/* The Gyrex Solution */}
            <div className="p-7 rounded-3xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>The Gyrex Practice Platform</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>5×5 Geo-Rank heatmaps simulate 25 virtual searchers to dominate local neighborhood map packs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>20 Specialty Clinical Website Themes with 99+ Google PageSpeed and custom domain support.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>24/7 Multilingual WhatsApp AI receptionist that answers treatment queries and books OPD slots.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automated 2-step WhatsApp surveys converting 70%+ of happy patients into 5-star Google reviews.</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* ── 4. MISSION & VISION STATEMENTS ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Guided by Purpose, Driven by Impact
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Our commitment to the doctors and clinics who care for millions of families every day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* MISSION CARD */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Our Mission</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                To empower every healthcare provider with an effortless, automated practice growth platform.
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We believe that great medicine deserves to be found. By eliminating the administrative burden of marketing, website management, and patient communication, we help doctors spend more of their time doing what they do best — providing exceptional patient care.
              </p>
            </div>

            {/* VISION CARD */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Our Vision</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                A healthcare landscape where quality medical expertise is universally discoverable and trusted.
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We envision a future where no clinic is left behind because of outdated technology. Whether a solo pediatrician or a multi-location cardiology center, every clinic will have the world-class digital presence they deserve to build lasting patient relationships.
              </p>
            </div>

          </div>
        </section>

        {/* ── 5. HOW IT WAS DEVELOPED: OUR CORE ETHICAL PILLARS ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Our Core Architectural Principles
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Four non-negotiable principles that guide every feature we build at Gyrex.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero Marketing Fluff</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Everything is engineered around real clinical OPD workflows, verified Google Maps data, and direct patient communication.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Medical Data Privacy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                100% direct QR-based WhatsApp pairing. Zero 3rd-party data mining or unauthorized access to patient health records.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Instant 2-Minute Setup</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero coding, zero server configurations. Select your specialty theme, link your WhatsApp, and launch your practice platform immediately.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg transition-all space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Measurable Clinical ROI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track every metric with clarity: Google Maps rank positions, WhatsApp consultation bookings, and review conversion rates.
              </p>
            </div>

          </div>
        </section>

        {/* ── 6. PRACTICE GROWTH CTA BANNER ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-2xl text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
              Join Hundreds of Doctors Growing Their Practice with Confidence
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
              Take complete control of your clinic&apos;s digital presence, Google Maps rankings, and 24/7 patient engagement.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs h-12 px-7 rounded-xl shadow-xl transition-transform hover:scale-105">
                  Start 14-Day Free Trial 🚀
                </Button>
              </Link>
              <Link href="/local-seo/free-audit">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-xs h-12 px-6 rounded-xl bg-transparent">
                  Get Free 60-Sec Audit
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
