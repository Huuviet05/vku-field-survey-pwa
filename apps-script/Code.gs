// ============================================================
// VKU Field Survey — Google Apps Script Webhook
// Nhận POST từ PWA và ghi vào Google Sheets
//
// HƯỚNG DẪN DEPLOY:
// 1. Mở Google Sheet -> Extensions -> Apps Script
// 2. Paste toàn bộ code này vào
// 3. Bấm Deploy -> New deployment -> Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL và dán vào VITE_GOOGLE_SCRIPT_URL trong file .env
// ============================================================

// Tiêu đề các cột trong Google Sheet (phải khớp với flattenSurvey trong sheetsSync.js)
const HEADERS = [
  'Mã Biên Bản',      // refCode
  'Thời Gian Nộp',    // timestamp
  'Người Khảo Sát',   // surveyorName
  'MSSV / Mã CB',     // surveyorId
  'Mã Phòng',         // maPhong
  'Khu Vực',          // khuVuc
  'Tầng',             // floor
  'Loại Phòng',       // loaiPhong
  'Tình Trạng',       // tinhTrang
  'Mức Ưu Tiên',      // priority
  'Hệ Thống Điện',    // denDien
  'Máy Chiếu',        // mayChieu
  'Điều Hòa',         // dieuHoa
  'Bàn Ghế',          // banGhe
  'Cửa Sổ',           // cuaSo
  'WiFi',             // wifi
  'Số Ảnh',           // soAnh
  'URL Ảnh',          // anhUrls
  'Ghi Chú',          // ghiChu
  'Trạng Thái',       // status
]

// Thứ tự các key trong data gửi lên (phải khớp với HEADERS)
const DATA_KEYS = [
  'refCode', 'timestamp', 'surveyorName', 'surveyorId',
  'maPhong', 'khuVuc', 'floor', 'loaiPhong',
  'tinhTrang', 'priority',
  'denDien', 'mayChieu', 'dieuHoa', 'banGhe', 'cuaSo', 'wifi',
  'soAnh', 'anhUrls', 'ghiChu', 'status'
]

/**
 * Xử lý HTTP GET — dùng để test xem script có hoạt động không
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'VKU Field Survey Script is running!' }))
    .setMimeType(ContentService.MimeType.JSON)
}

/**
 * Xử lý HTTP POST — nhận data từ PWA và ghi vào Sheet
 */
function doPost(e) {
  try {
    // Parse JSON từ body
    const data = JSON.parse(e.postData.contents)

    // Lấy Sheet đầu tiên
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheets()[0]

    // Tạo header nếu Sheet còn trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS)
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length)
      headerRange.setBackground('#1e40af')
      headerRange.setFontColor('#ffffff')
      headerRange.setFontWeight('bold')
      headerRange.setHorizontalAlignment('center')
      sheet.setFrozenRows(1)
    }

    // Chuyển data thành array theo đúng thứ tự cột
    const row = DATA_KEYS.map(key => {
      const val = data[key]
      if (val === null || val === undefined) return ''
      return String(val)
    })

    // Thêm hàng mới vào cuối Sheet
    sheet.appendRow(row)

    const lastRow = sheet.getLastRow()

    // Tạo link xanh bấm được trực tiếp cho cột URL Ảnh (Cột 18)
    try {
      const anhUrlsCol = DATA_KEYS.indexOf('anhUrls') + 1
      const anhCell = sheet.getRange(lastRow, anhUrlsCol)

      let photoItems = []
      if (Array.isArray(data.photoList) && data.photoList.length > 0) {
        photoItems = data.photoList.filter(p => p && p.url)
      } else if (data.anhUrls) {
        const lines = String(data.anhUrls).split('\n')
        lines.forEach(line => {
          const match = line.trim().match(/^(https?:\/\/[^\s]+)(?:\s*\((.*)\))?$/)
          if (match) {
            photoItems.push({ url: match[1], caption: match[2] || '' })
          } else if (line.trim().startsWith('http')) {
            photoItems.push({ url: line.trim(), caption: '' })
          }
        })
      }

      if (photoItems.length === 1) {
        const p = photoItems[0]
        const label = p.caption ? `🔗 Xem ảnh (${p.caption})` : '🔗 Xem ảnh'
        anhCell.setFormula(`=HYPERLINK("${p.url}", "${label}")`)
      } else if (photoItems.length > 1) {
        let fullText = ''
        const linkRanges = []
        photoItems.forEach((p, idx) => {
          const prefix = `🔗 Xem ảnh ${idx + 1}`
          const caption = p.caption ? ` (${p.caption})` : ''
          const lineText = prefix + caption
          const start = fullText.length
          fullText += (start > 0 ? '\n' : '') + lineText
          const actualStart = start + (start > 0 ? 1 : 0)
          linkRanges.push({
            start: actualStart,
            end: actualStart + prefix.length,
            url: p.url
          })
        })
        if (fullText) {
          const richText = SpreadsheetApp.newRichTextValue().setText(fullText)
          linkRanges.forEach(lr => richText.setLinkUrl(lr.start, lr.end, lr.url))
          anhCell.setRichTextValue(richText.build())
        }
      }
    } catch (linkErr) {
      Logger.log('[VKU Script] Lưu ý link ảnh: ' + linkErr.message)
    }

    // Auto-resize các cột sau khi thêm
    sheet.autoResizeColumns(1, HEADERS.length)

    // Tô màu hàng theo tình trạng
    const tinhTrang = data.tinhTrang || ''
    if (tinhTrang.includes('Cần Thay Thế')) {
      sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground('#fef2f2')
    } else if (tinhTrang.includes('Hư Hỏng')) {
      sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground('#fffbeb')
    }

    Logger.log('[VKU Script] ✅ Đã ghi phiếu: ' + data.refCode)

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', refCode: data.refCode }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    Logger.log('[VKU Script] ❌ Lỗi: ' + err.message)
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

