import { describe, it, expect } from 'vitest';
import { generateSvgString } from '../../../core/src/halftone';
import type { AnimationSettings, Dot, HalftoneSettings } from '../../../core/src/types';

const baseSettings: HalftoneSettings = {
  resolution: 10,
  dotSize: 1,
  dotShape: 'round',
  imageBlur: 0,
  invert: false,
  useGradient: false,
  gradientDirection: 'vertical',
  randomness: 0,
  color1: '#ffffff',
  color2: '#000000',
  customCharacter: '*',
  fillPattern: 'solid',
  angle: 0,
};

const baseAnimation: AnimationSettings = {
  organicPulse: true,
  pulseStrength: 0.08,
  pulseTempo: 1,
  hoverParallax: 1,
  clickRippleSpeed: 1,
  uiHoverMotion: true,
};

describe('generateSvgString organic animation', () => {
  it('wraps dots in animated groups with ht-dot class and defines pulse keyframes', () => {
    const dots: Dot[] = [
      { x: 10, y: 10, size: 5, color: '#ffffff' },
      { x: 30, y: 40, size: 8, color: '#ffffff' },
    ];

    const svg = generateSvgString(dots, 100, 100, baseSettings, baseAnimation);

    expect(svg).toContain('.ht-dot');
    expect(svg).toContain('@keyframes htPulse');
    expect(svg).toContain('<g class="ht-dot"');
  });

  it('omits the pulse animation when organicPulse is disabled', () => {
    const dots: Dot[] = [
      { x: 10, y: 10, size: 5, color: '#ffffff' },
    ];

    const svg = generateSvgString(dots, 100, 100, baseSettings, {
      ...baseAnimation,
      organicPulse: false,
    });

    expect(svg).toContain('.ht-dot');
    expect(svg).not.toContain('@keyframes htPulse');
    expect(svg).not.toContain('animation-name: htPulse');
  });
});


