import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  images: ['public/its-on.svg'],
  preset: {
    transparent: {
      sizes: [64, 192, 512],
    },
    maskable: {
      sizes: [512],
    },
    apple: {
      sizes: [180],
    },
  },
})
