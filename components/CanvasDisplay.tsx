
import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon } from './Icon';

interface CanvasDisplayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  svgMarkup?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const CanvasDisplay: React.FC<CanvasDisplayProps> = ({
  canvasRef,
  hasImage,
  onUpload,
  onFileDrop,
  svgMarkup,
  zoom,
  onZoomChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  const effectiveZoom = zoom ?? 1;

  // Only re-parse and inject the SVG markup when the string itself changes.
  // This avoids forcing the browser to rebuild a potentially huge SVG DOM
  // tree on every React render (for example, when zoom changes).
  useEffect(() => {
    if (!svgContainerRef.current) return;

    if (svgMarkup && hasImage) {
      svgContainerRef.current.innerHTML = svgMarkup;
    } else {
      svgContainerRef.current.innerHTML = '';
    }
  }, [svgMarkup, hasImage]);

  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const dragClasses = isDragging ? 'bg-gray-800/80 border-indigo-500' : 'border-gray-700 hover:border-indigo-500';

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!onZoomChange) return;

    // Use pinch-zoom gesture (trackpad / pen) or Ctrl/Meta + wheel as zoom signal
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();
    e.stopPropagation();

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    onZoomChange(effectiveZoom * zoomFactor);
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg relative aspect-square"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
    >
      {!hasImage && (
         <div 
          className={`absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragClasses}`}
          onClick={handlePlaceholderClick}
        >
            <UploadIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold">Click to Upload Image</p>
            <p className="text-sm">or drag, drop, or paste</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onUpload} 
              className="hidden" 
              accept="image/*"
            />
        </div>
      )}
      {/* Hidden/underlying canvas used for raster generation & sampling */}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain rounded-md transition-opacity duration-500 ${
          hasImage ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* SVG overlay for crisp, scalable rendering when available */}
      {hasImage && svgMarkup && (
        <div className="absolute inset-4 flex items-center justify-center overflow-hidden">
          <div
            className="origin-center"
            style={{ transform: `scale(${effectiveZoom})` }}
            data-testid="svg-zoom-wrapper"
          >
            <div
              ref={svgContainerRef}
              data-testid="svg-container"
            />
          </div>
        </div>
      )}

      {/* Zoom controls (only when an image is loaded and handler provided) */}
      {hasImage && onZoomChange && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-800/80 rounded-md px-2 py-1 text-xs text-gray-200 shadow-lg">
          <button
            type="button"
            onClick={() => onZoomChange(effectiveZoom - 0.25)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="px-1 text-[11px] font-medium"
          >
            {Math.round(effectiveZoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(effectiveZoom + 0.25)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};
