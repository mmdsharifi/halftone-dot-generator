
import React from 'react';
import { UploadIcon } from './Icon';

interface CanvasDisplayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasImage: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CanvasDisplay: React.FC<CanvasDisplayProps> = ({ canvasRef, hasImage, onUpload }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg p-4 relative aspect-square">
      {!hasImage && (
         <div 
         className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-center border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-indigo-500 transition-colors duration-300"
         onClick={handlePlaceholderClick}
        >
            <UploadIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold">Click to Upload Image</p>
            <p className="text-sm">or drag and drop</p>
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
