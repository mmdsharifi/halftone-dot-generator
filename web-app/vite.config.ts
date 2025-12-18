import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/halftone-dot-generator/',
  server: {
    fs: {
      // Allow serving files from the parent directory (for core)
      allow: ['..']
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts'
  }
})
