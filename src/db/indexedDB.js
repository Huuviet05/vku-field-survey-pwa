import { openDB } from 'idb'
import { syncSurveyToSheets } from '../utils/sheetsSync'

// ============================================================
// IndexedDB Layer - VKU Field Survey PWA v2
// Database: vku-survey-db
// Stores:
//   1. 'pending-surveys': Hàng đợi offline cần đồng bộ
//   2. 'surveys-history': Toàn bộ lịch sử các phiếu khảo sát
// ============================================================

const DB_NAME = 'vku-survey-db'
const DB_VERSION = 2
const STORE_PENDING = 'pending-surveys'
const STORE_HISTORY = 'surveys-history'

/**
 * Khởi tạo hoặc nâng cấp IndexedDB
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 1. Pending surveys store
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const pendingStore = db.createObjectStore(STORE_PENDING, {
          keyPath: 'id',
          autoIncrement: true,
        })
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false })
        console.log('[IndexedDB] ✅ Created store:', STORE_PENDING)
      }

      // 2. Full survey history store
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, {
          keyPath: 'id',
          autoIncrement: true,
        })
        historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        historyStore.createIndex('status', 'status', { unique: false })
        historyStore.createIndex('maPhong', 'maPhong', { unique: false })
        console.log('[IndexedDB] ✅ Created store:', STORE_HISTORY)
      }
    },
    blocked() {
      console.warn('[IndexedDB] ⚠️ DB blocked - old version still open')
    },
    blocking() {
      console.warn('[IndexedDB] ⚠️ DB blocking - new version waiting')
    },
  })
}

/**
 * Tạo mã biên bản khảo sát ngẫu nhiên chuẩn VKU
 */
export function generateSurveyCode() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `VKU-${y}${m}${d}-${rand}`
}

/**
 * Thêm một phiếu khảo sát mới vào cơ sở dữ liệu
 * Lưu đồng thời vào 'surveys-history' và nếu offline thì lưu vào 'pending-surveys'
 * @param {Object} surveyData
 * @param {boolean} isOnline
 * @returns {Promise<{historyId: number, refCode: string}>}
 */
export async function saveSurvey(surveyData, isOnline) {
  const db = await getDB()
  const refCode = surveyData.refCode || generateSurveyCode()
  const now = new Date().toISOString()

  let isSynced = false
  let syncedAt = null

  // Nếu đang online, gửi thẳng lên Google Sheets ngay lập tức
  if (isOnline) {
    try {
      console.log('[IndexedDB] 🌐 Online - đang gửi trực tiếp lên Google Sheets cho phiếu:', refCode)
      await syncSurveyToSheets({ ...surveyData, refCode, timestamp: now })
      isSynced = true
      syncedAt = now
      console.log('[IndexedDB] ✅ Đã gửi trực tiếp thành công lên Google Sheets:', refCode)
    } catch (syncErr) {
      console.warn('[IndexedDB] ⚠️ Gửi trực tiếp thất bại, lưu vào hàng đợi chờ sync lại:', syncErr.message)
      isSynced = false
    }
  }

  const historyRecord = {
    ...surveyData,
    refCode,
    timestamp: now,
    status: isSynced ? 'synced' : 'pending',
    syncedAt,
  }

  // 1. Lưu vào history
  const historyId = await db.add(STORE_HISTORY, historyRecord)
  console.log('[IndexedDB] 📥 Survey saved to history, id:', historyId, 'refCode:', refCode)

  // 2. Nếu chưa sync thành công (offline hoặc lỗi mạng), đưa vào pending queue
  if (!isSynced) {
    const pendingRecord = {
      ...historyRecord,
      historyId,
    }
    const pendingId = await db.add(STORE_PENDING, pendingRecord)
    console.log('[IndexedDB] ⏳ Survey queued for offline sync, pendingId:', pendingId)
  }

  return { historyId, refCode, isSynced }
}

/**
 * Lấy tất cả lịch sử khảo sát (sắp xếp mới nhất lên đầu)
 * @returns {Promise<Array>}
 */
export async function getAllSurveyHistory() {
  const db = await getDB()
  const allSurveys = await db.getAll(STORE_HISTORY)
  return allSurveys.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

/**
 * Lấy chi tiết 1 phiếu khảo sát theo ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getSurveyById(id) {
  const db = await getDB()
  return db.get(STORE_HISTORY, Number(id))
}

/**
 * Xóa một phiếu khỏi lịch sử
 * @param {number} id
 */
export async function deleteSurveyFromHistory(id) {
  const db = await getDB()
  const numId = Number(id)
  await db.delete(STORE_HISTORY, numId)

  // Nếu phiếu này cũng đang ở trong pending, xóa luôn
  const pendingSurveys = await db.getAll(STORE_PENDING)
  const pendingMatch = pendingSurveys.find(p => p.historyId === numId || p.id === numId)
  if (pendingMatch) {
    await db.delete(STORE_PENDING, pendingMatch.id)
  }
  console.log('[IndexedDB] 🗑️ Survey deleted from history and queue, id:', id)
}

/**
 * Lấy danh sách phiếu đang chờ đồng bộ
 * @returns {Promise<Array>}
 */
export async function getAllPendingSurveys() {
  const db = await getDB()
  return db.getAll(STORE_PENDING)
}

/**
 * Đếm số lượng phiếu đang chờ đồng bộ
 * @returns {Promise<number>}
 */
export async function countPendingSurveys() {
  const db = await getDB()
  return db.count(STORE_PENDING)
}

/**
 * Xóa phiếu khỏi hàng đợi pending sau khi sync
 * @param {number} id
 */
export async function deletePendingSurvey(id) {
  const db = await getDB()
  await db.delete(STORE_PENDING, id)
}

/**
 * Cập nhật trạng thái phiếu trong history thành 'synced'
 * @param {number} historyId
 */
export async function markHistoryAsSynced(historyId) {
  const db = await getDB()
  const record = await db.get(STORE_HISTORY, historyId)
  if (record) {
    record.status = 'synced'
    record.syncedAt = new Date().toISOString()
    await db.put(STORE_HISTORY, record)
  }
}

/**
 * Đồng bộ thủ công toàn bộ phiếu pending
 * @param {Function} onSuccess
 */
/**
 * Đồng bộ toàn bộ phiếu pending lên Google Sheets
 * @param {Function} onSuccess - callback(syncedCount, failedCount)
 * @returns {Promise<{synced: number, failed: number}>}
 */
export async function manualSync(onSuccess) {
  const pendingSurveys = await getAllPendingSurveys()
  if (pendingSurveys.length === 0) return { synced: 0, failed: 0 }

  console.log('[IndexedDB] 🔄 Starting sync for', pendingSurveys.length, 'records')

  let syncedCount = 0
  let failedCount = 0
  let lastErrorMsg = ''

  for (const item of pendingSurveys) {
    try {
      // Gửi lên Google Sheets qua Apps Script
      await syncSurveyToSheets(item)

      // Cập nhật trạng thái trong history thành 'synced'
      if (item.historyId) {
        await markHistoryAsSynced(item.historyId)
      }

      // Xóa khỏi pending queue
      await deletePendingSurvey(item.id)
      syncedCount++
      console.log('[IndexedDB] ✅ Synced:', item.refCode || item.id)
    } catch (err) {
      failedCount++
      lastErrorMsg = err.message || 'Lỗi không xác định'
      console.error('[IndexedDB] ❌ Sync thất bại cho phiếu', item.refCode || item.id, ':', err.message)
      // Giữ nguyên trong pending queue để retry sau
    }
  }

  console.log(`[IndexedDB] 🏁 Sync xong: ${syncedCount} thành công, ${failedCount} thất bại`)
  if (onSuccess) onSuccess(syncedCount, failedCount, lastErrorMsg)
  return { synced: syncedCount, failed: failedCount, error: lastErrorMsg }
}

/**
 * Hàm hỗ trợ tương thích ngược cho addPendingSurvey (nếu sw hoặc component gọi cũ)
 */
export async function addPendingSurvey(surveyData) {
  const res = await saveSurvey(surveyData, false)
  return res.historyId
}

/**
 * Khởi tạo dữ liệu mẫu nếu history trống (giúp người dùng trải nghiệm ngay lập tức)
 */
export async function seedSampleSurveysIfEmpty() {
  const history = await getAllSurveyHistory()
  if (history.length > 0) return

  const samples = [
    {
      refCode: 'VKU-20260905-1842',
      maPhong: 'K-201',
      khuVuc: 'Khu K (Tòa Trung Tâm & Giảng Đường K)',
      buildingCode: 'K',
      floor: 'Tầng 2',
      loaiPhong: 'Phòng học lý thuyết',
      tinhTrang: 'hu_hong_nhe',
      priority: 'normal',
      surveyorName: 'Nguyễn Văn An',
      surveyorId: '22IT001',
      checklist: {
        denDien: 'good',
        mayChieu: 'damaged',
        dieuHoa: 'good',
        banGhe: 'good',
        cuaSo: 'good',
        wifi: 'good',
      },
      ghiChu: 'Máy chiếu bị mờ bóng hình, quạt gió máy chiếu kêu to khi hoạt động trên 30 phút.',
      photos: [
        {
          id: 'samp_1',
          name: 'may_chieu_k201.jpg',
          caption: 'Bóng chiếu projector Panasonic bị nhòe màu đỏ',
          dataUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60',
          size: 184000,
        },
      ],
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'synced',
      syncedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      refCode: 'VKU-20260906-7291',
      maPhong: 'V-201',
      khuVuc: 'Khu V (Viện CNTT & Vi Mạch Bán Dẫn)',
      buildingCode: 'V',
      floor: 'Tầng 2',
      loaiPhong: 'Phòng thực hành máy tính / Lab',
      tinhTrang: 'tot',
      priority: 'low',
      surveyorName: 'Trần Thị Mai',
      surveyorId: '21IT105',
      checklist: {
        denDien: 'good',
        mayChieu: 'good',
        dieuHoa: 'good',
        banGhe: 'good',
        cuaSo: 'good',
        wifi: 'good',
      },
      ghiChu: 'Toàn bộ 40 máy trạm vi mạch hoạt động ổn định, điều hòa mát tốt, hệ thống điện đạt chuẩn.',
      photos: [],
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      status: 'synced',
      syncedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      refCode: 'VKU-20260907-3310',
      maPhong: 'A-102',
      khuVuc: 'Dãy Giảng Đường A',
      buildingCode: 'A',
      floor: 'Tầng 1',
      loaiPhong: 'Phòng học lý thuyết',
      tinhTrang: 'can_thay_the',
      priority: 'urgent',
      surveyorName: 'Lê Hoàng Long',
      surveyorId: 'CB-VKU-442',
      checklist: {
        denDien: 'damaged',
        mayChieu: 'damaged',
        dieuHoa: 'damaged',
        banGhe: 'damaged',
        cuaSo: 'good',
        wifi: 'good',
      },
      ghiChu: 'Dãy bàn thứ 3 bị gãy chân sắt nguy hiểm cho sinh viên. 2 bóng đèn tuýp LED nhấp nháy, điều hòa Daikin góc trái chảy nước xuống sàn.',
      photos: [
        {
          id: 'samp_2',
          name: 'ban_ghe_hong_a102.jpg',
          caption: 'Chân bàn gãy cần thợ hàn xử lý gấp',
          dataUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=60',
          size: 210000,
        },
      ],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      syncedAt: null,
    },
  ]

  const db = await getDB()
  for (const s of samples) {
    const historyId = await db.add(STORE_HISTORY, s)
    if (s.status === 'pending') {
      await db.add(STORE_PENDING, { ...s, historyId })
    }
  }
  console.log('[IndexedDB] 🚀 Seeded sample survey records for preview')
}
