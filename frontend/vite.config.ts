import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

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
        categories: ['social'],
        display: 'standalone',
        start_url: '/',
        theme_color: '#131313',
        background_color: '#131313',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-high-res.svg',
            sizes: 'any',
          },
          {
            src: 'monochrome-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'monochrome',
          },
          {
            src: 'monochrome-icon-high-res.svg',
            sizes: 'any',
            purpose: 'monochrome',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-high-res.svg',
            sizes: 'any',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/screenshot-1.png',
            sizes: '1440x2865',
            type: 'image/png',
            form_factor: 'narrow',
            label: "It's On",
          },
          {
            src: 'screenshots/screenshot-wide-1.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: "It's On",
          },
        ],
      },
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
