import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // macOS ocupa el puerto 5000 con AirPlay: usa PORT=5050 en el backend
        // y VITE_API_TARGET=http://127.0.0.1:5050 aquí.
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        timeout: 120000,
        proxyTimeout: 120000,
      },
    },
  },
})
