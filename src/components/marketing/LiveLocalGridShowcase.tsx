"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  MapPin, ArrowRight, ZoomIn, ZoomOut, RotateCcw, 
  TrendingUp, Target, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

// Sample Specialty Presets in key medical hubs
interface SpecialtyPreset {
  id: string;
  specialty: string;
  clinicName: string;
  city: string;
  locality: string;
  keyword: string;
  centerLat: number;
  centerLng: number;
  centerRank: number;
  rankDecayRate: number;
}

const PRESETS: SpecialtyPreset[] = [
  {
    id: "derma-mumbai",
    specialty: "Dermatology",
    clinicName: "Aura Skin & Laser Clinic",
    locality: "Bandra West",
    city: "Mumbai",
    keyword: "Dermatologist near me",
    centerLat: 19.0596,
    centerLng: 72.8295,
    centerRank: 1,
    rankDecayRate: 1.8,
  },
  {
    id: "dental-bangalore",
    specialty: "Dental & Implants",
    clinicName: "Apex Dental & Implant Studio",
    locality: "Indiranagar",
    city: "Bengaluru",
    keyword: "Dental Clinic near me",
    centerLat: 12.9784,
    centerLng: 77.6408,
    centerRank: 1,
    rankDecayRate: 2.1,
  },
  {
    id: "pedia-delhi",
    specialty: "Pediatrics",
    clinicName: "Little Stars Child Clinic",
    locality: "Greater Kailash",
    city: "New Delhi",
    keyword: "Pediatrician near me",
    centerLat: 28.5494,
    centerLng: 77.2346,
    centerRank: 2,
    rankDecayRate: 2.4,
  },
  {
    id: "ortho-chennai",
    specialty: "Orthopedics",
    clinicName: "Joint & Spine Specialty Care",
    locality: "Anna Nagar",
    city: "Chennai",
    keyword: "Orthopedic Doctor near me",
    centerLat: 13.0850,
    centerLng: 80.2101,
    centerRank: 1,
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

  const activePreset = PRESETS[selectedPresetIndex];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Generate 5x5 Geo-Grid coordinates & simulated ranks
  const gridCells = useMemo(() => {
    const cells = [];
    const R = 6378137;
    const centerLat = activePreset.centerLat;
    const centerLng = activePreset.centerLng;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dRow = 2 - r;
        const dCol = c - 2;
        const isCenter = dRow === 0 && dCol === 0;

        const dNorth = dRow * spacingMeters;
        const dEast = dCol * spacingMeters;

        const lat = centerLat + (dNorth / R) * (180 / Math.PI);
        const lng = centerLng + (dEast / (R * Math.cos((Math.PI * centerLat) / 180))) * (180 / Math.PI);

        const distSteps = Math.sqrt(dRow * dRow + dCol * dCol);
        
        let rank: number;
        if (isCenter) {
          rank = activePreset.centerRank;
        } else {
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

  // Performance metrics
  const top3Count = gridCells.filter(c => c.found && c.rank <= 3).length;
  const solvPercentage = Math.round((top3Count / 25) * 100);
  const foundCells = gridCells.filter(c => c.found && c.rank > 0);
  const avgRank = foundCells.length > 0 
    ? (foundCells.reduce((sum, c) => sum + c.rank, 0) / foundCells.length).toFixed(1)
    : "15+";

  // Leaflet Map Initialization
  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (!mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

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
          scrollWheelZoom: false,
          attributionControl: false,
        });

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

  // Sync center and zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const zoomLevel = spacingMeters >= 2000 ? 12 : spacingMeters >= 1000 ? 13 : 14;
    mapInstanceRef.current.setView([activePreset.centerLat, activePreset.centerLng], zoomLevel, {
      animate: true,
    });
  }, [activePreset, spacingMeters]);

  // Sync tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = mapType === "satellite"
      ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      : "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapType]);

  // Draw pins
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    async function drawMarkers() {
      const L = (await import("leaflet")).default;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      gridCells.forEach((cell) => {
        const colors = getBadgeColors(cell.rank, cell.found, cell.isCenter);

        const pulseRing = cell.isCenter
          ? `<span style="position:absolute;inset:-4px;border-radius:9999px;border:2px solid #4F46E5;opacity:0.6;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>`
          : "";

        const html = `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            ${pulseRing}
            <div style="
              width:${cell.isCenter ? "34px" : "28px"};
              height:${cell.isCenter ? "34px" : "28px"};
              border-radius:9999px;
              background-color:${colors.bg};
              border:2px solid ${colors.border};
              color:${colors.text};
              font-weight:800;
              font-size:${cell.isCenter ? "13px" : "11px"};
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.25);
              font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
            ">
              ${colors.label}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-rank-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const popupContent = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;min-width:180px;padding:3px 2px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">
              <span style="font-size:11px;font-weight:700;color:#64748B;">
                ${cell.direction}
              </span>
              <span style="font-size:10px;font-weight:700;color:#0284C7;background:#F0F9FF;padding:2px 6px;border-radius:4px;border:1px solid #BAE6FD;">
                ${cell.distMeters === 0 ? "Clinic Center" : `${cell.distMeters}m`}
              </span>
            </div>

            <div style="font-size:11px;color:#475569;margin-bottom:6px;">
              Keyword: <strong style="color:#0F172A;">"${activePreset.keyword}"</strong>
            </div>

            <div style="background:${colors.bg}15;border:1px solid ${colors.bg}40;border-radius:6px;padding:5px 8px;display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11px;font-weight:600;color:#334155;">Rank Position:</span>
              <span style="font-size:12px;font-weight:900;color:${colors.bg === '#10B981' ? '#047857' : colors.bg === '#EF4444' ? '#B91C1C' : '#B45309'};">
                ${cell.isCenter ? "Rank #1 (Center)" : cell.rank > 20 ? "Rank >20" : `Rank #${cell.rank}`}
              </span>
            </div>
          </div>
        `;

        const marker = L.marker([cell.lat, cell.lng], { icon });
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });
    }

    drawMarkers();
  }, [gridCells, activePreset]);

  return (
    <section id="local-grid" className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How Visible Is Your Clinic on Google Maps?
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Patient discovery changes every few hundred meters. See how rankings vary across local neighborhood sectors.
          </p>
        </div>

        {/* Clean Showcase Frame */}
        <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
          
          {/* Top Control Bar: Inline Specialty Tabs + Radius */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/60">
            
            {/* Specialty Presets */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedPresetIndex === idx
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{preset.specialty}</span>
                  <span className="text-[10px] opacity-70">({preset.city})</span>
                </button>
              ))}
            </div>

            {/* Radius Spacing + Map Layer */}
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
                {[
                  { label: "200m", val: 200 },
                  { label: "500m", val: 500 },
                  { label: "1 km", val: 1000 },
                  { label: "2 km", val: 2000 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSpacingMeters(s.val)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      spacingMeters === s.val
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMapType("streets")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    mapType === "streets" ? "bg-slate-100 text-slate-900 font-black" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Road
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    mapType === "satellite" ? "bg-slate-100 text-slate-900 font-black" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sat
                </button>
              </div>
            </div>

          </div>

          {/* Map Viewport */}
          <div className="relative bg-slate-100 h-[400px] sm:h-[460px]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Zoom / Recenter */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const zoom = spacingMeters >= 2000 ? 12 : spacingMeters >= 1000 ? 13 : 14;
                  mapInstanceRef.current?.setView([activePreset.centerLat, activePreset.centerLng], zoom);
                }}
                className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
                title="Recenter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Minimal Clean Legend */}
            <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Top 3 (Google 3-Pack)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Rank 4–7
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> &gt;15
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Simulated Query: &quot;{activePreset.keyword}&quot;
              </span>
            </div>
          </div>

          {/* Slim Performance Strip (Matching Dashboard) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/50 border-t border-slate-200/80">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Map Pack Share</div>
                <div className="text-sm font-extrabold text-slate-900">{solvPercentage}% <span className="text-[11px] font-normal text-slate-500">({top3Count}/25 nodes)</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 sm:border-l sm:border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Average Rank</div>
                <div className="text-sm font-extrabold text-slate-900">#{avgRank} <span className="text-[11px] font-normal text-slate-500">overall</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 sm:border-l sm:border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Radius Step</div>
                <div className="text-sm font-extrabold text-slate-900">{spacingMeters}m <span className="text-[11px] font-normal text-slate-500">({(spacingMeters * 4) / 1000} km area)</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 sm:border-l sm:border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                <div className="text-sm font-extrabold text-slate-900 truncate">{activePreset.locality}</div>
              </div>
            </div>
          </div>

          {/* Simple Clean CTA Banner */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Where does your practice rank in your neighborhood?
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Run a free 60-second scan across 25 local coordinates to see your clinic&apos;s real positions.
              </p>
            </div>
            <Link href="/local-seo/free-audit" className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs flex items-center justify-center gap-2">
                <span>Check Your Clinic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
