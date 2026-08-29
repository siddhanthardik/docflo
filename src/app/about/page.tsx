"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Users,
  Compass,
  Building2,
  Star,
  MessageCircle,
  TrendingUp,
  Award,
  Globe2,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-grow pt-24 pb-20">
        
        {/* ── 1. HERO SECTION: WARM, HUMAN EDITORIAL OPENING ── */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Our Story &amp; Purpose</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-slate-900 leading-[1.15] mb-6">
            We built Gyrex because <br className="hidden sm:inline" />
            <span className="italic font-normal text-blue-600">exceptional doctors</span> deserve to be found.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            Doctors spend over a decade mastering medicine, yet find themselves navigating marketing agencies, broken websites, and missed patient messages. We set out to give doctors back their time.
          </p>
        </section>

        {/* ── 2. THE FOUNDER'S LETTER / TRUE STORY ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 lg:p-14 shadow-sm relative overflow-hidden">
            {/* Ambient accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
              
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-serif font-bold text-lg">
                  G
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">A Letter from the Founder</h2>
                  <p className="text-xs text-slate-500">Why Gyrex was created</p>
                </div>
              </div>

              <p>
                The idea for Gyrex didn&apos;t come from a tech conference or a boardroom. It was born while sitting in the waiting rooms of dedicated doctors across our cities.
              </p>

              <p>
                Every day, we met brilliant practitioners—gold medalists, experienced surgeons, compassionate pediatricians, and general physicians—who had dedicated their lives to treating patients. Yet, despite their medical expertise, their OPD waiting chairs were often half-empty.
              </p>

              <p>
                Meanwhile, large corporate hospital chains with massive advertising budgets were dominating Google Maps search results, capturing all neighborhood inquiries simply because they had digital marketing departments.
              </p>

              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/60 my-6">
                <p className="text-amber-950 font-serif italic text-base sm:text-lg leading-snug">
                  &ldquo;Doctors did not spend 10 to 15 years in grueling medical training to become SEO technicians, digital marketers, or website managers.&rdquo;
                </p>
              </div>

              <p>
                When independent clinics tried to build a digital presence, they faced an exhausting cycle:
              </p>

              <ul className="space-y-2.5 pl-2 text-base text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>Agencies charging heavy monthly retainers with zero verifiable increase in patient footfall.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>Slow, generic websites that took 8 seconds to load on mobile phones.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>Anxious patients sending WhatsApp inquiries late at night when the clinic front desk was closed, only to seek care elsewhere by morning.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>Delighted patients leaving the clinic with a smile but forgetting to write a Google review once they reached home.</span>
                </li>
              </ul>

              <p>
                We built <strong>Gyrex</strong> to fix this disconnect permanently.
              </p>

              <p>
                Gyrex is an automated, unified practice growth platform designed exclusively for healthcare clinics. It combines neighborhood Google Maps SEO, lightning-fast clinical websites, 24/7 multilingual WhatsApp AI reception, and automated 5-star review collection into one seamless system.
              </p>

              <p>
                Our promise is simple: <strong>We handle your clinic&apos;s digital growth and patient communication quietly in the background, so you can focus 100% of your energy on patient care.</strong>
              </p>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-serif font-bold text-slate-900 text-base">The Gyrex Team</p>
                  <p className="text-xs text-slate-500">Built with respect for the medical profession</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor-First Design</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 3. OUR THREE CORE CONVICTIONS ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-slate-900">
              The Principles That Guide Us
            </h2>
            <p className="text-base text-slate-600">
              Everything we build at Gyrex is anchored in three non-negotiable convictions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Principle 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">
                  1. Clinical Expertise Should Determine Visibility
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A patient looking for medical care should find the most competent, caring doctor in their neighborhood—not merely the hospital chain that spent the most on advertising.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-blue-600 font-semibold flex items-center gap-1">
                <span>5×5 Geo-Rank SEO</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Principle 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">
                  2. A Doctor&apos;s Time is Sacred
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Software for clinics must be effortless. It should launch in minutes, require zero technical maintenance, and automate routine tasks without interrupting your consultation schedule.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span>Zero-Maintenance Platform</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Principle 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">
                  3. Empathy at Every Patient Touchpoint
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Whether a patient messages at 2:00 PM or 2:00 AM, they deserve warmth, clarity, and instant assistance in their native language—building trust even before they step into your clinic.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-purple-600 font-semibold flex items-center gap-1">
                <span>24/7 WhatsApp AI Care</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          </div>
        </section>

        {/* ── 4. MISSION & VISION STATEMENTS ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* MISSION */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-900 to-slate-900 text-white shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center border border-blue-400/30">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest block">Our Mission</span>
              <h3 className="text-2xl font-serif font-bold text-white">
                Empowering doctors with the digital presence their expertise deserves.
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                To eliminate the technical, administrative, and marketing obstacles that stand between compassionate doctors and the patients who need them most.
              </p>
            </div>

            {/* VISION */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                <Globe2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block">Our Vision</span>
              <h3 className="text-2xl font-serif font-bold text-white">
                A healthcare community where quality clinical care is always discoverable.
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                A future where independent doctors, specialty practices, and family clinics have access to the same world-class digital capabilities as large corporate hospital networks.
              </p>
            </div>

          </div>
        </section>

        {/* ── 5. CALL TO ACTION ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Ready to elevate your clinic&apos;s digital practice?
            </h2>
            <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              Join forward-thinking doctors who have modernized their clinic websites, local Google rankings, and WhatsApp patient care with Gyrex.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-12 px-7 rounded-xl shadow-md transition-transform hover:scale-105">
                  Start 14-Day Free Trial
                </Button>
              </Link>
              <Link href="/local-seo/free-audit">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm h-12 px-6 rounded-xl">
                  Run Free 60-Sec Audit
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
