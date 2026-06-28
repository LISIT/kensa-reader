import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 等のサブパス配信に対応。
// 例: https://<user>.github.io/vLLM-apps/  に置くなら BASE=/vLLM-apps/ を指定。
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'やさしい検査結果リーダー',
        short_name: '検査リーダー',
        description: 'スマホで撮った血液検査結果を、やさしい日本語で説明します（非薬事）',
        lang: 'ja',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // OCRモデル(CDN)もオフライン用にキャッシュ。ユーザーの写真はキャッシュしない。
        runtimeCaching: [
          {
            // OCRモデル(jsdelivr) / OCRエンジン(esm.sh) / 言語データ(projectnaptha) をキャッシュ。
            // ユーザーの写真はキャッシュしない（端末内処理のみ）。
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|esm\.sh|tessdata\.projectnaptha\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
})
