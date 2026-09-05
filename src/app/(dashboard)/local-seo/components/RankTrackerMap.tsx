"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Layers, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import "leaflet/dist/leaflet.css";

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
  if (dRow === 0 && dCol === 0) return "Clinic Center";
  let ns = "";
  let ew = "";
  if (dRow > 0) ns = "North";
  else if (dRow < 0) ns = "South";

  if (dCol > 0) ew = "East";
  else if (dCol < 0) ew = "West";

  return `${ns}${ew ? (ns ? "-" + ew : ew) : ""}`;
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
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (!mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      // Fix default marker asset paths if needed
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const validCenter = centerLat && centerLng && !isNaN(centerLat) && !isNaN(centerLng);
      const defaultCenter: [number, number] = validCenter
        ? [centerLat, centerLng]
        : [28.5672, 77.2100];

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        // CartoDB Voyager tiles (clean, modern, road-centric styling like Google Maps)
        const streetTiles = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 19,
            subdomains: "abcd",
          }
        );

        streetTiles.addTo(map);
        tileLayerRef.current = streetTiles;

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;

        mapInstanceRef.current = map;
        if (isMounted) setMapLoaded(true);

        // Force resize recalculation once DOM settles
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer (Streets vs Satellite)
  useEffect(() => {
    async function updateTiles() {
      if (!mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let newTileLayer;
      if (mapType === "satellite") {
        newTileLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        );
      } else {
        newTileLayer = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          { maxZoom: 19, subdomains: "abcd" }
        );
      }

      newTileLayer.addTo(map);
      tileLayerRef.current = newTileLayer;
    }

    if (mapLoaded) {
      updateTiles();
    }
  }, [mapType, mapLoaded]);

  // Update Markers & Fit Bounds
  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      const layer = markersLayerRef.current;

      layer.clearLayers();

      const validCells = grid.filter((c) => c.lat && c.lng && !isNaN(c.lat) && !isNaN(c.lng));
      if (validCells.length === 0) return;

      const latLngs: [number, number][] = [];
      const centerRow = 2;
      const centerCol = 2;

      validCells.forEach((cell) => {
        const isCenter = cell.row === centerRow && cell.col === centerCol;
        const colors = getBadgeColors(cell.rank, cell.found, isCenter);
        const size = isCenter ? 44 : 36;
        const fontSize = colors.label.length > 2 ? 11 : 13;

        latLngs.push([cell.lat, cell.lng]);

        const iconHtml = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${colors.bg};
            border: 2.5px solid ${colors.border};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${fontSize}px;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            ${isCenter ? 'ring: 4px solid rgba(79, 70, 229, 0.4); animation: pulse 2s infinite;' : ''}
          ">
            ${colors.label}
          </div>
        `;

        const customIcon = L.divIcon({
          className: "rank-badge-icon",
          html: iconHtml,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

        const dRow = centerRow - cell.row;
        const dCol = cell.col - centerCol;
        const dir = getDirectionLabel(dRow, dCol);
        const approxDist = Math.round(Math.sqrt(dRow * dRow + dCol * dCol) * spacingMeters);
        const rankText = !cell.found || cell.rank === 0 ? "Not Found in Top 20" : cell.rank > 15 ? "> 15" : `#${cell.rank}`;

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 2px; min-width: 190px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${colors.bg};"></span>
              <strong style="font-size: 14px; color: #111827;">
                ${isCenter ? businessName : `Search Rank ${rankText}`}
              </strong>
            </div>
            <div style="font-size: 12px; color: #4B5563; margin-bottom: 4px;">
              ${isCenter ? '<span style="color: #4F46E5; font-weight: 600;">Clinic Location (Center)</span>' : `<strong>${dir}</strong> (${approxDist}m from clinic)`}
            </div>
            ${keyword ? `<div style="font-size: 11px; color: #6B7280; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; display: inline-block;">Target: "${keyword}"</div>` : ''}
            <div style="font-size: 10px; color: #9CA3AF; margin-top: 6px; border-top: 1px solid #E5E7EB; padding-top: 4px;">
              GPS: ${cell.lat.toFixed(4)}, ${cell.lng.toFixed(4)}
            </div>
          </div>
        `;

        const marker = L.marker([cell.lat, cell.lng], {
          icon: customIcon,
          zIndexOffset: isCenter ? 1000 : 100,
        }).bindPopup(popupContent);

        marker.addTo(layer);
      });

      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [45, 45] });
      }
    }

    if (mapLoaded) {
      updateMarkers();
    }
  }, [grid, mapLoaded, centerLat, centerLng, businessName, spacingMeters, keyword]);

  const handleResetBounds = async () => {
    if (!mapInstanceRef.current) return;
    const L = (await import("leaflet")).default;
    const validCells = grid.filter((c) => c.lat && c.lng && !isNaN(c.lat) && !isNaN(c.lng));
    if (validCells.length > 0) {
      const bounds = L.latLngBounds(validCells.map((c) => [c.lat, c.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45] });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-slate-50">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[440px] sm:h-[500px]"
        style={{ minHeight: "400px" }}
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-xs z-1000">
          <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold bg-white px-4 py-2.5 rounded-xl shadow-md border border-gray-200">
            <Navigation className="w-4 h-4 animate-spin text-indigo-600" />
            Loading Interactive Geo Map...
          </div>
        </div>
      )}

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-3 right-3 z-1000 flex flex-col gap-2">
        {/* Layer Toggle */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-gray-200 flex">
          <button
            type="button"
            onClick={() => setMapType("streets")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              mapType === "streets"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Roads
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              mapType === "satellite"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-b border-gray-100 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-b border-gray-100 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetBounds}
            title="Fit All Points"
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Legend Overlay Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-1000 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-gray-100 text-[11px] text-gray-600 flex flex-wrap items-center gap-3">
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
