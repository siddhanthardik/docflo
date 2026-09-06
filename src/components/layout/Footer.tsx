import React from "react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { Sparkles } from "lucide-react";

// Facebook SVG icon
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// Instagram SVG icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative w-full mt-auto bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Gradient top divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">

          {/* ── Brand & Mission ── */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <GyrexLogo size="md" lightText />

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              The complete practice growth platform for modern doctors —
              Google Maps SEO, custom clinic websites, 24/7 WhatsApp
              receptionist, and 5-star review growth.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://www.facebook.com/gyrex.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gyrex on Facebook"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/gyrex.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gyrex on Instagram"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-pink-600 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Warm closing line */}
            <p className="text-xs text-slate-500 mt-auto pt-2">
              Made with ❤️ in India
            </p>
          </div>

          {/* ── Platform Solutions ── */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold text-white mb-4 pl-3 border-l-2 border-indigo-500">
              Platform Solutions
            </h4>
            <ul className="space-y-3 text-sm text-slate-400 font-medium">
              <li>
                <Link
                  href="/#clinic-websites"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Healthcare Website Builder</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                    20 Themes
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  5×5 Geo-Rank Heatmap Tracker
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  5-Star WhatsApp Review System
                </Link>
              </li>
              <li>
                <Link href="/#receptionist-simulator" className="hover:text-white transition-colors">
                  24/7 WhatsApp Practice Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/local-seo/free-audit"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>Free 60-Sec GBP Audit Scanner</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Practice & Resources ── */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold text-white mb-4 pl-3 border-l-2 border-indigo-500">
              Practice &amp; Resources
            </h4>
            <ul className="space-y-3 text-sm text-slate-400 font-medium">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Clinical Growth &amp; SEO Blog
                </Link>
              </li>
              <li>
                <Link href="/#roi-calculator" className="hover:text-white transition-colors">
                  Interactive ROI Calculator
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white transition-colors">
                  Pricing &amp; Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Doctor Portal (Sign In)
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Register Practice
                </Link>
              </li>
              <li>
                <Link
                  href="/affiliates"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Partner &amp; Affiliate Program</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                    Earn 20%
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/affiliates/login" className="hover:text-white transition-colors">
                  Partner Portal (Sign In)
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Legal & Support ── */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-4 pl-3 border-l-2 border-indigo-500">
              Legal &amp; Support
            </h4>
            <ul className="space-y-3 text-sm text-slate-400 font-medium">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  Medical Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-slate-800/70 pt-7 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Gyrex Technologies</p>

          <p className="text-slate-400 font-medium text-center">
            ❤️ Helping doctors build smarter clinics
          </p>

          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/refund" className="hover:text-slate-300 transition-colors">
              Refund
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
