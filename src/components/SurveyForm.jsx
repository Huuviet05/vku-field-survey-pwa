import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RoomPickerModal } from './RoomPickerModal'
import { PhotoUploader } from './PhotoUploader'
import { saveSurvey, manualSync } from '../db/indexedDB'

// ============================================================
// ZOD VALIDATION SCHEMA
// ============================================================
const surveySchema = z.object({
  maPhong: z
    .string()
    .min(1, 'Vui lòng chọn hoặc nhập mã phòng')
    .max(20, 'Mã phòng không vượt quá 20 ký tự'),

  khuVuc: z.string().optional(),
  floor: z.string().optional(),
  loaiPhong: z.string().optional(),
  tenPhong: z.string().optional(),

  surveyorName: z
    .string()
    .min(2, 'Vui lòng nhập họ tên người khảo sát')
    .max(100, 'Họ tên quá dài'),

  surveyorId: z
    .string()
    .min(1, 'Vui lòng nhập MSSV hoặc mã cán bộ')
    .max(30, 'Mã số không hợp lệ'),

  tinhTrang: z.enum(['tot', 'hu_hong_nhe', 'can_thay_the'], {
    required_error: 'Vui lòng chọn tình trạng tổng thể của phòng',
    invalid_type_error: 'Tình trạng không hợp lệ',
  }),

  priority: z.enum(['low', 'normal', 'urgent']).default('normal'),

  ghiChu: z
    .string()
    .max(800, 'Ghi chú không được vượt quá 800 ký tự')
    .optional()
    .or(z.literal('')),
})

// ============================================================
// OPTIONS & CONSTANTS (THIẾT KẾ TINH GỌN, KHÔNG LẠM DỤNG EMOJI)
// ============================================================
const TINH_TRANG_OPTIONS = [
  {
    value: 'tot',
    label: 'Tốt / Đạt Chuẩn',
    description: 'Cơ sở vật chất hoàn hảo, phục vụ tốt giảng dạy & học tập',
    color: '#10b981',
    bg: '#f0fdf4',
    badge: 'Đạt chuẩn',
  },
  {
    value: 'hu_hong_nhe',
    label: 'Hư Hỏng Nhẹ',
    description: 'Có một số lỗi nhỏ, vẫn dùng được nhưng cần lịch bảo trì',
    color: '#f59e0b',
    bg: '#fffbeb',
    badge: 'Cần bảo trì',
  },
  {
    value: 'can_thay_the',
    label: 'Cần Thay Thế',
    description: 'Hư hỏng nặng, nguy cơ mất an toàn hoặc gián đoạn học tập',
    color: '#ef4444',
    bg: '#fef2f2',
    badge: 'Khẩn cấp',
  },
]

const CHECKLIST_ITEMS = [
  { key: 'denDien', label: 'Hệ thống điện & Đèn' },
  { key: 'mayChieu', label: 'Máy chiếu & Màn hình' },
  { key: 'dieuHoa', label: 'Điều hòa & Quạt' },
  { key: 'banGhe', label: 'Bàn ghế phòng học' },
  { key: 'cuaSo', label: 'Cửa ra vào & Cửa sổ' },
  { key: 'wifi', label: 'Mạng WiFi / Internet' },
]

const QUICK_SUGGESTIONS = [
  'Máy chiếu bị mờ màu / nhòe hình',
  'Điều hòa kém lạnh / bị chảy nước',
  'Bàn ghế bị lỏng ốc vít / gãy chân',
  'Bóng đèn tuýp nhấp nháy liên tục',
  'Mạng WiFi chập chờn không kết nối',
  'Ổ cắm điện bị lỏng chân tiếp xúc',
]

// ============================================================
// SURVEY FORM COMPONENT
// ============================================================
export function SurveyForm({ isOnline, onSyncSuccess, onSurveySubmitted }) {
  const [isRoomPickerOpen, setIsRoomPickerOpen] = useState(false)
  const [photos, setPhotos] = useState([])
  const [checklist, setChecklist] = useState({
    denDien: 'good',
    mayChieu: 'good',
    dieuHoa: 'good',
    banGhe: 'good',
    cuaSo: 'good',
    wifi: 'good',
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(surveySchema),
    mode: 'onChange',
    defaultValues: {
      maPhong: 'K-201',
      khuVuc: 'Khu K (Tòa Trung Tâm & Giảng Đường K)',
      buildingCode: 'K',
      floor: 'Tầng 2',
      loaiPhong: 'Phòng học lý thuyết',
      tenPhong: 'Phòng Học Lý Thuyết K-201',
      surveyorName: 'Nguyễn Hữu Việt',
      surveyorId: '23IT309',
      tinhTrang: 'tot',
      priority: 'normal',
      ghiChu: '',
    },
  })

  const maPhongVal = watch('maPhong')
  const khuVucVal = watch('khuVuc')
  const floorVal = watch('floor')
  const loaiPhongVal = watch('loaiPhong')
  const tenPhongVal = watch('tenPhong')
  const ghiChuVal = watch('ghiChu') || ''
  const selectedTinhTrang = watch('tinhTrang')
  const priorityVal = watch('priority')

  const handleSelectRoom = (roomData) => {
    setValue('maPhong', roomData.maPhong, { shouldValidate: true })
    setValue('khuVuc', roomData.khuVuc)
    setValue('buildingCode', roomData.buildingCode)
    setValue('floor', roomData.floor)
    setValue('loaiPhong', roomData.loaiPhong)
    setValue('tenPhong', roomData.tenPhong)
  }

  const toggleChecklistItem = (key) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: prev[key] === 'good' ? 'damaged' : 'good',
    }))
  }

  const addSuggestion = (text) => {
    const current = ghiChuVal.trim()
    if (!current) {
      setValue('ghiChu', text, { shouldValidate: true })
    } else if (!current.includes(text)) {
      setValue('ghiChu', `${current}; ${text}`, { shouldValidate: true })
    }
  }

  const onSubmit = async (data) => {
    const surveyPayload = {
      ...data,
      checklist,
      photos,
      submittedAt: new Date().toISOString(),
    }

    try {
      const { historyId, refCode, isSynced } = await saveSurvey(surveyPayload, isOnline)
      const fullRecord = {
        ...surveyPayload,
        id: historyId,
        refCode,
        status: isSynced ? 'synced' : 'pending',
        timestamp: new Date().toISOString(),
      }

      if (!isSynced) {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            const sw = await navigator.serviceWorker.ready
            await sw.sync.register('sync-surveys')
          } catch {
            window.addEventListener(
              'online',
              async () => {
                await manualSync(onSyncSuccess)
              },
              { once: true }
            )
          }
        } else {
          window.addEventListener(
            'online',
            async () => {
              await manualSync(onSyncSuccess)
            },
            { once: true }
          )
        }
      }

      reset({
        maPhong: '',
        khuVuc: '',
        floor: '',
        loaiPhong: '',
        tenPhong: '',
        surveyorName: data.surveyorName,
        surveyorId: data.surveyorId,
        tinhTrang: 'tot',
        priority: 'normal',
        ghiChu: '',
      })
      setPhotos([])
      setChecklist({
        denDien: 'good',
        mayChieu: 'good',
        dieuHoa: 'good',
        banGhe: 'good',
        cuaSo: 'good',
        wifi: 'good',
      })

      if (onSurveySubmitted) {
        onSurveySubmitted(fullRecord, isOnline)
      }
    } catch (err) {
      console.error('[SurveyForm] Lỗi khi gửi phiếu:', err)
      alert('Có lỗi xảy ra khi lưu phiếu khảo sát. Vui lòng thử lại!')
    }
  }

  return (
    <div className="survey-form-container">
      <form
        id="survey-form"
        className="survey-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* ── CARD 1: VỊ TRÍ & PHÒNG KHẢO SÁT ── */}
        <section className="form-card-section" aria-labelledby="section-location">
          <div className="form-card-section__header">
            <span className="section-step-badge">1</span>
            <div>
              <h3 id="section-location" className="section-step-title">
                Vị Trí & Phòng Khảo Sát
              </h3>
              <p className="section-step-desc">
                Chọn phòng từ danh mục cơ sở VKU hoặc nhập mã phòng
              </p>
            </div>
          </div>

          <div className="form-card-section__body">
            {/* Room Display & Selector Box */}
            <div className="room-selector-box">
              {maPhongVal ? (
                <div className="room-selected-preview">
                  <div className="room-selected-info">
                    <div className="room-selected-tag">
                      <span className="room-code-badge">{maPhongVal}</span>
                      {floorVal && <span className="room-floor-tag">{floorVal}</span>}
                      {loaiPhongVal && (
                        <span className="room-type-tag">{loaiPhongVal}</span>
                      )}
                    </div>
                    <h4 className="room-selected-name">
                      {tenPhongVal || `Phòng ${maPhongVal}`}
                    </h4>
                    <p className="room-selected-building">
                      {khuVucVal || 'Cơ sở VKU - Trường ĐH CNTT & Truyền Thông Việt Hàn'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-change-room"
                    onClick={() => setIsRoomPickerOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span>Đổi phòng khác</span>
                  </button>
                </div>
              ) : (
                <div className="room-unselected-box">
                  <div className="room-unselected-text">
                    <div className="unselected-icon-badge">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 21h18" />
                        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                        <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
                        <path d="M14 9h1" /><path d="M14 13h1" /><path d="M14 17h1" />
                      </svg>
                    </div>
                    <div>
                      <strong>Chưa chọn phòng khảo sát</strong>
                      <p>Tra cứu nhanh trong danh mục phòng học, hội trường & lab VKU</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-select-room-modal"
                    onClick={() => setIsRoomPickerOpen(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Chọn phòng từ danh mục VKU</span>
                  </button>
                </div>
              )}

              {/* Hidden input for React Hook Form */}
              <input type="hidden" {...register('maPhong')} />
              <input type="hidden" {...register('khuVuc')} />
              <input type="hidden" {...register('floor')} />
              <input type="hidden" {...register('loaiPhong')} />
              <input type="hidden" {...register('tenPhong')} />

              {errors.maPhong && (
                <p className="form-error" role="alert">
                  <span className="error-dot" /> {errors.maPhong.message}
                </p>
              )}
            </div>

            {/* Surveyor Info Grid */}
            <div className="form-grid-2">
              <div className={`form-group ${errors.surveyorName ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="surveyorName">
                  Họ và tên người khảo sát
                  <span className="form-label__required">*</span>
                </label>
                <div className="input-wrapper input-wrapper--clean">
                  <input
                    id="surveyorName"
                    type="text"
                    className="form-input form-input--clean"
                    placeholder="VD: Nguyễn Hữu Việt"
                    {...register('surveyorName')}
                  />
                </div>
                {errors.surveyorName && (
                  <p className="form-error" role="alert">
                    <span className="error-dot" /> {errors.surveyorName.message}
                  </p>
                )}
              </div>

              <div className={`form-group ${errors.surveyorId ? 'form-group--error' : ''}`}>
                <label className="form-label" htmlFor="surveyorId">
                  Mã số SV / Mã cán bộ
                  <span className="form-label__required">*</span>
                </label>
                <div className="input-wrapper input-wrapper--clean">
                  <input
                    id="surveyorId"
                    type="text"
                    className="form-input form-input--clean"
                    placeholder="VD: 23IT309 hoặc CB-VKU-12"
                    {...register('surveyorId')}
                  />
                </div>
                {errors.surveyorId && (
                  <p className="form-error" role="alert">
                    <span className="error-dot" /> {errors.surveyorId.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 2: ĐÁNH GIÁ TÌNH TRẠNG & CHECKLIST THIẾT BỊ ── */}
        <section className="form-card-section" aria-labelledby="section-condition">
          <div className="form-card-section__header">
            <span className="section-step-badge">2</span>
            <div>
              <h3 id="section-condition" className="section-step-title">
                Đánh Giá Tình Trạng Cơ Sở Vật Chất
              </h3>
              <p className="section-step-desc">
                Chọn tình trạng chung và kiểm tra checklist các thiết bị
              </p>
            </div>
          </div>

          <div className="form-card-section__body">
            {/* Tình Trạng Phòng (Clean Radio Cards, NO Emojis, Clean Radio Ring) */}
            <div className="form-group">
              <label className="form-label">
                Tình trạng tổng quan
                <span className="form-label__required">*</span>
              </label>

              <div className="radio-group-modern" role="radiogroup">
                {TINH_TRANG_OPTIONS.map((option) => {
                  const isSelected = selectedTinhTrang === option.value
                  return (
                    <label
                      key={option.value}
                      className={`radio-card-modern ${isSelected ? 'radio-card-modern--selected' : ''}`}
                      style={{
                        '--card-theme-color': option.color,
                        '--card-theme-bg': option.bg,
                      }}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="sr-only"
                        {...register('tinhTrang')}
                      />
                      <div className="radio-card-modern__content">
                        <div className="radio-card-modern__top">
                          <span
                            className="radio-status-tag"
                            style={{ color: option.color, borderColor: option.color }}
                          >
                            {option.badge}
                          </span>
                          {/* Clean radio circle - single indicator only */}
                          <span className={`radio-dot-circle ${isSelected ? 'radio-dot-circle--checked' : ''}`} />
                        </div>
                        <h4 className="radio-card-modern__title">{option.label}</h4>
                        <p className="radio-card-modern__desc">{option.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {errors.tinhTrang && (
                <p className="form-error" role="alert">
                  <span className="error-dot" /> {errors.tinhTrang.message}
                </p>
              )}
            </div>

            {/* Mức độ ưu tiên (Clean text buttons, NO emoji dots) */}
            <div className="form-group">
              <label className="form-label">Mức độ ưu tiên sửa chữa / can thiệp:</label>
              <div className="priority-segmented">
                {[
                  { id: 'low', label: 'Bình thường', level: 'low' },
                  { id: 'normal', label: 'Cần lưu ý', level: 'normal' },
                  { id: 'urgent', label: 'Khẩn cấp', level: 'urgent' },
                ].map((p) => (
                  <label
                    key={p.id}
                    className={`priority-pill priority-pill--${p.level} ${priorityVal === p.id ? 'priority-pill--active' : ''}`}
                  >
                    <input
                      type="radio"
                      value={p.id}
                      className="sr-only"
                      {...register('priority')}
                    />
                    <span className="priority-dot" />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checklist Chi Tiết Các Hạng Mục (Clean switches, NO emojis, NO redundant ticks) */}
            <div className="form-group">
              <label className="form-label">
                Kiểm tra chi tiết hạng mục thiết bị trong phòng:
                <small className="text-muted ms-2">(Nhấn để chuyển trạng thái Bình thường / Báo hỏng)</small>
              </label>

              <div className="checklist-toggle-grid">
                {CHECKLIST_ITEMS.map((item) => {
                  const isDamaged = checklist[item.key] === 'damaged'
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`checklist-btn ${isDamaged ? 'checklist-btn--damaged' : 'checklist-btn--good'}`}
                      onClick={() => toggleChecklistItem(item.key)}
                      aria-pressed={isDamaged}
                    >
                      <span className="checklist-btn__label">{item.label}</span>
                      <span className="checklist-btn__badge">
                        {isDamaged ? 'Báo hỏng' : 'Đạt chuẩn'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 3: GHI CHÚ & KIẾN NGHỊ ── */}
        <section className="form-card-section" aria-labelledby="section-notes">
          <div className="form-card-section__header">
            <span className="section-step-badge">3</span>
            <div>
              <h3 id="section-notes" className="section-step-title">
                Ghi Chú & Kiến Nghị Xử Lý
              </h3>
              <p className="section-step-desc">
                Mô tả chi tiết vị trí sự cố hoặc ghi nhận đề xuất
              </p>
            </div>
          </div>

          <div className="form-card-section__body">
            {/* Clean Suggestion Chips (NO plus sign / emoji) */}
            <div className="suggestion-chips-box">
              <span className="suggestion-label">Gợi ý nhanh:</span>
              <div className="suggestion-chips-list">
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => addSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="textarea-wrapper">
                <textarea
                  id="ghiChu"
                  className={`form-textarea ${errors.ghiChu ? 'form-textarea--error' : ''}`}
                  placeholder="Mô tả cụ thể vị trí hư hỏng, ví dụ: Bàn số 5 dãy 2 bị lỏng bản lề, điều hòa phía cửa sổ bị nhỏ nước..."
                  rows={4}
                  {...register('ghiChu')}
                />
                <div className="textarea-footer">
                  {errors.ghiChu && (
                    <p className="form-error">
                      <span className="error-dot" /> {errors.ghiChu.message}
                    </p>
                  )}
                  <span
                    className={`char-counter ${ghiChuVal.length > 700 ? 'char-counter--warning' : ''}`}
                  >
                    {ghiChuVal.length} / 800 ký tự
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 4: HÌNH ẢNH MINH CHỨNG ── */}
        <section className="form-card-section" aria-labelledby="section-photos">
          <div className="form-card-section__header">
            <span className="section-step-badge">4</span>
            <div>
              <h3 id="section-photos" className="section-step-title">
                Hình Ảnh Minh Chứng Hiện Trường
              </h3>
              <p className="section-step-desc">
                Chụp trực tiếp từ camera hoặc tải ảnh từ thư viện máy
              </p>
            </div>
          </div>

          <div className="form-card-section__body">
            <PhotoUploader
              photos={photos}
              onChange={setPhotos}
              maxPhotos={5}
            />
          </div>
        </section>

        {/* ── SUBMIT FOOTER BAR (CLEAN, NO EMOJIS) ── */}
        <div className="form-sticky-footer">
          <div className="sticky-footer__info">
            <span
              className={`submit-mode-pill ${isOnline ? 'submit-mode-pill--online' : 'submit-mode-pill--offline'}`}
            >
              <span className="mode-dot" />
              <span>{isOnline ? 'Trực tuyến (Gửi ngay)' : 'Ngoại tuyến (Lưu bộ nhớ máy)'}</span>
            </span>
          </div>

          <div className="sticky-footer__actions">
            <button
              type="button"
              className="btn-reset-form"
              onClick={() => {
                if (window.confirm('Bạn có muốn làm mới toàn bộ nội dung phiếu?')) {
                  reset()
                  setPhotos([])
                }
              }}
            >
              Làm mới
            </button>

            <button
              id="submit-btn"
              type="submit"
              className={`btn-submit-main ${isSubmitting ? 'btn-submit-main--loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" />
                  <span>Đang xử lý & lưu dữ liệu...</span>
                </>
              ) : (
                <span>{isOnline ? 'Gửi Báo Cáo Khảo Sát' : 'Lưu Báo Cáo Offline'}</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Room Picker Modal */}
      <RoomPickerModal
        isOpen={isRoomPickerOpen}
        onClose={() => setIsRoomPickerOpen(false)}
        onSelectRoom={handleSelectRoom}
        currentRoomId={maPhongVal}
      />
    </div>
  )
}
