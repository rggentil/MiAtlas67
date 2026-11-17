import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the app under /MiAtlas67/; the deploy job sets VITE_BASE. Locally it is "/".
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
});
