"use client";

import { useEffect } from "react";

export function ReferralTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get("ref") || searchParams.get("aff") || searchParams.get("referral");

      if (refParam && refParam.trim()) {
        const cleanRef = refParam.trim().toUpperCase();

        // 1. Set 60-day first-party cookie (5,184,000 seconds)
        const maxAgeSeconds = 60 * 24 * 60 * 60; // 60 days
        document.cookie = `gyrex_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;

        // 2. Persist in localStorage as resilient fallback
        localStorage.setItem("gyrex_ref", cleanRef);
        localStorage.setItem("gyrex_ref_captured_at", new Date().toISOString());
      }
    } catch (e) {
      console.warn("Could not capture affiliate referral code:", e);
    }
  }, []);

  return null;
}
