/**
 * ============================================================================
 * COLOR UTILITY FUNCTIONS
 * ============================================================================
 * Color conversion and interpolation utilities for gradient generation.
 * Groups related functionality:
 * - Hex to RGB conversion
 * - RGB to Hex conversion
 * - Color interpolation (lerp) for gradients
 */

// Hex to RGB conversion: Parse hex color string to RGB object
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// RGB to Hex conversion: Convert RGB values to hex color string
const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .padStart(6, "0")
  );
};

// Color interpolation: Linear interpolation between two hex colors
export const lerpColor = (
  color1: string,
  color2: string,
  amount: number
): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) {
    return color1; // Fallback to the first color
  }

  // Amount clamping: Ensure interpolation amount is between 0 and 1
  const a = Math.max(0, Math.min(1, amount));

  // RGB interpolation: Interpolate each color channel separately
  const r = Math.round(c1.r + (c2.r - c1.r) * a);
  const g = Math.round(c1.g + (c2.g - c1.g) * a);
  const b = Math.round(c1.b + (c2.b - c1.b) * a);

  return rgbToHex(r, g, b);
};
