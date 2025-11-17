// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useCallback, useRef } from 'react';
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
        useGradient, gradientDirection, randomness, color1, color2, customCharacter, fillPattern, angle
    } = settings;

    const dotsRef = useRef<Dot[]>([]);

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
    
        // Create pattern styles if needed
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
            dotsRef.current = generateDotsData(img, canvas.width, canvas.height);
            drawCanvas(dotsRef.current);
        };
    }, [imageSrc, settings, canvasRef, generateDotsData, drawCanvas]);

    const getSvgString = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || dotsRef.current.length === 0) return '';
    
        const dots = dotsRef.current;
        let svgElements = '';
        let svgDefs = '';
    
        if (fillPattern === 'stripes') {
            svgDefs = `
  <defs>
    <pattern id="fillPattern" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="${color2}"/>
        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="${color1}" stroke-width="2"/>
    </pattern>
  </defs>`;
        } else if (fillPattern === 'checkerboard') {
            svgDefs = `
  <defs>
    <pattern id="fillPattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="10" height="10" fill="${color2}"/>
      <rect width="5" height="5" x="0" y="0" fill="${color1}"/>
      <rect width="5" height="5" x="5" y="5" fill="${color1}"/>
    </pattern>
  </defs>`;
        }
    
        dots.forEach(dot => {
            if (dot.size > 0.1) { // Avoid creating tiny invisible elements
                 const fillAttr = fillPattern === 'solid' ? `fill="${dot.color}"` : 'fill="url(#fillPattern)"';
                 const transformAttr = (dotShape !== 'round' && angle !== 0) 
                    ? ` transform="rotate(${angle} ${dot.x.toFixed(2)} ${dot.y.toFixed(2)})"` 
                    : '';

                 switch (dotShape) {
                    case 'round':
                        svgElements += `<circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.size.toFixed(2)}" ${fillAttr} />\n`;
                        break;
                    case 'square':
                        const width = (dot.size * 2).toFixed(2);
                        svgElements += `<rect x="${(dot.x - dot.size).toFixed(2)}" y="${(dot.y - dot.size).toFixed(2)}" width="${width}" height="${width}" ${fillAttr}${transformAttr} />\n`;
                        break;
                    case 'plus':
                    case 'custom': {
                        const char = dotShape === 'plus' ? '+' : customCharacter || '*';
                        const escapedChar = char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const fontSize = dot.size * 3;
                        svgElements += `<text x="${dot.x.toFixed(2)}" y="${dot.y.toFixed(2)}" font-size="${fontSize.toFixed(2)}" ${fillAttr} font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle"${transformAttr}>${escapedChar}</text>\n`;
                        break;
                    }
                }
            }
        });
    
        return `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">${svgDefs ? `\n${svgDefs}\n` : '\n'}${svgElements}</svg>`;
    }, [settings, canvasRef]);

    return { getSvgString };
};
