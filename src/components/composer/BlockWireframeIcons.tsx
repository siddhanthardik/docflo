import React from "react";

export function WireframeIcon1Col({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="30" height="28" rx="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon2Col({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="13.5" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="21.5" y="6" width="13.5" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon2Col2575({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="6" width="19" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon2Col7525({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="19" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="27" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon3Col({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="27" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon3Col502525({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="15" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="23" y="6" width="6" height="28" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="31" y="6" width="6" height="28" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIconSection({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="12" width="30" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="8" y1="9" x2="32" y2="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="8" y1="31" x2="32" y2="31" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

export function WireframeIconDivider({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 14L20 10L24 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 26L20 30L24 26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WireframeIconHeading({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center font-bold text-2xl tracking-tighter select-none font-serif text-slate-700`}>
      H
    </div>
  );
}

export function WireframeIconText({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center font-bold text-2xl tracking-tighter select-none font-sans text-slate-700`}>
      T
    </div>
  );
}

export function WireframeIconFlexbox({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="7" width="30" height="26" rx="3" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
      <rect x="9" y="12" width="9" height="16" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="22" y="12" width="9" height="16" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

// ── EXLY-STYLE WIREFRAME CARDS FOR DESIGN BLOCKS ──

export function WireframeCardFeaturesCenter() {
  return (
    <svg className="w-full h-full" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#F8FAFC" rx="6" />
      {/* Centered Heading */}
      <rect x="55" y="12" width="50" height="5" rx="2" fill="#334155" />
      <rect x="45" y="20" width="70" height="3" rx="1.5" fill="#94A3B8" />
      {/* 3 Columns */}
      <rect x="14" y="32" width="38" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="33" cy="44" r="6" fill="#818CF8" fillOpacity="0.3" />
      <rect x="20" y="55" width="26" height="3" rx="1.5" fill="#64748B" />
      <rect x="18" y="62" width="30" height="2" rx="1" fill="#CBD5E1" />
      <rect x="22" y="67" width="22" height="2" rx="1" fill="#CBD5E1" />

      <rect x="61" y="32" width="38" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="80" cy="44" r="6" fill="#818CF8" fillOpacity="0.3" />
      <rect x="67" y="55" width="26" height="3" rx="1.5" fill="#64748B" />
      <rect x="65" y="62" width="30" height="2" rx="1" fill="#CBD5E1" />
      <rect x="69" y="67" width="22" height="2" rx="1" fill="#CBD5E1" />

      <rect x="108" y="32" width="38" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="127" cy="44" r="6" fill="#818CF8" fillOpacity="0.3" />
      <rect x="114" y="55" width="26" height="3" rx="1.5" fill="#64748B" />
      <rect x="112" y="62" width="30" height="2" rx="1" fill="#CBD5E1" />
      <rect x="116" y="67" width="22" height="2" rx="1" fill="#CBD5E1" />
    </svg>
  );
}

export function WireframeCardFeaturesSide() {
  return (
    <svg className="w-full h-full" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#F8FAFC" rx="6" />
      {/* Left Media Box */}
      <rect x="16" y="16" width="54" height="58" rx="6" fill="#E2E8F0" stroke="#CBD5E1" />
      <path d="M28 52L38 40L48 50L54 44L60 52" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="30" r="4" fill="#94A3B8" />
      {/* Right Content */}
      <rect x="80" y="20" width="55" height="5" rx="2" fill="#334155" />
      <rect x="80" y="30" width="65" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="80" y="37" width="58" height="3" rx="1.5" fill="#94A3B8" />
      {/* Bullets */}
      <circle cx="84" cy="50" r="2.5" fill="#6366F1" />
      <rect x="91" y="49" width="50" height="3" rx="1.5" fill="#64748B" />
      <circle cx="84" cy="60" r="2.5" fill="#6366F1" />
      <rect x="91" y="59" width="45" height="3" rx="1.5" fill="#64748B" />
      <rect x="80" y="68" width="32" height="6" rx="3" fill="#6366F1" />
    </svg>
  );
}

export function WireframeCardFeaturesCards() {
  return (
    <svg className="w-full h-full" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#F8FAFC" rx="6" />
      {/* 2 Big Cards */}
      <rect x="14" y="16" width="62" height="58" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="22" y="24" width="46" height="4" rx="2" fill="#334155" />
      <rect x="22" y="33" width="38" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="22" y="40" width="42" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="22" y="58" width="30" height="5" rx="2.5" fill="#6366F1" />

      <rect x="84" y="16" width="62" height="58" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="92" y="24" width="46" height="4" rx="2" fill="#334155" />
      <rect x="92" y="33" width="38" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="92" y="40" width="42" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="92" y="58" width="30" height="5" rx="2.5" fill="#6366F1" />
    </svg>
  );
}

export function WireframeCardFeaturesColumns() {
  return (
    <svg className="w-full h-full" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#F8FAFC" rx="6" />
      <rect x="52" y="10" width="56" height="5" rx="2" fill="#334155" />
      <rect x="42" y="18" width="76" height="3" rx="1.5" fill="#94A3B8" />
      {/* 4 Cards */}
      <rect x="10" y="28" width="31" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="14" y="34" width="23" height="3" rx="1.5" fill="#475569" />
      <rect x="14" y="40" width="18" height="2" rx="1" fill="#94A3B8" />
      <rect x="14" y="45" width="21" height="2" rx="1" fill="#CBD5E1" />

      <rect x="47" y="28" width="31" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="51" y="34" width="23" height="3" rx="1.5" fill="#475569" />
      <rect x="51" y="40" width="18" height="2" rx="1" fill="#94A3B8" />
      <rect x="51" y="45" width="21" height="2" rx="1" fill="#CBD5E1" />

      <rect x="84" y="28" width="31" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="88" y="34" width="23" height="3" rx="1.5" fill="#475569" />
      <rect x="88" y="40" width="18" height="2" rx="1" fill="#94A3B8" />
      <rect x="88" y="45" width="21" height="2" rx="1" fill="#CBD5E1" />

      <rect x="121" y="28" width="31" height="46" rx="4" fill="#FFFFFF" stroke="#E2E8F0" />
      <rect x="125" y="34" width="23" height="3" rx="1.5" fill="#475569" />
      <rect x="125" y="40" width="18" height="2" rx="1" fill="#94A3B8" />
      <rect x="125" y="45" width="21" height="2" rx="1" fill="#CBD5E1" />

      <rect x="66" y="78" width="28" height="5" rx="2.5" fill="#6366F1" />
    </svg>
  );
}

export function WireframeCardFeaturesBadges() {
  return (
    <svg className="w-full h-full" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="90" fill="#F8FAFC" rx="6" />
      {/* 3 rows with round badges */}
      <circle cx="28" cy="24" r="8" fill="#818CF8" fillOpacity="0.25" stroke="#6366F1" strokeWidth="1.2" />
      <rect x="44" y="20" width="90" height="4" rx="2" fill="#334155" />
      <rect x="44" y="27" width="70" height="2.5" rx="1.2" fill="#94A3B8" />

      <circle cx="28" cy="46" r="8" fill="#34D399" fillOpacity="0.25" stroke="#10B981" strokeWidth="1.2" />
      <rect x="44" y="42" width="85" height="4" rx="2" fill="#334155" />
      <rect x="44" y="49" width="65" height="2.5" rx="1.2" fill="#94A3B8" />

      <circle cx="28" cy="68" r="8" fill="#F472B6" fillOpacity="0.25" stroke="#EC4899" strokeWidth="1.2" />
      <rect x="44" y="64" width="80" height="4" rx="2" fill="#334155" />
      <rect x="44" y="71" width="75" height="2.5" rx="1.2" fill="#94A3B8" />
    </svg>
  );
}
