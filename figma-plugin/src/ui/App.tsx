import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HalftoneSettings, generateDotsData, generateSvgString, Dot } from '../../../core/src';
import { ControlsPanel } from './components/ControlsPanel';
import { UploadIcon } from './components/Icon';

const App: React.FC = () => {
    const [imageInfo, setImageInfo] = useState<{ url: string; width: number; height: number } | null>(null);
    const [generatedSvg, setGeneratedSvg] = useState<string>('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
        window.onmessage = async (event) => {
            const msg = event.data.pluginMessage;
            if (msg.type === 'image-bytes') {
                if (msg.bytes) {
                    const blob = new Blob([msg.bytes], { type: 'image/png' }); // Type might vary, but this works for decoding
                    const url = URL.createObjectURL(blob);
                    
                    const img = new Image();
                    img.onload = () => {
                        setImageInfo({ url, width: img.width, height: img.height });
                        URL.revokeObjectURL(url);
                    };
                    img.src = url;
                } else {
                    setImageInfo(null);
                }
            }
        };
    }, []);

    useEffect(() => {
        if (!imageInfo) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageInfo.url;
        img.onload = () => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = imageInfo.width;
            offscreenCanvas.height = imageInfo.height;
            const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            
            ctx.filter = settings.imageBlur > 0 ? `blur(${settings.imageBlur}px)` : 'none';
            ctx.drawImage(img, 0, 0, imageInfo.width, imageInfo.height);
            const imageData = ctx.getImageData(0, 0, imageInfo.width, imageInfo.height);
            
            const dots = generateDotsData(imageData.data, imageInfo.width, imageInfo.height, settings);
            setGeneratedSvg(generateSvgString(dots, imageInfo.width, imageInfo.height, settings));
        };

    }, [imageInfo, settings]);


    const handleGenerate = () => {
        if (!generatedSvg || !imageInfo) {
            parent.postMessage({ pluginMessage: { type: 'notify', message: 'No image selected or SVG not ready.' } }, '*');
            return;
        }
        parent.postMessage({ 
            pluginMessage: { 
                type: 'create-svg', 
                svg: generatedSvg,
                width: imageInfo.width,
                height: imageInfo.height
            } 
        }, '*');
    };

    return (
        <div className="flex flex-col h-screen">
            {!imageInfo && (
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
                hasImage={!!imageInfo}
                isFigmaPlugin={true}
            />
        </div>
    );
};

export default App;
