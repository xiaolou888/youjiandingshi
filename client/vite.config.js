import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    // 禁用 CSS 代码分割
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // 简化代码分割策略
        manualChunks: {
          'vue': ['vue', 'vue-router'],
          'element-plus': ['element-plus'],
          'axios': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})