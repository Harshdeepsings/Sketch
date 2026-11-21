import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 8080,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('konva') || id.includes('react-konva')) {
              return 'vendor-konva';
            }
            if (
              id.includes('jspdf') ||
              id.includes('html2canvas') ||
              id.includes('dompurify') ||
              id.includes('purify') ||
              id.includes('fflate')
            ) {
              return 'vendor-export';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'vendor-socket';
            }
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/') ||
              id.includes('\\react\\')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
