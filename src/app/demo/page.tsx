"use client";

import React from "react";
import Link from "next/link";
import { AIRepceptionistSimulator } from "@/components/marketing/AIRepceptionistSimulator";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, MessageSquare, 
  ChevronRight, Calendar, Star, ShieldCheck 
} from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20">
        {/* Interactive Simulator Hero */}
        <AIRepceptionistSimulator />

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Why Doctors Choose Gyrex
              </h3>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                Built specifically for Indian healthcare practices to streamline appointment bookings and elevate patient satisfaction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900">24/7 Patient Inquiries</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Patients reach out at night and on weekends. Gyrex responds instantly and books confirmed OPD slots round the clock.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900">Fluent Multilingual Chat</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Communicates naturally in English, Hindi, Hinglish, Bengali, Tamil, Telugu, Kannada, Gujarati, and Punjabi.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900">In-Clinic &amp; Video Care</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Seamlessly quotes respective fees and schedules both in-person visits and virtual video consultations.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action Card */}
            <div className="mt-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-xl shadow-blue-500/20">
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 text-xs">
                No Credit Card Required • Instant Setup
              </Badge>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                Ready to Automate Your Practice on WhatsApp?
              </h3>
              <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto">
                Join doctors using Gyrex to streamline appointment bookings and grow 5-star Google reviews.
              </p>
              <div className="pt-2">
                <Link href="/register">
                  <Button className="bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-sm sm:text-base px-8 py-6 rounded-2xl shadow-lg">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Practice Comparison Table */}
        <ComparisonTable />
      </main>

      <Footer />
    </div>
  );
}
