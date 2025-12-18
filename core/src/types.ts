export type DotShape = 'round' | 'square' | 'plus' | 'custom';
export type FillPattern = 'solid' | 'stripes' | 'checkerboard';

export interface HalftoneSettings {
  resolution: number;
  dotSize: number;
  dotShape: DotShape;
  imageBlur: number;
  invert: boolean;
  useGradient: boolean;
  gradientDirection: 'vertical' | 'horizontal';
  randomness: number;
  color1: string;
  color2: string;
  customCharacter: string;
  fillPattern: FillPattern;
  angle: number;
}

export interface Dot {
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface AnimationSettings {
  organicPulse: boolean;
  pulseStrength: number; // additional scale applied at peak (0.08 => scale 1.08)
  pulseTempo: number; // tempo multiplier for pulse speed (1 = default)
  hoverParallax: number; // multiplier for hover parallax strength (0 disables)
  clickRippleSpeed: number; // multiplier for click ripple propagation speed
  uiHoverMotion: boolean; // toggle for UI button hover scaling
}
