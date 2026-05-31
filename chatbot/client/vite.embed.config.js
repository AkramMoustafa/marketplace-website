import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds a single self-contained IIFE bundle for embedding via <script> tag
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/embed.jsx',
      name: 'AlexChatbot',
      fileName: 'alex-chatbot',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
