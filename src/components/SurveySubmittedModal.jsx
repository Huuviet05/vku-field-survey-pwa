// ============================================================
// SurveySubmittedModal Component - KẾT QUẢ SAU KHI GỬI PHIẾU
// Thiết kế biên lai tinh giản, chuyên nghiệp, không lạm dụng emoji
// ============================================================

export function SurveySubmittedModal({
  isOpen,
  surveyData,
  onClose,
  onViewHistory,
  onPrintReport,
  onNewSurvey,
}) {
  if (!isOpen || !surveyData) return null

  const isOnline = surveyData.status === 'synced'
  const photosCount = surveyData.photos?.length || 0

  const statusMap = {
    tot: { label: 'Tốt / Đạt chuẩn', color: '#10b981', bg: '#f0fdf4' },
    hu_hong_nhe: { label: 'Hư hỏng nhẹ', color: '#f59e0b', bg: '#fffbeb' },
    can_thay_the: { label: 'Cần thay thế', color: '#ef4444', bg: '#fef2f2' },
  }

  const currentStatus = statusMap[surveyData.tinhTrang] || statusMap.tot

  const damagedItems = []
  if (surveyData.checklist) {
    const labels = {
      denDien: 'Hệ thống điện & đèn',
      mayChieu: 'Máy chiếu / Màn hình',
      dieuHoa: 'Điều hòa / Quạt',
      banGhe: 'Bàn ghế giảng đường',
      cuaSo: 'Cửa ra vào & Cửa sổ',
      wifi: 'Mạng WiFi / Internet',
    }
    Object.entries(surveyData.checklist).forEach(([key, val]) => {
      if (val === 'damaged' && labels[key]) {
        damagedItems.push(labels[key])
      }
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container modal-container--md" onClick={(e) => e.stopPropagation()}>
        {/* Success Header with Clean SVG Checkmark */}
        <div className="submitted-modal__header">
          <div className="submitted-modal__icon-circle" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="submitted-modal__title">Khảo Sát Đã Được Ghi Nhận</h2>
          <p className="submitted-modal__subtitle">
            {isOnline
              ? 'Báo cáo đã gửi trực tuyến lên hệ thống quản lý cơ sở vật chất VKU'
              : 'Đã lưu an toàn vào bộ nhớ PWA (Offline) — Sẽ tự động gửi khi có kết nối mạng'}
          </p>
        </div>

        {/* Modal Body - Detailed Summary Receipt */}
        <div className="submitted-modal__body">
          {/* Reference Code Card */}
          <div className="receipt-ref-card">
            <span className="receipt-ref__label">MÃ BIÊN BẢN KHẢO SÁT</span>
            <span className="receipt-ref__code">{surveyData.refCode}</span>
            <div className="receipt-ref__badge-group">
              <span
                className="receipt-status-pill"
                style={{
                  color: currentStatus.color,
                  backgroundColor: currentStatus.bg,
                }}
              >
                {currentStatus.label}
              </span>
              <span
                className={`receipt-sync-pill ${isOnline ? 'receipt-sync-pill--online' : 'receipt-sync-pill--offline'}`}
              >
                {isOnline ? 'Đã gửi máy chủ' : 'Chờ đồng bộ (Offline)'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="receipt-details">
            <div className="receipt-row">
              <span className="receipt-row__label">Phòng & Khu vực:</span>
              <span className="receipt-row__value">
                <strong>{surveyData.maPhong}</strong>
                {surveyData.khuVuc && <small className="text-muted"> ({surveyData.khuVuc})</small>}
              </span>
            </div>

            {surveyData.loaiPhong && (
              <div className="receipt-row">
                <span className="receipt-row__label">Loại phòng:</span>
                <span className="receipt-row__value">{surveyData.loaiPhong}</span>
              </div>
            )}

            <div className="receipt-row">
              <span className="receipt-row__label">Người thực hiện:</span>
              <span className="receipt-row__value">
                {surveyData.surveyorName || 'Cán bộ khảo sát'}
                {surveyData.surveyorId && ` (${surveyData.surveyorId})`}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-row__label">Thời gian ghi nhận:</span>
              <span className="receipt-row__value">
                {surveyData.timestamp
                  ? new Date(surveyData.timestamp).toLocaleString('vi-VN')
                  : 'Vừa xong'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-row__label">Ảnh minh chứng:</span>
              <span className="receipt-row__value">
                {photosCount > 0 ? (
                  <strong className="text-primary">{photosCount} hình ảnh</strong>
                ) : (
                  <span className="text-muted">Không có ảnh đính kèm</span>
                )}
              </span>
            </div>

            {damagedItems.length > 0 && (
              <div className="receipt-row receipt-row--alert">
                <span className="receipt-row__label">Hạng mục cần xử lý:</span>
                <div className="receipt-row__chips">
                  {damagedItems.map((item, i) => (
                    <span key={i} className="damaged-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {surveyData.ghiChu && (
              <div className="receipt-note-box">
                <span className="receipt-note__label">Ghi chú hiện trường:</span>
                <p className="receipt-note__text">{surveyData.ghiChu}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="submitted-modal__actions">
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => {
              onClose()
              if (onViewHistory) onViewHistory()
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Xem Danh Sách Đã Gửi</span>
          </button>

          <button
            type="button"
            className="btn-action-secondary"
            onClick={() => {
              if (onPrintReport) onPrintReport(surveyData)
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>In / Xuất Biên Bản</span>
          </button>

          <button
            type="button"
            className="btn-action-outline"
            onClick={() => {
              onClose()
              if (onNewSurvey) onNewSurvey()
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Khảo Sát Phòng Khác</span>
          </button>
        </div>
      </div>
    </div>
  )
}
