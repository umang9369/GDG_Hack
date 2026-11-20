import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // FastAPI backend (was 5000 Node.js)
        changeOrigin: true,
      },
      '/roboflow': {
        target: 'http://localhost:8000',  // FastAPI handles this too now (was 4000)
        changeOrigin: true,
      }
    }
  },
})
