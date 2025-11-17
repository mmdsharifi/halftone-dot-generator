
import React, { useEffect, useCallback, useRef } from 'react';
import { HalftoneSettings, Dot } from '../../../core/src/types';
import { lerpColor, generateDotsData, generateSvgString } from '../../../core/src';

export const useHalftone = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    imageSrc: string | null,
    settings: HalftoneSettings,
    onError: (message: string) => void
) => {
    const { 
        dotShape, customCharacter, fillPattern, color1, color2, angle, imageBlur
    } = settings;

    const dotsRef = useRef<Dot[]>([]);
    
    const drawCanvas = useCallback((dots: Dot[]) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        let patternStyle: CanvasPattern | null = null;
        if (fillPattern === 'stripes') {
            const patternCanvas = document.createElement('canvas');
            const pctx = patternCanvas.getContext('2d');
            patternCanvas.width = 8;
            patternCanvas.height = 8;
            if (pctx) {
                pctx.fillStyle = color2;
                pctx.fillRect(0,0,8,8);
                pctx.strokeStyle = color1;
                pctx.lineWidth = 2;
                pctx.beginPath();
                pctx.moveTo(-2, 2); pctx.lineTo(2, -2);
                pctx.moveTo(0, 8); pctx.lineTo(8, 0);
                pctx.moveTo(6, 10); pctx.lineTo(10, 6);
                pctx.stroke();
                patternStyle = ctx.createPattern(patternCanvas, 'repeat');
            }
        } else if (fillPattern === 'checkerboard') {
            const patternCanvas = document.createElement('canvas');
            const pctx = patternCanvas.getContext('2d');
            patternCanvas.width = 10;
            patternCanvas.height = 10;
            if (pctx) {
                pctx.fillStyle = color2;
                pctx.fillRect(0,0,10,10);
                pctx.fillStyle = color1;
                pctx.fillRect(0,0,5,5);
                pctx.fillRect(5,5,5,5);
                patternStyle = ctx.createPattern(patternCanvas, 'repeat');
            }
        }
    
        dots.forEach(dot => {
            ctx.fillStyle = fillPattern === 'solid' ? dot.color : (patternStyle || dot.color);
            
            ctx.save();
            ctx.translate(dot.x, dot.y);
            if (dotShape !== 'round' && angle !== 0) {
                ctx.rotate(angle * Math.PI / 180);
            }
            
            switch (dotShape) {
                case 'round':
                    ctx.beginPath();
                    ctx.arc(0, 0, dot.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.beginPath();
                    ctx.rect(-dot.size, -dot.size, dot.size * 2, dot.size * 2);
                    ctx.fill();
                    break;
                case 'plus':
                case 'custom': {
                    const char = dotShape === 'plus' ? '+' : customCharacter || '*';
                    const fontSize = dot.size * 3;
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(char, 0, 0);
                    break;
                }
            }
            ctx.restore();
        });
    
    }, [canvasRef, dotShape, customCharacter, fillPattern, color1, color2, angle]);
    

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) {
            const ctx = canvas?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            dotsRef.current = [];
            return;
        };

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let canvasWidth = canvas.parentElement?.clientWidth || 512;
            let canvasHeight = canvasWidth / aspectRatio;
            if (canvasHeight > (canvas.parentElement?.clientHeight || 512)) {
                canvasHeight = canvas.parentElement?.clientHeight || 512;
                canvasWidth = canvasHeight * aspectRatio;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            
            // Apply blur before getting image data
            ctx.filter = imageBlur > 0 ? `blur(${imageBlur}px)` : 'none';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            dotsRef.current = generateDotsData(imageData.data, canvas.width, canvas.height, settings);
            
            // Reset filter before drawing dots to avoid blurring the dots
            ctx.filter = 'none';
            drawCanvas(dotsRef.current);
        };

        img.onerror = () => {
            onError('Could not load image. The file may be corrupted or in an unsupported format.');
        };
    }, [imageSrc, settings, canvasRef, drawCanvas, imageBlur, onError]);

    const getSvgString = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || dotsRef.current.length === 0) return '';
        return generateSvgString(dotsRef.current, canvas.width, canvas.height, settings);
    }, [settings, canvasRef]);

    return { getSvgString };
};
