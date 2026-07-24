"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <GyrexLogo size="md" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["Overview", "Data Architecture", "Features", "Process"].map((item) => (
              <Link
                key={item}
                href={`/#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/local-seo/free-audit">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-11 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all border border-blue-500/30">
                Get Free Audit
              </Button>
            </Link>
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col p-6 animate-in slide-in-from-right-full duration-300 md:hidden">
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <GyrexLogo size="md" />
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-600 hover:text-blue-600 rounded-full bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex flex-col gap-6 text-lg font-medium text-slate-700">
            {["Overview", "Data Architecture", "Features", "Process"].map((item) => (
              <Link
                key={item}
                href={`/#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-blue-600 transition-colors border-b border-slate-100 pb-4"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pb-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl h-12 text-base font-semibold border-slate-300 bg-white">
                Sign In
              </Button>
            </Link>
            <Link href="/local-seo/free-audit" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold shadow-md shadow-blue-500/20">
                Get Free Audit
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
