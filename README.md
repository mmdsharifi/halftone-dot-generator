# Halftone Dot Generator

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://mmdsharifi.github.io/halftone-dot-generator/)

This repository contains the source code for the Halftone Dot Generator, an interactive tool to convert images into a customizable halftone dot pattern. The project is structured as a monorepo with a shared core logic library, a web application, and a Figma plugin.

## Projects

-   **`/web-app`**: An interactive web-based tool to convert images into halftone patterns and export them as SVG.
-   **`/figma-plugin`**: A plugin to apply the same halftone effect directly to images inside Figma.
-   **`/core`**: A framework-agnostic library containing the core halftone generation logic, shared between the web app and the Figma plugin.

---

## 1. Web App

The web application allows you to fine-tune various parameters and export the result as a scalable SVG, perfect for use in design tools like Figma, Illustrator, or Inkscape.

### Live Demo

**[Click here to try it out!](https://mmdsharifi.github.io/halftone-dot-generator/)**

### Features

-   **Flexible Image Input**: Upload, paste from clipboard, or drag-and-drop your image.
-   **Real-time Preview**: See changes to the halftone effect instantly.
-   **Deep Customization**: Adjust resolution, dot size, shape (round, square, custom char), blur, randomness, angle, and more.
-   **Advanced Coloring**: Use solid colors, two-color gradients, and various fill patterns.
-   **SVG Export**: Instantly copy the generated pattern as an SVG to your clipboard.

### Development (Web App)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mmdsharifi/halftone-dot-generator.git
    cd halftone-dot-generator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 2. Figma Plugin

The Figma plugin brings the power of the halftone generator directly into your design workflow. Select an image, run the plugin, and insert the generated SVG onto your canvas.

### How to Install and Use the Figma Plugin

1.  **Build the plugin:**
    ```bash
    npm install
    npm run figma:build
    ```
2.  Open the Figma desktop app.
3.  Go to `Plugins` > `Development` > `Import plugin from manifest...`
4.  Select the `figma-plugin/manifest.json` file from this repository.
5.  **To use:** Select a shape with an image fill in your Figma file, then run the Halftone Dot Generator plugin.

### Development (Figma Plugin)

-   Run the development watcher: `npm run figma:dev`
-   This will watch for changes and rebuild the plugin automatically. You may need to close and re-run the plugin in Figma to see the changes.
