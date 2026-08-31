"use client";

import React from "react";
import Link from "next/link";
import { AIRepceptionistSimulator } from "@/components/marketing/AIRepceptionistSimulator";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, ShieldCheck, Clock, MessageSquare, 
  Sparkles, CheckCircle2, ChevronRight, Zap, PhoneCall, Star 
} from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-12">
        {/* Interactive Simulator Hero */}
        <AIRepceptionistSimulator />

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-slate-900 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Why 500+ Indian Clinics Trust Docflo AI
              </h3>
              <p className="mt-3 text-slate-400 text-sm">
                Built specifically for Indian healthcare practices to eliminate front-desk chaos and capture every patient lead.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-white">38% Inquiries Captured After-Hours</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Patients search for doctors at night and on weekends. Docflo responds in 3 seconds and books confirmed OPD slots while you sleep.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-white">Fluent Multilingual Intelligence</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Communicates naturally in English, Hindi, Hinglish, Bengali, Tamil, Telugu, Kannada, Gujarati, and Punjabi.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-white">100% Clinical Guardrails</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Strictly protects doctor liability. Never guesses diagnoses or medications, routing complex queries directly to your clinic reception.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-14 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-xs">
                Zero Setup Fee • 14-Day Free Trial
              </Badge>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                Ready to Automate Your Practice on WhatsApp?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
                Join hundreds of doctors using Docflo to streamline appointment bookings and grow 5-star Google reviews.
              </p>
              <div className="pt-2">
                <Link href="/register">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-base px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/25">
                    Start Your 14-Day Free Trial Now 🚀
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
