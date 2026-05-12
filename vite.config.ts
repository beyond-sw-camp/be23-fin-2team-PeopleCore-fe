import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueJsx(), react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
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
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
