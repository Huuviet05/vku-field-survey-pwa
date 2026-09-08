// ============================================================
// IMAGE COMPRESSOR UTILITY - CLIENT-SIDE CANVAS COMPRESSION
// Tối ưu ảnh chụp/tải lên để lưu nhẹ trong IndexedDB và gửi nhanh qua mạng PWA
// ============================================================

/**
 * Nén ảnh từ File hoặc Blob sử dụng HTML5 Canvas
 * @param {File|Blob} file - File ảnh đầu vào
 * @param {Object} options - Tùy chọn nén
 * @param {number} options.maxWidth - Chiều rộng tối đa (mặc định 1280px)
 * @param {number} options.maxHeight - Chiều cao tối đa (mặc định 1280px)
 * @param {number} options.quality - Chất lượng nén (0.1 đến 1.0, mặc định 0.78)
 * @param {string} options.mimeType - Định dạng ảnh nén ('image/webp' hoặc 'image/jpeg')
 * @returns {Promise<{dataUrl: string, size: number, originalSize: number, width: number, height: number, name: string}>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    mimeType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'))

    reader.onload = (event) => {
      const img = new Image()

      img.onerror = () => reject(new Error('Không thể tải hình ảnh để xử lý'))

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Tính toán kích thước mới theo tỷ lệ
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Tạo Canvas và vẽ ảnh đã resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas 2D context'))
          return
        }

        // Thiết lập làm mịn ảnh
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Xuất dataUrl nén
        const dataUrl = canvas.toDataURL(mimeType, quality)

        // Tính dung lượng xấp xỉ từ base64
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1)
        const compressedSize = Math.round((base64Length * 3) / 4)

        resolve({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          dataUrl,
          size: compressedSize,
          originalSize: file.size || compressedSize,
          width,
          height,
          name: file.name || `photo_${Date.now()}.jpg`,
          caption: '',
          createdAt: new Date().toISOString(),
        })
      }

      img.src = event.target.result
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Định dạng dung lượng byte sang KB / MB thân thiện
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
