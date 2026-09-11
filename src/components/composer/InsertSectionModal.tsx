"use client";

import React, { useState } from "react";
import { SectionType } from "@/components/themes/theme-types";
import {
  Layout,
  DollarSign,
  ShieldCheck,
  Stethoscope,
  Star,
  MessageSquare,
  Image as ImageIcon,
  HelpCircle,
  MapPin,
  Type,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WidgetOption {
  type: SectionType;
  label: string;
  icon: any;
  description: string;
  category: "Essential" | "Clinical" | "Social Proof" | "Conversion" | "Information";
}

export const COMPOSER_WIDGETS: WidgetOption[] = [
  {
    type: "HERO",
    label: "Hero Banner & Welcome",
    icon: Layout,
    description: "High-impact headline, multi-photo slider, clinic logo, and primary booking CTA.",
    category: "Essential",
  },
  {
    type: "STATS_RIBBON",
    label: "Trust Metrics & Stats Bar",
    icon: ShieldCheck,
    description: "Highlight clinical years of experience, patient counts, and verified Google rating badge.",
    category: "Essential",
  },
  {
    type: "SERVICES",
    label: "Treatments & Clinical Services",
    icon: Stethoscope,
    description: "Clinical procedures grid, medical icons, procedure duration, and pricing options.",
    category: "Clinical",
  },
  {
    type: "PACKAGES",
    label: "Health Checkup Packages",
    icon: DollarSign,
    description: "Full-body checkup packages, test parameter counts, and package offer pricing.",
    category: "Clinical",
  },
  {
    type: "DOCTOR_BIO",
    label: "Doctor Credentials & Profile",
    icon: ShieldCheck,
    description: "Doctor credentials, medical degrees, portrait, clinical philosophy, and awards.",
    category: "Clinical",
  },
  {
    type: "REVIEWS",
    label: "Google Patient Testimonials",
    icon: Star,
    description: "Verified patient testimonials with 5-star Google rating badge and patient remarks.",
    category: "Social Proof",
  },
  {
    type: "GALLERY",
    label: "Clinic Facilities Showcase",
    icon: ImageIcon,
    description: "Visual photo showcase of modern clinic ambiance, waiting lounge, and medical suites.",
    category: "Social Proof",
  },
  {
    type: "CTA_BANNER",
    label: "WhatsApp & Booking Callout",
    icon: MessageSquare,
    description: "High-conversion banner to drive WhatsApp consultations and teleconsult calls.",
    category: "Conversion",
  },
  {
    type: "FAQ",
    label: "Interactive Patient FAQs",
    icon: HelpCircle,
    description: "Accordion of frequently asked patient questions with Google FAQ rich schema.",
    category: "Information",
  },
  {
    type: "MAP_HOURS",
    label: "Location Map & OPD Schedule",
    icon: MapPin,
    description: "Interactive Google Map, calling phone, clinic address, and weekly schedule.",
    category: "Information",
  },
  {
    type: "CUSTOM_TEXT",
    label: "Custom Clinic Story / Notice",
    icon: Type,
    description: "Rich text story block for clinic notices, specialized equipment, or guidelines.",
    category: "Information",
  },
];

interface InsertSectionModalProps {
  isOpen: boolean;
  targetIndex: number | null;
  onClose: () => void;
  onSelectWidget: (type: SectionType, targetIndex: number) => void;
}

export function InsertSectionModal({
  isOpen,
  targetIndex,
  onClose,
  onSelectWidget,
}: InsertSectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  if (!isOpen || targetIndex === null) return null;

  const categories = ["ALL", "Essential", "Clinical", "Social Proof", "Conversion", "Information"];

  const filteredWidgets = COMPOSER_WIDGETS.filter(
    (w) => selectedCategory === "ALL" || w.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Elementor Section Block</h3>
              <p className="text-[11px] text-slate-500">
                Choose a medical block to insert at position #{targetIndex + 1}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Blocks" : cat}
            </button>
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredWidgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <div
                key={widget.type}
                onClick={() => {
                  onSelectWidget(widget.type, targetIndex);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md transition-all cursor-pointer flex items-start gap-3.5 bg-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                      {widget.label}
                    </h4>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {widget.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {widget.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any block to insert instantly onto the canvas</span>
          <Button type="button" variant="outline" onClick={onClose} className="h-8 rounded-lg text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
