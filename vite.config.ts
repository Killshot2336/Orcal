import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use '/' for local npm start. For GitHub Pages set VITE_BASE=/Orcal/
  base: process.env.VITE_BASE || '/',
  server: {
    port: 5173,
    open: true,
  },
});
