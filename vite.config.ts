import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // 5173/5174 落在 Windows 保留端口段（5141–5240，Hyper-V/WSL 常见），
    // 绑定会报 EACCES，故固定到一个保留段外的端口
    port: 4321,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 立绘派生图较大，放宽内联阈值，避免 base64 进 JS
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
  },
})
