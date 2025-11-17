import React from 'react';
import { HalftoneSettings, DotShape, FillPattern } from '../../../core/src/types';
import { Slider } from './Slider';
import { CopyIcon, UploadIcon } from './Icon';

interface ControlsPanelProps {
  settings: HalftoneSettings;
  onSettingsChange: <K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopySvg: () => void;
  hasImage: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-5 border-b border-gray-700/50 last:border-b-0">
      <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  onSettingsChange,
  onImageUpload,
  onCopySvg,
  hasImage,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderShapeButton = (shape: DotShape, label: string) => (
    <button
      onClick={() => onSettingsChange('dotShape', shape)}
      className={`px-3 py-2 text-sm rounded-md transition-colors w-full ${
        settings.dotShape === shape ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const renderFillPatternButton = (pattern: FillPattern, label: string) => (
    <button
      onClick={() => onSettingsChange('fillPattern', pattern)}
      className={`px-3 py-2 text-sm rounded-md transition-colors w-full ${
        settings.fillPattern === pattern ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen bg-gray-800 flex flex-col">
       <header className="p-6 border-b border-gray-700/50">
         <h1 className="text-xl font-bold text-center text-white">Halftone Controls</h1>
      </header>
        
      <div className="flex-grow px-6 overflow-y-auto">
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
            <div className="grid grid-cols-4 gap-2">
                {renderShapeButton('round', 'Round')}
                {renderShapeButton('square', 'Square')}
                {renderShapeButton('plus', '+')}
                {renderShapeButton('custom', 'Custom')}
            </div>
            {settings.dotShape === 'custom' && (
            <div className="pt-2">
                <input
                type="text"
                maxLength={2}
                value={settings.customCharacter}
                onChange={(e) => onSettingsChange('customCharacter', e.target.value.slice(0, 2))}
                className="w-full bg-gray-700/50 p-2 rounded-md text-center font-bold text-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
            <div className="flex items-center justify-between pt-2">
                <label htmlFor="invert-toggle" className="font-medium text-gray-300 text-sm">Invert Colors</label>
                <button
                id="invert-toggle"
                onClick={() => onSettingsChange('invert', !settings.invert)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    settings.invert ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    settings.invert ? 'translate-x-6' : 'translate-x-1'
                }`} />
                </button>
            </div>
            <div className="pt-2">
                <label className="font-medium text-gray-300 text-sm mb-2 block">Fill Pattern</label>
                <div className="grid grid-cols-3 gap-2">
                    {renderFillPatternButton('solid', 'Solid')}
                    {renderFillPatternButton('stripes', 'Stripes')}
                    {renderFillPatternButton('checkerboard', 'Checker')}
                </div>
            </div>
        </Section>
        
        <Section title="Color & Gradient">
             <div className="flex items-center justify-between">
                <label htmlFor="gradient-toggle" className="font-medium text-gray-300 text-sm">Use Gradient</label>
                <button
                id="gradient-toggle"
                onClick={() => onSettingsChange('useGradient', !settings.useGradient)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    settings.useGradient ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
                >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    settings.useGradient ? 'translate-x-6' : 'translate-x-1'
                }`} />
                </button>
            </div>
            <div className={`space-y-4 pt-2 transition-opacity duration-300 ${settings.useGradient ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onSettingsChange('gradientDirection', 'vertical')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors w-full ${
                            settings.gradientDirection === 'vertical' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        >
                        Vertical
                    </button>
                    <button
                        onClick={() => onSettingsChange('gradientDirection', 'horizontal')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors w-full ${
                            settings.gradientDirection === 'horizontal' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        >
                        Horizontal
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <input type="color" value={settings.color1} onChange={e => onSettingsChange('color1', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                        <span className="text-sm text-gray-300">{settings.useGradient ? 'Start' : 'Color 1'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="color" value={settings.color2} onChange={e => onSettingsChange('color2', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                        <span className="text-sm text-gray-300">{settings.useGradient ? 'End' : 'Color 2'}</span>
                    </div>
                </div>
            </div>
        </Section>
      </div>
      
      <footer className="p-6 border-t border-gray-700/50 space-y-3 bg-gray-800">
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-md transition-colors"
        >
          <UploadIcon className="w-5 h-5" />
          {hasImage ? 'Change Image' : 'Upload Image'}
        </button>
        <input type="file" ref={fileInputRef} onChange={onImageUpload} className="hidden" accept="image/*" />
        <button
          onClick={onCopySvg}
          disabled={!hasImage}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-md transition-colors"
        >
          <CopyIcon className="w-5 h-5" />
          Copy as SVG
        </button>
      </footer>
    </div>
  );
};
