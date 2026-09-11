"use client";

import React from "react";
import {
  Layout,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroTemplateOption {
  id: "SPLIT" | "FULL_WIDTH" | "BENTO" | "MINIMAL" | "REVERSED_SPLIT";
  title: string;
  badge: string;
  description: string;
  tag: string;
  diagram: React.ReactNode;
}

export const HERO_TEMPLATES: HeroTemplateOption[] = [
  {
    id: "SPLIT",
    title: "Split Half-Image Right",
    badge: "Most Popular",
    description: "Headline & appointment buttons on left (60%), doctor photo or clinic visual on right (40%).",
    tag: "High Conversion",
    diagram: (
      <div className="w-full h-24 bg-slate-900/5 rounded-xl border border-slate-200 p-2 flex gap-2 items-center">
        <div className="w-7/12 flex flex-col justify-center space-y-1.5 pl-1">
          <div className="w-12 h-1.5 bg-blue-500 rounded-full" />
          <div className="w-full h-2.5 bg-slate-800 rounded" />
          <div className="w-4/5 h-2 bg-slate-400 rounded" />
          <div className="flex gap-1 pt-1">
            <div className="w-12 h-3.5 bg-blue-600 rounded text-[7px] text-white flex items-center justify-center font-bold">Book</div>
            <div className="w-10 h-3.5 bg-emerald-500 rounded" />
          </div>
        </div>
        <div className="w-5/12 h-full bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg border border-blue-200/60 flex items-center justify-center text-base">
          👨‍⚕️
        </div>
      </div>
    ),
  },
  {
    id: "FULL_WIDTH",
    title: "Full Screen Ambient Slider",
    badge: "Premium Hospital",
    description: "100% immersive full-screen background photo slider with darkened gradient & centered headline.",
    tag: "Luxury / Brand",
    diagram: (
      <div className="w-full h-24 bg-slate-900 rounded-xl relative overflow-hidden p-2 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "radial-gradient(circle, #3b82f6 10%, #0f172a 90%)" }} />
        <div className="relative z-10 w-full flex flex-col items-center space-y-1">
          <div className="w-14 h-1.5 bg-white/40 rounded-full" />
          <div className="w-3/4 h-2.5 bg-white rounded" />
          <div className="w-1/2 h-1.5 bg-white/60 rounded" />
          <div className="flex gap-1 pt-1">
            <div className="w-14 h-3.5 bg-blue-500 rounded text-[7px] text-white flex items-center justify-center font-bold">Book Slot</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "BENTO",
    title: "Bento Medical Hub",
    badge: "Direct OPD Booking",
    description: "Branded headline block on left with an interactive instant booking card on right & quick badges.",
    tag: "High Volume",
    diagram: (
      <div className="w-full h-24 bg-slate-100 rounded-xl p-1.5 grid grid-cols-12 gap-1.5 items-stretch">
        <div className="col-span-7 bg-white rounded-lg border border-slate-200 p-2 flex flex-col justify-center space-y-1">
          <div className="w-10 h-1 bg-blue-500 rounded-full" />
          <div className="w-full h-2 bg-slate-800 rounded" />
          <div className="w-3/4 h-1.5 bg-slate-400 rounded" />
          <div className="w-16 h-2 bg-slate-200 rounded mt-1" />
        </div>
        <div className="col-span-5 bg-white rounded-lg border border-emerald-300 p-1.5 flex flex-col justify-between shadow-2xs">
          <div className="w-full h-1 bg-emerald-500 rounded" />
          <div className="space-y-0.5">
            <div className="w-full h-2 bg-slate-100 rounded border border-slate-200" />
            <div className="w-full h-2 bg-slate-100 rounded border border-slate-200" />
          </div>
          <div className="w-full h-3 bg-emerald-600 rounded text-[6px] text-white flex items-center justify-center font-bold">Confirm</div>
        </div>
      </div>
    ),
  },
  {
    id: "MINIMAL",
    title: "Minimalist Authority",
    badge: "Clean Consultant",
    description: "Centered crisp medical headline, credentials bar, and clean dual action buttons with zero noise.",
    tag: "Super Specialist",
    diagram: (
      <div className="w-full h-24 bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center justify-center text-center space-y-1.5 shadow-2xs">
        <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
        <div className="w-4/5 h-2.5 bg-slate-900 rounded" />
        <div className="w-3/5 h-1.5 bg-slate-500 rounded" />
        <div className="w-32 h-2 bg-slate-100 rounded border border-slate-200" />
        <div className="flex gap-1 pt-0.5">
          <div className="w-12 h-3 bg-slate-900 rounded text-[6px] text-white flex items-center justify-center">Consult</div>
          <div className="w-10 h-3 bg-emerald-600 rounded text-[6px] text-white flex items-center justify-center">Chat</div>
        </div>
      </div>
    ),
  },
  {
    id: "REVERSED_SPLIT",
    title: "Split Half-Image Left",
    badge: "Editorial Style",
    description: "Doctor or clinic visual prominently positioned on the left (40%) with clinical notice on right (60%).",
    tag: "Modern Practice",
    diagram: (
      <div className="w-full h-24 bg-slate-900/5 rounded-xl border border-slate-200 p-2 flex gap-2 items-center">
        <div className="w-5/12 h-full bg-gradient-to-br from-amber-100 to-rose-100 rounded-lg border border-amber-200/60 flex items-center justify-center text-base">
          👩‍⚕️
        </div>
        <div className="w-7/12 flex flex-col justify-center space-y-1.5 pl-1">
          <div className="w-12 h-1.5 bg-rose-500 rounded-full" />
          <div className="w-full h-2.5 bg-slate-800 rounded" />
          <div className="w-4/5 h-2 bg-slate-400 rounded" />
          <div className="flex gap-1 pt-1">
            <div className="w-12 h-3.5 bg-blue-600 rounded text-[7px] text-white flex items-center justify-center font-bold">Book</div>
            <div className="w-10 h-3.5 bg-emerald-500 rounded" />
          </div>
        </div>
      </div>
    ),
  },
];

interface BlockTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHeroTemplate: (templateId: "SPLIT" | "FULL_WIDTH" | "BENTO" | "MINIMAL" | "REVERSED_SPLIT") => void;
  activeHeroStyle?: string;
}

export function BlockTemplateModal({
  isOpen,
  onClose,
  onSelectHeroTemplate,
  activeHeroStyle = "SPLIT",
}: BlockTemplateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Select Hero Design Template</h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  5 Ready Designs
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose the visual layout for your website&apos;s top banner. You can switch anytime with 1 click.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
          {HERO_TEMPLATES.map((tmpl) => {
            const isSelected = activeHeroStyle === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  onSelectHeroTemplate(tmpl.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between bg-white relative group ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20 shadow-lg bg-blue-50/10"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {/* Active Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm z-10">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Wireframe Diagram */}
                <div className="mb-3 group-hover:scale-[1.01] transition-transform">
                  {tmpl.diagram}
                </div>

                {/* Text Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-600">
                      {tmpl.title}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {tmpl.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {tmpl.badge}
                  </span>
                  <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white"
                    }`}
                  >
                    {isSelected ? "Active" : "Apply Design"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>💡 You can switch between Full Screen and Half Image right in the hero inspector toolbar.</span>
          <Button type="button" variant="outline" onClick={onClose} className="h-8 rounded-xl text-xs font-bold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
