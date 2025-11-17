// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useCallback } from 'react';
import { HalftoneSettings } from '../types';
import { lerpColor } from '../utils/color';

interface Dot {
    x: number;
    y: number;
    size: number;
    color: string;
}

export const useHalftone = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    imageSrc: string | null,
    settings: HalftoneSettings
) => {
    const { 
        resolution, dotSize, dotShape, imageBlur, invert, 
        useGradient, gradientDirection, randomness, color1, color2, customCharacter 
    } = settings;

    const generateDotsData = useCallback((img: HTMLImageElement, canvasWidth: number, canvasHeight: number): Dot[] => {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        if (!offscreenCtx) return [];

        offscreenCanvas.width = canvasWidth;
        offscreenCanvas.height = canvasHeight;

        if (imageBlur > 0) {
            offscreenCtx.filter = `blur(${imageBlur}px)`;
        }
        offscreenCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        const imageData = offscreenCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        const dots: Dot[] = [];

        const cols = resolution;
        const rows = Math.round(cols * (canvasHeight / canvasWidth));
        const cellWidth = canvasWidth / cols;
        const cellHeight = canvasHeight / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cellWidth;
                const y = r * cellHeight;

                const sampleX = Math.floor(x + cellWidth / 2);
                const sampleY = Math.floor(y + cellHeight / 2);

                const pixelIndex = (sampleY * canvasWidth + sampleX) * 4;
                const red = data[pixelIndex];
                const green = data[pixelIndex + 1];
                const blue = data[pixelIndex + 2];

                let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
                if (invert) {
                    luminance = 1 - luminance;
                }

                const baseSize = (Math.min(cellWidth, cellHeight) / 2) * dotSize;
                const size = baseSize * luminance;

                const randX = (Math.random() - 0.5) * randomness * cellWidth;
                const randY = (Math.random() - 0.5) * randomness * cellHeight;
                
                let color = color1;
                if (useGradient) {
                    const gradientPos = gradientDirection === 'vertical' ? (y / canvasHeight) : (x / canvasWidth);
                    color = lerpColor(color1, color2, gradientPos);
                }

                dots.push({
                    x: x + cellWidth / 2 + randX,
                    y: y + cellHeight / 2 + randY,
                    size,
                    color,
                });
            }
        }
        return dots;
    }, [resolution, dotSize, imageBlur, invert, useGradient, gradientDirection, randomness, color1, color2]);

    const drawCanvas = useCallback((dots: Dot[]) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        dots.forEach(dot => {
            ctx.fillStyle = dot.color;
            ctx.beginPath();
            
            switch (dotShape) {
                case 'round':
                    ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.rect(dot.x - dot.size, dot.y - dot.size, dot.size * 2, dot.size * 2);
                    ctx.fill();
                    break;
                case 'plus':
                case 'custom': {
                    const char = dotShape === 'plus' ? '+' : customCharacter || '*';
                    const fontSize = dot.size * 3;
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(char, dot.x, dot.y);
                    break;
                }
            }
        });

    }, [canvasRef, dotShape, customCharacter]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

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
            const dots = generateDotsData(img, canvas.width, canvas.height);
            drawCanvas(dots);
        };
    }, [imageSrc, settings, canvasRef, generateDotsData, drawCanvas]);

    const getSvgString = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return '';

        const img = new Image();
        img.src = imageSrc;
        
        if(!img.width || !img.height) return '';

        const dots = generateDotsData(img, canvas.width, canvas.height);
        let svgElements = '';

        dots.forEach(dot => {
            if (dot.size > 0.1) { // Avoid creating tiny invisible elements
                 switch (dotShape) {
                    case 'round':
                        svgElements += `<circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.size.toFixed(2)}" fill="${dot.color}" />\n`;
                        break;
                    case 'square':
                        const width = (dot.size * 2).toFixed(2);
                        svgElements += `<rect x="${(dot.x - dot.size).toFixed(2)}" y="${(dot.y - dot.size).toFixed(2)}" width="${width}" height="${width}" fill="${dot.color}" />\n`;
                        break;
                    case 'plus':
                    case 'custom': {
                        const char = dotShape === 'plus' ? '+' : customCharacter || '*';
                        const escapedChar = char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const fontSize = dot.size * 3;
                        svgElements += `<text x="${dot.x.toFixed(2)}" y="${dot.y.toFixed(2)}" font-size="${fontSize.toFixed(2)}" fill="${dot.color}" font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${escapedChar}</text>\n`;
                        break;
                    }
                }
            }
        });

        return `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">\n${svgElements}</svg>`;
    }, [imageSrc, settings, canvasRef, generateDotsData]);

    return { getSvgString };
};