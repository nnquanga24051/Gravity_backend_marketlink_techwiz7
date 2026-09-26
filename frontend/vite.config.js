import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://36.50.176.64',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_TARGET || 'http://36.50.176.64',
        changeOrigin: true
      }
    }
  }
})
