import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // WebSocket: /hr-service/ws → API Gateway(8080) → hr-service /ws
      '/hr-service/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      // REST API: /api/hr-service/... → API Gateway(8080) → hr-service /...
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
