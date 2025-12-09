/// <reference types="@figma/plugin-typings" />

const UI_WINDOW = { width: 384, height: 720, title: "Halftone Controls" } as const;
const devUiUrl = import.meta.env.VITE_FIGMA_UI_DEV_SERVER?.trim();

const buildDevLoaderHtml = (url: string) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Halftone Controls (Dev)</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #0f172a;
          color: #f8fafc;
        }
      </style>
    </head>
    <body>
      <div>Connecting to ${url}...</div>
      <script>
        window.location.replace(${JSON.stringify(url)});
      </script>
    </body>
  </html>
`;

const showUIWithFallback = async () => {
  if (devUiUrl) {
    try {
      const response = await fetch(devUiUrl, { method: "GET", cache: "no-store" });
      if (response.ok) {
        figma.showUI(buildDevLoaderHtml(devUiUrl), UI_WINDOW);
        figma.notify("Halftone Controls connected to the local dev server.");
        return;
      }
      console.warn(`Dev UI responded with status ${response.status}. Falling back to bundled UI.`);
    } catch (error) {
      console.warn("Unable to reach the local dev UI. Falling back to bundled UI.", error);
    }
    figma.notify("Local dev server not reachable. Showing bundled UI.");
  }

  figma.showUI(__html__, UI_WINDOW);
};

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

type UiMessage =
  | { type: 'create-svg'; svg: string; width: number; height: number }
  | { type: 'notify'; message: string };

const handleUiMessage = (msg: UiMessage) => {
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

const init = async () => {
  await showUIWithFallback();
  figma.on('selectionchange', sendImageToUI);
  await sendImageToUI();
  figma.ui.onmessage = handleUiMessage;
};

init().catch(error => {
  console.error("Failed to initialize Halftone Controls UI", error);
  if (!figma.ui) {
    figma.showUI(__html__, UI_WINDOW);
  }
  figma.notify('Unable to load the Halftone Controls UI. See console for details.');
});
