import React from "react";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="mb-4">
              <GyrexLogo size="md" lightText />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured data-layer system engineered for medical practice growth and patient engagement.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/#data-architecture" className="hover:text-white transition">Data Architecture</Link></li>
              <li><Link href="/#features" className="hover:text-white transition">Core Modules</Link></li>
              <li><Link href="/local-seo/free-audit" className="hover:text-white transition">Free Audit Tool</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/login" className="hover:text-white transition">Doctor Portal</Link></li>
              <li><Link href="/register" className="hover:text-white transition">Register Practice</Link></li>
              <li><Link href="/affiliates/login" className="hover:text-white transition">Partner Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Compliance & Legal</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition">Refund Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition">Disclaimer</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Gyrex Technologies. All rights reserved.</p>
          <p>Built for healthcare professionals</p>
        </div>
      </div>
    </footer>
  );
}
