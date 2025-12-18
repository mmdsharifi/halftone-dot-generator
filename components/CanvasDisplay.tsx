import React, { useState, useRef, useEffect, useCallback } from "react";
import { UploadIcon } from "./Icon";
import { AnimationSettings } from "../types";

/**
 * ============================================================================
 * CANVAS DISPLAY COMPONENT
 * ============================================================================
 * Interactive canvas component with SVG overlay and user interactions.
 * Groups related functionality:
 * - SVG rendering and DOM management
 * - Drag and drop file handling
 * - Hover parallax effect (dot repulsion)
 * - Click ripple animation
 * - Zoom controls
 * - FPS tracking
 */

interface CanvasDisplayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  svgMarkup?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  animationSettings: AnimationSettings;
}

export const CanvasDisplay: React.FC<CanvasDisplayProps> = ({
  canvasRef,
  hasImage,
  onUpload,
  onFileDrop,
  svgMarkup,
  zoom,
  onZoomChange,
  animationSettings,
}) => {
  // File input reference: Hidden file input for upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Drag and drop state: Track drag state with counter for nested elements
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // SVG DOM references: Cache SVG elements and dimensions for performance
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const clickWaveEnabledRef = useRef<boolean>(false);
  const dotGroupsRef = useRef<SVGGElement[] | null>(null);
  const svgDimsRef = useRef<{
    width: number;
    height: number;
    viewWidth: number;
    viewHeight: number;
    left: number;
    top: number;
  } | null>(null);

  // Hover effect throttling: Throttle hover repulsion to ~60fps
  const lastHoverTsRef = useRef(0);

  // Click throttling: Prevent rapid-fire clicks from causing performance issues
  const lastClickTsRef = useRef(0);
  const clickAnimationFrameRef = useRef<number | null>(null);

  // FPS tracking: Track frame rate for performance monitoring
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const fpsAccumRef = useRef<{
    sum: number;
    count: number;
    lastUpdate: number;
  }>({
    sum: 0,
    count: 0,
    lastUpdate: 0,
  });
  const [fps, setFps] = useState<number>(0);

  const effectiveZoom = zoom ?? 1;
  const showSvg = hasImage && Boolean(svgMarkup);
  const shouldTrackFps = hasImage || showSvg;

  // SVG reference refresh: Update cached SVG elements and dimensions
  const refreshSvgRefs = useCallback(() => {
    if (!svgContainerRef.current) {
      dotGroupsRef.current = null;
      svgDimsRef.current = null;
      return;
    }
    const svg = svgContainerRef.current.querySelector("svg");
    if (!svg) {
      dotGroupsRef.current = null;
      svgDimsRef.current = null;
      return;
    }
    // Cache dot groups: Store all dot group elements for hover/click effects
    const groups = svg.querySelectorAll<SVGGElement>(".ht-dot");
    dotGroupsRef.current = Array.from(groups);

    // Dimension calculation: Get SVG dimensions from bounding rect and viewBox
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.getAttribute("viewBox");
    let viewWidth = rect.width;
    let viewHeight = rect.height;
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
        viewWidth = parts[2];
        viewHeight = parts[3];
      }
    }
    svgDimsRef.current = {
      width: rect.width,
      height: rect.height,
      viewWidth,
      viewHeight,
      left: rect.left,
      top: rect.top,
    };
  }, []);

  // SVG markup injection: Only re-parse and inject SVG when markup string changes
  // This avoids forcing the browser to rebuild a potentially huge SVG DOM
  // tree on every React render (for example, when zoom changes).
  useEffect(() => {
    if (!svgContainerRef.current) return;

    if (svgMarkup && hasImage) {
      svgContainerRef.current.innerHTML = svgMarkup;
      refreshSvgRefs();
    } else {
      svgContainerRef.current.innerHTML = "";
      dotGroupsRef.current = null;
      svgDimsRef.current = null;
    }
  }, [svgMarkup, hasImage, refreshSvgRefs]);

  // Hover parallax effect: Apply repulsion effect to dots based on mouse position
  const applyHoverRepulsion = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!svgContainerRef.current) return;
      if (!dotGroupsRef.current || !svgDimsRef.current) {
        refreshSvgRefs();
      }

      if (
        !svgDimsRef.current ||
        !dotGroupsRef.current ||
        svgDimsRef.current.width === 0 ||
        svgDimsRef.current.height === 0
      ) {
        refreshSvgRefs();
      }

      const dims = svgDimsRef.current;
      const groups = dotGroupsRef.current;
      if (!dims || !groups || dims.width === 0 || dims.height === 0) return;

      // Coordinate conversion: Convert mouse position to SVG coordinate space
      const localX =
        ((event.clientX - dims.left) / dims.width) * dims.viewWidth;
      const localY =
        ((event.clientY - dims.top) / dims.height) * dims.viewHeight;

      // Parallax strength calculation: Clamp and calculate effect radius
      const parallaxStrength = Math.max(
        0,
        Math.min(animationSettings.hoverParallax, 3)
      );

      const baseRadius = Math.min(dims.viewWidth, dims.viewHeight) * 0.25;
      const radius = baseRadius * parallaxStrength;
      const now = performance.now();
      // Performance throttling: Throttle to ~60fps (16.67ms per frame) for smooth performance
      if (now - lastHoverTsRef.current < 16.67) {
        return;
      }
      lastHoverTsRef.current = now;

      // Early exit: Disable effect if radius is too small
      if (radius <= 0.0001) {
        if (groups) {
          for (const group of groups) {
            group.removeAttribute("transform");
          }
        }
        return;
      }

      // Dot repulsion calculation: Calculate offset for each dot based on distance
      const maxOffset = radius * 0.25;
      for (const group of groups || []) {
        const baseX = parseFloat(group.getAttribute("data-x") || "");
        const baseY = parseFloat(group.getAttribute("data-y") || "");

        if (Number.isNaN(baseX) || Number.isNaN(baseY)) {
          continue;
        }

        // Distance calculation: Calculate distance from mouse to dot
        let dx = baseX - localX;
        let dy = baseY - localY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (!dist) {
          // Edge case: When cursor is exactly over the dot, push it in a gentle, fixed direction
          dx = radius * 0.25;
          dy = 0;
          dist = radius * 0.25;
        }

        if (dist >= radius) {
          group.removeAttribute("transform");
          continue;
        }

        // Falloff calculation: Calculate strength based on distance (closer = stronger)
        const falloff = 1 - dist / radius;

        // Depth factor: Based on dot luminance (approximated by circle radius)
        // Brighter (larger) dots move slightly more, darker dots stay closer to the plane
        let depth = 1;
        const circle = group.querySelector("circle");
        if (circle) {
          const r = parseFloat(circle.getAttribute("r") || "0");
          if (r > 0) {
            const normalized = r / (r + 4); // maps to (0,1)
            depth = 0.5 + normalized * 0.5; // keep within [0.5, 1.0] for subtlety
          }
        }

        // Transform application: Apply calculated offset to dot
        const strength = maxOffset * falloff * depth;
        const offsetX = (dx / dist) * strength;
        const offsetY = (dy / dist) * strength;

        group.setAttribute(
          "transform",
          `translate(${offsetX.toFixed(3)} ${offsetY.toFixed(3)})`
        );

        // Enable GPU acceleration for smoother hover animations
        const groupEl = group as unknown as HTMLElement;
        if (groupEl.style && !groupEl.style.willChange) {
          groupEl.style.willChange = "transform";
        }
      }
    },
    [animationSettings.hoverParallax, refreshSvgRefs]
  );

  // Hover cleanup: Remove repulsion transforms when mouse leaves
  const clearHoverRepulsion = useCallback(() => {
    const dotGroups = dotGroupsRef.current;
    if (!dotGroups) return;
    for (const group of dotGroups) {
      group.removeAttribute("transform");
      // Reset will-change when clearing hover
      const groupEl = group as unknown as HTMLElement;
      if (groupEl.style) {
        groupEl.style.willChange = "";
      }
    }
  }, []);

  // Placeholder click handler: Trigger file input when placeholder is clicked
  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  // Canvas click handler: Trigger file input when clicking on canvas element or empty container area
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT"
    ) {
      return;
    }
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // SVG overlay click handler: Handle clicks on SVG area - pulse effect for SVG content, file upload for empty space
  const handleSvgOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Check if clicking on SVG content (dot groups or SVG elements)
    if (
      target.closest(".ht-dot") ||
      target.closest("g") ||
      target.tagName === "g" ||
      target.tagName === "svg"
    ) {
      // Trigger pulse effect for SVG content
      handleClickPulse(e);
    } else {
      // Trigger file upload for empty space
      handleCanvasClick(e);
    }
  };

  // Drag and drop handlers: Handle file drag and drop with counter for nested elements
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const dragClasses = isDragging
    ? "bg-gray-800/80 border-indigo-500"
    : "border-gray-700 hover:border-indigo-500";

  // Zoom handler: Handle wheel zoom with Ctrl/Meta modifier (pinch-zoom gesture)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!onZoomChange) return;

    // Use pinch-zoom gesture (trackpad / pen) or Ctrl/Meta + wheel as zoom signal
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();
    e.stopPropagation();

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    onZoomChange(effectiveZoom * zoomFactor);
  };

  // Click ripple effect: Create wave animation that propagates from click point
  const handleClickPulse = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!svgContainerRef.current) return;

      // Throttle clicks: Prevent rapid-fire clicks (minimum 100ms between clicks)
      const now = performance.now();
      if (now - lastClickTsRef.current < 100) {
        return;
      }
      lastClickTsRef.current = now;

      // Cancel any pending animation frame to avoid queuing multiple updates
      if (clickAnimationFrameRef.current !== null) {
        cancelAnimationFrame(clickAnimationFrameRef.current);
      }

      const svg = svgContainerRef.current.querySelector("svg");
      if (!svg) return;

      const rect = (svg as SVGSVGElement).getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Use cached dot groups instead of querying DOM
      if (!dotGroupsRef.current || !svgDimsRef.current) {
        refreshSvgRefs();
      }
      const dotGroups = dotGroupsRef.current;
      if (!dotGroups || dotGroups.length === 0) return;

      // Coordinate conversion: Convert click position to SVG coordinate space
      const viewBox = svg.getAttribute("viewBox");
      // Start from layout box; override from viewBox if available.
      let viewWidth = rect.width;
      let viewHeight = rect.height;

      if (viewBox) {
        const parts = viewBox.split(/\s+/).map(Number);
        if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
          viewWidth = parts[2];
          viewHeight = parts[3];
        }
      }

      const localX = ((event.clientX - rect.left) / rect.width) * viewWidth;
      const localY = ((event.clientY - rect.top) / rect.height) * viewHeight;

      // Ripple calculation: Calculate timing based on distance from click point
      const maxDistance = Math.hypot(viewWidth, viewHeight);
      const rippleSpeed = Math.max(
        0,
        Math.min(animationSettings.clickRippleSpeed, 3)
      );
      if (rippleSpeed <= 0) return;

      const secondsPerPixel = 0.0015 / rippleSpeed;
      const pulseDuration = Math.max(0.4, 0.7 / Math.max(rippleSpeed, 0.5));

      // Keyframe injection: Ensure click-pulse keyframe exists in SVG (only once)
      if (!clickWaveEnabledRef.current) {
        const styleEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "style"
        );
        styleEl.textContent = `
@keyframes htClickPulse {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
}`;
        svg.appendChild(styleEl);
        clickWaveEnabledRef.current = true;
      }

      // Pre-calculate animation string parts for better performance
      const pulseDurationStr = pulseDuration.toFixed(2);

      // Batch DOM updates using requestAnimationFrame to prevent layout thrashing
      clickAnimationFrameRef.current = requestAnimationFrame(() => {
        // Use document fragment or batch updates for better performance
        // Calculate all delays first, then apply in a single batch
        const updates: Array<{
          group: SVGGElement;
          delaySeconds: number;
          existingAnimation: string;
        }> = [];

        // First pass: Calculate all delays without touching DOM
        for (const group of dotGroups) {
          const baseX = parseFloat(group.getAttribute("data-x") || "");
          const baseY = parseFloat(group.getAttribute("data-y") || "");

          if (Number.isNaN(baseX) || Number.isNaN(baseY)) {
            continue;
          }

          // Distance calculation: Calculate distance from click point to dot
          const dx = baseX - localX;
          const dy = baseY - localY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (!Number.isFinite(dist)) continue;

          const clamped = Math.max(0, Math.min(dist, maxDistance));
          const delaySeconds = clamped * secondsPerPixel;

          // Get existing animation
          const groupEl = group as unknown as HTMLElement;
          const existingAnimation = groupEl.style?.animation || "";

          updates.push({ group, delaySeconds, existingAnimation });
        }

        // Second pass: Apply all updates in a single batch
        // This reduces layout thrashing by batching style changes
        for (const { group, delaySeconds, existingAnimation } of updates) {
          const delayStr = delaySeconds.toFixed(3);
          const clickPulseAnim = `htClickPulse ${pulseDurationStr}s ease-out ${delayStr}s 1`;
          const combined = existingAnimation
            ? `${existingAnimation}, ${clickPulseAnim}`
            : clickPulseAnim;

          const groupEl = group as unknown as HTMLElement;
          if (groupEl.style) {
            groupEl.style.animation = combined;
            groupEl.style.animationDelay = `${delayStr}s`;

            // Enable GPU acceleration for smoother animations
            if (!groupEl.style.willChange) {
              groupEl.style.willChange = "transform, opacity";
            }
          }
        }

        clickAnimationFrameRef.current = null;
      });
    },
    [animationSettings.clickRippleSpeed, refreshSvgRefs]
  );

  // Cleanup: Cancel pending animation frames on unmount
  useEffect(() => {
    return () => {
      if (clickAnimationFrameRef.current !== null) {
        cancelAnimationFrame(clickAnimationFrameRef.current);
        clickAnimationFrameRef.current = null;
      }
    };
  }, []);

  // FPS tracking effect: Monitor frame rate using requestAnimationFrame
  useEffect(() => {
    if (!shouldTrackFps) {
      setFps(0);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
      fpsAccumRef.current = { sum: 0, count: 0, lastUpdate: 0 };
      return;
    }

    // FPS calculation: Accumulate frame deltas and update display every 250ms
    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const delta = now - lastFrameRef.current;
        if (delta > 0) {
          const instFps = 1000 / delta;
          const acc = fpsAccumRef.current;
          acc.sum += instFps;
          acc.count += 1;
          if (acc.lastUpdate === 0) {
            acc.lastUpdate = now;
          }
          if (now - acc.lastUpdate >= 250) {
            const avg = acc.sum / acc.count;
            setFps(Math.round(avg));
            fpsAccumRef.current = { sum: 0, count: 0, lastUpdate: now };
          }
        }
      }
      lastFrameRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [shouldTrackFps]);

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg relative aspect-square"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
      onClick={
        hasImage
          ? (e) => {
              // Only trigger if clicking directly on the container (not on child elements with their own handlers)
              if (e.target === e.currentTarget) {
                handleCanvasClick(e);
              }
            }
          : (e) => {
              // When no image, make entire container clickable for file upload
              if (
                e.target === e.currentTarget ||
                (e.target as HTMLElement).tagName === "CANVAS"
              ) {
                handlePlaceholderClick();
              }
            }
      }
    >
      {/* File input: Always present, hidden */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onUpload}
        className="hidden"
        accept="image/*"
      />
      {!hasImage && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragClasses}`}
          onClick={handlePlaceholderClick}
        >
          <UploadIcon className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold">Click to Upload Image</p>
          <p className="text-sm">or drag, drop, or paste</p>
        </div>
      )}
      {/* Hidden/underlying canvas used for raster generation & sampling */}
      <canvas
        ref={canvasRef}
        onClick={hasImage ? handleCanvasClick : undefined}
        className={`max-w-full max-h-full object-contain rounded-md transition-opacity duration-500 ${
          showSvg ? "opacity-0" : hasImage ? "opacity-100" : "opacity-0"
        } ${hasImage && !showSvg ? "cursor-pointer" : ""} ${
          !hasImage || showSvg ? "pointer-events-none" : ""
        }`}
      />

      {/* SVG overlay for crisp, scalable rendering when available */}
      {showSvg && (
        <div
          className="absolute inset-4 flex items-center justify-center overflow-hidden cursor-pointer"
          onMouseMove={applyHoverRepulsion}
          onMouseLeave={clearHoverRepulsion}
          onClick={handleSvgOverlayClick}
        >
          <div
            className="origin-center"
            style={{ transform: `scale(${effectiveZoom})` }}
            data-testid="svg-zoom-wrapper"
          >
            <div ref={svgContainerRef} data-testid="svg-container" />
          </div>
        </div>
      )}

      {/* Zoom controls (only when an image is loaded and handler provided) */}
      {hasImage && onZoomChange && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-800/80 rounded-md px-2 py-1 text-xs text-gray-200 shadow-lg">
          <button
            type="button"
            onClick={() => onZoomChange(effectiveZoom - 0.25)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="px-1 text-[11px] font-medium"
          >
            {Math.round(effectiveZoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(effectiveZoom + 0.25)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
          >
            +
          </button>
        </div>
      )}
      {hasImage && (
        <div className="absolute bottom-4 left-4 bg-gray-800/80 text-gray-200 px-2 py-1 rounded text-[11px] font-mono tracking-tight shadow-lg">
          {fps > 0 ? `${fps} fps` : "-- fps"}
        </div>
      )}
    </div>
  );
};
