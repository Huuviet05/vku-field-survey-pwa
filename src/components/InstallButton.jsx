import { useState, useEffect, useRef } from 'react'

// ============================================================
// InstallButton Component — Custom PWA Install Prompt
// ============================================================

export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    // Kiểm tra nếu app đã chạy ở standalone mode (đã được cài)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Lắng nghe sự kiện beforeinstallprompt
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault() // Ngăn Chrome tự hiện prompt
      deferredPromptRef.current = event
      setCanInstall(true)
      console.log('[PWA] 📲 beforeinstallprompt captured, install button ready')
    }

    // Lắng nghe khi app được cài xong
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      deferredPromptRef.current = null
      console.log('[PWA] ✅ App installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPromptRef.current) return

    setIsInstalling(true)

    try {
      // Kích hoạt popup cài đặt native của browser
      deferredPromptRef.current.prompt()

      // Chờ người dùng chọn
      const { outcome } = await deferredPromptRef.current.userChoice
      console.log('[PWA] 📲 User choice:', outcome)

      if (outcome === 'accepted') {
        console.log('[PWA] ✅ User accepted the install prompt')
        setCanInstall(false)
      } else {
        console.log('[PWA] ❌ User dismissed the install prompt')
      }

      deferredPromptRef.current = null
    } catch (err) {
      console.error('[PWA] ❌ Install prompt error:', err)
    } finally {
      setIsInstalling(false)
    }
  }

  // Ẩn button nếu đã cài hoặc không thể cài
  if (isInstalled || !canInstall) return null

  return (
    <button
      id="pwa-install-btn"
      className="install-btn"
      onClick={handleInstallClick}
      disabled={isInstalling}
      aria-label="Cài đặt ứng dụng VKU Field Survey"
    >
      {isInstalling ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>Đang mở...</span>
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Cài Đặt Ứng Dụng</span>
        </>
      )}
    </button>
  )
}
