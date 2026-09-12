"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  X,
  Sparkles,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionDesignConfig } from "@/components/themes/theme-types";

interface HeroImageAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: SectionDesignConfig;
  heroHeadline: string;
  sampleImageUrl?: string | null;
  onSaveDesign: (patch: Partial<SectionDesignConfig>) => void;
}

export function HeroImageAdjustModal({
  isOpen,
  onClose,
  design,
  heroHeadline,
  sampleImageUrl,
  onSaveDesign,
}: HeroImageAdjustModalProps) {
  const [localDesign, setLocalDesign] = useState<SectionDesignConfig>({ ...design });

  useEffect(() => {
    if (isOpen) {
      setLocalDesign({ ...design });
    }
  }, [isOpen, design]);

  if (!isOpen) return null;

  const currentImg = sampleImageUrl || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80";
  const opacity = localDesign.imageOpacity !== undefined ? localDesign.imageOpacity : 85;
  const pos = localDesign.imagePosition || "center";
  const overlay = localDesign.overlayDarkness || "medium";
  const height = localDesign.heroHeight || "normal";
  const sliderType = localDesign.sliderType || "fade";

  const posClass =
    pos === "top"
      ? "object-top"
      : pos === "bottom"
      ? "object-bottom"
      : pos === "left"
      ? "object-left"
      : pos === "right"
      ? "object-right"
      : "object-center";

  const overlayClass =
    overlay === "none"
      ? "bg-black/10"
      : overlay === "subtle"
      ? "bg-black/30"
      : overlay === "dark"
      ? "bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40"
      : "bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent";

  const handleApply = () => {
    onSaveDesign(localDesign);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Hero Image Adjustments &amp; Display</h3>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tune image brightness, focal point alignment, dark overlay, and section height with instant preview.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Interactive Live Preview Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" /> Interactive Live Preview
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                Opacity: {opacity}% • Overlay: {overlay} • Height: {height}
              </span>
            </div>
            <div className="w-full h-48 sm:h-56 rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center text-center p-4">
              <img
                src={currentImg}
                alt="Preview"
                style={{ opacity: opacity / 100 }}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${posClass}`}
              />
              <div className={`absolute inset-0 transition-colors duration-300 ${overlayClass}`} />
              <div className="relative z-10 max-w-lg space-y-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/30">
                  Live Preview Mode
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white drop-shadow-md line-clamp-2">
                  {heroHeadline || "Advanced Healthcare & Patient-First Treatments"}
                </h4>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="h-7 px-4 rounded-lg bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                    Book Appointment
                  </div>
                  <div className="h-7 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                    WhatsApp Chat
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Opacity Slider */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Image Opacity / Brightness</label>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                  {opacity}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={opacity}
                onChange={(e) => setLocalDesign({ ...localDesign, imageOpacity: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>20% (Dim)</span>
                <span>50%</span>
                <span>85% (Optimal)</span>
                <span>100% (Full Bright)</span>
              </div>
            </div>

            {/* Focal Alignment */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="font-bold text-slate-800">Image Focal Point Alignment</label>
              <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                {[
                  { id: "top", label: "Top" },
                  { id: "center", label: "Center" },
                  { id: "bottom", label: "Bottom" },
                  { id: "left", label: "Left" },
                  { id: "right", label: "Right" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocalDesign({ ...localDesign, imagePosition: item.id as any })}
                    className={`py-2 rounded-xl border transition-all cursor-pointer ${
                      pos === item.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Overlay */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="font-bold text-slate-800">Dark Gradient Overlay</label>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {[
                  { id: "none", label: "None" },
                  { id: "subtle", label: "Subtle" },
                  { id: "medium", label: "Balanced" },
                  { id: "dark", label: "Deep" },
                ].map((ov) => (
                  <button
                    key={ov.id}
                    type="button"
                    onClick={() => setLocalDesign({ ...localDesign, overlayDarkness: ov.id as any })}
                    className={`py-2 rounded-xl border transition-all cursor-pointer ${
                      overlay === ov.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ov.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Height */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Hero Section Height</label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                  {height}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {[
                  { id: "compact", label: "440px" },
                  { id: "normal", label: "580px" },
                  { id: "tall", label: "700px" },
                  { id: "fullscreen", label: "Full (100vh)" },
                ].map((ht) => (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => setLocalDesign({ ...localDesign, heroHeight: ht.id as any })}
                    className={`py-2 rounded-xl border transition-all cursor-pointer ${
                      height === ht.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ht.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
