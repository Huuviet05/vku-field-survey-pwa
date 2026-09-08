import { useState, useMemo } from 'react'
import { VKU_ROOMS, BUILDINGS, ROOM_TYPES } from '../data/vkuRooms'

// ============================================================
// RoomPickerModal Component - MODAL CHỌN PHÒNG KHẢO SÁT VKU
// Tìm kiếm nhanh & lọc theo Khu vực / Tầng / Loại phòng
// ============================================================

export function RoomPickerModal({ isOpen, onClose, onSelectRoom, currentRoomId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [customRoomCode, setCustomRoomCode] = useState('')
  const [customBuilding, setCustomBuilding] = useState('K')

  // Lọc danh sách phòng theo query & filters
  const filteredRooms = useMemo(() => {
    return VKU_ROOMS.filter((room) => {
      // Lọc theo tòa nhà
      if (selectedBuilding !== 'all' && room.buildingCode !== selectedBuilding) {
        return false
      }

      // Lọc theo loại phòng
      if (selectedType !== 'all') {
        const typeMatch = ROOM_TYPES.find((t) => t.id === selectedType)
        if (typeMatch && !room.type.toLowerCase().includes(typeMatch.name.toLowerCase().split('/')[0].trim())) {
          return false
        }
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchId = room.id.toLowerCase().includes(query)
        const matchName = room.name.toLowerCase().includes(query)
        const matchBuilding = room.building.toLowerCase().includes(query)
        const matchFloor = room.floor.toLowerCase().includes(query)
        return matchId || matchName || matchBuilding || matchFloor
      }

      return true
    })
  }, [searchQuery, selectedBuilding, selectedType])

  if (!isOpen) return null

  // Xử lý khi chọn phòng từ danh mục
  const handleSelect = (room) => {
    onSelectRoom({
      maPhong: room.id,
      khuVuc: room.building,
      buildingCode: room.buildingCode,
      floor: room.floor,
      loaiPhong: room.type,
      tenPhong: room.name,
    })
    onClose()
  }

  // Xử lý khi nhập mã phòng tự do không có trong danh mục
  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customRoomCode.trim()) return

    const b = BUILDINGS.find((b) => b.code === customBuilding) || BUILDINGS[1]
    onSelectRoom({
      maPhong: customRoomCode.trim().toUpperCase(),
      khuVuc: b.name,
      buildingCode: b.code,
      floor: 'Tự xác định',
      loaiPhong: 'Phòng học / Tiện ích khác',
      tenPhong: `Phòng ${customRoomCode.trim().toUpperCase()} (${b.code})`,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container modal-container--lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header__title-group">
            <div className="modal-header__icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18" />
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
                <path d="M14 9h1" /><path d="M14 13h1" /><path d="M14 17h1" />
              </svg>
            </div>
            <div>
              <h2 id="modal-title" className="modal-title">Chọn Phòng Khảo Sát VKU</h2>
              <p className="modal-subtitle">
                Tìm nhanh trong danh mục {VKU_ROOMS.length} phòng học & cơ sở vật chất
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng bảng chọn">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Search Box */}
          <div className="search-bar-wrapper">
            <span className="search-bar__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-bar__input"
              placeholder="Nhập mã phòng, tên phòng, tầng (VD: K-201, V-101, Lab AI, Tầng 2...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="search-bar__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>

          {/* Building Filter Chips */}
          <div className="filter-chips-container" role="tablist" aria-label="Lọc theo khu vực">
            <div className="filter-chips-scroll">
              {BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedBuilding === b.id}
                  className={`filter-chip ${selectedBuilding === b.id ? 'filter-chip--active' : ''}`}
                  onClick={() => setSelectedBuilding(b.id)}
                >
                  <span>{b.code === 'ALL' ? 'Tất cả khu vực' : `Khu ${b.code}`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Type Filter Chips */}
          <div className="filter-chips-container" role="tablist" aria-label="Lọc theo loại phòng">
            <div className="filter-chips-scroll">
              {ROOM_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedType === t.id}
                  className={`filter-chip filter-chip--sm ${selectedType === t.id ? 'filter-chip--active' : ''}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Meta */}
          <div className="results-meta">
            <span className="results-meta__count">
              Tìm thấy <strong>{filteredRooms.length}</strong> phòng phù hợp
            </span>
            {selectedBuilding !== 'all' && (
              <span className="results-meta__tag">
                {BUILDINGS.find((b) => b.id === selectedBuilding)?.name}
              </span>
            )}
          </div>

          {/* Rooms Grid */}
          <div className="rooms-grid">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isSelected = currentRoomId === room.id
                return (
                  <div
                    key={room.id}
                    className={`room-card ${isSelected ? 'room-card--selected' : ''}`}
                    onClick={() => handleSelect(room)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelect(room)
                      }
                    }}
                  >
                    <div className="room-card__header">
                      <span className="room-card__code">{room.id}</span>
                      <span className="room-card__floor">{room.floor}</span>
                    </div>
                    <div className="room-card__name">{room.name}</div>
                    <div className="room-card__footer">
                      <span className="room-card__type">
                        <span className="room-type-dot" /> {room.type.split('/')[0].trim()}
                      </span>
                      {room.capacity && (
                        <span className="room-card__capacity">{room.capacity}</span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rooms-empty">
                <p className="rooms-empty__text">Không tìm thấy phòng khớp với từ khóa "{searchQuery}"</p>
                <p className="rooms-empty__sub">
                  Bạn có thể nhập mã phòng tùy chỉnh bên dưới nếu phòng chưa có trong danh mục.
                </p>
              </div>
            )}
          </div>

          {/* Custom Room Entry Section */}
          <div className="custom-room-section">
            <h4 className="custom-room__title">
              Không thấy phòng cần tìm? Nhập mã phòng tùy chỉnh:
            </h4>
            <form className="custom-room__form" onSubmit={handleCustomSubmit}>
              <select
                className="custom-room__select"
                value={customBuilding}
                onChange={(e) => setCustomBuilding(e.target.value)}
                aria-label="Chọn khu vực cho phòng tự nhập"
              >
                {BUILDINGS.filter((b) => b.id !== 'all').map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="custom-room__input"
                placeholder="VD: K-505, V-108, KTX-C1..."
                value={customRoomCode}
                onChange={(e) => setCustomRoomCode(e.target.value)}
              />
              <button
                type="submit"
                className="custom-room__btn"
                disabled={!customRoomCode.trim()}
              >
                Chọn Phòng Này
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
