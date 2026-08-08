"use client";

import React from "react";
import Image from "next/image";
import {
  Sparkles,
  Search,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Users,
  Award,
  CheckCircle2,
  BarChart3,
  Globe,
  ArrowUpRight,
  Shield,
  Layers,
  Activity,
  Smile,
  Clock,
  Building2,
  Stethoscope
} from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <LandingHeader />

      <main className="flex-grow pt-28 pb-20">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-md mb-8 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>About Gyrex</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Helping Clinics Grow with{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>

            {/* Subtitle / Lead Paragraph */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Running a clinic today involves much more than providing excellent medical care. Gyrex brings together Google Business Profile management, WhatsApp communication, patient engagement, appointment management, billing, and practical automation into one unified platform designed specifically for healthcare providers.
            </p>
          </div>

          {/* Hero Image Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl shadow-cyan-500/10 group">
            <div className="relative h-[320px] sm:h-[480px] lg:h-[540px] w-full">
              <Image
                src="/images/about_hero.jpg"
                alt="Gyrex Platform Architectural Overview"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>

            {/* Floating Metric Cards on Image */}
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 z-20">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">350%+</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Google Local Search Growth</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">99.4%</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Patient Retention Rate</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">10M+</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Automated WhatsApp Reminders</div>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">4.9 ★</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Average Google Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* OUR STORY & THE GAP SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Born From a Simple Observation in Healthcare
              </h2>
              <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed">
                <p>
                  Patients search online before they visit. They compare ratings, read reviews, check photos, send WhatsApp messages, and expect quick responses. At the same time, clinic teams are busy managing appointments, answering calls, following up with patients, and handling everyday administrative work.
                </p>
                <p>
                  Many clinics provide excellent treatment, yet struggle to attract new patients or build a strong online presence. Meanwhile, other clinics with average services often appear first on Google simply because they manage their digital presence better.
                </p>
                <p className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 font-medium">
                  Success should not depend on marketing knowledge alone. Every clinic deserves access to tools that help patients find them, communicate with them easily, and build trust online. Gyrex was built to close that gap.
                </p>
              </div>
            </div>

            {/* Story Image / Visual Graphic */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl group">
                <Image
                  src="/images/about_story.jpg"
                  alt="Healthcare Team Collaborating"
                  width={600}
                  height={450}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Designed For Practitioners</div>
                      <div className="text-xs text-slate-400">Our goal is to make everything around patient care easier.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Guided by Purpose & Vision
            </h2>
            <p className="text-slate-400 text-lg">
              Empowering clinics—from solo practices to multi-location healthcare groups—with practical technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* MISSION CARD */}
            <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
              
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-8">
                <Target className="w-7 h-7" />
              </div>
              
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Our Mission</span>
              <h3 className="text-2xl font-bold text-white mb-4">
                To help healthcare providers build trusted, growing practices through simple technology.
              </h3>
              <p className="text-slate-300 leading-relaxed text-base">
                We want every clinic—whether it&apos;s a solo practice or a multi-location healthcare group—to have access to practical tools that improve visibility, strengthen patient relationships, and simplify day-to-day operations. By reducing repetitive administrative work and improving digital engagement, we help healthcare teams spend more time where it matters most—with their patients.
              </p>
            </div>

            {/* VISION CARD */}
            <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
              
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-8">
                <Globe className="w-7 h-7" />
              </div>
              
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Our Vision</span>
              <h3 className="text-2xl font-bold text-white mb-4">
                A future where every great healthcare provider is easy to discover, easy to reach, and trusted by their community.
              </h3>
              <p className="text-slate-300 leading-relaxed text-base">
                We believe that quality healthcare should never remain hidden because of poor digital visibility or outdated communication. Our vision is to help clinics build lasting relationships with patients by making every interaction—from the first Google search to post-treatment follow-up—simple, professional, and consistent.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE BELIEVE (CORE PILLARS & GRAPH VISUALIZER) */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Core Principles</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              What We Believe
            </h2>
            <p className="text-slate-400 text-lg mt-2">
              Four fundamental values driving every feature we design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Great Healthcare Deserves to Be Found</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Patients cannot choose a clinic they never discover. Helping healthcare providers improve their online visibility means helping more patients access quality care.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-1">
                <span>Discoverability</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Trust Is Earned Every Day</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A phone call answered promptly. A clear appointment reminder. A thoughtful follow-up message. Genuine patient reviews. Small interactions build lasting trust.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <span>Patient Trust</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Simplicity Creates Better Experiences</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Healthcare professionals already work under constant pressure. Software should reduce complexity, not add to it. Every feature we build is intuitive and practical.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                <span>Zero Friction</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">Growth Should Be Measurable</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Clinic growth is more than increasing patient numbers. It means building a stronger reputation, improving satisfaction, and reducing missed appointments.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-semibold text-indigo-400 flex items-center gap-1">
                <span>Sustainable Results</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Interactive Graph Data Visualization Component */}
          <div className="mt-12 p-8 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Measurable Impact Across Partner Clinics</h3>
                <p className="text-sm text-slate-400">Average performance metrics recorded 90 days after adopting Gyrex</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"/> Google Visibility</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"/> Appointment Confirmation Rate</span>
              </div>
            </div>

            {/* CSS / SVG Bar Chart */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-300">Local Google Search Rank (Top 3 Placement)</span>
                  <span className="text-cyan-400 font-bold">+280% Increase</span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full w-[88%] transition-all duration-1000" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-300">WhatsApp Confirmation & Follow-up Rate</span>
                  <span className="text-indigo-400 font-bold">96.8% Success</span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[96.8%] transition-all duration-1000" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-300">No-Show Reduction (Missed Appointments)</span>
                  <span className="text-emerald-400 font-bold">-72% Decrease</span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full w-[72%] transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DO (PRODUCT SUITE) */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              What We Do
            </h2>
            <p className="text-slate-400 text-lg">
              Gyrex supports clinics throughout every stage of the patient journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Help Patients Find Your Clinic</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Improve your Google Business Profile, monitor local search performance, publish regular updates, and understand what helps your clinic become more visible in local search results.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Make Communication Easier</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Manage WhatsApp conversations, send appointment confirmations and reminders, follow up after consultations, and encourage patient feedback from one central place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Simplify Daily Operations</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Organize appointments, maintain patient records, generate invoices, manage staff access, and keep everyday clinic activities running smoothly with zero friction.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Strengthen Your Reputation</h3>
              <p className="text-slate-300 leading-relaxed text-sm">
                Monitor reviews, respond professionally, and build a stronger online presence that helps new patients choose your clinic with absolute confidence.
              </p>
            </div>
          </div>
        </section>

        {/* OUR APPROACH & LOOKING AHEAD */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Approach Goals */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                <span>Our Approach</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Clinic Growth Begins with Trust
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                When patients can easily find your clinic, communicate effortlessly, receive timely updates, and share positive experiences, growth becomes a natural outcome. That&apos;s why every feature in Gyrex is designed around three simple goals:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Make your clinic easier to discover</h4>
                    <p className="text-sm text-slate-400 mt-0.5">Reach local patients searching on Google and Google Maps.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Make every patient interaction more professional</h4>
                    <p className="text-sm text-slate-400 mt-0.5">Automated WhatsApp notifications, confirmations, and follow-ups.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Make everyday clinic operations simpler</h4>
                    <p className="text-sm text-slate-400 mt-0.5">Streamline appointments, staff access, and patient records.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Looking Ahead Card */}
            <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 space-y-6">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Looking Ahead</span>
              <h3 className="text-2xl font-extrabold text-white">A Better Way to Grow</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Healthcare continues to evolve, and so do patient expectations. Clinics need practical tools that support both exceptional care and sustainable growth.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                At Gyrex, we are committed to building solutions that help healthcare providers strengthen their digital presence, improve patient communication, and create better experiences for every person who walks through their doors.
              </p>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-sm text-cyan-300 leading-relaxed font-medium">
                &ldquo;Every clinic has a unique story. Our job is to help more people discover it. Because when healthcare providers grow, communities receive better care.&rdquo;
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
