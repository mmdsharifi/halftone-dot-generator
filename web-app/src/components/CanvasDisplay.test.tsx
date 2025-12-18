import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CanvasDisplay } from '../../../components/CanvasDisplay';

const animationSettings = {
  organicPulse: true,
  pulseStrength: 0.08,
  pulseTempo: 1,
  hoverParallax: 1,
  clickRippleSpeed: 1,
  uiHoverMotion: true,
};

describe('CanvasDisplay', () => {
  it('renders SVG markup into a container when provided', () => {
    const svgMarkup = '<svg><circle cx="10" cy="10" r="5" /></svg>';

    render(
      <CanvasDisplay
        canvasRef={{ current: null }}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        animationSettings={animationSettings}
      />
    );

    const svgContainer = screen.getByTestId('svg-container');
    expect(svgContainer.innerHTML).toContain('<svg>');
  });

  it('applies zoom as a CSS transform scale', () => {
    const svgMarkup = '<svg><rect x="0" y="0" width="10" height="10" /></svg>';

    render(
      <CanvasDisplay
        canvasRef={{ current: null } as React.RefObject<HTMLCanvasElement>}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        zoom={2}
        animationSettings={animationSettings}
      />
    );

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');
    expect(zoomWrapper).toHaveStyle({ transform: 'scale(2)' });
  });

  it('applies a repulsion transform to dots near the cursor on hover', () => {
    const svgMarkup = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="ht-dot" data-x="50" data-y="50">
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
        </g>
      </svg>
    `;

    render(
      <CanvasDisplay
        canvasRef={{ current: null } as React.RefObject<HTMLCanvasElement>}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        animationSettings={animationSettings}
      />
    );

    const svgElement = document.querySelector('svg') as SVGSVGElement;
    // jsdom does not implement layout, so we stub out a bounding box
    (svgElement as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');

    fireEvent.mouseMove(zoomWrapper, {
      clientX: 50,
      clientY: 50,
    });

    const dotGroup = document.querySelector('.ht-dot') as SVGGElement;
    expect(dotGroup).not.toBeNull();
    const transform = dotGroup.getAttribute('transform');
    // When the cursor is over the group center, a small translation should be applied
    expect(transform).toContain('translate');
  });

  it('clears repulsion transform when the cursor leaves', () => {
    const svgMarkup = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="ht-dot" data-x="50" data-y="50">
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
        </g>
      </svg>
    `;

    render(
      <CanvasDisplay
        canvasRef={{ current: null } as React.RefObject<HTMLCanvasElement>}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        animationSettings={animationSettings}
      />
    );

    const svgElement = document.querySelector('svg') as SVGSVGElement;
    (svgElement as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');

    fireEvent.mouseMove(zoomWrapper, {
      clientX: 50,
      clientY: 50,
    });

    const dotGroup = document.querySelector('.ht-dot') as SVGGElement;
    expect(dotGroup.getAttribute('transform')).toContain('translate');

    fireEvent.mouseLeave(zoomWrapper);

    // After leaving, transform should be reset so dots can ease back via CSS transitions
    expect(dotGroup.getAttribute('transform')).toBeNull();
  });

  it('applies a soft radial click pulse with distance-based delays', () => {
    const svgMarkup = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="ht-dot" data-x="20" data-y="50">
          <circle cx="20" cy="50" r="5" fill="#ffffff" />
        </g>
        <g class="ht-dot" data-x="80" data-y="50">
          <circle cx="80" cy="50" r="5" fill="#ffffff" />
        </g>
      </svg>
    `;

    render(
      <CanvasDisplay
        canvasRef={{ current: null } as React.RefObject<HTMLCanvasElement>}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        animationSettings={animationSettings}
      />
    );

    const svgElement = document.querySelector('svg') as SVGSVGElement;
    (svgElement as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');

    // Click closer to the left dot so it should pulse earlier
    fireEvent.click(zoomWrapper, {
      clientX: 25,
      clientY: 50,
    });

    const dots = document.querySelectorAll('.ht-dot') as NodeListOf<SVGGElement>;
    expect(dots.length).toBe(2);

    const leftDelay = parseFloat(dots[0].style.animationDelay || '0');
    const rightDelay = parseFloat(dots[1].style.animationDelay || '0');

    expect(leftDelay).toBeGreaterThanOrEqual(0);
    expect(rightDelay).toBeGreaterThanOrEqual(0);
    // Right (farther) dot should start its pulse later than the left (near) dot
    expect(rightDelay).toBeGreaterThan(leftDelay);
  });

  it('moves brighter (larger) dots slightly more than darker ones on hover for depth parallax', () => {
    const svgMarkup = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="ht-dot" data-x="50" data-y="40">
          <circle cx="50" cy="40" r="8" fill="#ffffff" />
        </g>
        <g class="ht-dot" data-x="50" data-y="60">
          <circle cx="50" cy="60" r="3" fill="#ffffff" />
        </g>
      </svg>
    `;

    render(
      <CanvasDisplay
        canvasRef={{ current: null } as React.RefObject<HTMLCanvasElement>}
        hasImage={true}
        onUpload={vi.fn()}
        onFileDrop={vi.fn()}
        svgMarkup={svgMarkup}
        animationSettings={animationSettings}
      />
    );

    const svgElement = document.querySelector('svg') as SVGSVGElement;
    (svgElement as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');

    // Hover slightly to the right so both dots get a small parallax offset
    fireEvent.mouseMove(zoomWrapper, {
      clientX: 60,
      clientY: 50,
    });

    const dots = document.querySelectorAll('.ht-dot') as NodeListOf<SVGGElement>;
    expect(dots.length).toBe(2);

    const [bright, dark] = dots;
    const brightTransform = bright.getAttribute('transform') || '';
    const darkTransform = dark.getAttribute('transform') || '';

    expect(brightTransform).toContain('translate');
    expect(darkTransform).toContain('translate');

    const extractMagnitude = (transform: string) => {
      const match = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);
      if (!match) return 0;
      const tx = parseFloat(match[1]);
      const ty = parseFloat(match[2]);
      return Math.hypot(tx, ty);
    };

    const brightMag = extractMagnitude(brightTransform);
    const darkMag = extractMagnitude(darkTransform);

    // Brighter (larger radius) dot should move slightly more than the darker one
    expect(brightMag).toBeGreaterThan(darkMag);
  });
});



