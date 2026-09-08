// ============================================================
// PrintReportModal Component - MẪU IN BIÊN BẢN KHẢO SÁT CHUẨN VKU
// Cho phép in trực tiếp qua window.print() hoặc lưu dạng PDF
// ============================================================

export function PrintReportModal({ isOpen, survey, onClose }) {
  if (!isOpen || !survey) return null

  const handlePrint = () => {
    window.print()
  }

  const checklistMap = {
    denDien: 'Hệ thống điện & Đèn chiếu sáng',
    mayChieu: 'Máy chiếu / Màn hình giảng dạy',
    dieuHoa: 'Điều hòa nhiệt độ & Quạt thông gió',
    banGhe: 'Bàn ghế giảng đường & Phòng lab',
    cuaSo: 'Cửa ra vào & Cửa sổ phòng',
    wifi: 'Mạng WiFi / Đường truyền mạng',
  }

  const statusText = {
    tot: 'ĐẠT TIÊU CHUẨN (TỐT)',
    hu_hong_nhe: 'HƯ HỎNG NHẸ (CẦN BẢO TRÌ)',
    can_thay_the: 'HƯ HỎNG NẶNG (CẦN THAY THẾ KHẨN CẤP)',
  }

  return (
    <div className="modal-overlay print-modal-overlay" onClick={onClose}>
      <div className="modal-container print-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Print Control Toolbar (hidden during print) */}
        <div className="print-toolbar no-print">
          <div className="print-toolbar__info">
            <span>🖨️ Xem trước biên bản khảo sát hiện trường VKU</span>
          </div>
          <div className="print-toolbar__buttons">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="btn-primary" onClick={handlePrint}>
              In Biên Bản / Lưu PDF
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="print-document" id="printable-area">
          {/* Header */}
          <div className="doc-header">
            <div className="doc-header__left">
              <p className="doc-org">ĐẠI HỌC ĐÀ NẴNG</p>
              <p className="doc-school">TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN</p>
              <p className="doc-school">VÀ TRUYỀN THÔNG VIỆT - HÀN</p>
              <p className="doc-dept">TỔ KHẢO SÁT & QUẢN TRỊ THIẾT BỊ</p>
            </div>
            <div className="doc-header__right">
              <p className="doc-national">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="doc-motto">Độc lập - Tự do - Hạnh phúc</p>
              <div className="doc-divider-short" />
              <p className="doc-date">
                Đà Nẵng, ngày {new Date(survey.timestamp).getDate()} tháng{' '}
                {new Date(survey.timestamp).getMonth() + 1} năm{' '}
                {new Date(survey.timestamp).getFullYear()}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="doc-title-box">
            <h1 className="doc-main-title">BIÊN BẢN KHẢO SÁT HIỆN TRƯỜNG CƠ SỞ VẬT CHẤT</h1>
            <p className="doc-sub-title">Mã biên bản: <strong>{survey.refCode}</strong></p>
          </div>

          {/* Section 1: General Info */}
          <div className="doc-section">
            <h3 className="doc-section__heading">I. THÔNG TIN KHU VỰC & NGƯỜI KHẢO SÁT</h3>
            <table className="doc-table">
              <tbody>
                <tr>
                  <td className="doc-label" style={{ width: '25%' }}>Mã phòng học:</td>
                  <td className="doc-value" style={{ width: '25%' }}><strong>{survey.maPhong}</strong></td>
                  <td className="doc-label" style={{ width: '25%' }}>Tòa nhà / Khu vực:</td>
                  <td className="doc-value" style={{ width: '25%' }}>{survey.khuVuc || 'VKU Campus'}</td>
                </tr>
                <tr>
                  <td className="doc-label">Tầng & Loại phòng:</td>
                  <td className="doc-value">{survey.floor || 'Tầng 1'} ({survey.loaiPhong || 'Phòng học'})</td>
                  <td className="doc-label">Mức độ ưu tiên:</td>
                  <td className="doc-value">
                    {survey.priority === 'urgent' ? '🔴 Khẩn cấp' : survey.priority === 'low' ? 'Thấp' : 'Bình thường'}
                  </td>
                </tr>
                <tr>
                  <td className="doc-label">Người khảo sát:</td>
                  <td className="doc-value"><strong>{survey.surveyorName || 'Cán bộ khảo sát'}</strong></td>
                  <td className="doc-label">Mã số cán bộ/SV:</td>
                  <td className="doc-value">{survey.surveyorId || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="doc-label">Thời gian khảo sát:</td>
                  <td className="doc-value" colSpan={3}>
                    {new Date(survey.timestamp).toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Condition & Checklist */}
          <div className="doc-section">
            <h3 className="doc-section__heading">II. KẾT QUẢ ĐÁNH GIÁ TÌNH TRẠNG KỸ THUẬT</h3>
            <div className="doc-overall-box">
              <span>ĐÁNH GIÁ TỔNG QUAN: </span>
              <strong>{statusText[survey.tinhTrang] || 'ĐẠT TIÊU CHUẨN'}</strong>
            </div>

            {survey.checklist && (
              <table className="doc-table doc-table--checklist">
                <thead>
                  <tr>
                    <th style={{ width: '8%', textAlign: 'center' }}>STT</th>
                    <th>Hạng Mục Khảo Sát</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>Hiện Trạng</th>
                    <th style={{ width: '25%', textAlign: 'center' }}>Đánh Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(survey.checklist).map(([key, val], idx) => (
                    <tr key={key}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>{checklistMap[key] || key}</td>
                      <td style={{ textAlign: 'center' }}>
                        {val === 'damaged' ? 'Có dấu hiệu hư hại/lỗi' : 'Hoạt động bình thường'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {val === 'damaged' ? '❌ CẦN XỬ LÝ' : '✅ ĐẠT'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 3: Notes & Recommendations */}
          <div className="doc-section">
            <h3 className="doc-section__heading">III. GHI CHÚ CHI TIẾT & ĐỀ XUẤT XỬ LÝ</h3>
            <div className="doc-notes-text">
              {survey.ghiChu || 'Không có yêu cầu hay ghi chú đặc biệt.'}
            </div>
          </div>

          {/* Section 4: Photos */}
          {survey.photos && survey.photos.length > 0 && (
            <div className="doc-section doc-section--photos">
              <h3 className="doc-section__heading">IV. HÌNH ẢNH MINH CHỨNG HIỆN TRƯỜNG</h3>
              <div className="doc-photos-row">
                {survey.photos.slice(0, 4).map((p, i) => (
                  <div key={i} className="doc-photo-item">
                    <img src={p.dataUrl} alt={`Minh chứng ${i + 1}`} />
                    <p className="doc-photo-caption">
                      Hình {i + 1}: {p.caption || 'Hiện trạng thiết bị'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="doc-signatures">
            <div className="doc-sign-col">
              <p className="doc-sign-title">ĐẠI DIỆN ĐƠN VỊ SỬ DỤNG</p>
              <p className="doc-sign-hint">(Ký và ghi rõ họ tên)</p>
              <div className="doc-sign-space" />
            </div>

            <div className="doc-sign-col">
              <p className="doc-sign-title">NGƯỜI LẬP BIÊN BẢN</p>
              <p className="doc-sign-hint">(Ký và ghi rõ họ tên)</p>
              <div className="doc-sign-space" />
              <p className="doc-sign-name">{survey.surveyorName || 'Nguyễn Văn A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
