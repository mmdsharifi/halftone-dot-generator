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
