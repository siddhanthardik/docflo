"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, X, Sparkles, Clock, ShieldCheck, HeartPulse, 
  HelpCircle, ChevronRight, UserCheck, Smartphone, TrendingUp,
  AlertTriangle, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComparisonItem {
  feature: string;
  category: "Availability & Speed" | "Patient Experience" | "Data & Reputation" | "Cost & ROI";
  gyrex: {
    text: string;
    positive: boolean;
    subtext?: string;
  };
  receptionist: {
    text: string;
    positive: boolean;
    subtext?: string;
  };
  aggregators: {
    text: string;
    positive: boolean;
    subtext?: string;
  };
  genericBots: {
    text: string;
    positive: boolean;
    subtext?: string;
  };
}

const COMPARISON_DATA: ComparisonItem[] = [
  // ── Availability & Speed ──
  {
    feature: "Availability & Response Speed",
    category: "Availability & Speed",
    gyrex: {
      text: "24/7/365 Instant (< 3 seconds)",
      positive: true,
      subtext: "Answers night inquiries, Sundays & holiday patient emergencies instantly."
    },
    receptionist: {
      text: "8–10 hours / day",
      positive: false,
      subtext: "Misses all calls after 7 PM, lunch hours, sick leaves & weekends."
    },
    aggregators: {
      text: "Delayed app browsing",
      positive: false,
      subtext: "Patients wait for manual confirmation through marketplace app."
    },
    genericBots: {
      text: "Instant (< 5 seconds)",
      positive: true,
      subtext: "Replies quickly but sends static repetitive button prompts."
    }
  },
  {
    feature: "Multilingual Patient Fluency",
    category: "Availability & Speed",
    gyrex: {
      text: "English, Hindi, Hinglish + 7 Indian Languages",
      positive: true,
      subtext: "Speaks naturally in Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada & Punjabi."
    },
    receptionist: {
      text: "Usually 1 or 2 local languages",
      positive: false,
      subtext: "Struggles with out-of-state patients or mixed English-Hindi dialects."
    },
    aggregators: {
      text: "App English/Standard UI only",
      positive: false,
      subtext: "Lacks conversational clinical warmth in local dialects."
    },
    genericBots: {
      text: "Scripted English only",
      positive: false,
      subtext: "Breaks immediately if patient writes in Hinglish or regional script."
    }
  },

  // ── Patient Experience ──
  {
    feature: "Booking Convenience for Patients",
    category: "Patient Experience",
    gyrex: {
      text: "Direct inside WhatsApp (Zero App Download)",
      positive: true,
      subtext: "Patients book in 60 seconds right inside their favorite daily messaging app."
    },
    receptionist: {
      text: "Phone calls & waiting on hold",
      positive: false,
      subtext: "Phone line busy during peak morning rush or when front desk is assisting visitors."
    },
    aggregators: {
      text: "Must install third-party app",
      positive: false,
      subtext: "Forces patient to download external app, create account & remember passwords."
    },
    genericBots: {
      text: "Frustrating 'Press 1, Press 2' buttons",
      positive: false,
      subtext: "Rigid IVR-style menu trees that lead to high patient drop-offs."
    }
  },
  {
    feature: "OPD & Teleconsultation Scheduling",
    category: "Patient Experience",
    gyrex: {
      text: "Live OPD Shift Sync & Instant Fee Quotes",
      positive: true,
      subtext: "Quotes respective in-clinic or video consultation fees, shifts & location directions."
    },
    receptionist: {
      text: "Manual diary or notebook entry",
      positive: false,
      subtext: "High chance of double bookings, misplaced files, and handwriting errors."
    },
    aggregators: {
      text: "Locked in portal calendar",
      positive: false,
      subtext: "Requires doctor to constantly manage two calendars to prevent conflicts."
    },
    genericBots: {
      text: "No healthcare scheduling intelligence",
      positive: false,
      subtext: "Generic e-commerce bots cannot understand follow-up rules or OPD shifts."
    }
  },

  // ── Data & Reputation ──
  {
    feature: "Patient Database Ownership",
    category: "Data & Reputation",
    gyrex: {
      text: "100% Doctor Owned & Private",
      positive: true,
      subtext: "Your patients remain your patients on your official clinic WhatsApp line."
    },
    receptionist: {
      text: "Clinic files (Risk of staff turnover)",
      positive: true,
      subtext: "Data remains in clinic, but knowledge leaves when staff resigns."
    },
    aggregators: {
      text: "Aggregator owns patient database",
      positive: false,
      subtext: "Platform can retarget your patients and send them to competing clinics."
    },
    genericBots: {
      text: "Stored on third-party SaaS servers",
      positive: false,
      subtext: "Difficult to export or synchronize with hospital EMR."
    }
  },
  {
    feature: "Competitor Ads on Your Profile",
    category: "Data & Reputation",
    gyrex: {
      text: "Zero Competitor Ads (100% Private)",
      positive: true,
      subtext: "Private, VIP brand experience exclusively showcasing your clinic."
    },
    receptionist: {
      text: "Zero Competitor Ads",
      positive: true,
      subtext: "Front desk only promotes your personal clinic."
    },
    aggregators: {
      text: "Promotes rival doctors on your profile",
      positive: false,
      subtext: "Shows 'Other Doctors Near You' with sponsored badges right below your name."
    },
    genericBots: {
      text: "Zero Competitor Ads",
      positive: true,
      subtext: "No competitor ads."
    }
  },
  {
    feature: "Google 5-Star Review Automations",
    category: "Data & Reputation",
    gyrex: {
      text: "Automated Post-Consultation Reviews",
      positive: true,
      subtext: "Dominates local Google Maps 3-pack by requesting verified Google reviews via WhatsApp."
    },
    receptionist: {
      text: "Rarely asked (Staff forgets 95% of time)",
      positive: false,
      subtext: "Front desk staff rarely reminds patients to leave positive online reviews."
    },
    aggregators: {
      text: "Reviews stay trapped on their portal",
      positive: false,
      subtext: "Builds authority for their marketplace brand, NOT your local Google Business Profile."
    },
    genericBots: {
      text: "Not supported",
      positive: false,
      subtext: "No integration with Google Business Profile or local medical SEO."
    }
  },

  // ── Cost & ROI ──
  {
    feature: "Monthly Investment & Pricing Model",
    category: "Cost & ROI",
    gyrex: {
      text: "Flat ₹3,999 / month (Zero Commission)",
      positive: true,
      subtext: "Unlimited patient bookings, zero commission per consultation, full AI capability."
    },
    receptionist: {
      text: "₹18,000 – ₹25,000 / month salary",
      positive: false,
      subtext: "Plus annual bonuses, training downtime, sick leaves, and replacement costs."
    },
    aggregators: {
      text: "High listing fee + ₹200–₹500 per patient",
      positive: false,
      subtext: "Costs ₹50,000 to ₹1,50,000+ per year, plus commission for every single consultation."
    },
    genericBots: {
      text: "Per-conversation Meta API billing",
      positive: false,
      subtext: "Surprise monthly utility/marketing template bills from WhatsApp Cloud API."
    }
  }
];

export function ComparisonTable() {
  const [mobileView, setMobileView] = useState<"receptionist" | "aggregators" | "genericBots">("receptionist");

  return (
    <section id="comparison" className="py-20 bg-slate-50 border-t border-slate-200/80 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200/80 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Clear Healthcare Advantage
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Gyrex Compares to Traditional Alternatives
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            See why forward-thinking medical clinics choose Gyrex AI over full-time staff payroll, generic chatbots, and high-commission aggregator portals.
          </p>
        </div>

        {/* ── DESKTOP COMPARISON TABLE (≥ 1024px) ── */}
        <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="p-5 w-1/4 text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Core Capability
                  </th>
                  
                  {/* Gyrex Column Header (Highlighted) */}
                  <th className="p-5 w-1/4 bg-emerald-50/80 border-x-2 border-t-2 border-emerald-500 align-top">
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-xs mb-0.5">
                        <Sparkles className="w-3 h-3 text-amber-300" /> Recommended
                      </span>
                      <span className="text-base font-black text-slate-900 flex items-center justify-center gap-1.5">
                        Gyrex AI Practice
                      </span>
                      <p className="text-xs font-extrabold text-emerald-700">
                        Flat ₹3,999 / mo
                      </p>
                    </div>
                  </th>

                  <th className="p-5 w-1/6 text-center text-sm font-bold text-slate-700">
                    <div>Front-Desk Staff</div>
                    <span className="text-xs text-slate-400 font-normal">₹18k–₹25k / mo</span>
                  </th>

                  <th className="p-5 w-1/6 text-center text-sm font-bold text-slate-700">
                    <div>Doctor Portals</div>
                    <span className="text-xs text-slate-400 font-normal">Commission per Lead</span>
                  </th>

                  <th className="p-5 w-1/6 text-center text-sm font-bold text-slate-700">
                    <div>Generic Bots</div>
                    <span className="text-xs text-slate-400 font-normal">Static Button Trees</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {COMPARISON_DATA.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    {/* Feature Title */}
                    <td className="p-5 font-bold text-slate-900 align-top">
                      <div className="space-y-0.5">
                        <span>{item.feature}</span>
                        <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                    </td>

                    {/* Gyrex Cell (Highlighted) */}
                    <td className="p-5 bg-emerald-50/30 border-x-2 border-emerald-500/80 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 leading-tight">
                            {item.gyrex.text}
                          </p>
                          {item.gyrex.subtext && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.gyrex.subtext}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Receptionist Cell */}
                    <td className="p-5 align-top text-center text-slate-700">
                      <div className="flex flex-col items-center gap-1.5">
                        {item.receptionist.positive ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className="font-medium text-xs leading-snug">
                          {item.receptionist.text}
                        </span>
                      </div>
                    </td>

                    {/* Aggregators Cell */}
                    <td className="p-5 align-top text-center text-slate-700">
                      <div className="flex flex-col items-center gap-1.5">
                        {item.aggregators.positive ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className="font-medium text-xs leading-snug">
                          {item.aggregators.text}
                        </span>
                      </div>
                    </td>

                    {/* Generic Bots Cell */}
                    <td className="p-5 align-top text-center text-slate-700">
                      <div className="flex flex-col items-center gap-1.5">
                        {item.genericBots.positive ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className="font-medium text-xs leading-snug">
                          {item.genericBots.text}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Table Bar with CTA */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-700 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Zero Setup Fees • No Credit Card Required</strong> — Try the full AI assistant in our live sandbox.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/ai-receptionist-demo">
                <Button variant="outline" className="text-xs h-10 px-4 rounded-xl border-slate-300">
                  Open Interactive Demo
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-emerald-600/20">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── MOBILE COMPARISON CARDS (< 1024px) ── */}
        <div className="block lg:hidden space-y-5">
          {/* Mobile Comparison Target Toggle */}
          <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center justify-between shadow-xs">
            <button
              type="button"
              onClick={() => setMobileView("receptionist")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center",
                mobileView === "receptionist"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              vs Front Desk
            </button>
            <button
              type="button"
              onClick={() => setMobileView("aggregators")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center",
                mobileView === "aggregators"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              vs Portals
            </button>
            <button
              type="button"
              onClick={() => setMobileView("genericBots")}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center",
                mobileView === "genericBots"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              vs Button Bots
            </button>
          </div>

          {/* Feature List Cards */}
          <div className="space-y-3.5">
            {COMPARISON_DATA.map((item, idx) => {
              const other = mobileView === "receptionist" 
                ? item.receptionist 
                : mobileView === "aggregators" 
                ? item.aggregators 
                : item.genericBots;

              const otherTitle = mobileView === "receptionist" 
                ? "Human Front Desk" 
                : mobileView === "aggregators" 
                ? "Aggregator Portals" 
                : "Generic Button Bots";

              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">{item.feature}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.category}</span>
                  </div>

                  {/* Gyrex Advantage */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs font-extrabold text-emerald-950">
                        Gyrex AI Practice Engine (₹3,999/mo)
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 pl-6">
                      {item.gyrex.text}
                    </p>
                    {item.gyrex.subtext && (
                      <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                        {item.gyrex.subtext}
                      </p>
                    )}
                  </div>

                  {/* Competitor Alternative */}
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                        other.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {other.positive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {otherTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium pl-6">
                      {other.text}
                    </p>
                    {other.subtext && (
                      <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                        {other.subtext}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Bottom CTA */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900">
              Ready to Upgrade Your Clinic Front Desk?
            </h4>
            <p className="text-xs text-slate-500">
              Flat ₹3,999 / month with zero patient commissions.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Link href="/ai-receptionist-demo">
                <Button variant="outline" className="w-full text-xs h-10 rounded-xl">
                  Try Live Simulator
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
