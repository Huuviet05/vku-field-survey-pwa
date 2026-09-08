import { InstallButton } from './InstallButton'

// ============================================================
// Header Component - THANH ĐIỀU HƯỚNG & LOGO THƯƠNG HIỆU VKU
// Đồng bộ 100% với favicon và nhận diện chính thức của trường VKU
// ============================================================

export function Header({ currentTab, onTabChange, historyCount = 0, isOnline }) {
  return (
    <header className="app-header" role="banner">
      <div className="app-header__container">
        {/* Brand Identity */}
        <div className="app-header__brand">
          <div className="brand-logo" aria-label="Logo VKU">
            {/* Logo VKU chuẩn đồng nhất với Favicon */}
            <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#vkuBrandGrad)" />
              <defs>
                <linearGradient id="vkuBrandGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1e40af" />
                  <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="48%"
                dominantBaseline="central"
                textAnchor="middle"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                fontWeight="900"
                fontSize="16"
                fill="#ffffff"
                letterSpacing="-0.5"
              >
                VKU
              </text>
              <rect x="13" y="32" width="22" height="3" rx="1.5" fill="#f97316" />
            </svg>
          </div>

          <div className="brand-titles">
            <div className="brand-titles__main">
              <h1 className="brand-name">VKU FIELD SURVEY</h1>
              <span className="brand-badge-pwa">PWA</span>
            </div>
            <p className="brand-desc">Trường Đại học CNTT & Truyền thông Việt - Hàn</p>
          </div>
        </div>

        {/* Desktop / Tablet Navigation Tabs (Clean Professional SVGs, NO Emojis) */}
        <nav className="header-nav-tabs" aria-label="Điều hướng chính">
          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'form' ? 'nav-tab-btn--active' : ''}`}
            onClick={() => onTabChange('form')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="nav-tab-text">Khảo Sát Mới</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'history' ? 'nav-tab-btn--active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="nav-tab-text">Lịch Sử</span>
            {historyCount > 0 && (
              <span className="nav-tab-badge">{historyCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentTab === 'stats' ? 'nav-tab-btn--active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="nav-tab-text">Thống Kê</span>
          </button>
        </nav>

        {/* Right Tools: Network Pill & Install PWA Button */}
        <div className="header-tools">
          <div
            className={`network-status-pill ${isOnline ? 'network-status-pill--online' : 'network-status-pill--offline'}`}
            title={isOnline ? 'Đang kết nối internet bình thường' : 'Đang ở chế độ ngoại tuyến'}
          >
            <span className="network-dot" />
            <span className="network-label">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
          </div>

          <InstallButton />
        </div>
      </div>
    </header>
  )
}
