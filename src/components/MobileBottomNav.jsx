// ============================================================
// MobileBottomNav Component - Thanh Điều Hướng Đáy Màn Hình Di Động
// Nằm độc lập ngoài Header, cố định chuẩn xác ở đáy màn hình PWA
// ============================================================

export function MobileBottomNav({ currentTab, onTabChange, historyCount = 0 }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'form' ? 'mobile-nav-item--active' : ''}`}
        onClick={() => onTabChange('form')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="mobile-nav-text">Khảo Sát</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'history' ? 'mobile-nav-item--active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        <div className="mobile-nav-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {historyCount > 0 && (
            <span className="mobile-nav-counter">{historyCount}</span>
          )}
        </div>
        <span className="mobile-nav-text">Lịch Sử</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'stats' ? 'mobile-nav-item--active' : ''}`}
        onClick={() => onTabChange('stats')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span className="mobile-nav-text">Thống Kê</span>
      </button>
    </nav>
  )
}
