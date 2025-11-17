import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        ui: './src/ui.html',
        code: './src/code.ts',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
