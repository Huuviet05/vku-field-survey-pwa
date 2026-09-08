import { useState, useMemo } from 'react'
import { BUILDINGS } from '../data/vkuRooms'

// ============================================================
// SurveyHistory Component - QUẢN LÝ LỊCH SỬ & ĐỒNG BỘ PHIẾU KHẢO SÁT
// Thiết kế chuẩn đại học tinh gọn, loại bỏ emoji gây rối mắt
// ============================================================

export function SurveyHistory({
  surveys = [],
  onViewDetail,
  onPrint,
  onDelete,
  onSyncAll,
  isSyncing,
  isOnline,
  onGoToForm,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [syncFilter, setSyncFilter] = useState('all') // 'all' | 'synced' | 'pending'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'tot' | 'hu_hong_nhe' | 'can_thay_the'
  const [buildingFilter, setBuildingFilter] = useState('all')

  const filteredSurveys = useMemo(() => {
    return surveys.filter((item) => {
      if (syncFilter !== 'all' && item.status !== syncFilter) {
        return false
      }

      if (statusFilter !== 'all' && item.tinhTrang !== statusFilter) {
        return false
      }

      if (buildingFilter !== 'all' && item.buildingCode !== buildingFilter) {
        return false
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchRoom = item.maPhong?.toLowerCase().includes(query)
        const matchRef = item.refCode?.toLowerCase().includes(query)
        const matchSurveyor = item.surveyorName?.toLowerCase().includes(query)
        const matchNotes = item.ghiChu?.toLowerCase().includes(query)
        const matchBuilding = item.khuVuc?.toLowerCase().includes(query)
        return matchRoom || matchRef || matchSurveyor || matchNotes || matchBuilding
      }

      return true
    })
  }, [surveys, syncFilter, statusFilter, buildingFilter, searchQuery])

  const handleExportCSV = () => {
    if (surveys.length === 0) {
      alert('Không có dữ liệu để xuất!')
      return
    }

    const headers = [
      'Mã biên bản',
      'Mã phòng',
      'Khu vực',
      'Tầng',
      'Loại phòng',
      'Tình trạng',
      'Mức độ ưu tiên',
      'Người khảo sát',
      'Mã SV/CB',
      'Thời gian',
      'Trạng thái đồng bộ',
      'Số ảnh đính kèm',
      'Ghi chú',
    ]

    const statusNames = {
      tot: 'Tốt / Đạt chuẩn',
      hu_hong_nhe: 'Hư hỏng nhẹ',
      can_thay_the: 'Cần thay thế',
    }

    const rows = surveys.map((s) => [
      `"${s.refCode || ''}"`,
      `"${s.maPhong || ''}"`,
      `"${s.khuVuc || ''}"`,
      `"${s.floor || ''}"`,
      `"${s.loaiPhong || ''}"`,
      `"${statusNames[s.tinhTrang] || s.tinhTrang}"`,
      `"${s.priority || 'normal'}"`,
      `"${s.surveyorName || ''}"`,
      `"${s.surveyorId || ''}"`,
      `"${new Date(s.timestamp).toLocaleString('vi-VN')}"`,
      `"${s.status === 'synced' ? 'Đã gửi máy chủ' : 'Chờ đồng bộ'}"`,
      s.photos?.length || 0,
      `"${(s.ghiChu || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bao_cao_khao_sat_VKU_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    if (surveys.length === 0) return
    const jsonStr = JSON.stringify(surveys, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VKU_Survey_Backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pendingCount = surveys.filter((s) => s.status === 'pending').length

  const statusBadges = {
    tot: { label: 'Đạt chuẩn', class: 'status-tag--good' },
    hu_hong_nhe: { label: 'Hư hỏng nhẹ', class: 'status-tag--warning' },
    can_thay_the: { label: 'Cần thay thế', class: 'status-tag--danger' },
  }

  return (
    <div className="survey-history-view">
      {/* Top Action Bar */}
      <div className="history-header">
        <div className="history-header__titles">
          <h2 className="history-title">
            Lịch Sử Khảo Sát Hiện Trường
          </h2>
          <p className="history-subtitle">
            Tổng cộng <strong>{surveys.length}</strong> phiếu khảo sát đã ghi nhận
            {pendingCount > 0 && (
              <span className="history-pending-indicator">
                {' '}· <strong className="text-warning">{pendingCount}</strong> phiếu đang chờ đồng bộ
              </span>
            )}
          </p>
        </div>

        <div className="history-header__actions">
          {pendingCount > 0 && (
            <button
              type="button"
              className="btn-sync-all"
              onClick={onSyncAll}
              disabled={isSyncing || !isOnline}
              title={!isOnline ? 'Cần kết nối internet để đồng bộ' : 'Đồng bộ các phiếu offline ngay'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={isSyncing ? 'sync-icon--spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{isSyncing ? 'Đang đồng bộ...' : `Đồng bộ ngay (${pendingCount})`}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCSV}
            title="Tải bảng tính báo cáo Excel/CSV"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            className="btn-export-json"
            onClick={handleExportJSON}
            title="Sao lưu toàn bộ dữ liệu dưới dạng JSON"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Sao lưu</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="history-filters-card">
        <div className="history-search-row">
          <div className="search-bar-wrapper flex-1">
            <span className="search-bar__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-bar__input"
              placeholder="Tìm theo mã phòng, mã biên bản, người làm, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-bar__clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="history-filter-pills-row">
          {/* Sync status filter */}
          <div className="filter-group-inline">
            <span className="filter-label-inline">Đồng bộ:</span>
            <div className="segmented-tabs segmented-tabs--sm">
              <button
                type="button"
                className={`segmented-tab ${syncFilter === 'all' ? 'segmented-tab--active' : ''}`}
                onClick={() => setSyncFilter('all')}
              >
                Tất cả ({surveys.length})
              </button>
              <button
                type="button"
                className={`segmented-tab ${syncFilter === 'synced' ? 'segmented-tab--active' : ''}`}
                onClick={() => setSyncFilter('synced')}
              >
                Đã gửi ({surveys.filter((s) => s.status === 'synced').length})
              </button>
              <button
                type="button"
                className={`segmented-tab ${syncFilter === 'pending' ? 'segmented-tab--active' : ''}`}
                onClick={() => setSyncFilter('pending')}
              >
                Chờ đồng bộ ({pendingCount})
              </button>
            </div>
          </div>

          {/* Room status filter */}
          <div className="filter-group-inline">
            <span className="filter-label-inline">Tình trạng:</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo tình trạng"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="tot">Đạt chuẩn</option>
              <option value="hu_hong_nhe">Hư hỏng nhẹ</option>
              <option value="can_thay_the">Cần thay thế</option>
            </select>
          </div>

          {/* Building filter */}
          <div className="filter-group-inline">
            <span className="filter-label-inline">Khu vực:</span>
            <select
              className="filter-select"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              aria-label="Lọc theo khu vực"
            >
              {BUILDINGS.map((b) => (
                <option key={b.code} value={b.code === 'ALL' ? 'all' : b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="history-list">
        {filteredSurveys.length > 0 ? (
          filteredSurveys.map((item) => {
            const badge = statusBadges[item.tinhTrang] || statusBadges.tot
            const isSynced = item.status === 'synced'
            const photosCount = item.photos?.length || 0

            return (
              <div key={item.id} className="history-card">
                <div className="history-card__main">
                  {/* Top line: Room code & Status tags */}
                  <div className="history-card__top">
                    <div className="history-card__room-title">
                      <span className="history-card__room-code">{item.maPhong}</span>
                      <span className="history-card__ref-code">{item.refCode}</span>
                    </div>

                    <div className="history-card__badges">
                      <span className={`status-tag ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span
                        className={`sync-tag ${isSynced ? 'sync-tag--synced' : 'sync-tag--pending'}`}
                        title={isSynced ? 'Đã gửi máy chủ' : 'Chưa đồng bộ (Offline)'}
                      >
                        {isSynced ? 'Đã gửi' : 'Chờ sync'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Building & Details */}
                  <div className="history-card__details">
                    <span className="history-detail-chip">
                      {item.khuVuc || 'VKU'}
                    </span>
                    {item.floor && (
                      <span className="history-detail-chip">{item.floor}</span>
                    )}
                    <span className="history-detail-chip">
                      {item.surveyorName || 'Cán bộ khảo sát'}
                    </span>
                    <span className="history-detail-chip">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </span>
                    {photosCount > 0 && (
                      <span className="history-detail-chip history-detail-chip--photos">
                        {photosCount} ảnh
                      </span>
                    )}
                  </div>

                  {/* Notes snippet if any */}
                  {item.ghiChu && (
                    <p className="history-card__notes-snippet">
                      {item.ghiChu}
                    </p>
                  )}

                  {/* Photos preview strip */}
                  {photosCount > 0 && (
                    <div className="history-photos-strip">
                      {item.photos.slice(0, 4).map((p, pIdx) => (
                        <img
                          key={pIdx}
                          src={p.dataUrl}
                          alt="Thumbnail"
                          className="history-thumb-img"
                          onClick={() => onViewDetail(item)}
                        />
                      ))}
                      {photosCount > 4 && (
                        <span className="history-more-photos">+{photosCount - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side / Bottom Actions */}
                <div className="history-card__actions">
                  <button
                    type="button"
                    className="btn-card-action btn-card-action--detail"
                    onClick={() => onViewDetail(item)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Chi tiết</span>
                  </button>

                  <button
                    type="button"
                    className="btn-card-action btn-card-action--print"
                    onClick={() => onPrint(item)}
                    title="In biên bản khảo sát"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>In</span>
                  </button>

                  <button
                    type="button"
                    className="btn-card-action btn-card-action--delete"
                    onClick={() => {
                      if (window.confirm(`Xóa phiếu khảo sát phòng ${item.maPhong}?`)) {
                        onDelete(item.id)
                      }
                    }}
                    title="Xóa phiếu này"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="history-empty-card">
            <h3>Không tìm thấy phiếu khảo sát nào</h3>
            <p>
              {searchQuery || syncFilter !== 'all' || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'
                : 'Chưa có phiếu khảo sát nào được ghi nhận.'}
            </p>
            <button type="button" className="btn-primary mt-3" onClick={onGoToForm}>
              Tạo Phiếu Khảo Sát Mới
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
