import { HalftoneSettings, Dot, AnimationSettings } from "./types";
import { lerpColor } from "./utils/color";

/**
 * ============================================================================
 * HALFTONE DOT GENERATION
 * ============================================================================
 * Core algorithm for converting image pixel data into halftone dot patterns.
 * Groups related functionality:
 * - Grid calculation and cell sizing
 * - Pixel sampling and luminance calculation
 * - Dot size computation based on brightness
 * - Position randomization
 * - Color gradient application
 */

export const generateDotsData = (
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
  settings: HalftoneSettings
): Dot[] => {
  const {
    resolution,
    dotSize,
    invert,
    useGradient,
    gradientDirection,
    randomness,
    color1,
    color2,
  } = settings;

  const dots: Dot[] = [];

  // Grid calculation: Create resolution-based grid maintaining aspect ratio
  const cols = resolution;
  const rows = Math.round(cols * (height / width));
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  // Iterate through grid cells to generate dots
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellWidth;
      const y = r * cellHeight;

      // Pixel sampling: Sample center pixel of each cell for color data
      const sampleX = Math.floor(x + cellWidth / 2);
      const sampleY = Math.floor(y + cellHeight / 2);

      const pixelIndex = (sampleY * width + sampleX) * 4;
      const red = pixelData[pixelIndex];
      const green = pixelData[pixelIndex + 1];
      const blue = pixelData[pixelIndex + 2];

      // Luminance calculation: Convert RGB to perceived brightness using ITU-R BT.601
      let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      if (invert) {
        luminance = 1 - luminance;
      }

      // Dot size computation: Scale dot size based on luminance (brighter = larger)
      const baseSize = (Math.min(cellWidth, cellHeight) / 2) * dotSize;
      const size = baseSize * luminance;

      // Position randomization: Add organic variation to dot positions
      const randX = (Math.random() - 0.5) * randomness * cellWidth;
      const randY = (Math.random() - 0.5) * randomness * cellHeight;

      // Color gradient application: Interpolate between colors based on position
      let color = color1;
      if (useGradient) {
        const gradientPos =
          gradientDirection === "vertical" ? y / height : x / width;
        color = lerpColor(color1, color2, gradientPos);
      }

      dots.push({
        x: x + cellWidth / 2 + randX,
        y: y + cellHeight / 2 + randY,
        size,
        color,
      });
    }
  }
  return dots;
};

/**
 * ============================================================================
 * SVG GENERATION WITH ANIMATION
 * ============================================================================
 * Converts dot data into SVG markup with CSS animations.
 * Groups related functionality:
 * - Fill pattern definitions (stripes, checkerboard)
 * - Animation parameter clamping and calculation
 * - CSS keyframe generation for organic pulse
 * - SVG element generation for different dot shapes
 * - Position-based animation timing variation
 */

export const generateSvgString = (
  dots: Dot[],
  width: number,
  height: number,
  settings: HalftoneSettings,
  animationSettings?: AnimationSettings
): string => {
  const { dotShape, fillPattern, color1, color2, angle, customCharacter } =
    settings;
  const {
    organicPulse = true,
    pulseStrength = 0.08,
    pulseTempo = 1,
  } = animationSettings || {};
  if (dots.length === 0) return "";

  let svgElements = "";
  let patternDefs = "";

  // Fill pattern definitions: Create SVG patterns for non-solid fills
  if (fillPattern === "stripes") {
    patternDefs = `
<pattern id="fillPattern" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8" fill="${color2}"/>
    <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="${color1}" stroke-width="2"/>
</pattern>`;
  } else if (fillPattern === "checkerboard") {
    patternDefs = `
<pattern id="fillPattern" patternUnits="userSpaceOnUse" width="10" height="10">
  <rect width="10" height="10" fill="${color2}"/>
  <rect width="5" height="5" x="0" y="0" fill="${color1}"/>
  <rect width="5" height="5" x="5" y="5" fill="${color1}"/>
</pattern>`;
  }

  // Animation parameter clamping: Ensure values stay within safe ranges
  const clampedPulse = Math.max(0, Math.min(pulseStrength, 0.35));
  const clampedTempo = Math.max(0.25, Math.min(pulseTempo, 3));
  const maxScale = 1 + clampedPulse;

  // CSS keyframe generation: Create breathing animation for organic pulse effect
  const defs = `<defs>
<style>
${
  organicPulse
    ? `@keyframes htPulse {
  0%, 100% { transform: scale(1); opacity: ${(
    0.85 -
    clampedPulse * 0.25
  ).toFixed(2)}; }
  50% { transform: scale(${maxScale.toFixed(3)}); opacity: 1; }
}`
    : ""
}
.ht-dot {
  transform-origin: center;
  ${
    organicPulse
      ? `animation-name: htPulse;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;`
      : ""
  }
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 260ms ease-out,
    opacity 260ms ease-out;
}
</style>
${patternDefs}
</defs>`;

  // SVG element generation: Create SVG elements for each dot with shape-specific rendering
  dots.forEach((dot) => {
    if (dot.size > 0.1) {
      // Avoid creating tiny invisible elements
      const fillAttr =
        fillPattern === "solid"
          ? `fill="${dot.color}"`
          : 'fill="url(#fillPattern)"';
      const transformAttr =
        dotShape !== "round" && angle !== 0
          ? ` transform="rotate(${angle} ${dot.x.toFixed(2)} ${dot.y.toFixed(
              2
            )})"`
          : "";
      // Position-based animation timing: Use position-based variation so nearby dots move similarly, creating a calm noise field
      const normX = dot.x / width;
      const normY = dot.y / height;
      const delay = ((normX + normY) * 4) / clampedTempo; // up to ~8s offset across the field, tempo-adjusted
      const duration = (6 + normX * 2) / clampedTempo; // between 6s and 8s, slow breathing-like
      const dataAttrs = `data-x="${dot.x.toFixed(2)}" data-y="${dot.y.toFixed(
        2
      )}"`;
      const groupStyle = organicPulse
        ? ` style="animation-duration:${duration.toFixed(
            2
          )}s;animation-delay:${delay.toFixed(2)}s"`
        : "";
      const groupOpen = `<g class="ht-dot" ${dataAttrs}${groupStyle}>`;
      const groupClose = `</g>\n`;

      // Shape-specific rendering: Generate SVG elements based on dot shape type
      switch (dotShape) {
        case "round":
          svgElements += `${groupOpen}<circle cx="${dot.x.toFixed(
            2
          )}" cy="${dot.y.toFixed(2)}" r="${dot.size.toFixed(
            2
          )}" ${fillAttr} />${groupClose}`;
          break;
        case "square":
          const width = (dot.size * 2).toFixed(2);
          svgElements += `${groupOpen}<rect x="${(dot.x - dot.size).toFixed(
            2
          )}" y="${(dot.y - dot.size).toFixed(
            2
          )}" width="${width}" height="${width}" ${fillAttr}${transformAttr} />${groupClose}`;
          break;
        case "plus":
        case "custom": {
          const char = dotShape === "plus" ? "+" : customCharacter || "*";
          const escapedChar = char
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const fontSize = dot.size * 3;
          svgElements += `${groupOpen}<text x="${dot.x.toFixed(
            2
          )}" y="${dot.y.toFixed(2)}" font-size="${fontSize.toFixed(
            2
          )}" ${fillAttr} font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle"${transformAttr}>${escapedChar}</text>${groupClose}`;
          break;
        }
      }
    }
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
${defs}
${svgElements}</svg>`;
};
