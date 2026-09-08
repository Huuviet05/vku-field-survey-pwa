// ============================================================
// StatusBanner Component — Online/Offline Indicator
// ============================================================

export function StatusBanner({ isOnline, pendingCount }) {
  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`status-banner ${isOnline ? 'status-banner--online' : 'status-banner--offline'}`}
      role="status"
      aria-live="polite"
    >
      <div className="status-banner__content">
        {!isOnline ? (
          <>
            <span className="status-banner__dot status-banner__dot--pulse" aria-hidden="true" />
            <span className="status-banner__text">
              Đang ngoại tuyến — Dữ liệu được lưu an toàn trong máy và tự động gửi khi có mạng
              {pendingCount > 0 && (
                <strong className="status-banner__count"> ({pendingCount} phiếu đang chờ đồng bộ)</strong>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="status-banner__dot" aria-hidden="true" />
            <span className="status-banner__text">
              Đã kết nối mạng
              {pendingCount > 0 && (
                <strong className="status-banner__count"> — Đang đồng bộ {pendingCount} phiếu lên máy chủ...</strong>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
