"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  MapPin, ArrowRight, Layers, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, CheckCircle2, TrendingUp, Search, Compass, Info,
  ShieldCheck, Activity, Trophy, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

// Specialty Showcase Presets across prime Indian catchments
interface SpecialtyPreset {
  id: string;
  specialty: string;
  clinicName: string;
  city: string;
  locality: string;
  defaultKeyword: string;
  centerLat: number;
  centerLng: number;
  centerRank: number;
  reviewsCount: number;
  rating: number;
  rankDecayRate: number; // Factor for simulating distance decay
}

const PRESETS: SpecialtyPreset[] = [
  {
    id: "derma-mumbai",
    specialty: "Dermatology & Aesthetics",
    clinicName: "Aura Skin & Laser Clinic",
    locality: "Bandra West",
    city: "Mumbai",
    defaultKeyword: "Dermatologist near me",
    centerLat: 19.0596,
    centerLng: 72.8295,
    centerRank: 1,
    reviewsCount: 342,
    rating: 4.9,
    rankDecayRate: 1.8,
  },
  {
    id: "dental-bangalore",
    specialty: "Dental & Implantology",
    clinicName: "Apex Dental & Implant Studio",
    locality: "Indiranagar",
    city: "Bengaluru",
    defaultKeyword: "Dental Clinic near me",
    centerLat: 12.9784,
    centerLng: 77.6408,
    centerRank: 1,
    reviewsCount: 285,
    rating: 4.8,
    rankDecayRate: 2.1,
  },
  {
    id: "pedia-delhi",
    specialty: "Pediatrics & Child Health",
    clinicName: "Little Stars Child Clinic",
    locality: "Greater Kailash",
    city: "New Delhi",
    defaultKeyword: "Pediatrician near me",
    centerLat: 28.5494,
    centerLng: 77.2346,
    centerRank: 2,
    reviewsCount: 210,
    rating: 4.9,
    rankDecayRate: 2.4,
  },
  {
    id: "ortho-chennai",
    specialty: "Orthopedics & Spine",
    clinicName: "Joint & Spine Specialty Care",
    locality: "Anna Nagar",
    city: "Chennai",
    defaultKeyword: "Orthopedic Doctor near me",
    centerLat: 13.0850,
    centerLng: 80.2101,
    centerRank: 1,
    reviewsCount: 195,
    rating: 4.8,
    rankDecayRate: 2.0,
  }
];

function getBadgeColors(rank: number, found: boolean, isCenter: boolean) {
  if (isCenter) {
    return { bg: "#4F46E5", border: "#3730A3", text: "#FFFFFF", label: "★" };
  }
  if (!found || rank === 0) {
    return { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF", label: ">20" };
  }
  if (rank <= 3) {
    return { bg: "#10B981", border: "#059669", text: "#FFFFFF", label: String(rank) };
  }
  if (rank <= 7) {
    return { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF", label: String(rank) };
  }
  if (rank <= 15) {
    return { bg: "#F97316", border: "#EA580C", text: "#FFFFFF", label: String(rank) };
  }
  return { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF", label: ">15" };
}

function getDirectionLabel(dRow: number, dCol: number): string {
  if (dRow === 0 && dCol === 0) return "Clinic Location";
  let ns = "";
  let ew = "";
  if (dRow > 0) ns = "North";
  else if (dRow < 0) ns = "South";

  if (dCol > 0) ew = "East";
  else if (dCol < 0) ew = "West";

  return `${ns}${ew ? (ns ? "-" + ew : ew) : ""}`;
}

export function LiveLocalGridShowcase() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [spacingMeters, setSpacingMeters] = useState<number>(500); // 200m, 500m, 1km, 2km
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const activePreset = PRESETS[selectedPresetIndex];
  const activeKeyword = customKeyword.trim() || activePreset.defaultKeyword;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Generate 5x5 Geo-Grid coordinates & simulated ranks around the preset center
  const gridCells = useMemo(() => {
    const cells = [];
    const R = 6378137; // Earth radius in meters
    const centerLat = activePreset.centerLat;
    const centerLng = activePreset.centerLng;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dRow = 2 - r; // +2 to -2 (North to South)
        const dCol = c - 2; // -2 to +2 (West to East)
        const isCenter = dRow === 0 && dCol === 0;

        const dNorth = dRow * spacingMeters;
        const dEast = dCol * spacingMeters;

        const lat = centerLat + (dNorth / R) * (180 / Math.PI);
        const lng = centerLng + (dEast / (R * Math.cos((Math.PI * centerLat) / 180))) * (180 / Math.PI);

        // Distance from center in steps (0 to ~2.82)
        const distSteps = Math.sqrt(dRow * dRow + dCol * dCol);
        
        let rank: number;
        if (isCenter) {
          rank = activePreset.centerRank;
        } else {
          // Deterministic rank decay as distance increases
          const calculatedRank = activePreset.centerRank + Math.round(distSteps * activePreset.rankDecayRate);
          rank = Math.min(21, calculatedRank);
        }

        const found = rank <= 20;

        cells.push({
          row: r,
          col: c,
          lat,
          lng,
          rank,
          found,
          isCenter,
          distMeters: Math.round(distSteps * spacingMeters),
          direction: getDirectionLabel(dRow, dCol)
        });
      }
    }
    return cells;
  }, [activePreset, spacingMeters]);

  // Statistics & Share of Local Voice (SoLV)
  const top3Count = gridCells.filter(c => c.found && c.rank <= 3).length;
  const solvPercentage = Math.round((top3Count / 25) * 100);
  const foundCells = gridCells.filter(c => c.found && c.rank > 0);
  const avgRank = foundCells.length > 0 
    ? (foundCells.reduce((sum, c) => sum + c.rank, 0) / foundCells.length).toFixed(1)
    : "15+";
  const coverageKm = ((spacingMeters * 4) / 1000).toFixed(1);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (!mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [activePreset.centerLat, activePreset.centerLng],
          zoom: spacingMeters >= 2000 ? 12 : spacingMeters >= 1000 ? 13 : 14,
          zoomControl: false,
          scrollWheelZoom: false, // Prevent accidental scrolling when browsing landing page
          attributionControl: false,
        });

        // Google Maps Tiles Layer
        const tileUrl = mapType === "satellite"
          ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          : "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

        const tiles = L.tileLayer(tileUrl, {
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          maxZoom: 20,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        tileLayerRef.current = tiles;
        markersLayerRef.current = markersLayer;

        setMapLoaded(true);
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update map center & zoom when preset or radius changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const zoomLevel = spacingMeters >= 2000 ? 12 : spacingMeters >= 1000 ? 13 : 14;
    mapInstanceRef.current.setView([activePreset.centerLat, activePreset.centerLng], zoomLevel, {
      animate: true,
    });
  }, [activePreset, spacingMeters]);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = mapType === "satellite"
      ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      : "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapType]);

  // Render 25 Custom SVG Badges on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    async function drawMarkers() {
      const L = (await import("leaflet")).default;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      gridCells.forEach((cell) => {
        const colors = getBadgeColors(cell.rank, cell.found, cell.isCenter);
        const isRankTop3 = cell.found && cell.rank <= 3;

        const pulseRing = cell.isCenter
          ? `<span style="position:absolute;inset:-4px;border-radius:9999px;border:2px solid #4F46E5;opacity:0.6;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>`
          : "";

        const crownIcon = isRankTop3 && !cell.isCenter
          ? `<svg style="position:absolute;top:-8px;width:12px;height:12px;fill:#F59E0B;" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`
          : "";

        const html = `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            ${pulseRing}
            ${crownIcon}
            <div style="
              width:${cell.isCenter ? "36px" : "30px"};
              height:${cell.isCenter ? "36px" : "30px"};
              border-radius:9999px;
              background-color:${colors.bg};
              border:2.5px solid ${colors.border};
              color:${colors.text};
              font-weight:900;
              font-size:${cell.isCenter ? "14px" : "12px"};
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 3px 8px rgba(0,0,0,0.3);
              font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
              transition:transform 0.15s ease;
            ">
              ${colors.label}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-rank-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        const popupContent = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;min-width:210px;padding:4px 2px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid #E2E8F0;padding-bottom:5px;">
              <span style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
                ${cell.direction}
              </span>
              <span style="font-size:11px;font-weight:700;color:#0284C7;background:#F0F9FF;padding:2px 6px;border-radius:4px;border:1px solid #BAE6FD;">
                ${cell.distMeters === 0 ? "At Clinic" : `${cell.distMeters}m away`}
              </span>
            </div>

            <div style="font-size:12px;color:#334155;margin-bottom:6px;line-height:1.4;">
              Virtual patient searching: <strong style="color:#0F172A;">"${activeKeyword}"</strong>
            </div>

            <div style="background:${colors.bg}15;border:1px solid ${colors.bg}40;border-radius:8px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11px;font-weight:600;color:#334155;">Google Maps Position:</span>
              <span style="font-size:13px;font-weight:900;color:${colors.bg === '#10B981' ? '#047857' : colors.bg === '#EF4444' ? '#B91C1C' : '#B45309'};">
                ${cell.isCenter ? "Rank #1 (Center)" : cell.rank > 20 ? "Rank >20 (Hidden)" : `Rank #${cell.rank}`}
              </span>
            </div>

            <div style="margin-top:6px;font-size:10px;color:#64748B;text-align:center;">
              ${cell.rank <= 3 ? "⭐ Visible in Google 3-Pack — Maximum Patient Inquiries" : "⚠️ Beyond Page 1 — Patients choose nearby competitors"}
            </div>
          </div>
        `;

        const marker = L.marker([cell.lat, cell.lng], { icon });
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });
    }

    drawMarkers();
  }, [gridCells, activeKeyword]);

  return (
    <section id="local-grid" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-bold text-blue-300">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive 5×5 Google Maps Visibility Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            See Exactly How Patients Find Your Clinic Across Town
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Google Maps rankings drop drastically just a few streets away from your clinic. Test the interactive 25-point catchment grid below to see how local searchers discover top practices.
          </p>
        </div>

        {/* Interactive Controls & Specialty Preset Switcher */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 backdrop-blur-md shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Specialty Presets */}
            <div className="space-y-1.5 w-full lg:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Select Practice Specialty &amp; City:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetIndex(idx);
                      setCustomKeyword("");
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      selectedPresetIndex === idx
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-102"
                        : "bg-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{preset.clinicName}</span>
                    <span className="text-[10px] opacity-75 font-normal">({preset.city})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Radius Spacing Controls */}
            <div className="space-y-1.5 w-full lg:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Grid Radius Spacing:
              </span>
              <div className="inline-flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                {[
                  { label: "200m", val: 200, desc: "Immediate Walk-in" },
                  { label: "500m", val: 500, desc: "Neighborhood" },
                  { label: "1 km", val: 1000, desc: "Local Catchment" },
                  { label: "2 km", val: 2000, desc: "City Sector" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSpacingMeters(s.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      spacingMeters === s.val
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Keyword Search Bar & Layer Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder={`Search query (e.g. "${activePreset.defaultKeyword}")`}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="inline-flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setMapType("streets")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    mapType === "streets" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    mapType === "satellite" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Satellite
                </button>
              </div>

              <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Click any badge on map for live diagnostics</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAP CANVAS CONTAINER ── */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-950">
          
          {/* Leaflet Map Box */}
          <div ref={mapContainerRef} className="w-full h-[500px] sm:h-[540px] z-10" />

          {/* Floating Metric HUD (Top Left) */}
          <div className="absolute top-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl max-w-[280px] hidden sm:block">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white">{activePreset.clinicName}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{activePreset.locality}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Share of Voice</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{solvPercentage}%</span>
                <span className="text-[9px] text-slate-400 block">Top 3 Dominance</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Position</span>
                <span className="text-xl font-black text-blue-400 font-mono">#{avgRank}</span>
                <span className="text-[9px] text-slate-400 block">{coverageKm} km Catchment</span>
              </div>
            </div>
          </div>

          {/* Map Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-md transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-md transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const zoom = spacingMeters >= 2000 ? 12 : spacingMeters >= 1000 ? 13 : 14;
                mapInstanceRef.current?.setView([activePreset.centerLat, activePreset.centerLng], zoom);
              }}
              className="w-8 h-8 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-md transition-colors"
              title="Recenter Clinic"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Banner (Bottom) */}
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">#1 to #3 (Google 3-Pack)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200">#4 to #7 (Striking Distance)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-400 shrink-0" />
                <span className="font-semibold text-slate-200">#8 to #15 (Page 2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-400 shrink-0" />
                <span className="font-semibold text-slate-200">&gt;15 (Invisible)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 border border-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-200">Clinic Center</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Query: <strong className="text-white font-mono">&quot;{activeKeyword}&quot;</strong>
            </div>
          </div>

        </div>

        {/* ── SCORECARD METRICS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Share of Local Voice</span>
            <div className="text-3xl font-black text-emerald-400 font-mono">{solvPercentage}%</div>
            <p className="text-[11px] text-slate-400">{top3Count} of 25 nodes in Google 3-Pack</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Catchment Rank</span>
            <div className="text-3xl font-black text-blue-400 font-mono">#{avgRank}</div>
            <p className="text-[11px] text-slate-400">Across {coverageKm} km surrounding area</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Verified Patient Reviews</span>
            <div className="text-3xl font-black text-amber-400 font-mono">{activePreset.reviewsCount}</div>
            <p className="text-[11px] text-slate-400">{activePreset.rating} ★ Rating on Google Maps</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimated Patient Inquiries</span>
            <div className="text-3xl font-black text-purple-400 font-mono">+{Math.round(top3Count * 4.2)} / mo</div>
            <p className="text-[11px] text-slate-400">Direct phone &amp; direction calls</p>
          </div>
        </div>

        {/* ── CALL TO ACTION BANNER FOR DOCTOR AUDIT ── */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Free Live Audit
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Where Does Your Clinic Rank in Your Neighborhood?
            </h3>
            <p className="text-sm text-indigo-100 max-w-xl">
              Type your clinic name and scan your live Google Maps rank across 25 neighborhood coordinates in 60 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link href="/local-seo/free-audit">
              <Button className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm h-12 px-7 rounded-2xl shadow-xl transition-transform hover:scale-105 flex items-center gap-2">
                <span>Scan Your Clinic Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/40 text-white hover:bg-white/10 font-bold text-sm bg-transparent">
                <span>Start 14-Day Free Trial</span>
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
