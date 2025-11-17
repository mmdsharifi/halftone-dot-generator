import { HalftoneSettings, Dot } from './types';
import { lerpColor } from './utils/color';

export const generateDotsData = (
    pixelData: Uint8ClampedArray,
    width: number,
    height: number,
    settings: HalftoneSettings
): Dot[] => {
    const { 
        resolution, dotSize, invert, useGradient, 
        gradientDirection, randomness, color1, color2 
    } = settings;
    
    const dots: Dot[] = [];

    const cols = resolution;
    const rows = Math.round(cols * (height / width));
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * cellWidth;
            const y = r * cellHeight;

            const sampleX = Math.floor(x + cellWidth / 2);
            const sampleY = Math.floor(y + cellHeight / 2);

            const pixelIndex = (sampleY * width + sampleX) * 4;
            const red = pixelData[pixelIndex];
            const green = pixelData[pixelIndex + 1];
            const blue = pixelData[pixelIndex + 2];

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
                const gradientPos = gradientDirection === 'vertical' ? (y / height) : (x / width);
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
};


export const generateSvgString = (
    dots: Dot[],
    width: number,
    height: number,
    settings: HalftoneSettings
): string => {
    const { dotShape, fillPattern, color1, color2, angle, customCharacter } = settings;
    if (dots.length === 0) return '';

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
};
