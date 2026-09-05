"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

export interface GridCell {
  row: number;
  col: number;
  lat: number;
  lng: number;
  rank: number;
  found: boolean;
}

interface RankTrackerMapProps {
  grid: GridCell[];
  centerLat: number;
  centerLng: number;
  businessName: string;
  spacingMeters: number;
  keyword?: string;
}

function getRankBadgeSvg(rank: number, found: boolean, isCenter: boolean): string {
  let bgColor = "#EF4444"; // Red >15 / not found
  let strokeColor = "#DC2626";
  let textColor = "#FFFFFF";
  let text = !found || rank === 0 ? ">20" : rank > 15 ? ">15" : String(rank);

  if (isCenter) {
    bgColor = "#4F46E5"; // Indigo
    strokeColor = "#3730A3";
    text = "★";
  } else if (found && rank > 0) {
    if (rank <= 3) {
      bgColor = "#10B981"; // Emerald
      strokeColor = "#059669";
    } else if (rank <= 7) {
      bgColor = "#F59E0B"; // Amber
      strokeColor = "#D97706";
    } else if (rank <= 15) {
      bgColor = "#F97316"; // Orange
      strokeColor = "#EA580C";
    }
  }

  const size = isCenter ? 42 : 36;
  const radius = isCenter ? 18 : 16;
  const fontSize = text.length > 2 ? 11 : 13;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3" />
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${bgColor}" stroke="${strokeColor}" stroke-width="2.5" filter="url(#shadow)" />
      <text x="${size / 2}" y="${size / 2 + 4.5}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="bold" font-family="system-ui, -apple-system, sans-serif">
        ${text}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function getDirectionLabel(dRow: number, dCol: number): string {
  if (dRow === 0 && dCol === 0) return "Clinic Center";
  let ns = "";
  let ew = "";
  if (dRow > 0) ns = "North";
  else if (dRow < 0) ns = "South";

  if (dCol > 0) ew = "East";
  else if (dCol < 0) ew = "West";

  return `${ns}${ew ? (ns ? "-" + ew : ew) : ""}`;
}

declare global {
  interface Window {
    google?: any;
    initRankMap?: () => void;
  }
}

export function RankTrackerMap({
  grid,
  centerLat,
  centerLng,
  businessName,
  spacingMeters,
  keyword,
}: RankTrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [activeCell, setActiveCell] = useState<GridCell | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

  useEffect(() => {
    if (!apiKey) {
      setMapError("Google Maps API Key not detected in environment.");
      return;
    }

    let isMounted = true;

    const loadGoogleMapsScript = () => {
      if (window.google?.maps) {
        if (isMounted) setMapLoaded(true);
        return;
      }

      const existingScript = document.getElementById("google-maps-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (isMounted) setMapLoaded(true);
        });
        existingScript.addEventListener("error", () => {
          if (isMounted) setMapError("Failed to load Google Maps SDK.");
        });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) setMapLoaded(true);
      };
      script.onerror = () => {
        if (isMounted) setMapError("Failed to load Google Maps script. Please verify network or API key.");
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    try {
      const validCenter = centerLat && centerLng && !isNaN(centerLat) && !isNaN(centerLng);
      const center = validCenter ? { lat: centerLat, lng: centerLng } : { lat: 28.5672, lng: 77.2100 };

      // Initialize map once
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 14,
          mapTypeId: "roadmap",
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }], // Reduce clutter so rank badges stand out
            },
          ],
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();
      const centerRow = 2; // for 5x5
      const centerCol = 2;

      grid.forEach((cell) => {
        if (!cell.lat || !cell.lng || isNaN(cell.lat) || isNaN(cell.lng)) return;

        const isCenter = cell.row === centerRow && cell.col === centerCol;
        const position = { lat: cell.lat, lng: cell.lng };
        bounds.extend(position);

        const iconUrl = getRankBadgeSvg(cell.rank, cell.found, isCenter);
        const iconSize = isCenter ? 42 : 36;

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: isCenter ? `${businessName} (You)` : `Rank #${cell.found ? cell.rank : '>20'}`,
          icon: {
            url: iconUrl,
            scaledSize: new window.google.maps.Size(iconSize, iconSize),
            anchor: new window.google.maps.Point(iconSize / 2, iconSize / 2),
          },
          zIndex: isCenter ? 100 : 10,
        });

        const dRow = centerRow - cell.row;
        const dCol = cell.col - centerCol;
        const dir = getDirectionLabel(dRow, dCol);
        const approxDist = Math.round(Math.sqrt(dRow * dRow + dCol * dCol) * spacingMeters);
        const rankLabel = !cell.found || cell.rank === 0 ? ">20" : cell.rank > 15 ? ">15" : `#${cell.rank}`;

        marker.addListener("click", () => {
          setActiveCell(cell);
          const content = `
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 4px; max-width: 220px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${
                  isCenter ? '#4F46E5' : cell.found && cell.rank <= 3 ? '#10B981' : cell.found && cell.rank <= 7 ? '#F59E0B' : '#EF4444'
                };"></span>
                <strong style="font-size: 13px; color: #111827;">
                  ${isCenter ? businessName : `Google Map Rank ${rankLabel}`}
                </strong>
              </div>
              <div style="font-size: 12px; color: #4B5563; line-height: 1.4;">
                ${isCenter ? '<strong>Clinic Origin Point</strong>' : `<strong>${dir}</strong> (${approxDist}m from clinic)`}
              </div>
              ${keyword ? `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Query: "${keyword}"</div>` : ''}
              <div style="font-size: 10px; color: #9CA3AF; margin-top: 4px; border-top: 1px solid #E5E7EB; padding-top: 4px;">
                GPS: ${cell.lat.toFixed(4)}, ${cell.lng.toFixed(4)}
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current.push(marker);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
      }
    } catch (err: any) {
      console.error("[RankTrackerMap] Render error:", err);
      setMapError("Failed to initialize Google Map view.");
    }
  }, [mapLoaded, grid, centerLat, centerLng, businessName, spacingMeters, keyword]);

  if (mapError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-amber-900">Google Map Preview Unavailable</h4>
        <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
          {mapError} You can continue tracking your rank using the 5×5 Matrix view below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
      <div
        ref={mapContainerRef}
        className="w-full h-[420px] sm:h-[480px]"
        style={{ minHeight: "380px" }}
      />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Navigation className="w-4 h-4 animate-spin text-indigo-600" />
            Loading Google Map & Geocodes...
          </div>
        </div>
      )}

      {/* Floating Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-gray-100 text-[11px] text-gray-600 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[8px]">1-3</span>
          Top 3 Pack
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[8px]">4-7</span>
          Ranks 4–7
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-[8px]">8-15</span>
          Ranks 8–15
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-[8px]">&gt;15</span>
          &gt;15 / Unranked
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[8px]">★</span>
          Clinic Center
        </div>
      </div>
    </div>
  );
}
