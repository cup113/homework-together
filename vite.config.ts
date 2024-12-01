import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: 'instances/vite-stats.html',
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tiptap: ['@tiptap/starter-kit', '@tiptap/vue-3'],
          network: ['zod', 'socket.io-client', '@tanstack/vue-query', '@tanstack/vue-table'],
          ui: ['gsap', 'radix-vue', '@iconify/vue'],
        },
      }
    }
  },
})
