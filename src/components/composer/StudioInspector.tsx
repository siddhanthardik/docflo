"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Paintbrush,
  Sliders,
  Sparkles,
  Bookmark,
  Trash2,
  Save,
  Wand2,
  Upload,
  Plus,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Layers,
  Layout,
  Maximize2,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageSection, SectionDesignConfig, ClinicWebsiteData } from "@/components/themes/theme-types";

interface StudioInspectorProps {
  selectedSection: PageSection;
  siteData: ClinicWebsiteData;
  saving: boolean;
  onUpdateSection: (patch: Partial<PageSection>) => void;
  onUpdateDesign: (designPatch: Partial<SectionDesignConfig>) => void;
  onSaveWebsite: (sectionLabel?: string) => void;
  onClose: () => void;
  onSaveAsBlock: (section: PageSection) => void;
  onDeleteSection: (id: string) => void;
  onGenerateAiCopy: (type: "hero" | "bio" | "service") => void;
  onOpenStockModal?: (field: string) => void;
  onHeroImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BG_PRESETS = [
  { label: "Pure White", value: "#FFFFFF", border: "#E2E8F0" },
  { label: "Slate Mist", value: "#F8FAFC", border: "#E2E8F0" },
  { label: "Hospital Soft Blue", value: "#F0F9FF", border: "#BAE6FD" },
  { label: "Clinical Emerald", value: "#F0FDF4", border: "#BBF7D0" },
  { label: "Warm Beige", value: "#FDFBF7", border: "#E7E5E4" },
  { label: "Indigo Hue", value: "#EEF2FF", border: "#C7D2FE" },
  { label: "Deep Hospital Navy", value: "#0F172A", border: "#334155" },
  { label: "Midnight Dark", value: "#020617", border: "#1E293B" },
];

export function StudioInspector({
  selectedSection,
  siteData,
  saving,
  onUpdateSection,
  onUpdateDesign,
  onSaveWebsite,
  onClose,
  onSaveAsBlock,
  onDeleteSection,
  onGenerateAiCopy,
  onOpenStockModal,
  onHeroImageUpload,
}: StudioInspectorProps) {
  // 3 Primary Inspector Tabs matching Exly: Styles | Properties | Animation
  const [inspectorTab, setInspectorTab] = useState<"styles" | "properties" | "animation">("properties");

  // Accordion fold states for Styles tab
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    layout: true,
    space: false,
    typography: false,
    background: false,
    borders: false,
    effects: false,
  });

  const toggleAccordion = (fold: string) => {
    setOpenAccordions((prev) => ({ ...prev, [fold]: !prev[fold] }));
  };

  const d = selectedSection.design || {};

  return (
    <div className="w-[340px] sm:w-[360px] h-full bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-md select-none transition-all">
      {/* ── TOP HEADER ── */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
            title="Back to Blocks Tray"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 truncate inline-block">
              {selectedSection.type.replace("PRIMITIVE_", "").replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onSaveAsBlock(selectedSection)}
            className="text-slate-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
            title="Save Section to 'Saved Blocks' Library"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSection(selectedSection.id)}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── EXLY 3-TAB SWITCHER (Styles | Properties | Animation) ── */}
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/70 p-1 gap-1 text-[11px] font-bold shrink-0">
        <button
          type="button"
          onClick={() => setInspectorTab("styles")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            inspectorTab === "styles"
              ? "bg-white text-purple-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Styles</span>
        </button>
        <button
          type="button"
          onClick={() => setInspectorTab("properties")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            inspectorTab === "properties"
              ? "bg-white text-purple-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>
        <button
          type="button"
          onClick={() => setInspectorTab("animation")}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            inspectorTab === "animation"
              ? "bg-white text-purple-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Animation</span>
        </button>
      </div>

      {/* ── BODY SCROLL AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: STYLES (Exly Accordion Engine)                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {inspectorTab === "styles" && (
          <div className="space-y-3">
            {/* 1. Layout Accordion (Flex & Direction) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("layout")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-purple-600" /> Layout &amp; Alignment
                </span>
                {openAccordions.layout ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.layout && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  {/* Display Mode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Display</label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {(["block", "flex", "grid"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onUpdateDesign({ display: mode })}
                          className={`py-1 text-[10px] font-bold rounded capitalize transition-all ${
                            (d.display || "block") === mode ? "bg-white text-purple-700 shadow-2xs" : "text-slate-600"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Direction</label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: "row", label: "Row", icon: ArrowRight },
                        { id: "row-reverse", label: "Rev Row", icon: ArrowLeft },
                        { id: "column", label: "Col", icon: ArrowDown },
                        { id: "column-reverse", label: "Rev Col", icon: ArrowUp },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onUpdateDesign({ flexDirection: item.id as any })}
                          className={`py-1 flex items-center justify-center text-[10px] font-bold rounded transition-all ${
                            (d.flexDirection || "row") === item.id ? "bg-white text-purple-700 shadow-2xs" : "text-slate-600"
                          }`}
                          title={item.label}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Justify Content */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Justify Content</label>
                    <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: "flex-start", label: "Start", icon: AlignLeft },
                        { id: "center", label: "Center", icon: AlignCenter },
                        { id: "flex-end", label: "End", icon: AlignRight },
                        { id: "space-between", label: "Between", icon: AlignJustify },
                        { id: "space-around", label: "Around", icon: Maximize2 },
                      ].map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => onUpdateDesign({ justifyContent: j.id as any })}
                          className={`py-1 flex items-center justify-center rounded text-[10px] transition-all ${
                            (d.justifyContent || "center") === j.id ? "bg-white text-purple-700 shadow-2xs font-bold" : "text-slate-600"
                          }`}
                          title={j.label}
                        >
                          <j.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gap Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span>Column / Item Gap</span>
                      <span className="font-mono text-purple-700">{d.gap ?? 16}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      step="4"
                      value={d.gap ?? 16}
                      onChange={(e) => onUpdateDesign({ gap: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Space & Box Model Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("space")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span>Space &amp; Container Width</span>
                {openAccordions.space ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.space && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Vertical Section Padding</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "compact", label: "Compact (48px)" },
                        { id: "normal", label: "Normal (80px)" },
                        { id: "spacious", label: "Spacious (112px)" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onUpdateDesign({ paddingSize: p.id as any })}
                          className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                            (d.paddingSize || "normal") === p.id
                              ? "bg-purple-50 text-purple-700 border-purple-300 font-black shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Container Max Width</label>
                    <select
                      value={d.maxWidth || "xl"}
                      onChange={(e) => onUpdateDesign({ maxWidth: e.target.value as any })}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="none">Full Browser Width (100%)</option>
                      <option value="2xl">Wide Container (1400px)</option>
                      <option value="xl">Standard Container (1200px)</option>
                      <option value="lg">Compact Clinical (1000px)</option>
                      <option value="md">Reading Width (800px)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Typography Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("typography")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span>Typography &amp; Text Styling</span>
                {openAccordions.typography ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.typography && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Text Alignment</label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: "left", label: "Left", icon: AlignLeft },
                        { id: "center", label: "Center", icon: AlignCenter },
                        { id: "right", label: "Right", icon: AlignRight },
                        { id: "justify", label: "Justify", icon: AlignJustify },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onUpdateDesign({ textAlign: item.id as any })}
                          className={`py-1 flex items-center justify-center rounded text-[10px] transition-all ${
                            (d.textAlign || "left") === item.id ? "bg-white text-purple-700 shadow-2xs font-bold" : "text-slate-600"
                          }`}
                          title={item.label}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Font Size</label>
                      <select
                        value={d.fontSize || "base"}
                        onChange={(e) => onUpdateDesign({ fontSize: e.target.value as any })}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="sm">Small (14px)</option>
                        <option value="base">Normal (16px)</option>
                        <option value="lg">Large (18px)</option>
                        <option value="xl">XL (20px)</option>
                        <option value="2xl">2XL (24px)</option>
                        <option value="3xl">Heroic 3XL (30px)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Font Weight</label>
                      <select
                        value={d.fontWeight || "medium"}
                        onChange={(e) => onUpdateDesign({ fontWeight: e.target.value as any })}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="normal">Regular (400)</option>
                        <option value="medium">Medium (500)</option>
                        <option value="semibold">SemiBold (600)</option>
                        <option value="bold">Bold (700)</option>
                        <option value="extrabold">ExtraBold (800)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Background & Colors Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("background")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span>Background &amp; Contrast</span>
                {openAccordions.background ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.background && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Color Presets</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {BG_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            const patch = selectedSection.type === "DOCTOR_BIO"
                              ? { bgColor: preset.value, cardBg: preset.value }
                              : { bgColor: preset.value };
                            onUpdateSection(patch);
                            onUpdateDesign(patch);
                          }}
                          className={`h-8 rounded-lg border flex items-center justify-center transition-all ${
                            (selectedSection.bgColor || d.bgColor) === preset.value
                              ? "ring-2 ring-purple-600 ring-offset-1 scale-105"
                              : "hover:scale-102"
                          }`}
                          style={{ backgroundColor: preset.value, borderColor: preset.border }}
                          title={preset.label}
                        >
                          {(selectedSection.bgColor || d.bgColor) === preset.value && (
                            <Check className={`w-3.5 h-3.5 ${preset.value === "#0F172A" || preset.value === "#020617" ? "text-white" : "text-purple-700"}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Custom Hex Color</label>
                    <Input
                      value={selectedSection.bgColor || d.bgColor || "#FFFFFF"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const patch = selectedSection.type === "DOCTOR_BIO"
                          ? { bgColor: val, cardBg: val }
                          : { bgColor: val };
                        onUpdateSection(patch);
                        onUpdateDesign(patch);
                      }}
                      placeholder="#FFFFFF"
                      className="h-8 text-xs font-mono rounded-lg"
                    />
                  </div>

                  {/* Dark Overlay */}
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">Dark Contrast Overlay</p>
                      <p className="text-[9px] text-slate-500">Improves headline readability</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={d.overlayDarkness !== "none"}
                      onChange={(e) => onUpdateDesign({ overlayDarkness: e.target.checked ? "medium" : "none" })}
                      className="w-4 h-4 rounded text-purple-600 cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Borders & Corners Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("borders")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span>Borders &amp; Corner Radius</span>
                {openAccordions.borders ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.borders && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Corner Radius</label>
                    <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: "none", label: "0" },
                        { id: "md", label: "8" },
                        { id: "lg", label: "12" },
                        { id: "2xl", label: "24" },
                        { id: "full", label: "Pill" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onUpdateDesign({ borderRadius: r.id as any })}
                          className={`py-1 text-[10px] font-bold rounded transition-all ${
                            (d.borderRadius || "xl") === r.id ? "bg-white text-purple-700 shadow-2xs font-black" : "text-slate-600"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Border Style</label>
                      <select
                        value={d.borderStyle || "none"}
                        onChange={(e) => onUpdateDesign({ borderStyle: e.target.value as any })}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="none">None</option>
                        <option value="solid">Solid Line</option>
                        <option value="dashed">Dashed Outline</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Border Width</label>
                      <select
                        value={d.borderWidth ?? 0}
                        onChange={(e) => onUpdateDesign({ borderWidth: Number(e.target.value) })}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="0">0px</option>
                        <option value="1">1px Subdued</option>
                        <option value="2">2px Prominent</option>
                        <option value="4">4px Accent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Effects & Shadows Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleAccordion("effects")}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-bold text-slate-800 text-[11px]"
              >
                <span>Elevation &amp; Shadows</span>
                {openAccordions.effects ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openAccordions.effects && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Card Elevation Shadow</label>
                    <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg">
                      {[
                        { id: "none", label: "Flat" },
                        { id: "sm", label: "Soft" },
                        { id: "md", label: "Med" },
                        { id: "xl", label: "High" },
                        { id: "glow", label: "Glow" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onUpdateDesign({ boxShadow: s.id as any })}
                          className={`py-1 text-[10px] font-bold rounded transition-all ${
                            (d.boxShadow || "none") === s.id ? "bg-white text-purple-700 shadow-2xs font-black" : "text-slate-600"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PROPERTIES (Contextual Content & Parameters)                */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {inspectorTab === "properties" && (
          <div className="space-y-4">
            {/* Top Pill / Badge Control (Zero Hardcoding - 100% User Editable or Removable) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Top Pill / Tagline Badge</span>
                  {selectedSection.badgeText && selectedSection.badgeText.trim().length > 0 && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Active
                    </span>
                  )}
                </label>
                {selectedSection.badgeText && selectedSection.badgeText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateSection({ badgeText: "" })}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Remove Pill Badge"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Pill
                  </button>
                )}
              </div>
              <Input
                value={selectedSection.badgeText || ""}
                onChange={(e) => onUpdateSection({ badgeText: e.target.value })}
                placeholder="Leave blank for NO pill / badge (e.g. ⭐ Top Rated Practice)"
                className="h-8 text-xs bg-white rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Leave this blank to remove the pill badge completely from the canvas.
              </p>
            </div>

            {/* ── DOCTOR BIO SPECIFIC PROPERTIES & DESIGNS ── */}
            {selectedSection.type === "DOCTOR_BIO" && (
              <div className="space-y-4">
                {/* 1. Doctor Bio Layout Style Switcher */}
                <div className="space-y-1.5 p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900">Bio Layout Design</label>
                    <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-full border border-purple-200 uppercase">
                      {selectedSection.bioStyle || d.bioStyle || "CARD"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[
                      { id: "CARD", label: "Floating Card", desc: "Contained inner card" },
                      { id: "SPLIT_EDITORIAL", label: "Editorial Split", desc: "No black box, 2-col" },
                      { id: "MINIMAL", label: "Minimalist", desc: "Centered portrait" },
                      { id: "BENTO", label: "Bento Hub", desc: "3-cell modern grid" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          onUpdateSection({ bioStyle: st.id as any });
                          onUpdateDesign({ bioStyle: st.id as any });
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          (selectedSection.bioStyle || d.bioStyle || "CARD") === st.id
                            ? "bg-white border-purple-600 text-purple-950 shadow-xs ring-2 ring-purple-500/20"
                            : "bg-white/80 border-slate-200 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{st.label}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{st.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Card Background Color Control (Fixes the black color issue) */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                  <label className="text-xs font-bold text-slate-800">Card Background Color</label>
                  <p className="text-[10px] text-slate-500">Choose the card color. Text automatically adjusts for high contrast.</p>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { label: "Pure White", value: "#FFFFFF", border: "#E2E8F0" },
                      { label: "Clean Slate", value: "#F8FAFC", border: "#E2E8F0" },
                      { label: "Medical Soft Blue", value: "#F0F9FF", border: "#BAE6FD" },
                      { label: "Soft Cream", value: "#FDFBF7", border: "#E7E5E4" },
                      { label: "Clinical Navy", value: "#0F172A", border: "#334155" },
                      { label: "Pitch Black", value: "#09090B", border: "#27272A" },
                      { label: "Emerald Hue", value: "#F0FDF4", border: "#BBF7D0" },
                      { label: "Primary Theme", value: "primary", border: "#93C5FD" },
                    ].map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => {
                          onUpdateSection({ cardBg: col.value });
                          onUpdateDesign({ cardBg: col.value });
                        }}
                        className={`h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          (selectedSection.cardBg || d.cardBg || "#FFFFFF") === col.value
                            ? "ring-2 ring-purple-600 ring-offset-1 scale-105"
                            : "hover:scale-102"
                        }`}
                        style={{
                          backgroundColor: col.value === "primary" ? siteData.primaryColor || "#2563EB" : col.value,
                          borderColor: col.border,
                        }}
                        title={col.label}
                      >
                        {(selectedSection.cardBg || d.cardBg || "#FFFFFF") === col.value && (
                          <Check className={`w-3.5 h-3.5 ${col.value === "#0F172A" || col.value === "#09090B" || col.value === "primary" ? "text-white" : "text-purple-700"}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Hex Color</label>
                    <Input
                      value={selectedSection.cardBg || d.cardBg || "#FFFFFF"}
                      onChange={(e) => {
                        onUpdateSection({ cardBg: e.target.value });
                        onUpdateDesign({ cardBg: e.target.value });
                      }}
                      placeholder="#FFFFFF"
                      className="h-8 text-xs font-mono rounded-lg bg-white mt-1"
                    />
                  </div>
                </div>

                {/* 3. Doctor Profile Details */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                  <label className="text-xs font-bold text-slate-800">Doctor Profile Credentials</label>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Doctor Full Name</label>
                    <Input
                      value={selectedSection.doctorName !== undefined ? selectedSection.doctorName : (siteData.doctor?.name || "")}
                      onChange={(e) => onUpdateSection({ doctorName: e.target.value })}
                      placeholder="e.g. Dr. Vinay Kumar Rai"
                      className="h-8 text-xs bg-white rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Specialty / Title</label>
                      <Input
                        value={selectedSection.doctorSpecialty !== undefined ? selectedSection.doctorSpecialty : (siteData.doctor?.specialty || "")}
                        onChange={(e) => onUpdateSection({ doctorSpecialty: e.target.value })}
                        placeholder="e.g. Pediatrician & Neonatologist"
                        className="h-8 text-xs bg-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Degrees</label>
                      <Input
                        value={selectedSection.doctorDegrees !== undefined ? selectedSection.doctorDegrees : (siteData.doctor?.degrees || "")}
                        onChange={(e) => onUpdateSection({ doctorDegrees: e.target.value })}
                        placeholder="e.g. MBBS, MD, DNB"
                        className="h-8 text-xs bg-white rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Doctor Photo URL</label>
                    <Input
                      value={selectedSection.doctorImage !== undefined ? selectedSection.doctorImage : (siteData.doctor?.image || "")}
                      onChange={(e) => onUpdateSection({ doctorImage: e.target.value })}
                      placeholder="https://... or upload photo"
                      className="h-8 text-xs bg-white rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title & AI Copy Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs">Block Headline / Title</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateAiCopy("hero")}
                  className="h-6 text-[10px] font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="w-3 h-3 text-purple-600" /> ✨ AI Copy
                </Button>
              </div>
              <Input
                value={selectedSection.title || ""}
                onChange={(e) => onUpdateSection({ title: e.target.value })}
                placeholder="e.g. Specialized Clinical Consultation"
                className="h-9 text-xs rounded-xl font-bold"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs">Subtitle / Description</label>
              <Textarea
                value={selectedSection.subtitle || ""}
                onChange={(e) => onUpdateSection({ subtitle: e.target.value })}
                placeholder="Descriptive explanation of clinical service, qualifications, or care details..."
                rows={3}
                className="text-xs rounded-xl leading-relaxed"
              />
            </div>

            {/* Story / Content Body if present */}
            {selectedSection.content !== undefined && (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 text-xs">Body Text / Narrative</label>
                <Textarea
                  value={selectedSection.content || ""}
                  onChange={(e) => onUpdateSection({ content: e.target.value })}
                  rows={5}
                  placeholder="Full clinical details, accreditation notices, emergency procedures..."
                  className="text-xs rounded-xl leading-relaxed"
                />
              </div>
            )}

            {/* Primary Action Button */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 text-xs">Call-to-Action Button</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={selectedSection.ctaText || ""}
                  onChange={(e) => onUpdateSection({ ctaText: e.target.value })}
                  placeholder="Button Label (e.g. Book Slot)"
                  className="h-8 text-xs bg-white rounded-lg"
                />
                <select
                  value={selectedSection.ctaAction || "BOOKING_MODAL"}
                  onChange={(e) => onUpdateSection({ ctaAction: e.target.value })}
                  className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="BOOKING_MODAL">Instant Booking Modal</option>
                  <option value="WHATSAPP">WhatsApp Direct</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="CUSTOM_URL">Custom Web Link</option>
                </select>
              </div>
            </div>

            {/* Special Component Field: Video URL */}
            {selectedSection.videoUrl !== undefined && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-800 text-xs">YouTube / Video Embed URL</label>
                <Input
                  value={selectedSection.videoUrl || ""}
                  onChange={(e) => onUpdateSection({ videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>
            )}

            {/* Special Component Field: Countdown Target */}
            {selectedSection.countdownDate !== undefined && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-800 text-xs">Countdown Target Date &amp; Time</label>
                <Input
                  type="datetime-local"
                  value={selectedSection.countdownDate ? selectedSection.countdownDate.substring(0, 16) : ""}
                  onChange={(e) => onUpdateSection({ countdownDate: new Date(e.target.value).toISOString() })}
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: ANIMATION (Exly Motion Engine)                              */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {inspectorTab === "animation" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Entrance Motion Presets
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                  {d.animationType || "none"}
                </span>
              </div>
              <p className="text-[10px] text-amber-800">
                Smoothly animates into view as the patient scrolls down the page.
              </p>
            </div>

            {/* Animation Type Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Entrance Effect</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "none", label: "None" },
                  { id: "fadeIn", label: "Fade In" },
                  { id: "fadeInUp", label: "Fade Up" },
                  { id: "fadeInDown", label: "Fade Down" },
                  { id: "slideInLeft", label: "Slide Left" },
                  { id: "slideInRight", label: "Slide Right" },
                  { id: "zoomIn", label: "Zoom In" },
                  { id: "bounce", label: "Bounce" },
                  { id: "pulse", label: "Pulse" },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => onUpdateDesign({ animationType: anim.id as any })}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center ${
                      (d.animationType || "none") === anim.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-2xs font-black"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Delay */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span>Start Delay</span>
                <span className="font-mono text-purple-700">{d.animationDelay ?? 0}ms</span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                {[0, 100, 200, 300].map((delay) => (
                  <button
                    key={delay}
                    type="button"
                    onClick={() => onUpdateDesign({ animationDelay: delay })}
                    className={`py-1 text-[10px] font-bold rounded transition-all ${
                      (d.animationDelay ?? 0) === delay ? "bg-white text-purple-700 shadow-2xs font-black" : "text-slate-600"
                    }`}
                  >
                    {delay}ms
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Duration */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Duration Speed</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 300, label: "Fast (0.3s)" },
                  { id: 500, label: "Normal (0.5s)" },
                  { id: 800, label: "Smooth (0.8s)" },
                ].map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => onUpdateDesign({ animationDuration: dur.id })}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                      (d.animationDuration ?? 500) === dur.id
                        ? "bg-purple-50 text-purple-700 border-purple-300 font-black shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Hover Effects */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Mouse Hover Interaction</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "none", label: "None" },
                  { id: "lift", label: "Float / Lift Up (-4px)" },
                  { id: "scale", label: "Subtle Scale (1.02x)" },
                  { id: "glow", label: "Card Border Glow" },
                ].map((hov) => (
                  <button
                    key={hov.id}
                    type="button"
                    onClick={() => onUpdateDesign({ hoverEffect: hov.id as any })}
                    className={`p-2 text-[10px] font-bold rounded-xl border text-left transition-all ${
                      (d.hoverEffect || "none") === hov.id
                        ? "bg-purple-50 text-purple-700 border-purple-400 font-black shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {hov.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DOCKED FOOTER: PROMINENT SAVE BUTTON (EXLY / ELEMENTOR REA) ── */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0 shadow-lg">
        <Button
          onClick={() => onSaveWebsite(`${selectedSection.type.replace("PRIMITIVE_", "").replace("_", " ")} Block`)}
          disabled={saving}
          className="w-full h-11 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Section Changes"}</span>
        </Button>
      </div>
    </div>
  );
}
