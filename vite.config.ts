import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['framer-motion', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'zustand'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200,
  }
});
