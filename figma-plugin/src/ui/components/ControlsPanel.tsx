import React from 'react';
import { HalftoneSettings, DotShape, FillPattern } from '../../../../core/src/types';
import { Slider } from './Slider';
import { CopyIcon } from './Icon';

interface ControlsPanelProps {
  settings: HalftoneSettings;
  onSettingsChange: <K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; // Not used but kept for prop compatibility
  onCopySvg: () => void; // Used for "Create SVG"
  hasImage: boolean;
  isFigmaPlugin?: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="controls__section">
    <h2 className="controls__section-title">{title}</h2>
    <div className="controls__section-content">{children}</div>
  </div>
);

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  onSettingsChange,
  onCopySvg,
  hasImage,
}) => {
  const renderShapeButton = (shape: DotShape, label: string) => (
    <button
      onClick={() => onSettingsChange('dotShape', shape)}
      className={`chip-button ${settings.dotShape === shape ? 'chip-button--active' : ''}`}
    >
      {label}
    </button>
  );

  const renderFillPatternButton = (pattern: FillPattern, label: string) => (
    <button
      onClick={() => onSettingsChange('fillPattern', pattern)}
      className={`chip-button ${settings.fillPattern === pattern ? 'chip-button--active' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="controls">
       <header className="controls__header">
         <h1 className="controls__title">Halftone Controls</h1>
      </header>
        
      <div className="controls__body">
        <Section title="Layout & Size">
            <Slider
            label="Resolution"
            value={settings.resolution}
            min={10}
            max={150}
            step={1}
            onChange={(e) => onSettingsChange('resolution', parseInt(e.target.value))}
            />
            <Slider
            label="Max Dot Size"
            value={settings.dotSize}
            min={0.1}
            max={2.5}
            step={0.05}
            onChange={(e) => onSettingsChange('dotSize', parseFloat(e.target.value))}
            />
        </Section>
        
        <Section title="Dot Shape">
            <div className="controls__grid controls__grid--four">
                {renderShapeButton('round', 'Round')}
                {renderShapeButton('square', 'Square')}
                {renderShapeButton('plus', '+')}
                {renderShapeButton('custom', 'Custom')}
            </div>
            {settings.dotShape === 'custom' && (
            <div>
                <input
                type="text"
                maxLength={2}
                value={settings.customCharacter}
                onChange={(e) => onSettingsChange('customCharacter', e.target.value.slice(0, 2))}
                className="controls__input"
                placeholder="?"
                />
            </div>
            )}
        </Section>
        
        <Section title="Effects & Style">
            <Slider
            label="Image Blur"
            value={settings.imageBlur}
            min={0}
            max={10}
            step={0.1}
            onChange={(e) => onSettingsChange('imageBlur', parseFloat(e.target.value))}
            />
            <Slider
            label="Randomness"
            value={settings.randomness}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => onSettingsChange('randomness', parseFloat(e.target.value))}
            />
            <Slider
            label="Dot Angle"
            value={settings.angle}
            min={-180}
            max={180}
            step={1}
            onChange={(e) => onSettingsChange('angle', parseInt(e.target.value))}
            />
            <div className="controls__button-row">
                <label htmlFor="invert-toggle" className="controls__label">Invert Colors</label>
                <button
                id="invert-toggle"
                onClick={() => onSettingsChange('invert', !settings.invert)}
                className={`toggle ${settings.invert ? 'toggle--active' : ''}`}
                >
                <span className="toggle__thumb" />
                </button>
            </div>
            <div>
                <label className="controls__label">Fill Pattern</label>
                <div className="controls__grid controls__grid--three" style={{ marginTop: '0.5rem' }}>
                    {renderFillPatternButton('solid', 'Solid')}
                    {renderFillPatternButton('stripes', 'Stripes')}
                    {renderFillPatternButton('checkerboard', 'Checker')}
                </div>
            </div>
        </Section>
        
        <Section title="Color & Gradient">
             <div className="controls__button-row">
                <label htmlFor="gradient-toggle" className="controls__label">Use Gradient</label>
                <button
                id="gradient-toggle"
                onClick={() => onSettingsChange('useGradient', !settings.useGradient)}
                className={`toggle ${settings.useGradient ? 'toggle--active' : ''}`}
                >
                <span className="toggle__thumb" />
                </button>
            </div>
            <div className={`controls__gradient-settings ${settings.useGradient ? '' : 'is-disabled'}`}>
                <div className="controls__grid controls__grid--two">
                    <button
                        onClick={() => onSettingsChange('gradientDirection', 'vertical')}
                        className={`chip-button ${settings.gradientDirection === 'vertical' ? 'chip-button--active' : ''}`}
                        >
                        Vertical
                    </button>
                    <button
                        onClick={() => onSettingsChange('gradientDirection', 'horizontal')}
                        className={`chip-button ${settings.gradientDirection === 'horizontal' ? 'chip-button--active' : ''}`}
                        >
                        Horizontal
                    </button>
                </div>
                <div className="controls__gap-md">
                    <div className="controls__color-row">
                        <input type="color" value={settings.color1} onChange={e => onSettingsChange('color1', e.target.value)} className="controls__color-input" />
                        <span className="controls__color-label">{settings.useGradient ? 'Start' : 'Color 1'}</span>
                    </div>
                    <div className="controls__color-row">
                        <input type="color" value={settings.color2} onChange={e => onSettingsChange('color2', e.target.value)} className="controls__color-input" />
                        <span className="controls__color-label">{settings.useGradient ? 'End' : 'Color 2'}</span>
                    </div>
                </div>
            </div>
        </Section>
      </div>
      
      <footer className="controls__footer">
        <button
          onClick={onCopySvg}
          disabled={!hasImage}
          className="controls__primary-btn"
        >
          <CopyIcon />
          Create SVG
        </button>
      </footer>
    </div>
  );
};
