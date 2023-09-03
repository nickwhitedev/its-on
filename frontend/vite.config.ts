import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "It's On",
        short_name: 'ItsOn',
        description: "Always know when it's on",
        start_url: '/',
        theme_color: '#0e1118',
        background_color: '#0e1118',
        orientation: 'portrait',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
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
