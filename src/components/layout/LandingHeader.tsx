"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  MapPin,
  MessageSquare,
  Sparkles,
  Calendar,
  CreditCard,
  ChevronRight,
  LogIn,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

const NAV_ITEMS = [
  { label: "Local Rank Tracker", href: "/#local-grid", icon: MapPin },
  { label: "WhatsApp Receptionist", href: "/#receptionist-simulator", icon: MessageSquare },
  { label: "Features", href: "/#features", icon: Sparkles },
  { label: "Booking Demo", href: "/#whatsapp-demo", icon: Calendar },
  { label: "Pricing", href: "/#pricing", icon: CreditCard },
];

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* ── 1. LOGO (RESPONSIVELY SIZED) ── */}
          <div className="flex items-center shrink-0">
            <Link 
              href="/" 
              className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
              aria-label="Gyrex Home"
            >
              <GyrexLogo imageClassName="h-7 sm:h-8 md:h-9 lg:h-11 w-auto" />
            </Link>
          </div>

          {/* ── 2. DESKTOP NAVIGATION (ACTIVATES AT LG >= 1024PX TO PREVENT TABLET COLLISION) ── */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ── 3. ACTIONS & MENU TRIGGER (RESPONSIVELY BALANCED) ── */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
            {/* Sign In link: shown on screens >= 640px with explicit un-squeezed padding */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>

            {/* Primary CTA button: responsive dimensions so it never overflows mobile */}
            <Link href="/local-seo/free-audit" className="shrink-0">
              <Button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-3 sm:px-4 lg:px-5 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all border border-blue-500/30 whitespace-nowrap shrink-0">
                <span className="hidden xs:inline">Get </span>Free Audit
              </Button>
            </Link>

            {/* Hamburger button: visible on mobile & tablet (< 1024px), guaranteed shrink-0 visibility */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE & TABLET DRAWER ── */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div 
            className="fixed inset-y-0 right-0 z-[100] w-full max-w-sm bg-white shadow-2xl flex flex-col p-6 overflow-y-auto overscroll-contain lg:hidden animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <GyrexLogo imageClassName="h-8 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col py-6 space-y-1">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 font-semibold text-sm transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full rounded-xl h-11 text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/local-seo/free-audit" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
                  Get Free Audit
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

