"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Sparkles,
  Layout,
  Stethoscope,
  DollarSign,
  ShieldCheck,
  Star,
  MessageSquare,
  Images,
  HelpCircle,
  MapPin,
  Type,
  Plus,
  Trash2,
  Bookmark,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Video,
  Link2,
  Image as ImageIcon,
  Quote,
  CreditCard,
  Clock,
  Code,
  Table,
  CheckSquare,
} from "lucide-react";
import {
  PRIMITIVE_BLOCKS,
  GYREX_CLINICAL_BLOCKS,
  DESIGN_BLOCKS,
} from "./builder-block-registry";
import {
  WireframeIcon1Col,
  WireframeIcon2Col,
  WireframeIcon2Col2575,
  WireframeIcon2Col7525,
  WireframeIcon3Col,
  WireframeIcon3Col502525,
  WireframeIconFlexbox,
  WireframeIconSection,
  WireframeIconDivider,
  WireframeIconHeading,
  WireframeIconText,
  WireframeCardFeaturesCenter,
  WireframeCardFeaturesSide,
  WireframeCardFeaturesCards,
  WireframeCardFeaturesColumns,
  WireframeCardFeaturesBadges,
} from "./BlockWireframeIcons";
import { PageSection, SectionType } from "@/components/themes/theme-types";
import { SavedBlockItem } from "@/types/builder-blocks";

interface StudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSection: (section: Partial<PageSection>) => void;
  savedBlocks: SavedBlockItem[];
  onDeleteSavedBlock: (id: string) => void;
}

export function StudioDrawer({
  isOpen,
  onClose,
  onInsertSection,
  savedBlocks,
  onDeleteSavedBlock,
}: StudioDrawerProps) {
  const [topTab, setTopTab] = useState<"blocks" | "design" | "saved">("blocks");
  const [subTab, setSubTab] = useState<"primitives" | "gyrex">("primitives");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignCategory, setSelectedDesignCategory] = useState<string>("All");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Wireframe Icon Resolver for Primitives
  const renderPrimitiveIcon = (id: string) => {
    switch (id) {
      case "prim_1col":
        return <WireframeIcon1Col className="w-8 h-8 text-slate-700" />;
      case "prim_2col_5050":
      case "prim_2col":
        return <WireframeIcon2Col className="w-8 h-8 text-slate-700" />;
      case "prim_2col_2575":
      case "prim_2col_37":
        return <WireframeIcon2Col2575 className="w-8 h-8 text-slate-700" />;
      case "prim_2col_7525":
        return <WireframeIcon2Col7525 className="w-8 h-8 text-slate-700" />;
      case "prim_3col":
        return <WireframeIcon3Col className="w-8 h-8 text-slate-700" />;
      case "prim_3col_502525":
        return <WireframeIcon3Col502525 className="w-8 h-8 text-slate-700" />;
      case "prim_flexbox":
        return <WireframeIconFlexbox className="w-8 h-8 text-purple-600" />;
      case "prim_section":
        return <WireframeIconSection className="w-8 h-8 text-slate-700" />;
      case "prim_divider":
        return <WireframeIconDivider className="w-8 h-8 text-slate-700" />;
      case "prim_heading":
        return <WireframeIconHeading className="w-8 h-8 text-slate-700" />;
      case "prim_text":
      case "prim_text_section":
        return <WireframeIconText className="w-8 h-8 text-slate-700" />;
      case "prim_link":
        return <Link2 className="w-6 h-6 text-blue-600" />;
      case "prim_link_box":
        return <ExternalLink className="w-6 h-6 text-purple-600" />;
      case "prim_image":
        return <ImageIcon className="w-6 h-6 text-indigo-600" />;
      case "prim_image_box":
        return <Layers className="w-6 h-6 text-emerald-600" />;
      case "prim_video":
        return <Video className="w-6 h-6 text-rose-600" />;
      case "prim_map":
        return <MapPin className="w-6 h-6 text-amber-600" />;
      case "prim_quote":
        return <Quote className="w-6 h-6 text-sky-600" />;
      case "prim_button":
        return <CreditCard className="w-6 h-6 text-purple-600" />;
      case "prim_countdown":
        return <Clock className="w-6 h-6 text-amber-600" />;
      case "prim_custom_code":
        return <Code className="w-6 h-6 text-slate-600" />;
      case "prim_typed":
        return <Sparkles className="w-6 h-6 text-indigo-600" />;
      case "prim_table":
        return <Table className="w-6 h-6 text-emerald-600" />;
      case "prim_form":
        return <CheckSquare className="w-6 h-6 text-purple-600" />;
      default:
        return <Layout className="w-7 h-7 text-slate-600" />;
    }
  };

  // Clinical Icon Resolver
  const renderClinicalIcon = (type: SectionType) => {
    switch (type) {
      case "HERO":
        return <Layout className="w-5 h-5 text-indigo-600" />;
      case "SERVICES":
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case "PACKAGES":
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case "STATS_RIBBON":
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case "DOCTOR_BIO":
        return <ShieldCheck className="w-5 h-5 text-purple-600" />;
      case "REVIEWS":
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case "CTA_BANNER":
        return <MessageSquare className="w-5 h-5 text-rose-600" />;
      case "GALLERY":
        return <Images className="w-5 h-5 text-teal-600" />;
      case "FAQ":
        return <HelpCircle className="w-5 h-5 text-sky-600" />;
      case "MAP_HOURS":
        return <MapPin className="w-5 h-5 text-red-600" />;
      default:
        return <Type className="w-5 h-5 text-slate-600" />;
    }
  };

  // Filtered Primitives
  const filteredPrimitives = useMemo(() => {
    return PRIMITIVE_BLOCKS.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filtered Gyrex Clinical Blocks
  const filteredGyrexBlocks = useMemo(() => {
    return GYREX_CLINICAL_BLOCKS.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filtered Design Blocks
  const filteredDesignBlocks = useMemo(() => {
    return DESIGN_BLOCKS.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedDesignCategory === "All" || d.category === selectedDesignCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedDesignCategory]);

  // Filtered Saved Blocks
  const filteredSavedBlocks = useMemo(() => {
    return savedBlocks.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedBlocks, searchQuery]);

  if (!isOpen) return null;

  return (
    <aside className="w-[340px] sm:w-[360px] h-full bg-white border-r border-slate-200 shadow-xl flex flex-col shrink-0 z-30 transition-all select-none">
      {/* ── TOP HEADER ── */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Blocks</span>
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── TIER 1 PRIMARY TABS (Blocks | Design Blocks | Saved Blocks) ── */}
      <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-semibold bg-slate-50/50">
        <button
          type="button"
          onClick={() => setTopTab("blocks")}
          className={`py-2.5 text-center transition-all cursor-pointer border-b-2 ${
            topTab === "blocks"
              ? "border-purple-600 text-purple-700 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Blocks
        </button>
        <button
          type="button"
          onClick={() => setTopTab("design")}
          className={`py-2.5 text-center transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1 ${
            topTab === "design"
              ? "border-purple-600 text-purple-700 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Design Blocks</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
        </button>
        <button
          type="button"
          onClick={() => setTopTab("saved")}
          className={`py-2.5 text-center transition-all cursor-pointer border-b-2 ${
            topTab === "saved"
              ? "border-purple-600 text-purple-700 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Saved Blocks
        </button>
      </div>

      {/* ── TIER 2 SUB TABS (Under 'Blocks': Blocks vs Exly/Gyrex Blocks) ── */}
      {topTab === "blocks" && (
        <div className="flex border-b border-slate-200 bg-white px-2 pt-1 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSubTab("primitives")}
            className={`pb-2 px-3 transition-all cursor-pointer font-bold border-b-2 ${
              subTab === "primitives"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Blocks
          </button>
          <button
            type="button"
            onClick={() => setSubTab("gyrex")}
            className={`pb-2 px-3 transition-all cursor-pointer font-bold border-b-2 flex items-center gap-1.5 ${
              subTab === "gyrex"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Gyrex Clinical</span>
            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">
              PRO
            </span>
          </button>
        </div>
      )}

      {/* ── SEARCH INPUT ── */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── BODY SCROLL AREA ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* ── 1. PRIMITIVE BLOCKS ── */}
        {topTab === "blocks" && subTab === "primitives" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Basic</span>
              <span className="text-[10px] text-slate-400 font-normal">Drag or Click to add</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredPrimitives.map((block) => (
                <div
                  key={block.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-gyrex-widget", block.defaultSection().type || "CUSTOM_TEXT");
                  }}
                  onClick={() => onInsertSection(block.defaultSection())}
                  className="group p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center text-center gap-2 select-none"
                  title={`${block.description} (Drag onto canvas or click to add)`}
                >
                  <div className="w-12 h-10 flex items-center justify-center text-slate-700 group-hover:text-purple-600 transition-colors">
                    {renderPrimitiveIcon(block.id)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
                    {block.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. GYREX CLINICAL BLOCKS ── */}
        {topTab === "blocks" && subTab === "gyrex" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Healthcare Modules</span>
              <span className="text-[10px] text-slate-400 font-normal">Specialized for Clinics</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredGyrexBlocks.map((block) => (
                <div
                  key={block.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-gyrex-widget", block.type);
                  }}
                  onClick={() => onInsertSection(block.defaultSection())}
                  className="group p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/20 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-start gap-3 select-none"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center shrink-0 transition-colors">
                    {renderClinicalIcon(block.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                        {block.name}
                      </span>
                      {block.badge && (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {block.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {block.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. DESIGN BLOCKS (High-Converting Sections) ── */}
        {topTab === "design" && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium no-scrollbar">
              {["All", "Features", "Hero Banners", "Clinical Services", "Checkup Packages", "Trust & Reviews", "Conversion CTA", "FAQ & Contact"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedDesignCategory(cat)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                    selectedDesignCategory === cat
                      ? "bg-purple-700 text-white font-bold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Design Blocks Cards */}
            <div className="space-y-3">
              {filteredDesignBlocks.map((design) => (
                <div
                  key={design.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-gyrex-widget", design.targetType);
                  }}
                  onClick={() => onInsertSection(design.defaultSection())}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* Miniature Wireframe Visual */}
                  <div className="h-20 bg-slate-50 p-2 border-b border-slate-100 flex items-center justify-center relative group-hover:bg-purple-50/30 transition-colors">
                    {design.thumbnailVariant === "features-center" && (
                      <div className="w-full h-full p-0.5">
                        <WireframeCardFeaturesCenter />
                      </div>
                    )}
                    {design.thumbnailVariant === "features-side" && (
                      <div className="w-full h-full p-0.5">
                        <WireframeCardFeaturesSide />
                      </div>
                    )}
                    {design.thumbnailVariant === "features-cards" && (
                      <div className="w-full h-full p-0.5">
                        <WireframeCardFeaturesCards />
                      </div>
                    )}
                    {design.thumbnailVariant === "features-columns" && (
                      <div className="w-full h-full p-0.5">
                        <WireframeCardFeaturesColumns />
                      </div>
                    )}
                    {design.thumbnailVariant === "features-badges" && (
                      <div className="w-full h-full p-0.5">
                        <WireframeCardFeaturesBadges />
                      </div>
                    )}
                    {design.thumbnailVariant === "split" && (
                      <div className="w-full h-full flex gap-2 items-center px-2">
                        <div className="w-7/12 space-y-1">
                          <div className="w-10 h-1 bg-purple-500 rounded-full" />
                          <div className="w-full h-2 bg-slate-800 rounded" />
                          <div className="w-3/4 h-1.5 bg-slate-300 rounded" />
                        </div>
                        <div className="w-5/12 h-full bg-purple-100 rounded-md border border-purple-200 flex items-center justify-center text-xs">
                          👨‍⚕️
                        </div>
                      </div>
                    )}

                    {design.thumbnailVariant === "bento" && (
                      <div className="w-full h-full grid grid-cols-12 gap-1.5 p-1">
                        <div className="col-span-7 bg-white rounded border border-slate-200 p-1.5 space-y-1">
                          <div className="w-8 h-1 bg-purple-500 rounded" />
                          <div className="w-full h-1.5 bg-slate-700 rounded" />
                        </div>
                        <div className="col-span-5 bg-white rounded border border-emerald-300 p-1 flex items-center justify-center text-[8px] font-bold text-emerald-700">
                          OPD Slot
                        </div>
                      </div>
                    )}

                    {design.thumbnailVariant === "full" && (
                      <div className="w-full h-full bg-slate-900 rounded-md p-2 flex flex-col items-center justify-center space-y-1 text-center">
                        <div className="w-12 h-1 bg-white/40 rounded-full" />
                        <div className="w-3/4 h-2 bg-white rounded" />
                        <div className="w-1/2 h-1 bg-white/60 rounded" />
                      </div>
                    )}

                    {design.thumbnailVariant === "grid" && (
                      <div className="w-full h-full grid grid-cols-3 gap-1.5 p-1">
                        <div className="bg-white rounded border border-slate-200 p-1 space-y-1">
                          <div className="w-3 h-3 bg-blue-100 rounded" />
                          <div className="w-full h-1 bg-slate-300 rounded" />
                        </div>
                        <div className="bg-white rounded border border-slate-200 p-1 space-y-1">
                          <div className="w-3 h-3 bg-blue-100 rounded" />
                          <div className="w-full h-1 bg-slate-300 rounded" />
                        </div>
                        <div className="bg-white rounded border border-slate-200 p-1 space-y-1">
                          <div className="w-3 h-3 bg-blue-100 rounded" />
                          <div className="w-full h-1 bg-slate-300 rounded" />
                        </div>
                      </div>
                    )}

                    {design.thumbnailVariant === "cards" && (
                      <div className="w-full h-full flex gap-1.5 p-1">
                        <div className="flex-1 bg-white rounded border border-slate-200 p-1 space-y-1">
                          <div className="w-full h-1.5 bg-slate-800 rounded" />
                          <div className="w-8 h-2 bg-emerald-100 rounded" />
                        </div>
                        <div className="flex-1 bg-white rounded border-2 border-purple-500 p-1 space-y-1 shadow-2xs">
                          <div className="w-full h-1.5 bg-purple-800 rounded" />
                          <div className="w-8 h-2 bg-purple-100 rounded" />
                        </div>
                      </div>
                    )}

                    {design.thumbnailVariant === "ribbon" && (
                      <div className="w-full h-7 bg-white rounded border border-slate-200 px-3 flex items-center justify-between">
                        <div className="w-8 h-2 bg-blue-500 rounded" />
                        <div className="w-8 h-2 bg-slate-300 rounded" />
                        <div className="w-8 h-2 bg-amber-400 rounded" />
                      </div>
                    )}

                    {design.thumbnailVariant === "faq" && (
                      <div className="w-full h-full p-1.5 space-y-1">
                        <div className="w-full h-3 bg-white rounded border border-slate-200 flex items-center px-1 justify-between">
                          <div className="w-20 h-1 bg-slate-700 rounded" />
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </div>
                        <div className="w-full h-3 bg-white rounded border border-slate-200 flex items-center px-1 justify-between">
                          <div className="w-16 h-1 bg-slate-700 rounded" />
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </div>
                      </div>
                    )}

                    {design.thumbnailVariant === "map" && (
                      <div className="w-full h-full flex gap-1.5 p-1">
                        <div className="w-1/2 bg-blue-50 rounded border border-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-700">
                          🗺️ Map
                        </div>
                        <div className="w-1/2 bg-white rounded border border-slate-200 p-1 space-y-1">
                          <div className="w-10 h-1 bg-slate-700 rounded" />
                          <div className="w-full h-1 bg-slate-300 rounded" />
                        </div>
                      </div>
                    )}

                    {design.badge && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-purple-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-purple-200 shadow-2xs">
                        {design.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="p-2.5">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {design.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                      {design.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. SAVED BLOCKS (Custom Library) ── */}
        {topTab === "saved" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Your Custom Blocks</span>
              <span className="text-[10px] text-slate-400 font-normal">{filteredSavedBlocks.length} Saved</span>
            </div>

            {filteredSavedBlocks.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Saved Blocks Yet</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Customize any section on your canvas, click &quot;Save to Library&quot; in the section menu, and it will appear here for 1-click reuse across pages!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSavedBlocks.map((saved) => (
                  <div
                    key={saved.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                  >
                    <div
                      onClick={() => onInsertSection(saved.section)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <h4 className="text-xs font-bold text-slate-900 hover:text-purple-700 truncate">
                        {saved.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {saved.targetType} • Saved on {saved.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onInsertSection(saved.section)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Insert Block"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSavedBlock(saved.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete from Library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
