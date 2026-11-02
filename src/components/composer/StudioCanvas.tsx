"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
} from "lucide-react";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData, PageSection } from "@/components/themes/theme-types";

interface StudioCanvasProps {
  siteData: ClinicWebsiteData;
  selectedSectionId: string | null;
  viewport: "desktop" | "tablet" | "mobile";
  onSelectSection: (id: string) => void;
  onMoveSection: (id: string, dir: "up" | "down") => void;
  onDeleteSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onDropNewSection: (type: any, targetIndex: number) => void;
  onReorderSection: (dragIndex: number, hoverIndex: number) => void;
  onOpenInsertModal: (idx?: number) => void;
}

export function StudioCanvas({
  siteData,
  selectedSectionId,
  viewport,
  onSelectSection,
  onMoveSection,
  onDeleteSection,
  onDuplicateSection,
  onDropNewSection,
  onReorderSection,
  onOpenInsertModal,
}: StudioCanvasProps) {
  // Panning & Zooming State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningMode, setIsPanningMode] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Drag over target index for block insertion
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Keyboard Spacebar Listener for Pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsDraggingCanvas(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse Hand Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || isPanningMode || e.button === 1) {
      setIsDraggingCanvas(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const resetPanAndZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 1.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 0.5));
  };

  // Canvas Drag & Drop handlers for incoming blocks from Drawer
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData("application/x-gyrex-widget");
    if (widgetType) {
      const targetIdx = dragOverIndex !== null ? dragOverIndex : (siteData.sections || []).length;
      onDropNewSection(widgetType, targetIdx);
      setDragOverIndex(null);
    }
  };

  // Viewport Container Width
  const viewportWidthClass =
    viewport === "desktop"
      ? "w-full max-w-6xl min-w-[960px]"
      : viewport === "tablet"
      ? "w-[768px]"
      : "w-[390px]";

  const isHandActive = isPanningMode || isSpacePressed;

  return (
    <div
      ref={canvasContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      className={`relative flex-1 h-full overflow-hidden bg-slate-100 select-none ${
        isHandActive
          ? isDraggingCanvas
            ? "cursor-grabbing"
            : "cursor-grab"
          : "cursor-default"
      }`}
      style={{
        backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* ── FLOATING PANNING & ZOOM CONTROLS TOOLBAR ── */}
      <div className="absolute bottom-5 right-6 z-30 flex items-center bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-1 gap-1 select-none">
        <button
          type="button"
          onClick={() => setIsPanningMode(false)}
          className={`p-1.5 rounded-xl transition-all ${
            !isPanningMode
              ? "bg-purple-100 text-purple-700 font-bold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Select Tool (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsPanningMode(true)}
          className={`p-1.5 rounded-xl transition-all ${
            isPanningMode
              ? "bg-purple-100 text-purple-700 font-bold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Pan Hand Tool (H / Hold Spacebar)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl disabled:opacity-40"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-slate-700 min-w-11 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 1.5}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl disabled:opacity-40"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={resetPanAndZoom}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
          title="Reset View to 100% & Center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── DRAGGABLE & SCALABLE ARTBOARD CANVAS WRAPPER ── */}
      <div
        className="w-full h-full overflow-auto flex items-start justify-center p-6 md:p-12 transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center top",
        }}
      >
        <div
          className={`bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-300 transition-all duration-300 ${viewportWidthClass} ${
            viewport === "mobile" ? "ring-8 ring-slate-800 rounded-[36px]" : ""
          }`}
        >
          {/* Top Frame Bar for Mobile Device */}
          {viewport === "mobile" && (
            <div className="h-6 bg-slate-800 flex items-center justify-center">
              <div className="w-16 h-3 bg-slate-900 rounded-full" />
            </div>
          )}

          {/* ThemeRenderer Canvas Content */}
          <ThemeRenderer
            data={siteData}
            previewMode={false}
            composerMode={true}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
            onMoveSection={onMoveSection}
            onDeleteSection={onDeleteSection}
            onDuplicateSection={onDuplicateSection}
            onDropNewSection={onDropNewSection}
            onReorderSection={onReorderSection}
            onOpenInsertModal={onOpenInsertModal}
          />
        </div>
      </div>
    </div>
  );
}
