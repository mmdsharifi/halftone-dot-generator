
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HalftoneSettings, generateDotsData, generateSvgString } from '../../../core/src';
import { ControlsPanel } from './components/ControlsPanel';
import { UploadIcon } from './components/Icon';

const App: React.FC = () => {
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [generatedSvg, setGeneratedSvg] = useState<string>('');
    const imageUrlRef = useRef<string | null>(null);

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

    const handleSettingsChange = useCallback(<K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    useEffect(() => {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (msg.type === 'image-bytes') {
                if (imageUrlRef.current) {
                    URL.revokeObjectURL(imageUrlRef.current);
                    imageUrlRef.current = null;
                }

                if (msg.bytes) {
                    const blob = new Blob([msg.bytes], { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    imageUrlRef.current = url;
                    
                    const img = new Image();
                    img.onload = () => {
                        setImageElement(img);
                    };
                    img.onerror = () => {
                        parent.postMessage({ pluginMessage: { type: 'notify', message: 'Could not load image. It may be corrupted or in an unsupported format.' } }, '*');
                        setImageElement(null);
                        URL.revokeObjectURL(url);
                        imageUrlRef.current = null;
                    };
                    img.src = url;
                } else {
                    setImageElement(null);
                }
            }
        };

        return () => {
            if (imageUrlRef.current) {
                URL.revokeObjectURL(imageUrlRef.current);
            }
            window.onmessage = null;
        };
    }, []);

    useEffect(() => {
        if (!imageElement) {
            setGeneratedSvg('');
            return;
        }

        const { width, height } = imageElement;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        ctx.filter = settings.imageBlur > 0 ? `blur(${settings.imageBlur}px)` : 'none';
        ctx.drawImage(imageElement, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        
        const dots = generateDotsData(imageData.data, width, height, settings);
        setGeneratedSvg(generateSvgString(dots, width, height, settings));
        
    }, [imageElement, settings]);


    const handleGenerate = () => {
        if (!generatedSvg || !imageElement) {
            parent.postMessage({ pluginMessage: { type: 'notify', message: 'No image selected or SVG not ready.' } }, '*');
            return;
        }
        parent.postMessage({ 
            pluginMessage: { 
                type: 'create-svg', 
                svg: generatedSvg,
                width: imageElement.width,
                height: imageElement.height
            } 
        }, '*');
    };

    return (
        <div className="flex flex-col h-screen">
            {!imageElement && (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-4">
                    <UploadIcon className="w-12 h-12 mb-4" />
                    <h2 className="font-bold text-lg">Select an Image</h2>
                    <p className="text-sm">Select a single layer with an image fill in Figma to begin.</p>
                </div>
            )}
            <ControlsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onImageUpload={() => {}} // Not used in plugin
                onCopySvg={handleGenerate} // Repurposed for "Generate"
                hasImage={!!imageElement}
                isFigmaPlugin={true}
            />
        </div>
    );
};

export default App;
