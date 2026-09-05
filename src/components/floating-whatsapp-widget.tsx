"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Sparkles, Send, MessageCircle, Calendar, HelpCircle, ShieldCheck } from "lucide-react";

export function FloatingWhatsAppWidget() {
  const pathname = usePathname();
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const status = sessionContext?.status;

  const [mounted, setMounted] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("919717228528");
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissedPrompt, setHasDismissedPrompt] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDoctorDomain, setIsDoctorDomain] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      // If accessed via a subdomain like dr-vinay.gyrex.in or a custom domain, mark as doctor site
      if (host.includes(".gyrex.in") && host !== "gyrex.in" && host !== "www.gyrex.in") {
        setIsDoctorDomain(true);
      } else if (host !== "gyrex.in" && host !== "www.gyrex.in" && !host.includes("localhost")) {
        setIsDoctorDomain(true);
      }
    }
  }, []);

  const DASHBOARD_ROUTES = [
    "/dashboard",
    "/gbp",
    "/appointments",
    "/billing",
    "/chatbot",
    "/leads",
    "/local-seo",
    "/patients",
    "/reports",
    "/reviews",
    "/settings",
    "/staff",
    "/subscription",
    "/website",
    "/whatsapp",
    "/ai-agents",
    "/admin",
    "/sites",
    "/affiliates",
    "/login",
    "/signup",
    "/ai-receptionist-demo"
  ];

  const isAuthenticated = status === "authenticated" || Boolean(session);
  const isDashboardRoute = DASHBOARD_ROUTES.some((route) => pathname?.startsWith(route));

  // Exclude SaaS marketing widget when authenticated or on internal dashboard routes or doctor custom domains
  const isInternalApp = isDoctorDomain || isAuthenticated || isDashboardRoute;

  useEffect(() => {
    // Fetch active platform WhatsApp number configured in SuperAdmin settings
    async function fetchNumber() {
      try {
        const res = await fetch("/api/platform/whatsapp-number");
        if (res.ok) {
          const data = await res.json();
          if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        }
      } catch (err) {
        console.error("Failed to load platform WhatsApp number", err);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchNumber();
  }, []);

  if (!mounted || isInternalApp || !isLoaded) {
    return null;
  }

  const handleOpenWhatsApp = (prefilledMessage: string) => {
    const cleanNumber = whatsappNumber.replace(/[^\d]/g, "");
    const encoded = encodeURIComponent(prefilledMessage);
    const url = `https://wa.me/${cleanNumber}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans print:hidden">
      {/* ── 1. Interactive Mini Popup Card ──────────────────────────────── */}
      {isOpen && (
        <div className="mb-3 w-[330px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 text-white font-bold text-lg">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-300 border-2 border-emerald-700 rounded-full animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight leading-snug">Gyrex Clinic Growth Team</h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  Typically replies instantly (AI Powered)
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 bg-slate-50/50 space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              Hello! 👋 How can we help you grow your healthcare practice today?
            </p>

            {/* Quick Action Options */}
            <div className="space-y-2">
              <button
                onClick={() => handleOpenWhatsApp("Hi, I want a Free 60-Second Google Maps & SEO Audit for my clinic.")}
                className="w-full text-left p-3 rounded-xl bg-white hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-300 transition-all shadow-sm flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">
                    Get Free 60s Google Audit
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    Instant local ranking, reviews & competitor report
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleOpenWhatsApp("Hi, I want to book a 1-on-1 Growth Consultation with the Gyrex expert team.")}
                className="w-full text-left p-3 rounded-xl bg-white hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-300 transition-all shadow-sm flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-blue-800">
                    Book Growth Consultation
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    Speak with our Clinic Growth Consultant
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleOpenWhatsApp("Hi, I am a doctor using Gyrex and I need support with my account.")}
                className="w-full text-left p-3 rounded-xl bg-white hover:bg-emerald-50/70 border border-gray-200/80 hover:border-emerald-300 transition-all shadow-sm flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-amber-800">
                    Doctor & Clinic Support
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    Technical help, billing & feature setup
                  </div>
                </div>
              </button>
            </div>

            {/* Direct Open Link */}
            <div className="pt-1 flex items-center justify-between border-t border-gray-100 text-[11px]">
              <span className="text-gray-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Official WhatsApp
              </span>
              <button
                onClick={() => handleOpenWhatsApp("Hi")}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Direct Chat <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Greeting Attention Bubble (Before Opened) ─────────────────── */}
      {!isOpen && !hasDismissedPrompt && (
        <div className="mb-2.5 mr-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[260px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
          <span className="truncate">Need a Free Google Audit?</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasDismissedPrompt(true);
            }}
            className="text-gray-400 hover:text-gray-600 ml-auto p-0.5 rounded-full"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── 3. Main Floating Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer relative group focus:outline-none focus:ring-4 focus:ring-emerald-200"
        aria-label="Chat on WhatsApp"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        )}

        {/* Pulse Ring Indicator */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
      </button>
    </div>
  );
}
