import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // On ne rewrite pas ici car le backend s'attend maintenant à recevoir /api grace à root_path="/api"
        // Mais si on lance uvicorn sans root_path en local, il faut rewrite.
        // Option simple : on lance uvicorn normalement et on rewrite ici.
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})