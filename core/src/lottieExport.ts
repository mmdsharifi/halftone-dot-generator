import { Dot, HalftoneSettings, AnimationSettings } from "./types";

/**
 * ============================================================================
 * LOTTIE ANIMATION EXPORT
 * ============================================================================
 * Converts halftone dots into Lottie JSON format for use in Framer and other tools.
 * Groups related functionality:
 * - Color conversion utilities (hex to RGB)
 * - Lottie keyframe and property creation helpers
 * - Animation parameter calculation and clamping
 * - Dot filtering and sampling for file size optimization
 * - Layer generation with position-based timing variation
 * - Shape rendering (circle, square, text approximation)
 */

// Color conversion: Convert hex color string to normalized RGB array [0-1]
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
}

// Keyframe creation: Create Lottie keyframe with bezier interpolation handles
function createKeyframe(
  frame: number,
  value: number | [number, number] | [number, number, number],
  endValue?: number | [number, number] | [number, number, number]
): any {
  const kf: any = {
    i: { x: 0.833, y: 0.833 }, // Incoming bezier handle
    o: { x: 0.167, y: 0.167 }, // Outgoing bezier handle
    t: frame,
    s: Array.isArray(value) ? value : [value],
  };
  // Add end value if provided (for explicit interpolation)
  if (endValue !== undefined) {
    kf.e = Array.isArray(endValue) ? endValue : [endValue];
  }
  return kf;
}

// Animated property creation: Create property with keyframe animation
function createAnimatedProperty(
  keyframes: any[],
  defaultValue: number | [number, number]
): any {
  if (keyframes.length === 0) {
    return defaultValue;
  }
  return {
    a: 1, // Animated flag
    k: keyframes,
  };
}

// Static property creation: Create non-animated property with fixed value
function createStaticProperty(value: number | [number, number]): any {
  return {
    a: 0, // Not animated
    k: value,
  };
}

export function generateLottieAnimation(
  dots: Dot[],
  width: number,
  height: number,
  settings: HalftoneSettings,
  animationSettings?: AnimationSettings
): any {
  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lottieExport.ts:50",
      message: "generateLottieAnimation entry",
      data: {
        dotsCount: dots.length,
        width,
        height,
        resolution: settings.resolution,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  // Animation parameter extraction: Get settings with defaults
  const {
    organicPulse = true,
    pulseStrength = 0.08,
    pulseTempo = 1,
  } = animationSettings || {};

  // Parameter clamping: Ensure animation values stay within safe ranges
  const clampedPulse = Math.max(0, Math.min(pulseStrength, 0.35));
  const clampedTempo = Math.max(0.25, Math.min(pulseTempo, 3));
  const maxScale = 1 + clampedPulse;
  const minOpacity = 0.85 - clampedPulse * 0.25;

  // Animation timing calculation: Calculate duration and frame count (60fps)
  // Shorter animation duration for smaller file size (8 seconds max)
  // Reduced from 16 seconds to keep file lightweight
  const maxDurationSeconds = 8 / clampedTempo;
  const outPoint = Math.ceil(maxDurationSeconds * 60); // 60fps

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lottieExport.ts:73",
      message: "animation timing calculated",
      data: { outPoint, maxDurationSeconds, clampedTempo },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "B",
    }),
  }).catch(() => {});
  // #endregion

  // Dot filtering and sampling: Filter tiny dots and sample for file size optimization
  // For Lottie, we'll sample dots to keep file size manageable
  const filteredDots = dots.filter((dot) => dot.size > 0.1);

  // Dot sampling: Limit to max 200 dots for lightweight file size
  // Sample evenly across the array to maintain visual distribution
  const maxDots = 200;
  const sampledDots =
    filteredDots.length > maxDots
      ? filteredDots.filter(
          (_, i) => i % Math.ceil(filteredDots.length / maxDots) === 0
        )
      : filteredDots;

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lottieExport.ts:127",
      message: "dots filtered and sampled",
      data: {
        totalDots: dots.length,
        filteredCount: filteredDots.length,
        sampledCount: sampledDots.length,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "post-fix",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  // Animation cycle calculation: Use consistent cycle duration (8 seconds at 60fps)
  const cycleDurationFrames = Math.round((8 / clampedTempo) * 60);

  // Layer generation: Create Lottie layer for each sampled dot
  const layers = sampledDots.map((dot, index) => {
    // Position-based timing variation: Calculate delay and duration based on dot position
    // Creates organic wave effect where nearby dots animate similarly
    const normX = dot.x / width;
    const normY = dot.y / height;
    const delaySeconds = ((normX + normY) * 4) / clampedTempo;
    const durationSeconds = (6 + normX * 2) / clampedTempo;

    const delayFrames = Math.round(delaySeconds * 60);
    const durationFrames = Math.round(durationSeconds * 60);

    // Layer timing: All layers start at frame 0 and use the same outPoint
    // The delay is handled within the animation keyframes
    const inPoint = 0;
    const layerOutPoint = outPoint;

    // Keyframe generation: Create scale and opacity keyframes for pulse animation
    const scaleKeyframes: any[] = [];
    const opacityKeyframes: any[] = [];

    if (organicPulse) {
      // Timing clamping: Clamp delay and duration to be within outPoint for proper looping
      const clampedDelay = Math.min(delayFrames, outPoint - 10);
      const clampedDuration = Math.min(durationFrames, outPoint - clampedDelay);
      const startFrame = clampedDelay;
      const midFrame = Math.min(
        clampedDelay + Math.round(clampedDuration * 0.5),
        outPoint - 1
      );
      const endFrame = Math.min(clampedDelay + clampedDuration, outPoint);

      // Scale keyframes: Simplified keyframes for smaller file size (3 keyframes instead of 5)
      // Start -> Peak -> End for smooth looping
      // Use full opacity (100%) for better visibility on black background
      scaleKeyframes.push(createKeyframe(0, [100, 100], [100, 100]));
      scaleKeyframes.push(
        createKeyframe(
          midFrame,
          [maxScale * 100, maxScale * 100],
          [maxScale * 100, maxScale * 100]
        )
      );
      scaleKeyframes.push(createKeyframe(outPoint, [100, 100], [100, 100]));

      // Opacity keyframes: Full opacity for visibility - white dots on black background
      opacityKeyframes.push(createKeyframe(0, 100, 100));
      opacityKeyframes.push(createKeyframe(midFrame, 100, 100));
      opacityKeyframes.push(createKeyframe(outPoint, 100, 100));
    } else {
      // Static values: No animation when organic pulse is disabled
      scaleKeyframes.push(createKeyframe(0, [100, 100], [100, 100]));
      opacityKeyframes.push(createKeyframe(0, 100, 100));
    }

    // Color assignment: Force all dots to be black for visibility against light/transparent background
    const rgb: [number, number, number] = [0, 0, 0]; // Black color in RGB (0-1 range)

    // Size calculation: Scale up dots significantly for Lottie visibility
    // Base size in pixels (radius for circle, half-width for square)
    const baseSize = dot.size;
    const scaleFactor = 10; // Scale up by 10x to make dots clearly visible
    const rawDiameter = baseSize * 2 * scaleFactor;
    const minDiameter = 5; // Minimum 5 pixel diameter to ensure visibility
    const diameter = Math.max(rawDiameter, minDiameter);

    // Shape rendering: Create Lottie shape based on dot shape type
    let shape: any;
    switch (settings.dotShape) {
      case "round": {
        // Circle/ellipse: position is center relative to layer, size is width/height
        shape = {
          ty: "el",
          p: createStaticProperty([0, 0]), // Center at layer position
          s: createStaticProperty([diameter, diameter]), // Width and height
        };
        break;
      }
      case "square": {
        // Rectangle: size represents half-width, so full width is size * 2
        shape = {
          ty: "rc",
          p: createStaticProperty([0, 0]),
          s: createStaticProperty([diameter, diameter]),
          r: 0,
        };
        break;
      }
      case "plus":
      case "custom": {
        // Text approximation: For text shapes, approximate as a circle for simplicity
        shape = {
          ty: "el",
          p: createStaticProperty([0, 0]),
          s: createStaticProperty([diameter, diameter]),
        };
        break;
      }
      default:
        shape = {
          ty: "el",
          p: createStaticProperty([0, 0]),
          s: createStaticProperty([diameter, diameter]),
        };
    }

    // Fill definition: Handle fill pattern (for Lottie, we use solid fill; patterns would need more complex setup)
    // Fill opacity is static; layer opacity handles the animation
    const fill = {
      ty: "fl",
      o: createStaticProperty(100),
      c: createStaticProperty(rgb),
      r: 1,
      bm: 0,
    };

    const layer: any = {
      ddd: 0,
      ind: index + 1,
      ty: 4, // Shape layer
      nm: `Dot ${index + 1}`,
      sr: 1,
      ks: {
        o: createAnimatedProperty(opacityKeyframes, 100),
        r: createStaticProperty(settings.angle || 0),
        p: createStaticProperty([dot.x, dot.y, 0]), // Layer position
        a: createStaticProperty([0, 0, 0]), // Anchor at origin - layer position p places the anchor
        s: createAnimatedProperty(scaleKeyframes, [100, 100, 100]),
      },
      ao: 0,
      shapes: [
        {
          ty: "gr", // Group
          it: [shape, fill], // Shape first, then fill
          nm: "Dot Group",
          np: 2, // Number of items
          cix: 2,
          bm: 0,
        },
      ],
      ip: inPoint,
      op: layerOutPoint,
      st: inPoint,
      bm: 0,
    };

    // #region agent log
    if (
      index === 0 ||
      index === Math.floor(sampledDots.length / 2) ||
      index === sampledDots.length - 1
    ) {
      fetch(
        "http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "lottieExport.ts:292",
            message: "sample layer created",
            data: {
              index,
              inPoint,
              layerOutPoint,
              dotX: dot.x,
              dotY: dot.y,
              dotSize: dot.size,
              diameter,
              scaleKeyframesCount: scaleKeyframes.length,
              opacityKeyframesCount: opacityKeyframes.length,
              delayFrames,
              firstScaleKf: scaleKeyframes[0],
              firstOpacityKf: opacityKeyframes[0],
              layerOpacity: layer.ks.o,
              layerScale: layer.ks.s,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "post-fix",
            hypothesisId: "C",
          }),
        }
      ).catch(() => {});
    }
    // #endregion

    return layer;
  });

  // Lottie structure assembly: Create main Lottie animation object
  // No background layer - let it be transparent/default
  const lottieAnimation: any = {
    v: "5.7.4",
    fr: 60, // 60fps
    ip: 0,
    op: outPoint,
    w: width,
    h: height,
    nm: "Halftone Animation",
    ddd: 0,
    assets: [],
    layers: layers.reverse(), // Just dots - background is transparent/default
    markers: [],
  };

  // File size calculation: Calculate final JSON size for logging
  const jsonString = JSON.stringify(lottieAnimation);
  const fileSizeBytes = new Blob([jsonString]).size;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  // #region agent log
  fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lottieExport.ts:372",
      message: "lottie animation generated",
      data: {
        layersCount: layers.length,
        outPoint,
        fileSizeMB: fileSizeMB.toFixed(2),
        fileSizeBytes,
        sampledDotsCount: sampledDots.length,
        width,
        height,
        firstLayerSample:
          layers.length > 0
            ? {
                ip: layers[0].ip,
                op: layers[0].op,
                st: layers[0].st,
                ks_o: layers[0].ks.o,
                ks_s: layers[0].ks.s,
                shapes_count: layers[0].shapes?.length,
              }
            : null,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "post-fix",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  return lottieAnimation;
}
