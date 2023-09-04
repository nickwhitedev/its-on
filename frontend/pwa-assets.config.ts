import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  images: ['public/its-on.svg'],
  // images: ['public/favicon-light.svg'], // Used to generate favicon.ico
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      // favicons: [[64, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
    },
    apple: {
      sizes: [180],
    },
  },
})
