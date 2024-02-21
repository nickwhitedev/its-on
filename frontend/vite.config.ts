import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: "It's On",
        short_name: "It's On",
        description: "Always know when it's on",
        display: 'standalone',
        start_url: '/',
        theme_color: '#131313',
        background_color: '#131313',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      workbox: {
        cleanupOutdatedCaches: true,
      },
      // Promotional - not supported by vite types?
      // screenshots: [
      //   src: 'pwa-512x512.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      // ],
      // categories: ['social'],
    }),
  ],
})
