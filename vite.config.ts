import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://118.196.105.22:8420',
      '/bg': 'http://118.196.105.22:8420',
      '/skills': 'http://118.196.105.22:8420',
      '/items': 'http://118.196.105.22:8420',
      '/npc': 'http://118.196.105.22:8420',
      '/sprites': 'http://118.196.105.22:8420',
      '/icons': 'http://118.196.105.22:8420',
      '/icon-manifest.json': 'http://118.196.105.22:8420',
      '/avatar.png': 'http://118.196.105.22:8420',
      '/favicon.svg': 'http://118.196.105.22:8420',
    },
  },
})
