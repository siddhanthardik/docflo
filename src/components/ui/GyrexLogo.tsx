"use client";

import React from "react";

interface GyrexLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "1.5x";
  lightText?: boolean;
}

export function GyrexLogo({
  className = "",
  iconOnly = false,
  size = "md",
  lightText = false,
}: GyrexLogoProps) {
  const heightMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
    "1.5x": "h-[60px]",
  };

  const hClass = heightMap[size as keyof typeof heightMap] || "h-8";

  if (iconOnly) {
    return (
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${hClass} w-auto aspect-square ${className}`}
      >
        <defs>
          <linearGradient id="gyrex-icon-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#00D2FF" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="#020B1E" />
        <g transform="translate(32, 32)">
          <path
            d="M12 8L52 56"
            stroke="url(#gyrex-icon-g)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M52 8L24 32L52 56"
            stroke="url(#gyrex-icon-g)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={lightText ? "/logo-dark-background.svg" : "/logo.svg"}
        alt="Gyrex"
        className={`${hClass} w-auto object-contain`}
      />
    </div>
  );
}
