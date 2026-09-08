import { useState, useRef } from 'react'
import { compressImage, formatBytes } from '../utils/imageCompressor'

// ============================================================
// PhotoUploader Component - BỘ CHỤP & QUẢN LÝ ẢNH KHẢO SÁT CHUYÊN NGHIỆP
// Chụp trực tiếp từ camera, chọn nhiều ảnh, nén canvas, chú thích, zoom lightbox
// ============================================================

export function PhotoUploader({ photos = [], onChange, maxPhotos = 5 }) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // Xử lý nén và thêm các file ảnh mới
  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return

    const availableSlots = maxPhotos - photos.length
    if (availableSlots <= 0) {
      alert(`Bạn đã đạt tối đa ${maxPhotos} hình ảnh cho phiếu này!`)
      return
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots)
    setIsCompressing(true)

    try {
      const compressedList = []
      for (const file of filesToProcess) {
        // Chỉ xử lý file ảnh
        if (!file.type.startsWith('image/')) continue

        const compressed = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.78,
          mimeType: 'image/jpeg',
        })
        compressedList.push(compressed)
      }

      onChange([...photos, ...compressedList])
    } catch (err) {
      console.error('[PhotoUploader] ❌ Lỗi xử lý nén ảnh:', err)
      alert('Không thể xử lý hình ảnh. Vui lòng thử lại!')
    } finally {
      setIsCompressing(false)
      // Reset input files
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  // Xóa 1 ảnh
  const handleRemovePhoto = (indexToRemove) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove)
    onChange(updated)
    if (activeLightboxIndex === indexToRemove) {
      setActiveLightboxIndex(null)
    }
  }

  // Cập nhật chú thích cho 1 ảnh
  const handleCaptionChange = (index, newCaption) => {
    const updated = photos.map((p, idx) => {
      if (idx === index) {
        return { ...p, caption: newCaption }
      }
      return p
    })
    onChange(updated)
  }

  return (
    <div className="photo-uploader">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="sr-only"
        style={{ display: 'none' }}
        onChange={(e) => processFiles(e.target.files)}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        multiple
        className="sr-only"
        style={{ display: 'none' }}
        onChange={(e) => processFiles(e.target.files)}
      />

      {/* Action Buttons Bar */}
      <div className="photo-uploader__actions">
        <div className="photo-action-buttons">
          <button
            type="button"
            className="photo-btn photo-btn--camera"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing || photos.length >= maxPhotos}
          >
            <span className="photo-btn__icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <div className="photo-btn__text">
              <strong>Chụp ảnh hiện trường</strong>
              <small>Mở camera máy</small>
            </div>
          </button>

          <button
            type="button"
            className="photo-btn photo-btn--gallery"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isCompressing || photos.length >= maxPhotos}
          >
            <span className="photo-btn__icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <div className="photo-btn__text">
              <strong>Chọn từ thư viện</strong>
              <small>Tải lên nhiều ảnh</small>
            </div>
          </button>
        </div>

        {/* Counter & Hint */}
        <div className="photo-meta-bar">
          <span className="photo-count-badge">
            Đã đính kèm: <strong>{photos.length}/{maxPhotos}</strong> ảnh
          </span>
          <span className="photo-compression-hint">
            Tự động nén ảnh tối ưu lưu trữ PWA
          </span>
        </div>
      </div>

      {/* Loading state during compression */}
      {isCompressing && (
        <div className="photo-compressing-banner">
          <span className="btn-spinner" aria-hidden="true" />
          <span>Đang tối ưu & nén hình ảnh... Vui lòng đợi chút nhé!</span>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div key={photo.id || index} className="photo-item-card">
              <div
                className="photo-thumbnail-wrapper"
                onClick={() => setActiveLightboxIndex(index)}
                title="Nhấn để phóng to xem chi tiết"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || `Ảnh khảo sát ${index + 1}`}
                  className="photo-thumbnail"
                />
                <div className="photo-thumbnail__overlay">
                  <span className="photo-zoom-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </span>
                </div>
                <span className="photo-badge-index">#{index + 1}</span>
                {photo.size && (
                  <span className="photo-badge-size">{formatBytes(photo.size)}</span>
                )}
                <button
                  type="button"
                  className="photo-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemovePhoto(index)
                  }}
                  aria-label={`Xóa ảnh ${index + 1}`}
                >
                  ✕
                </button>
              </div>

              {/* Caption Input */}
              <div className="photo-caption-box">
                <input
                  type="text"
                  className="photo-caption-input"
                  placeholder="Ghi chú ảnh này (VD: Bàn gãy chân, ổ điện hở...)"
                  value={photo.caption || ''}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && photos[activeLightboxIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setActiveLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-title">
                <span>📷 Ảnh minh chứng #{activeLightboxIndex + 1}</span>
                {photos[activeLightboxIndex].size && (
                  <span className="lightbox-size-tag">
                    {formatBytes(photos[activeLightboxIndex].size)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setActiveLightboxIndex(null)}
                aria-label="Đóng ảnh phóng to"
              >
                ✕
              </button>
            </div>

            <div className="lightbox-body">
              <img
                src={photos[activeLightboxIndex].dataUrl}
                alt="Ảnh phóng to chi tiết"
                className="lightbox-image"
              />
            </div>

            {photos[activeLightboxIndex].caption && (
              <div className="lightbox-caption">
                <strong>Ghi chú:</strong> {photos[activeLightboxIndex].caption}
              </div>
            )}

            <div className="lightbox-footer">
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={activeLightboxIndex === 0}
                onClick={() => setActiveLightboxIndex((prev) => prev - 1)}
              >
                ← Ảnh trước
              </button>
              <span className="lightbox-counter">
                {activeLightboxIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={activeLightboxIndex === photos.length - 1}
                onClick={() => setActiveLightboxIndex((prev) => prev + 1)}
              >
                Ảnh tiếp →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
