"use client";

import React, { useState } from "react";
import { MEDICAL_STOCK_PHOTOS, MedicalStockPhoto } from "@/lib/medical-stock-library";
import { X, Search, Check, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MedicalStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (url: string) => void;
  title?: string;
  defaultCategory?: string;
}

export function MedicalStockModal({
  isOpen,
  onClose,
  onSelectPhoto,
  title = "Select from Curated Medical Stock Library",
  defaultCategory = "ALL",
}: MedicalStockModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);

  if (!isOpen) return null;

  const categories = [
    { id: "ALL", label: "All Photos" },
    { id: "HERO", label: "Hero Banners" },
    { id: "DOCTOR", label: "Doctors & Consultation" },
    { id: "CLINIC", label: "Clinic Facilities" },
    { id: "PEDIATRICS", label: "Pediatrics" },
    { id: "DENTAL", label: "Dental" },
    { id: "DERMATOLOGY", label: "Dermatology" },
    { id: "CARDIOLOGY", label: "Cardiology" },
    { id: "ORTHO", label: "Ortho & Physio" },
  ];

  const filteredPhotos = MEDICAL_STOCK_PHOTOS.filter((photo) => {
    const matchesCategory =
      activeCategory === "ALL" ||
      photo.category === activeCategory ||
      photo.tags.includes(activeCategory.toLowerCase());

    const matchesSearch =
      !search ||
      photo.title.toLowerCase().includes(search.toLowerCase()) ||
      photo.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500">
                100% Royalty-free, medical-grade high resolution photography for your clinic website.
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

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medical photos (e.g. child, dental, stethoscope, heart, clinic)..."
              className="pl-9 h-10 rounded-xl text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => {
                onSelectPhoto(photo.url);
                onClose();
              }}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer aspect-4/3 bg-slate-100"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <span className="text-white text-xs font-bold leading-tight drop-shadow-xs">
                  {photo.title}
                </span>
                <span className="text-blue-300 text-[10px] font-medium mt-0.5">
                  Click to Use Photo →
                </span>
              </div>
            </div>
          ))}

          {filteredPhotos.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
              <p className="text-xs">No matching photos found in this category.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>{filteredPhotos.length} photos available</span>
          <Button type="button" variant="outline" onClick={onClose} className="h-8 rounded-lg text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
