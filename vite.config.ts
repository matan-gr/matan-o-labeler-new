
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'framer-motion'],
          viz: ['reactflow', 'dagre'],
          genai: ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
