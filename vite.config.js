// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 👈 추가

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 👇 PWA 설정 추가
    VitePWA({
      registerType: 'autoUpdate', // 업데이트 시 자동 새로고침
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '넝쿨OS',
        short_name: '넝쿨OS',
        description: '하루를 기록하고 나를 발견하는 넝쿨OS',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})