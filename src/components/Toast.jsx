import { useEffect, useState, useCallback } from 'react'

// ============================================================
// Toast Notification Component
// ============================================================

/**
 * @param {{ toasts: Array<{id, message, type}>, onDismiss: Function }} props
 */
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss sau 4 giây
    const timer = setTimeout(() => dismiss(), 4000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), 350)
  }, [toast.id, onDismiss])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    sync: '🔄',
  }

  return (
    <div
      className={`toast toast--${toast.type || 'info'} ${visible ? 'toast--visible' : ''} ${leaving ? 'toast--leaving' : ''}`}
      role="alert"
      onClick={dismiss}
    >
      <span className="toast__icon">{icons[toast.type] || icons.info}</span>
      <span className="toast__message">{toast.message}</span>
      <button className="toast__close" onClick={dismiss} aria-label="Đóng thông báo">
        ×
      </button>
    </div>
  )
}

// ============================================================
// useToast Hook
// ============================================================
let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter
    setToasts((prev) => [...prev, { id, message, type }])
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}
