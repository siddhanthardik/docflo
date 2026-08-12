"use client";

import { useState } from "react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, MessageSquare, Star, Building2, PhoneCall, RefreshCcw } from "lucide-react";

export default function AuditLandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    clinicName: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setErrorMsg("Please enter your name and WhatsApp number.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      
      {/* Top Header Navigation (No Links to Keep Zero Distraction) */}
      <header className="w-full bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <GyrexLogo size="md" />
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span>Instant WhatsApp Audit</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Value Copy & Copy Highlights */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              <span>📍 Google Maps & WhatsApp Clinic Audit</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Doctor Saab, See How Your Clinic Ranks on Google Maps in 30 Seconds.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed">
              Stop losing local patients to nearby competitor clinics. Scan your Google Maps visibility and get your custom audit report sent straight to your WhatsApp.
            </p>

            {/* Pain Points Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Stop 25%+ Appointment No-Shows</h4>
                  <p className="text-[11px] text-slate-600">Automate 2-way WhatsApp reminders with 1-tap confirmation buttons.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Turn Happy Patients into 5-Star Reviews</h4>
                  <p className="text-[11px] text-slate-600">Auto-send Google Review links after consultation when patient satisfaction is highest.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Paperless WhatsApp Receipts in 1-Click</h4>
                  <p className="text-[11px] text-slate-600">Send digital OPD invoices instantly and save printing costs.</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-indigo-600" /> 100% Data Private</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4 text-indigo-600" /> Trusted by 500+ Indian Clinics</span>
            </div>
          </div>

          {/* Right Column: High-Conversion 2-Field Lead Capture Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
              
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Get Your Free WhatsApp Audit</h3>
                <p className="text-xs text-slate-500">Takes 30 seconds. No credit card or password needed.</p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-emerald-950">Audit Request Sent!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Thank you, <strong>Dr. {formData.name}</strong>. We are generating your Google Maps rank report and sending it directly to <strong>{formData.phone}</strong> on WhatsApp right now.
                  </p>
                  <a
                    href={`https://wa.me/919999999999?text=Hi%20Gyrex%2C%20I%20just%20requested%20my%20clinic%20audit%20for%20Dr.%20${encodeURIComponent(formData.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" /> Open WhatsApp Demo Chat
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Doctor / Practice Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Siddhant Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Clinic Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. City Care Clinic"
                        value={formData.clinicName}
                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing Audit...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /> Get Free WhatsApp Audit Report</>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-medium">
                    ⚡️ Report delivered to your WhatsApp within 30 seconds.
                  </p>

                </form>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-4 text-center text-xs text-slate-400 font-medium bg-white">
        © {new Date().getFullYear()} Gyrex Clinic Growth & Automation. All rights reserved.
      </footer>

    </div>
  );
}
