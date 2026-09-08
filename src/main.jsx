import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Tự động xóa sạch Service Worker & Cache cũ khi đang ở môi trường phát triển (DEV)
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister())
  })
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name))
    })
  }
}

// ============================================================
// PWA Service Worker Registration
// ============================================================
const updateSW = registerSW({
  onNeedRefresh() {
    // Có phiên bản SW mới — thông báo người dùng (có thể dùng toast)
    console.log('[PWA] 🔔 New version available — reload to update')
    const shouldUpdate = window.confirm(
      '🔔 Phiên bản mới của ứng dụng đã sẵn sàng!\nNhấn OK để cập nhật ngay.'
    )
    if (shouldUpdate) updateSW(true)
  },
  onOfflineReady() {
    console.log('[PWA] ✅ App is ready to work offline!')
  },
  onRegistered(sw) {
    console.log('[PWA] 🔧 Service Worker registered:', sw)
  },
  onRegisterError(error) {
    console.error('[PWA] ❌ Service Worker registration failed:', error)
  },
})

// ============================================================
// React App Mount
// ============================================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
