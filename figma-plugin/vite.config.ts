import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "src",
  base: "./",
  build: {
    outDir: "../dist",
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        ui: resolve(__dirname, "src/ui.html"),
        code: resolve(__dirname, "src/code.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
