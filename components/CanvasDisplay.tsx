
import React, { useState, useRef } from 'react';
import { UploadIcon } from './Icon';

interface CanvasDisplayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
}

export const CanvasDisplay: React.FC<CanvasDisplayProps> = ({ canvasRef, hasImage, onUpload, onFileDrop }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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

  return (
    <div 
      className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg p-4 relative aspect-square"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
      <canvas ref={canvasRef} className={`max-w-full max-h-full object-contain rounded-md transition-opacity duration-500 ${hasImage ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};
