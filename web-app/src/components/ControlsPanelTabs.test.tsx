import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ControlsPanel } from '../../../components/ControlsPanel';
import { HalftoneSettings } from '../../../core/src/types';

const baseSettings: HalftoneSettings = {
  resolution: 40,
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
const animationSettings = {
  organicPulse: true,
  pulseStrength: 0.08,
  pulseTempo: 1,
  hoverParallax: 1,
  clickRippleSpeed: 1,
  uiHoverMotion: true,
};

describe('ControlsPanel tabs in web app', () => {
  it('renders Basic tab by default and can switch to Animation tab', () => {
    render(
      <ControlsPanel
        settings={baseSettings}
        animationSettings={animationSettings}
        onSettingsChange={vi.fn()}
        onAnimationChange={vi.fn()}
        onImageUpload={vi.fn()}
        onCopySvg={vi.fn()}
        hasImage={false}
      />
    );

    // Basic tab is active by default (existing sections visible)
    expect(screen.getByText('Layout & Size')).toBeInTheDocument();

    // Switch to Animation tab
    const animationTab = screen.getByRole('tab', { name: /animation/i });
    fireEvent.click(animationTab);

    // Animation content should be visible
    expect(
      screen.getByText(/organic breathing/i)
    ).toBeInTheDocument();
  });
});

