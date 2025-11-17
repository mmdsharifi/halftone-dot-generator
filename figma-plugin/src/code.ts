// FIX: Replaced triple-slash directive with explicit type imports and global declarations
// to resolve issues with TypeScript's type definition resolution for the Figma plugin API.
import type { ImagePaint, PluginAPI } from '@figma/plugin-typings';

declare const figma: PluginAPI;
declare const __html__: string;

figma.showUI(__html__, { width: 384, height: 720, title: "Halftone Controls" });

const sendImageToUI = async () => {
  const selection = figma.currentPage.selection;
  let imageBytes: Uint8Array | null = null;

  if (selection.length === 1) {
    const node = selection[0];
    if ('fills' in node && Array.isArray(node.fills)) {
      const imagePaint = node.fills.find(fill => fill.type === 'IMAGE') as ImagePaint;
      if (imagePaint && imagePaint.imageHash) {
        const image = figma.getImageByHash(imagePaint.imageHash);
        if (image) {
          imageBytes = await image.getBytesAsync();
        }
      }
    }
  }
  figma.ui.postMessage({ type: 'image-bytes', bytes: imageBytes });
};

figma.on('selectionchange', sendImageToUI);

// Initial run
sendImageToUI();

figma.ui.onmessage = msg => {
  if (msg.type === 'create-svg') {
    const { svg, width, height } = msg;
    const svgNode = figma.createNodeFromSvg(svg);
    svgNode.resize(width, height);

    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const selectionNode = selection[0];
      svgNode.x = selectionNode.x;
      svgNode.y = selectionNode.y;
      const parent = selectionNode.parent;
      if (parent) {
        const index = parent.children.indexOf(selectionNode);
        parent.insertChild(index + 1, svgNode);
      }
    } else {
      figma.currentPage.appendChild(svgNode);
      const { x, y } = figma.viewport.center;
      svgNode.x = x - (width / 2);
      svgNode.y = y - (height / 2);
    }
    
    figma.currentPage.selection = [svgNode];
    figma.notify('Halftone SVG created successfully!');
  } else if (msg.type === 'notify') {
    figma.notify(msg.message);
  }
};
