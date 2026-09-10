import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin tự động xóa sạch Service Worker & Cache cũ khi chạy dev
function devSwCleaner() {
  return {
    name: 'dev-sw-cleaner',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/sw.js' || req.url?.startsWith('/sw.js?') || req.url?.includes('dev-sw')) {
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
          res.end(`
            self.addEventListener('install', () => self.skipWaiting());
            self.addEventListener('activate', (e) => {
              e.waitUntil(
                caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
                  .then(() => self.registration.unregister())
                  .then(() => self.clients.claim())
              );
            });
          `)
          return
        }
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Expose ra network (0.0.0.0) để truy cập từ thiết bị di động
    port: 5173,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  },
  plugins: [
    devSwCleaner(),
    react(),
    VitePWA({
      // Dùng injectManifest để viết custom Service Worker thủ công
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Web App Manifest
      manifest: {
        name: 'VKU Field Survey — Khảo Sát Hiện Trường',
        short_name: 'VKU Survey',
        description: 'Hệ thống Khảo sát Hiện trường Cơ sở Vật chất VKU',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'vi',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // Các file được pre-cache tự động bởi workbox manifest injection
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
})
