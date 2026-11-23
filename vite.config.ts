import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the app under /MiAtlas67/; the deploy job sets VITE_BASE. Locally it is "/".
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    // Offline play (NFR-02, D36): a service worker keeps every file of the build on the device after the first
    // visit. It never runs in `npm run dev`.
    VitePWA({
      // No skipWaiting: a new version waits until the game is opened again, so a round in progress is never
      // reloaded (D36). There is no "update" prompt either: it arrives in silence.
      registerType: 'prompt',
      injectRegister: 'script-defer',
      // The manifest of the home screen install (D24) stays in public/manifest.webmanifest.
      manifest: false,
      workbox: {
        // The whole game: pages, scripts, styles, fonts, every flag and silhouette, the icons and the manifest.
        globPatterns: ['**/*.{html,js,css,woff2,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        skipWaiting: false,
        // The first visit is served by the worker as soon as it is ready, so a round that loses the connection
        // goes on with its pictures. It changes no version: only skipWaiting would.
        clientsClaim: true,
      },
    }),
  ],
});
