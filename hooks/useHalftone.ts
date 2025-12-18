import React, { useEffect, useCallback, useRef } from 'react';
import { HalftoneSettings } from '../types';
import { lerpColor } from '../utils/color';

interface Dot {
    x: number;
    y: number;
    size: number;
    color: string;
}

const getSafeCanvasSize = (canvas: HTMLCanvasElement | null) => ({
    width: canvas?.width ?? 0,
    height: canvas?.height ?? 0,
});

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
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

    const computeDotColor = useCallback((x: number, y: number) => {
        const { width, height } = canvasSizeRef.current;
        if (useGradient && width && height) {
            const gradientPos = gradientDirection === 'vertical' ? (y / height) : (x / width);
            return lerpColor(color1, color2, gradientPos);
        }
        return color1;
    }, [useGradient, gradientDirection, color1, color2]);

    const generateDotsData = useCallback((img: HTMLImageElement): Dot[] => {
        const canvas = canvasRef.current;
        if (!canvas) return [];

        const canvasWidth = canvasSizeRef.current.width || img.width;
        const canvasHeight = canvasSizeRef.current.height || img.height;

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

        const cols = Math.max(1, resolution);
        const rows = Math.max(1, Math.round(cols * (canvasHeight / canvasWidth)));
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
                
                const centerX = x + cellWidth / 2 + randX;
                const centerY = y + cellHeight / 2 + randY;

                dots.push({
                    x: centerX,
                    y: centerY,
                    size,
                    color: computeDotColor(centerX, centerY),
                });
            }
        }
        return dots;
    }, [canvasRef, resolution, dotSize, imageBlur, invert, randomness, computeDotColor]);

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
    
    const regenerateDots = useCallback(() => {
        if (!imageElementRef.current) return;
        dotsRef.current = generateDotsData(imageElementRef.current);
        drawCanvas(dotsRef.current);
    }, [drawCanvas, generateDotsData]);

    const recolorDots = useCallback(() => {
        if (!dotsRef.current.length) return;
        const { width, height } = getSafeCanvasSize(canvasRef.current);
        dotsRef.current = dotsRef.current.map(dot => ({
            ...dot,
            color: computeDotColor(dot.x, dot.y),
        }));
        // Ensure we have the latest canvas bounds for gradient calculation.
        if (width && height) {
            canvasSizeRef.current = { width, height };
        }
    }, [canvasRef, computeDotColor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) {
            const ctx = canvas?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            dotsRef.current = [];
            imageElementRef.current = null;
            return;
        };

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let canvasWidth = canvas.parentElement?.clientWidth || 512;
            let canvasHeight = canvasWidth / aspectRatio;
            const maxHeight = canvas.parentElement?.clientHeight || 512;
            if (canvasHeight > maxHeight) {
                canvasHeight = maxHeight;
                canvasWidth = canvasHeight * aspectRatio;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
            imageElementRef.current = img;
            regenerateDots();
        };
    }, [imageSrc, canvasRef, regenerateDots]);

    useEffect(() => {
        if (!imageElementRef.current) return;
        regenerateDots();
    }, [resolution, dotSize, imageBlur, invert, randomness, regenerateDots]);

    useEffect(() => {
        if (!dotsRef.current.length) return;
        recolorDots();
        drawCanvas(dotsRef.current);
    }, [recolorDots, drawCanvas, useGradient, gradientDirection, color1, color2]);

    useEffect(() => {
        if (!dotsRef.current.length) return;
        drawCanvas(dotsRef.current);
    }, [drawCanvas, dotShape, fillPattern, customCharacter, angle]);

    const getSvgString = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || dotsRef.current.length === 0) return '';
    
        const dots = dotsRef.current;
        const { width, height } = canvasSizeRef.current.width && canvasSizeRef.current.height
            ? canvasSizeRef.current
            : getSafeCanvasSize(canvas);

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
    
        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${svgDefs ? `\n${svgDefs}\n` : '\n'}${svgElements}</svg>`;
    }, [fillPattern, dotShape, angle, customCharacter, color1, color2, canvasRef]);

    return { getSvgString };
};
