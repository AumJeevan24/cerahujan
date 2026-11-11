/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre + three.js (~1.7 MB minified, ~450 KB gzipped) are in their own chunk, loaded after the first screen.
    chunkSizeWarningLimit: 1800,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
