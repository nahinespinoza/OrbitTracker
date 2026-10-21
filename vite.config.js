import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/OrbitTracker/',
  plugins: [react(), tailwindcss()],
  // satellite.js v7 incluye builds WASM con top-level await
  worker: { format: 'es' },
  build: { target: 'esnext' },
})
