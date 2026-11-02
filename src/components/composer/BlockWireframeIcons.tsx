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

export function WireframeIcon3Col({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="27" y="6" width="8" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WireframeIcon2Col37({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="6" width="9" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="6" width="18" height="28" rx="2" stroke="currentColor" strokeWidth="1.8" />
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
    <div className={`${className} flex items-center justify-center font-bold text-2xl tracking-tighter select-none font-serif`}>
      H
    </div>
  );
}

export function WireframeIconText({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center font-bold text-2xl tracking-tighter select-none font-sans`}>
      T
    </div>
  );
}
