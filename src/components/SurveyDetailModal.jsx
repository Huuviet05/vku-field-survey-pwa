import { useState } from 'react'
import { formatBytes } from '../utils/imageCompressor'

// ============================================================
// SurveyDetailModal Component - CHI TIẾT ĐẦY ĐỦ 1 PHIẾU KHẢO SÁT
// Giao diện chuẩn mực, loại bỏ emoji gây khó chịu
// ============================================================

export function SurveyDetailModal({
  isOpen,
  survey,
  onClose,
  onPrint,
  onDelete,
}) {
  const [activePhoto, setActivePhoto] = useState(null)

  if (!isOpen || !survey) return null

  const isOnline = survey.status === 'synced'

  const statusMap = {
    tot: { label: 'Tốt / Đạt chuẩn', color: '#10b981', bg: '#f0fdf4' },
    hu_hong_nhe: { label: 'Hư hỏng nhẹ', color: '#f59e0b', bg: '#fffbeb' },
    can_thay_the: { label: 'Cần thay thế', color: '#ef4444', bg: '#fef2f2' },
  }

  const priorityMap = {
    low: { label: 'Bình thường', color: '#10b981' },
    normal: { label: 'Cần lưu ý', color: '#f59e0b' },
    urgent: { label: 'Khẩn cấp', color: '#ef4444' },
  }

  const checklistLabels = [
    { key: 'denDien', label: 'Hệ thống điện & Đèn chiếu sáng' },
    { key: 'mayChieu', label: 'Máy chiếu / Màn hình giảng dạy' },
    { key: 'dieuHoa', label: 'Điều hòa nhiệt độ & Quạt' },
    { key: 'banGhe', label: 'Bàn ghế giảng đường / Ghế ngồi' },
    { key: 'cuaSo', label: 'Cửa ra vào & Cửa sổ thông gió' },
    { key: 'wifi', label: 'Mạng WiFi / Đường truyền mạng' },
  ]

  const statusInfo = statusMap[survey.tinhTrang] || statusMap.tot
  const priorityInfo = priorityMap[survey.priority] || priorityMap.normal

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container modal-container--lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__title-group">
            <div className="modal-header__icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div className="detail-modal-ref-row">
                <h2 className="modal-title">Phiếu Khảo Sát {survey.maPhong}</h2>
                <span className="detail-ref-code">{survey.refCode}</span>
              </div>
              <p className="modal-subtitle">
                Ghi nhận lúc: {new Date(survey.timestamp).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng chi tiết">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body detail-modal-body">
          {/* Top Status Banner */}
          <div className="detail-status-banner">
            <div className="detail-status-item">
              <span className="detail-label">Tình Trạng Tổng Thể:</span>
              <span
                className="detail-status-pill"
                style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="detail-status-item">
              <span className="detail-label">Mức Độ Ưu Tiên:</span>
              <span
                className="detail-priority-pill"
                style={{ color: priorityInfo.color, borderColor: priorityInfo.color }}
              >
                {priorityInfo.label}
              </span>
            </div>

            <div className="detail-status-item">
              <span className="detail-label">Trạng Thái Đồng Bộ:</span>
              <span
                className={`receipt-sync-pill ${isOnline ? 'receipt-sync-pill--online' : 'receipt-sync-pill--offline'}`}
              >
                {isOnline ? 'Đã gửi máy chủ' : 'Chờ đồng bộ (Offline)'}
              </span>
            </div>
          </div>

          {/* Section: Vị Trí & Người Khảo Sát */}
          <div className="detail-section">
            <h3 className="detail-section__title">Vị Trí & Người Thực Hiện</h3>
            <div className="detail-grid-2">
              <div className="detail-field">
                <span className="detail-field__label">Tòa nhà / Khu vực:</span>
                <span className="detail-field__value">{survey.khuVuc || 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-field__label">Tầng & Loại phòng:</span>
                <span className="detail-field__value">
                  {survey.floor || 'Tầng 1'} — {survey.loaiPhong || 'Phòng học'}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-field__label">Người khảo sát:</span>
                <span className="detail-field__value">
                  {survey.surveyorName || 'Cán bộ khảo sát'}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-field__label">Mã số / MSSV:</span>
                <span className="detail-field__value">
                  {survey.surveyorId || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Checklist Thiết Bị */}
          {survey.checklist && (
            <div className="detail-section">
              <h3 className="detail-section__title">Tình Trạng Hạng Mục Thiết Bị</h3>
              <div className="detail-checklist-grid">
                {checklistLabels.map((item) => {
                  const val = survey.checklist[item.key]
                  const isDamaged = val === 'damaged'
                  return (
                    <div
                      key={item.key}
                      className={`checklist-item-pill ${isDamaged ? 'checklist-item-pill--damaged' : 'checklist-item-pill--good'}`}
                    >
                      <span className="checklist-item__name">{item.label}</span>
                      <span className="checklist-item__status">
                        {isDamaged ? 'Báo hỏng' : 'Đạt chuẩn'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section: Ghi chú */}
          <div className="detail-section">
            <h3 className="detail-section__title">Ghi Chú & Kiến Nghị Hiện Trường</h3>
            <div className="detail-notes-box">
              {survey.ghiChu ? (
                <p>{survey.ghiChu}</p>
              ) : (
                <p className="text-muted fst-italic">Không có ghi chú thêm.</p>
              )}
            </div>
          </div>

          {/* Section: Hình Ảnh Minh Chứng */}
          <div className="detail-section">
            <h3 className="detail-section__title">
              Hình Ảnh Minh Chứng ({survey.photos?.length || 0})
            </h3>
            {survey.photos && survey.photos.length > 0 ? (
              <div className="detail-photos-grid">
                {survey.photos.map((photo, i) => (
                  <div
                    key={photo.id || i}
                    className="detail-photo-card"
                    onClick={() => setActivePhoto(photo)}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || `Ảnh ${i + 1}`}
                      className="detail-photo-img"
                    />
                    <div className="detail-photo-meta">
                      <span className="detail-photo-caption">
                        {photo.caption || `Hình ảnh #${i + 1}`}
                      </span>
                      {photo.size && (
                        <span className="detail-photo-size">{formatBytes(photo.size)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="detail-photos-empty">
                <span className="text-muted">Không có hình ảnh nào được đính kèm.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer detail-modal-footer">
          <div className="detail-footer-left">
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa phiếu khảo sát này không?')) {
                  onDelete(survey.id)
                  onClose()
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Xóa Phiếu</span>
            </button>
          </div>

          <div className="detail-footer-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Đóng
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onPrint(survey)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>In Biên Bản</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for detail photos */}
      {activePhoto && (
        <div
          className="lightbox-overlay"
          onClick={() => setActivePhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span className="lightbox-title">
                {activePhoto.caption || 'Hình ảnh khảo sát hiện trường'}
              </span>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setActivePhoto(null)}
              >
                ✕
              </button>
            </div>
            <div className="lightbox-body">
              <img
                src={activePhoto.dataUrl}
                alt="Ảnh phóng to"
                className="lightbox-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
