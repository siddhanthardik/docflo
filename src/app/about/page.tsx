"use client";

import React from "react";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  MapPin,
  Star,
  Zap,
  MessageSquare,
  Check,
  Stethoscope,
  Building2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-grow pt-24 pb-20 space-y-16 sm:space-y-24">

        {/* ── 1. HERO SECTION: FULL WIDTH, CENTERED ── */}
        <section className="relative pt-12 pb-6 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-4">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              About Gyrex
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto mb-6">
              The waiting room taught us more than any market research ever could.
            </h1>

            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              A clinic isn&apos;t really a business to the doctor running it. It&apos;s closer to a life&apos;s work.
            </p>
          </div>
        </section>

        {/* ── 2. WHERE THIS STORY ACTUALLY BEGINS (2-COLUMN FULL-WIDTH GRID) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 lg:p-14 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Narrative (7 Cols) */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">The Origin</span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                    Where This Story Actually Begins
                  </h2>
                </div>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  It didn&apos;t start with an idea. It started with a lot of sitting around — in OPD waiting areas, in clinic corridors, in the gap between one patient leaving and the next one walking in.
                </p>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  I&apos;ve spent more than 10 years in healthcare. Enough time to know that a clinic isn&apos;t really a business to the doctor running it. It&apos;s closer to a life&apos;s work. And enough time to notice something that bothered me more every year.
                </p>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  The doctors I met weren&apos;t ordinary. One had trained for fifteen years to become a surgeon. Another was a gold medalist who could have taken a job anywhere but chose to open a small neighborhood practice instead. A pediatrician who knew every child&apos;s name, not just their file number. These were people who had put in the years and earned their skill.
                </p>
              </div>

              {/* Right Column: Featured Pull-Quote Card (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-white rounded-2xl border border-amber-200/80 p-7 sm:p-9 shadow-xs space-y-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-serif text-2xl font-bold">
                    &ldquo;
                  </div>
                  
                  <blockquote className="text-lg sm:text-xl font-serif italic text-amber-950 leading-snug">
                    &ldquo;Why is my OPD half-empty when I know I&apos;m good at this?&rdquo;
                  </blockquote>

                  <div className="pt-4 border-t border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-1">
                    <p className="font-bold text-slate-900">The Question We Kept Hearing</p>
                    <p className="text-slate-600">
                      Asked by doctor after doctor, across specialties and cities. The answer was never about clinical capability.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 3. WHAT I KEPT SEEING, OVER AND OVER (4-CARD FULL-WIDTH GRID) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">The Reality Gap</span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              What I Kept Seeing, Over and Over
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              The answer never had anything to do with medicine.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Search at 9:00 PM
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  It had to do with a patient searching <em>&ldquo;best dermatologist near me&rdquo;</em> at 9 PM, and a big hospital chain&apos;s ad showing up first — not because they were better, but because they had a marketing team and this doctor didn&apos;t.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  The 8-Second Website
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  It had to do with a clinic website that took eight seconds to load, so the patient just gave up and called someone else.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  11:30 PM Fever Message
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  It had to do with a mother messaging a clinic&apos;s WhatsApp at 11:30 at night because her child had a fever, hearing nothing back, and finding a different doctor by morning — one who just happened to be awake.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  The Forgotten Review
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  It had to do with a patient walking out of a consultation happy, meaning to leave a good review, and forgetting by the time they got home. Nobody had asked. The front desk was busy with the next patient.
                </p>
              </div>
            </div>

          </div>

          {/* Full Width Insight Callout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-4xl mx-auto shadow-2xs">
            <p className="text-base sm:text-xl font-serif text-slate-900 leading-relaxed">
              None of it was about how good a doctor someone was. <br className="hidden sm:inline" />
              <span className="font-bold text-blue-700">All of it decided whether that doctor got found in the first place.</span>
            </p>
          </div>
        </section>

        {/* ── 4. WHY THIS SHOULDN'T BE A DOCTOR'S JOB (FULL-WIDTH 2-COLUMN) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 lg:p-14 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">The Unfair Burden</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  Why This Shouldn&apos;t Be a Doctor&apos;s Job
                </h2>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  Nobody spends a decade in medical college, studying through the night and pulling shifts in the emergency ward, planning to also become good at Google rankings, website speed, or WhatsApp automation. But that&apos;s what running an independent clinic today has quietly turned into.
                </p>
              </div>

              <div className="lg:col-span-6 space-y-4 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200/80">
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  Most doctors end up doing one of two things — teaching themselves marketing at midnight after a full day of patients, or paying an agency a heavy monthly fee and hoping something changes.
                </p>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    I saw this happen with doctor after doctor, in city after city. At some point I stopped just noticing it and started trying to fix it.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 5. SO WE BUILT GYREX (FULL-WIDTH 4-COLUMN PLATFORM) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl space-y-10">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">The Platform</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                So We Built Gyrex
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Gyrex handles the parts of running a clinic that have nothing to do with medicine, so a doctor doesn&apos;t have to learn them.
              </p>
            </div>

            {/* 4 Feature Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Google Maps Discovery</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  It shows your clinic to patients nearby who are searching on Google Maps.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Fast Booking Website</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  It gives you a website that actually loads fast and lets people book directly.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">24/7 WhatsApp AI</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  It answers patients on WhatsApp at 2 AM the same way it would at 2 PM, in whatever language they&apos;re comfortable speaking.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Automated Reviews</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  And after a visit, it asks the happy patients for a review, so that goodwill doesn&apos;t just evaporate on the way home.
                </p>
              </div>

            </div>

            <div className="pt-6 border-t border-white/10 text-center">
              <p className="text-base sm:text-lg text-cyan-200 font-medium italic max-w-2xl mx-auto">
                None of it needs training. None of it needs your time. It just runs in the background, the way a good front desk always should have.
              </p>
            </div>

          </div>
        </section>

        {/* ── 6. WHAT WE HOLD ONTO (3-COLUMN FULL-WIDTH GRID) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Our Core Principles</span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              What We Hold Onto
            </h2>
            <p className="text-base text-slate-600">
              Three convictions that guide every product decision we make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Conviction 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Skill over advertising budget
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                A good doctor should be found because they&apos;re good, not because they spent the most on ads. Skill should decide who a patient finds first, not budget.
              </p>
            </div>

            {/* Conviction 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Sacred clinical time
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                A doctor&apos;s time shouldn&apos;t go into this. If something we build needs a manual or ongoing upkeep from you, we haven&apos;t done our job properly.
              </p>
            </div>

            {/* Conviction 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-serif">
                Care at any hour
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                A patient at midnight deserves the same care as one at noon. People remember how they were treated before they even walked in the door.
              </p>
            </div>

          </div>
        </section>

        {/* ── 7. WHAT WE'RE WORKING TOWARD (FULL-WIDTH CENTERED BANNER) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-xs space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">The Mission</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              What We&apos;re Working Toward
            </h2>
            <p className="text-base sm:text-xl text-slate-700 leading-relaxed font-normal pt-2">
              A small neighborhood clinic should be able to reach patients the same way a large hospital chain does. Not because someone forced things to be fair, but because the tools finally caught up with the doctors who deserved them all along.
            </p>
          </div>
        </section>

        {/* ── 8. A PERSONAL NOTE & SIGNATURE (FULL-WIDTH CARD) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FFFDF9] rounded-3xl border border-amber-200/90 p-8 sm:p-12 lg:p-14 shadow-sm space-y-6 max-w-4xl mx-auto">
            
            <div className="flex items-center gap-3 pb-4 border-b border-amber-200/60">
              <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-serif font-bold text-base shadow-2xs">
                SH
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">A Personal Note</h3>
                <p className="text-xs text-slate-500">From the founder</p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              I built this after years of hearing the same frustration, in different cities, from doctors across different specialties — always coming back to the same root cause. Gyrex carries a piece of every one of those conversations.
            </p>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              If you&apos;re a doctor reading this and something in it sounds familiar — the empty OPD chair, the WhatsApp message you saw too late, the review you deserved but never got — this was built with you in mind.
            </p>

            <div className="pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-serif font-bold text-slate-900 text-xl tracking-tight">
                  — Siddhant Hardik
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Founder, Gyrex
                </p>
              </div>
              <span className="text-xs text-amber-900/80 font-serif italic">
                Built with deep respect for independent doctors
              </span>
            </div>

          </div>
        </section>

        {/* ── 9. CALL TO ACTION (FULL-WIDTH) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Ready to give your clinic the presence it deserves?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              Join dedicated doctors who run their patient growth and WhatsApp communication seamlessly with Gyrex.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-12 px-7 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2">
                  <span>Start Your 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/local-seo/free-audit">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm h-12 px-6 rounded-xl">
                  Run a Free 60-Second Audit
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
