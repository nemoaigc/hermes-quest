import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8420'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backendUrl,
      '/bg': backendUrl,
      '/skills': backendUrl,
      '/items': backendUrl,
      '/npc': backendUrl,
      '/sprites': backendUrl,
      '/icons': backendUrl,
      '/icon-manifest.json': backendUrl,
      '/avatar.png': backendUrl,
      '/favicon.svg': backendUrl,
    },
  },
})
