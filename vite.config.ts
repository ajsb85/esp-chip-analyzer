import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import macros from 'unplugin-parcel-macros'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    macros.vite(),
    react()
  ],
  base: '/esp-chip-analyzer/',
})
