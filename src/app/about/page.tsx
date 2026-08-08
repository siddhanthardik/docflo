"use client";

import React from "react";
import Image from "next/image";
import {
  Search,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Globe,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Stethoscope,
  Building2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Users,
  Activity
} from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-grow pt-20">
        {/* FULL-WIDTH HERO SECTION WITH OVERLAY TEXT */}
        <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-slate-950">
          {/* Background Hero Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/indian_doctors_hero_clean.jpg"
              alt="Gyrex Healthcare Team"
              fill
              className="object-cover object-center lg:object-[center_20%]"
              priority
            />
            {/* Gradient Overlays for perfect readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 z-10" />
          </div>

          {/* Hero Overlay Text */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
                Helping Clinics Grow with{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                  Confidence
                </span>
              </h1>
              
              <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl">
                Running a clinic today involves much more than providing excellent medical care. Gyrex provides the complete digital engine for modern healthcare practices.
              </p>

              {/* Quick Trust Badges */}
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Google Business & Local SEO
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> WhatsApp Automation
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Patient Management
                </span>
              </div>
            </div>
          </div>

          {/* Floating Metric Badges Bar at Bottom of Hero */}
          <div className="absolute bottom-0 inset-x-0 z-20 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-cyan-400">+350%</div>
                  <div className="text-xs text-slate-400">Google Search Rank</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-indigo-300">99.4%</div>
                  <div className="text-xs text-slate-400">Patient Retention</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-emerald-400">10M+</div>
                  <div className="text-xs text-slate-400">Automated Reminders</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-amber-400">4.9 ★</div>
                  <div className="text-xs text-slate-400">Average Patient Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROMINENTLY HIGHLIGHTED GYREX PLATFORM BANNER */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-snug tracking-tight text-white">
                Gyrex brings together Google Business Profile management, WhatsApp communication, patient engagement, appointment management, billing, and practical automation into one unified platform designed specifically for healthcare providers.
              </p>

              <div className="pt-6 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-blue-100 text-base font-medium">
                <span>Our goal is not to change the way doctors practice medicine.</span>
                <span className="font-bold text-white bg-white/15 px-4 py-2 rounded-xl border border-white/20 shadow-inner">
                  Our goal is to make everything around patient care easier.
                </span>
              </div>
            </div>
          </div>

          {/* Intro Context Paragraphs */}
          <div className="mt-12 text-slate-600 text-base sm:text-lg leading-relaxed space-y-4 max-w-4xl mx-auto text-center sm:text-left">
            <p>
              Patients search online before they visit. They compare ratings, read reviews, check photos, send WhatsApp messages, and expect quick responses.
            </p>
            <p>
              At the same time, clinic teams are busy managing appointments, answering calls, following up with patients, and handling everyday administrative work. These responsibilities are important, but they often take valuable time away from patient care. Gyrex was created to make managing and growing a clinic simpler.
            </p>
          </div>
        </section>

        {/* OUR STORY SECTION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Born From a Simple Observation in Healthcare
              </h2>
              <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                <p>
                  The idea behind Gyrex came from a simple observation.
                </p>
                <p>
                  Many clinics provide excellent treatment, yet struggle to attract new patients or build a strong online presence. Meanwhile, other clinics with average services often appear first on Google simply because they manage their digital presence better.
                </p>
              </div>
            </div>

            {/* Story Card Visual */}
            <div className="lg:col-span-5 relative">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Making Everything Around Patient Care Easier
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We handle digital visibility, WhatsApp messaging, appointment confirmations, and daily admin so doctors can focus 100% on providing care.
                </p>
                
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Simple Setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Zero Technical Hassle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Built for Doctors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Instant Growth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Guided by Purpose & Vision
            </h2>
            <p className="text-slate-600 text-lg">
              Empowering healthcare practices through intuitive digital solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* MISSION CARD */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-all" />
              
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <Target className="w-7 h-7" />
              </div>
              
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Our Mission</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
                To help healthcare providers build trusted, growing practices through simple technology.
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                We want every clinic—whether it&apos;s a solo practice or a multi-location healthcare group—to have access to practical tools that improve visibility, strengthen patient relationships, and simplify day-to-day operations. By reducing repetitive administrative work and improving digital engagement, we help healthcare teams spend more time where it matters most—with their patients.
              </p>
            </div>

            {/* VISION CARD */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-all" />
              
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <Globe className="w-7 h-7" />
              </div>
              
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">Our Vision</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
                A future where every great healthcare provider is easy to discover, easy to reach, and trusted by their community.
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                We believe that quality healthcare should never remain hidden because of poor digital visibility or outdated communication. Our vision is to help clinics build lasting relationships with patients by making every interaction—from the first Google search to post-treatment follow-up—simple, professional, and consistent.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE BELIEVE */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              What We Believe
            </h2>
            <p className="text-slate-600 text-lg mt-3">
              Four fundamental values driving every feature we design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-blue-300 hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Great Healthcare Deserves to Be Found</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Patients cannot choose a clinic they never discover. Helping healthcare providers improve their online visibility means helping more patients access quality care.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trust Is Earned Every Day</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                A phone call answered promptly. A clear appointment reminder. A thoughtful follow-up message. A genuine patient review. Small interactions build lasting trust. Technology should make these moments easier—not replace them.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-cyan-300 hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Simplicity Creates Better Experiences</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Healthcare professionals already work under constant pressure. Software should reduce complexity, not add to it. Every feature we build is designed to be intuitive, practical, and easy to use.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Growth Should Be Measurable</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Clinic growth is more than increasing patient numbers. It means building a stronger reputation, improving patient satisfaction, reducing missed appointments, and creating sustainable long-term success.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE DO SECTION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              What We Do
            </h2>
            <p className="text-slate-600 text-lg">
              Gyrex supports clinics throughout every stage of the patient journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Help Patients Find Your Clinic</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Improve your Google Business Profile, monitor local search performance, publish regular updates, and understand what helps your clinic become more visible in local search results.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Make Communication Easier</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Manage WhatsApp conversations, send appointment confirmations and reminders, follow up after consultations, and encourage patient feedback from one place.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Simplify Daily Operations</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Organize appointments, maintain patient records, generate invoices, manage staff access, and keep everyday clinic activities running smoothly.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Strengthen Your Reputation</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Monitor reviews, respond professionally, and build a stronger online presence that helps new patients choose your clinic with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* OUR APPROACH & LOOKING AHEAD */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Approach */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                <span>Our Approach</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Clinic Growth Begins with Trust
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                We believe clinic growth begins with trust. When patients can easily find your clinic, communicate effortlessly, receive timely updates, and share positive experiences, growth becomes a natural outcome.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                That&apos;s why every feature in Gyrex is designed around three simple goals:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Make your clinic easier to discover</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Reach local patients searching on Google and Google Maps.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Make every patient interaction more professional</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Automated WhatsApp notifications, confirmations, and follow-ups.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Make everyday clinic operations simpler</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Streamline appointments, staff access, and patient records.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Looking Ahead Card */}
            <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white shadow-2xl space-y-6">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">Looking Ahead</span>
              <h3 className="text-3xl font-black text-white">A Better Way to Grow</h3>
              <p className="text-slate-300 text-base leading-relaxed">
                Healthcare continues to evolve, and so do patient expectations. Clinics need practical tools that support both exceptional care and sustainable growth.
              </p>
              <p className="text-slate-300 text-base leading-relaxed">
                At Gyrex, we are committed to building solutions that help healthcare providers strengthen their digital presence, improve patient communication, and create better experiences for every person who walks through their doors.
              </p>
              <p className="text-slate-300 text-base leading-relaxed">
                As more clinics join the Gyrex community, our commitment remains the same: Helping healthcare providers spend less time managing processes and more time caring for people.
              </p>
              
              <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md text-sm text-cyan-200 leading-relaxed font-medium">
                &ldquo;Every clinic has a unique story. Our job is to help more people discover it. Whether you&apos;re starting your first practice or expanding across multiple locations, Gyrex is here to support your journey with practical technology, thoughtful design, and a deep understanding of how modern clinics grow. Because when healthcare providers grow, communities receive better care.&rdquo;
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
