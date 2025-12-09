
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HalftoneSettings } from '../../core/src/types';
import { ControlsPanel } from '../../components/ControlsPanel';
import { CanvasDisplay } from '../../components/CanvasDisplay';
import { useHalftone } from './hooks/useHalftone';
import { Toast } from '../../components/Toast';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });

  const [settings, setSettings] = useState<HalftoneSettings>({
    resolution: 40,
    dotSize: 1.0,
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
  });
  
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const handleImageError = useCallback((message: string) => {
    showToast(message, 'error');
    setImageSrc(null);
  }, [showToast]);

  const { getSvgString } = useHalftone(canvasRef, imageSrc, settings, handleImageError);
  
  const handleSettingsChange = useCallback(<K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const processImageFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Unsupported file type. Please select an image.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
            setImageSrc(result);
        } else {
            showToast('Failed to read the image file.', 'error');
        }
    };
    reader.onerror = () => {
        showToast('Error reading file. The file may be corrupt.', 'error');
    };
    reader.readAsDataURL(file);
  }, [showToast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processImageFile(event.target.files[0]);
    }
  };
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            processImageFile(file);
            showToast('Image pasted successfully!', 'success');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processImageFile]);


  const handleCopySvg = async () => {
    if (!imageSrc || !getSvgString) return;
    const svgString = getSvgString();
    if (svgString) {
      try {
        await navigator.clipboard.writeText(svgString);
        showToast('SVG copied to clipboard!', 'success');
      } catch (err) {
        console.error('Failed to copy SVG: ', err);
        showToast('Failed to copy SVG.', 'error');
      }
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-200 grid grid-cols-[1fr_384px] font-sans">
      <main className="flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full h-full max-w-full max-h-full">
            <CanvasDisplay 
                canvasRef={canvasRef} 
                hasImage={!!imageSrc} 
                onUpload={handleImageUpload}
                onFileDrop={processImageFile}
            />
        </div>
      </main>
      <aside className="border-l border-gray-700/50">
        <ControlsPanel 
            settings={settings} 
            onSettingsChange={handleSettingsChange}
            onImageUpload={handleImageUpload}
            onCopySvg={handleCopySvg}
            hasImage={!!imageSrc}
        />
      </aside>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default App;
