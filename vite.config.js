import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/freight/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001,
    open: '/freight/',
    host: true
  },
  build: {
    outDir: 'dist/freight',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
})
