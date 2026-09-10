// ============================================================
// sheetsSync.js — Đồng bộ dữ liệu lên Google Sheets qua Apps Script
// + Upload ảnh lên ImgBB (free image hosting)
// ============================================================

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL

// -----------------------------------------------------------
// Dịch giá trị enum sang tiếng Việt
// -----------------------------------------------------------
const TINH_TRANG_MAP = {
  tot: 'Tốt / Đạt Chuẩn',
  hu_hong_nhe: 'Hư Hỏng Nhẹ',
  can_thay_the: 'Cần Thay Thế',
}

const PRIORITY_MAP = {
  low: 'Thấp',
  normal: 'Bình thường',
  urgent: 'Khẩn cấp',
}

const CHECKLIST_STATUS_MAP = {
  good: 'Tốt',
  damaged: 'Hư hỏng',
  na: 'Không có',
}

// -----------------------------------------------------------
// Upload 1 ảnh (dataUrl / base64) lên ImgBB
// Trả về URL công khai của ảnh, hoặc null nếu lỗi
// -----------------------------------------------------------
async function uploadImageToImgBB(dataUrl) {
  if (!IMGBB_API_KEY || IMGBB_API_KEY === 'your_imgbb_api_key_here') {
    console.warn('[sheetsSync] ⚠️ VITE_IMGBB_API_KEY chưa được cài đặt, bỏ qua upload ảnh')
    return null
  }

  try {
    // Nếu là URL bên ngoài (ảnh mẫu) thì giữ nguyên
    if (dataUrl && dataUrl.startsWith('http')) {
      return dataUrl
    }

    // Tách phần base64 ra khỏi data URL
    const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl

    const formData = new FormData()
    formData.append('image', base64Data)

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) throw new Error(`ImgBB HTTP ${res.status}`)

    const json = await res.json()

    if (json.success) {
      console.log('[sheetsSync] 🖼️ Ảnh đã upload:', json.data.url)
      return json.data.url
    }

    throw new Error(json.error?.message || 'ImgBB upload thất bại')
  } catch (err) {
    console.error('[sheetsSync] ❌ Lỗi upload ảnh lên ImgBB:', err)
    return null
  }
}

// -----------------------------------------------------------
// Upload toàn bộ ảnh của 1 phiếu, trả về mảng URL
// -----------------------------------------------------------
async function uploadAllPhotos(photos = []) {
  if (!photos || photos.length === 0) return []

  const results = await Promise.allSettled(
    photos.map((photo) => uploadImageToImgBB(photo.dataUrl))
  )

  return results
    .map((r, i) => ({
      url: r.status === 'fulfilled' && r.value ? r.value : null,
      caption: photos[i]?.caption || '',
      name: photos[i]?.name || '',
    }))
    .filter((p) => p.url !== null)
}

// -----------------------------------------------------------
// Định dạng link ảnh hiển thị trong Google Sheets
// -----------------------------------------------------------
function formatPhotoCell(photoUrls = []) {
  if (!photoUrls || photoUrls.length === 0) return ''
  if (photoUrls.length === 1) {
    const p = photoUrls[0]
    const cleanUrl = (p.url || '').replace(/"/g, '')
    const cleanCaption = (p.caption || '').replace(/"/g, "'").trim()
    const label = cleanCaption ? `🔗 Xem ảnh (${cleanCaption})` : '🔗 Xem ảnh'
    return `=HYPERLINK("${cleanUrl}", "${label}")`
  }
  return photoUrls
    .map((p, i) => {
      const cleanUrl = (p.url || '').replace(/"/g, '')
      const cleanCaption = (p.caption || '').replace(/"/g, "'").trim()
      return cleanCaption ? `${cleanUrl} (${cleanCaption})` : cleanUrl
    })
    .join('\n')
}

// -----------------------------------------------------------
// Chuyển object survey phức tạp → row phẳng gửi lên Sheets
// -----------------------------------------------------------
function flattenSurvey(survey, photoUrls = []) {
  const checklist = survey.checklist || {}
  const photoUrlsText = formatPhotoCell(photoUrls)

  return {
    refCode: survey.refCode || '',
    timestamp: survey.timestamp
      ? new Date(survey.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : '',
    surveyorName: survey.surveyorName || '',
    surveyorId: survey.surveyorId || '',
    maPhong: survey.maPhong || '',
    khuVuc: survey.khuVuc || '',
    floor: survey.floor || '',
    loaiPhong: survey.loaiPhong || '',
    tinhTrang: TINH_TRANG_MAP[survey.tinhTrang] || survey.tinhTrang || '',
    priority: PRIORITY_MAP[survey.priority] || survey.priority || '',
    denDien: CHECKLIST_STATUS_MAP[checklist.denDien] || '',
    mayChieu: CHECKLIST_STATUS_MAP[checklist.mayChieu] || '',
    dieuHoa: CHECKLIST_STATUS_MAP[checklist.dieuHoa] || '',
    banGhe: CHECKLIST_STATUS_MAP[checklist.banGhe] || '',
    cuaSo: CHECKLIST_STATUS_MAP[checklist.cuaSo] || '',
    wifi: CHECKLIST_STATUS_MAP[checklist.wifi] || '',
    soAnh: (survey.photos || []).length,
    anhUrls: photoUrlsText,
    photoList: photoUrls,
    ghiChu: survey.ghiChu || '',
    status: 'synced',
  }
}

// -----------------------------------------------------------
// Hàm chính: Upload ảnh + Gửi data lên Google Sheets
// Trả về true nếu thành công, throw Error nếu thất bại
// -----------------------------------------------------------
export async function syncSurveyToSheets(survey) {
  let scriptUrl = (GOOGLE_SCRIPT_URL || '').trim()
  if (scriptUrl.startsWith('ttps://')) {
    scriptUrl = 'h' + scriptUrl
  } else if (scriptUrl && !scriptUrl.startsWith('http://') && !scriptUrl.startsWith('https://')) {
    scriptUrl = 'https://' + scriptUrl
  }

  if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_ID')) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL chưa được cài đặt trong file .env')
  }

  // 1. Upload ảnh lên ImgBB
  let photoUrls = []
  if (survey.photos && survey.photos.length > 0) {
    console.log(`[sheetsSync] 🖼️ Đang upload ${survey.photos.length} ảnh lên ImgBB...`)
    photoUrls = await uploadAllPhotos(survey.photos)
    console.log(`[sheetsSync] ✅ Upload xong ${photoUrls.length}/${survey.photos.length} ảnh`)
  }

  // 2. Chuẩn bị data phẳng
  const rowData = flattenSurvey(survey, photoUrls)

  // 3. POST lên Google Apps Script
  console.log('[sheetsSync] 📤 Đang gửi dữ liệu lên Google Sheets...', rowData.refCode)

  const response = await fetch(scriptUrl, {
    method: 'POST',
    // Apps Script không hỗ trợ Content-Type: application/json với CORS
    // Dùng text/plain;charset=utf-8 và parse ở phía Apps Script
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(rowData),
  })

  if (!response.ok) {
    throw new Error(`Google Script HTTP ${response.status}: ${response.statusText}`)
  }

  const result = await response.json()

  if (result.status !== 'success') {
    throw new Error(result.message || 'Apps Script trả về lỗi không xác định')
  }

  console.log('[sheetsSync] ✅ Sync thành công lên Google Sheets:', rowData.refCode)
  return true
}

