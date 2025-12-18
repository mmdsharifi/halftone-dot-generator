import React from 'react';
import { render, screen } from '@testing-library/react';
import { CanvasDisplay } from '../../../components/CanvasDisplay';

describe('CanvasDisplay', () => {
  it('renders SVG markup into a container when provided', () => {
    const svgMarkup = '<svg><circle cx="10" cy="10" r="5" /></svg>';

    render(
      <CanvasDisplay
        canvasRef={{ current: null }}
        hasImage={true}
        onUpload={jest.fn()}
        onFileDrop={jest.fn()}
        svgMarkup={svgMarkup}
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
        onUpload={jest.fn()}
        onFileDrop={jest.fn()}
        svgMarkup={svgMarkup}
        zoom={2}
      />
    );

    const zoomWrapper = screen.getByTestId('svg-zoom-wrapper');
    expect(zoomWrapper).toHaveStyle({ transform: 'scale(2)' });
  });
});





