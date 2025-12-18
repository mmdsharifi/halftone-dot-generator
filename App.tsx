import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HalftoneSettings } from './types';
import { ControlsPanel } from './components/ControlsPanel';
import { CanvasDisplay } from './components/CanvasDisplay';
import { useHalftone } from './hooks/useHalftone';
import { Toast } from './components/Toast';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });
  const toastTimeoutRef = useRef<number | null>(null);

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

  const { getSvgString } = useHalftone(canvasRef, imageSrc, settings);
  
  const handleSettingsChange = useCallback(<K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, show: true });
    toastTimeoutRef.current = window.setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
        showToast('Invalid file type. Please use an image.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
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
  }, [processImageFile, showToast]);


  const handleCopySvg = useCallback(async () => {
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
  }, [getSvgString, imageSrc, showToast]);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 grid grid-cols-[1fr_384px] font-sans">
      <main className="flex items-center justify-center overflow-hidden">
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
