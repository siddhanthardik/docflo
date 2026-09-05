import React from "react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          
          {/* Brand & Mission */}
          <div className="md:col-span-4 space-y-4">
            <div className="mb-2">
              <GyrexLogo size="md" lightText />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The complete practice growth platform for modern doctors and specialty clinics. Automated Google Maps SEO, custom clinic websites, 24/7 WhatsApp practice receptionist, and 5-star review growth.
            </p>
          </div>
          
          {/* Platform Solutions */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Platform Solutions</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/#clinic-websites" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Healthcare Website Builder</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">20 Themes</span>
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
                <Link href="/local-seo/free-audit" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Free 60-Sec GBP Audit Scanner</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Practice & Resources */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Practice &amp; Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
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
                <Link href="/affiliates/login" className="hover:text-white transition-colors">
                  Partner &amp; Affiliate Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Legal &amp; Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Gyrex Technologies. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <span>Built exclusively for healthcare professionals</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
