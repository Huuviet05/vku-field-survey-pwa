import { useMemo } from 'react'
import { BUILDINGS } from '../data/vkuRooms'

// ============================================================
// SurveyStats Component - BẢNG ĐIỀU KHIỂN THỐNG KÊ & TIẾN ĐỘ KHẢO SÁT
// Giao diện tinh gọn, chuyên nghiệp, loại bỏ emoji
// ============================================================

export function SurveyStats({ surveys = [], onGoToForm }) {
  const stats = useMemo(() => {
    const total = surveys.length
    if (total === 0) {
      return {
        total: 0,
        tot: 0,
        huHongNhe: 0,
        canThayThe: 0,
        synced: 0,
        pending: 0,
        totalPhotos: 0,
        buildingCounts: {},
        equipmentIssues: {},
      }
    }

    let tot = 0
    let huHongNhe = 0
    let canThayThe = 0
    let synced = 0
    let pending = 0
    let totalPhotos = 0

    const buildingCounts = {}
    const equipmentIssues = {
      denDien: { name: 'Đèn & Hệ thống điện', count: 0 },
      mayChieu: { name: 'Máy chiếu / Màn hình', count: 0 },
      dieuHoa: { name: 'Điều hòa / Quạt', count: 0 },
      banGhe: { name: 'Bàn ghế giảng đường', count: 0 },
      cuaSo: { name: 'Cửa & Cửa sổ', count: 0 },
      wifi: { name: 'Mạng WiFi / Internet', count: 0 },
    }

    surveys.forEach((s) => {
      if (s.tinhTrang === 'tot') tot++
      else if (s.tinhTrang === 'hu_hong_nhe') huHongNhe++
      else if (s.tinhTrang === 'can_thay_the') canThayThe++

      if (s.status === 'synced') synced++
      else if (s.status === 'pending') pending++

      if (s.photos) totalPhotos += s.photos.length

      const bCode = s.buildingCode || 'Khác'
      buildingCounts[bCode] = (buildingCounts[bCode] || 0) + 1

      if (s.checklist) {
        Object.entries(s.checklist).forEach(([k, val]) => {
          if (val === 'damaged' && equipmentIssues[k]) {
            equipmentIssues[k].count++
          }
        })
      }
    })

    return {
      total,
      tot,
      huHongNhe,
      canThayThe,
      synced,
      pending,
      totalPhotos,
      buildingCounts,
      equipmentIssues,
    }
  }, [surveys])

  const calcPercent = (val) => {
    if (stats.total === 0) return '0%'
    return `${Math.round((val / stats.total) * 100)}%`
  }

  return (
    <div className="survey-stats-view">
      {/* Header */}
      <div className="stats-header">
        <div>
          <h2 className="stats-title">
            Thống Kê & Báo Cáo Hiện Trường VKU
          </h2>
          <p className="stats-subtitle">
            Dữ liệu tổng hợp tình trạng cơ sở vật chất từ {stats.total} lượt khảo sát
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onGoToForm}>
          Khảo Sát Mới
        </button>
      </div>

      {/* KPI Cards Row (Clean SVGs, NO Emojis) */}
      <div className="stats-kpi-grid">
        {/* Total card */}
        <div className="kpi-card kpi-card--total">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Tổng Lượt Khảo Sát</span>
            <span className="kpi-card__badge-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              </svg>
            </span>
          </div>
          <div className="kpi-card__value">{stats.total}</div>
          <div className="kpi-card__sub">
            <span>{stats.synced} đã gửi máy chủ</span> · <span>{stats.pending} chờ đồng bộ</span>
          </div>
        </div>

        {/* Good card */}
        <div className="kpi-card kpi-card--good">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Đạt Chuẩn (Tốt)</span>
            <span className="kpi-card__badge-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
          </div>
          <div className="kpi-card__value">{stats.tot}</div>
          <div className="kpi-card__sub text-success">
            <strong>{calcPercent(stats.tot)}</strong> trên tổng số phòng
          </div>
        </div>

        {/* Warning card */}
        <div className="kpi-card kpi-card--warning">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Hư Hỏng Nhẹ</span>
            <span className="kpi-card__badge-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="kpi-card__value">{stats.huHongNhe}</div>
          <div className="kpi-card__sub text-warning">
            <strong>{calcPercent(stats.huHongNhe)}</strong> cần kế hoạch bảo trì
          </div>
        </div>

        {/* Danger card */}
        <div className="kpi-card kpi-card--danger">
          <div className="kpi-card__header">
            <span className="kpi-card__label">Cần Thay Thế</span>
            <span className="kpi-card__badge-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </span>
          </div>
          <div className="kpi-card__value">{stats.canThayThe}</div>
          <div className="kpi-card__sub text-danger">
            <strong>{calcPercent(stats.canThayThe)}</strong> mức ưu tiên khẩn cấp
          </div>
        </div>
      </div>

      {/* Progress & Breakdown Section */}
      <div className="stats-sections-grid">
        {/* Progress by building */}
        <div className="stats-card">
          <h3 className="stats-card__title">
            Phân Bổ Theo Tòa Nhà / Khu Vực
          </h3>
          <p className="stats-card__subtitle">
            Số lượng phòng đã được khảo sát tại từng cơ sở VKU
          </p>

          <div className="building-progress-list">
            {BUILDINGS.filter((b) => b.id !== 'all').map((b) => {
              const count = stats.buildingCounts[b.code] || 0
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={b.code} className="building-progress-item">
                  <div className="building-progress__info">
                    <span className="building-name">
                      {b.name}
                    </span>
                    <span className="building-count">
                      <strong>{count}</strong> phòng ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Equipment issues breakdown */}
        <div className="stats-card">
          <h3 className="stats-card__title">
            Các Hạng Mục Thiết Bị Báo Lỗi Nhiều Nhất
          </h3>
          <p className="stats-card__subtitle">
            Tần suất ghi nhận hư hỏng cần đội kỹ thuật VKU xử lý
          </p>

          <div className="equipment-issue-list">
            {Object.entries(stats.equipmentIssues).map(([key, item]) => {
              const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
              return (
                <div key={key} className="equipment-issue-item">
                  <div className="equipment-issue__info">
                    <span className="equipment-issue__name">
                      {item.name}
                    </span>
                    <span className="equipment-issue__badge">
                      {item.count} phòng báo lỗi
                    </span>
                  </div>
                  <div className="progress-bar-track progress-bar-track--danger">
                    <div
                      className="progress-bar-fill progress-bar-fill--danger"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="stats-photo-summary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div>
              <strong>{stats.totalPhotos} ảnh minh chứng hiện trường</strong>
              <p className="text-muted">Đã nén tối ưu và lưu an toàn trong cơ sở dữ liệu PWA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
