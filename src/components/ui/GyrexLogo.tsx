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
      <img
        src="/logo-icon.png"
        alt="Gyrex"
        className={`${hClass} w-auto object-contain shrink-0 ${className}`}
      />
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
