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
        target: process.env.VITE_BACKEND_TARGET || 'https://nnquangdev.id.vn',
        // target: process.env.VITE_BACKEND_TARGET || 'http://localhost:8081',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_TARGET || 'https://nnquangdev.id.vn',
        // target: process.env.VITE_BACKEND_TARGET || 'http://localhost:8081',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
