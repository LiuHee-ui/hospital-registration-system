import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks 手动分包：核心框架 / 网络库 / OCR 工具各自独立
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'network-vendor': ['axios'],
          'ocr-vendor': ['tesseract.js']
        }
      }
    }
  }
})
