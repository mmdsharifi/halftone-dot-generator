import React, { useEffect, useCallback, useRef } from "react";
import { HalftoneSettings, AnimationSettings } from "../types";
import { lerpColor } from "../utils/color";
import { generateSvgString } from "../core/src/halftone";
import { generateLottieAnimation } from "../core/src/lottieExport";

interface Dot {
  x: number;
  y: number;
  size: number;
  color: string;
}

/**
 * ============================================================================
 * REACT HOOK: HALFTONE GENERATION
 * ============================================================================
 * Custom hook managing halftone dot generation and canvas rendering.
 * Groups related functionality:
 * - Canvas size management and safety utilities
 * - Dot color computation with gradient support
 * - Dot data generation from image pixel data
 * - Canvas drawing operations with pattern support
 * - Effect hooks for regeneration and recoloring
 * - Export functions (SVG and Lottie)
 */

const getSafeCanvasSize = (canvas: HTMLCanvasElement | null) => ({
  width: canvas?.width ?? 0,
  height: canvas?.height ?? 0,
});

export const useHalftone = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageSrc: string | null,
  settings: HalftoneSettings,
  animationSettings?: AnimationSettings
) => {
  const {
    resolution,
    dotSize,
    dotShape,
    imageBlur,
    invert,
    useGradient,
    gradientDirection,
    randomness,
    color1,
    color2,
    customCharacter,
    fillPattern,
    angle,
  } = settings;

  // State management: Refs for dots data, image element, and canvas dimensions
  const dotsRef = useRef<Dot[]>([]);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const canvasSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Color computation: Calculate dot color based on gradient settings and position
  const computeDotColor = useCallback(
    (x: number, y: number) => {
      const { width, height } = canvasSizeRef.current;
      if (useGradient && width && height) {
        const gradientPos =
          gradientDirection === "vertical" ? y / height : x / width;
        return lerpColor(color1, color2, gradientPos);
      }
      return color1;
    },
    [useGradient, gradientDirection, color1, color2]
  );

  // Dot data generation: Convert image to halftone dot array
  const generateDotsData = useCallback(
    (img: HTMLImageElement): Dot[] => {
      const canvas = canvasRef.current;
      if (!canvas) return [];

      const canvasWidth = canvasSizeRef.current.width || img.width;
      const canvasHeight = canvasSizeRef.current.height || img.height;

      // Offscreen canvas setup: Create temporary canvas for image processing
      const offscreenCanvas = document.createElement("canvas");
      const offscreenCtx = offscreenCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!offscreenCtx) return [];

      offscreenCanvas.width = canvasWidth;
      offscreenCanvas.height = canvasHeight;

      // Image blur application: Apply blur filter if specified
      if (imageBlur > 0) {
        offscreenCtx.filter = `blur(${imageBlur}px)`;
      }
      offscreenCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Pixel data extraction: Get image pixel data for sampling
      const imageData = offscreenCtx.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
      );
      const data = imageData.data;
      const dots: Dot[] = [];

      // Grid calculation: Create resolution-based sampling grid
      const cols = Math.max(1, resolution);
      const rows = Math.max(1, Math.round(cols * (canvasHeight / canvasWidth)));
      const cellWidth = canvasWidth / cols;
      const cellHeight = canvasHeight / rows;

      // Pixel sampling loop: Iterate through grid cells and sample pixels
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellWidth;
          const y = r * cellHeight;

          const sampleX = Math.floor(x + cellWidth / 2);
          const sampleY = Math.floor(y + cellHeight / 2);

          const pixelIndex = (sampleY * canvasWidth + sampleX) * 4;
          const red = data[pixelIndex];
          const green = data[pixelIndex + 1];
          const blue = data[pixelIndex + 2];

          // Luminance calculation: Convert RGB to brightness
          let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          if (invert) {
            luminance = 1 - luminance;
          }

          // Dot size calculation: Scale based on luminance
          const baseSize = (Math.min(cellWidth, cellHeight) / 2) * dotSize;
          const size = baseSize * luminance;

          // Position randomization: Add organic variation
          const randX = (Math.random() - 0.5) * randomness * cellWidth;
          const randY = (Math.random() - 0.5) * randomness * cellHeight;

          const centerX = x + cellWidth / 2 + randX;
          const centerY = y + cellHeight / 2 + randY;

          dots.push({
            x: centerX,
            y: centerY,
            size,
            color: computeDotColor(centerX, centerY),
          });
        }
      }
      return dots;
    },
    [
      canvasRef,
      resolution,
      dotSize,
      imageBlur,
      invert,
      randomness,
      computeDotColor,
    ]
  );

  // Canvas drawing operations: Render dots to canvas with shape and pattern support
  const drawCanvas = useCallback(
    (dots: Dot[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill pattern creation: Generate canvas patterns for stripes and checkerboard
      let patternStyle: CanvasPattern | null = null;
      if (fillPattern === "stripes") {
        const patternCanvas = document.createElement("canvas");
        const pctx = patternCanvas.getContext("2d");
        patternCanvas.width = 8;
        patternCanvas.height = 8;
        if (pctx) {
          pctx.fillStyle = color2;
          pctx.fillRect(0, 0, 8, 8);
          pctx.strokeStyle = color1;
          pctx.lineWidth = 2;
          pctx.beginPath();
          pctx.moveTo(-2, 2);
          pctx.lineTo(2, -2);
          pctx.moveTo(0, 8);
          pctx.lineTo(8, 0);
          pctx.moveTo(6, 10);
          pctx.lineTo(10, 6);
          pctx.stroke();
          patternStyle = ctx.createPattern(patternCanvas, "repeat");
        }
      } else if (fillPattern === "checkerboard") {
        const patternCanvas = document.createElement("canvas");
        const pctx = patternCanvas.getContext("2d");
        patternCanvas.width = 10;
        patternCanvas.height = 10;
        if (pctx) {
          pctx.fillStyle = color2;
          pctx.fillRect(0, 0, 10, 10);
          pctx.fillStyle = color1;
          pctx.fillRect(0, 0, 5, 5);
          pctx.fillRect(5, 5, 5, 5);
          patternStyle = ctx.createPattern(patternCanvas, "repeat");
        }
      }

      // Dot rendering: Draw each dot with shape-specific rendering
      dots.forEach((dot) => {
        ctx.fillStyle =
          fillPattern === "solid" ? dot.color : patternStyle || dot.color;

        ctx.save();
        ctx.translate(dot.x, dot.y);
        // Rotation application: Apply angle rotation for non-round shapes
        if (dotShape !== "round" && angle !== 0) {
          ctx.rotate((angle * Math.PI) / 180);
        }

        // Shape-specific rendering: Draw different shapes based on dotShape
        switch (dotShape) {
          case "round":
            ctx.beginPath();
            ctx.arc(0, 0, dot.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "square":
            ctx.beginPath();
            ctx.rect(-dot.size, -dot.size, dot.size * 2, dot.size * 2);
            ctx.fill();
            break;
          case "plus":
          case "custom": {
            const char = dotShape === "plus" ? "+" : customCharacter || "*";
            const fontSize = dot.size * 3;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(char, 0, 0);
            break;
          }
        }
        ctx.restore();
      });
    },
    [canvasRef, dotShape, customCharacter, fillPattern, color1, color2, angle]
  );

  // Dot regeneration: Regenerate dots when image or core settings change
  const regenerateDots = useCallback(() => {
    if (!imageElementRef.current) return;
    dotsRef.current = generateDotsData(imageElementRef.current);
    drawCanvas(dotsRef.current);
  }, [drawCanvas, generateDotsData]);

  // Dot recoloring: Update colors without regenerating positions (for gradient/color changes)
  const recolorDots = useCallback(() => {
    if (!dotsRef.current.length) return;
    const { width, height } = getSafeCanvasSize(canvasRef.current);
    dotsRef.current = dotsRef.current.map((dot) => ({
      ...dot,
      color: computeDotColor(dot.x, dot.y),
    }));
    // Ensure we have the latest canvas bounds for gradient calculation.
    if (width && height) {
      canvasSizeRef.current = { width, height };
    }
  }, [canvasRef, computeDotColor]);

  // Image loading effect: Load image and initialize canvas when image source changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) {
      const ctx = canvas?.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      dotsRef.current = [];
      imageElementRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      // Canvas sizing: Calculate canvas dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let canvasWidth = canvas.parentElement?.clientWidth || 512;
      let canvasHeight = canvasWidth / aspectRatio;
      const maxHeight = canvas.parentElement?.clientHeight || 512;
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
      imageElementRef.current = img;
      regenerateDots();
    };
  }, [imageSrc, canvasRef, regenerateDots]);

  // Regeneration effect: Regenerate dots when core generation settings change
  useEffect(() => {
    if (!imageElementRef.current) return;
    regenerateDots();
  }, [resolution, dotSize, imageBlur, invert, randomness, regenerateDots]);

  // Recoloring effect: Update colors when gradient/color settings change
  useEffect(() => {
    if (!dotsRef.current.length) return;
    recolorDots();
    drawCanvas(dotsRef.current);
  }, [recolorDots, drawCanvas, useGradient, gradientDirection, color1, color2]);

  // Visual update effect: Redraw canvas when visual properties change
  useEffect(() => {
    if (!dotsRef.current.length) return;
    drawCanvas(dotsRef.current);
  }, [drawCanvas, dotShape, fillPattern, customCharacter, angle]);

  // SVG export generation: Generate SVG string from current dots
  const getSvgString = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dotsRef.current.length === 0) return "";

    const { width, height } =
      canvasSizeRef.current.width && canvasSizeRef.current.height
        ? canvasSizeRef.current
        : getSafeCanvasSize(canvas);

    return generateSvgString(
      dotsRef.current,
      width,
      height,
      settings,
      animationSettings
    );
  }, [animationSettings, canvasRef, settings]);

  // Lottie export generation: Generate Lottie JSON from current dots
  const getLottieJson = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dotsRef.current.length === 0) return null;

    const { width, height } =
      canvasSizeRef.current.width && canvasSizeRef.current.height
        ? canvasSizeRef.current
        : getSafeCanvasSize(canvas);

    return generateLottieAnimation(
      dotsRef.current,
      width,
      height,
      settings,
      animationSettings
    );
  }, [animationSettings, canvasRef, settings]);

  return { getSvgString, getLottieJson };
};
