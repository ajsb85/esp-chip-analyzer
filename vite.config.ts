import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import macros from 'unplugin-parcel-macros'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    macros.vite(), // Must be first!
    react()
  ],
  base: '/esp-chip-analyzer/',
  build: {
    target: ['es2022'],
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Bundle S2 and macro CSS to prevent duplicate rules across chunks
        manualChunks(id) {
          if (/macro-(.*)\.css$/.test(id) || /@react-spectrum\/s2\/.*\.css$/.test(id)) {
            return 's2-styles';
          }
          if (id.includes('node_modules')) {
            if (id.includes('@react-spectrum') || id.includes('@react-aria') || id.includes('@internationalized')) {
              return 'vendor-spectrum';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('esptool-js')) {
              return 'vendor-esptool';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
