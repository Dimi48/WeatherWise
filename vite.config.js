import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/foursquare': {
        target: 'https://places-api.foursquare.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/foursquare/, '')
      }
    }
  }
})