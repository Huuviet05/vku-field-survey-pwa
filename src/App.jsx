import { useEffect, useState, useCallback } from 'react'
import { Header } from './components/Header'
import { MobileBottomNav } from './components/MobileBottomNav'
import { SurveyForm } from './components/SurveyForm'
import { SurveyHistory } from './components/SurveyHistory'
import { SurveyStats } from './components/SurveyStats'
import { StatusBanner } from './components/StatusBanner'
import { SurveySubmittedModal } from './components/SurveySubmittedModal'
import { SurveyDetailModal } from './components/SurveyDetailModal'
import { PrintReportModal } from './components/PrintReportModal'
import { ToastContainer, useToast } from './components/Toast'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import {
  countPendingSurveys,
  getAllSurveyHistory,
  deleteSurveyFromHistory,
  manualSync,
} from './db/indexedDB'

// ============================================================
// APP ROOT COMPONENT - VKU FIELD SURVEY PWA
// ============================================================

function App() {
  const { isOnline, wasOffline } = useOnlineStatus()
  const { toasts, showToast, dismissToast } = useToast()

  const [currentTab, setCurrentTab] = useState('form') // 'form' | 'history' | 'stats'
  const [historySurveys, setHistorySurveys] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Modals state
  const [submittedModalData, setSubmittedModalData] = useState(null)
  const [detailModalData, setDetailModalData] = useState(null)
  const [printModalData, setPrintModalData] = useState(null)

  // Tải lại toàn bộ dữ liệu từ IndexedDB
  const reloadData = useCallback(async () => {
    try {
      const [count, history] = await Promise.all([
        countPendingSurveys(),
        getAllSurveyHistory(),
      ])
      setPendingCount(count)
      setHistorySurveys(history)
    } catch (err) {
      console.error('[App] ❌ Lỗi tải dữ liệu IndexedDB:', err)
    }
  }, [])

  // Khởi tạo app: Tải dữ liệu từ IndexedDB
  useEffect(() => {
    reloadData()
  }, [reloadData])

  // Lắng nghe message từ Service Worker (Background Sync thành công)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleSWMessage = (event) => {
      if (event.data?.type === 'SYNC_SUCCESS') {
        const { message, count } = event.data
        showToast(message || `Đã đồng bộ ${count} phiếu thành công!`, 'sync')
        reloadData()
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSWMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage)
  }, [showToast, reloadData])

  // Tự động kích hoạt đồng bộ khi có kết nối mạng trở lại
  useEffect(() => {
    if (!isOnline || !wasOffline) return

    const triggerAutoSync = async () => {
      const count = await countPendingSurveys()
      if (count === 0) return

      showToast(`Đang tự động đồng bộ ${count} phiếu khảo sát...`, 'info')
      setIsSyncing(true)
      try {
        await manualSync(async (syncedCount, failedCount, lastError) => {
          if (failedCount === 0) {
            showToast(`Đồng bộ thành công ${syncedCount} phiếu khảo sát! 🎉`, 'sync')
          } else {
            showToast(
              `Đồng bộ: ${syncedCount} thành công, ${failedCount} thất bại${lastError ? ` (${lastError})` : ''}`,
              failedCount > 0 ? 'warning' : 'sync'
            )
          }
          await reloadData()
        })
      } finally {
        setIsSyncing(false)
      }
    }

    triggerAutoSync()
  }, [isOnline, wasOffline, showToast, reloadData])

  // Xử lý đồng bộ thủ công từ người dùng
  const handleManualSyncAll = async () => {
    if (isSyncing || !isOnline) return
    setIsSyncing(true)
    showToast('Đang tiến hành đồng bộ dữ liệu lên máy chủ...', 'info')

    try {
      await manualSync(async (syncedCount, failedCount, lastError) => {
        if (failedCount === 0) {
          showToast(`Đã đồng bộ thành công ${syncedCount} phiếu khảo sát!`, 'sync')
        } else {
          showToast(
            `Đồng bộ: ${syncedCount} thành công, ${failedCount} thất bại${lastError ? ` (${lastError})` : ''}`,
            'warning'
          )
        }
        await reloadData()
      })
    } catch (err) {
      console.error('[App] ❌ Lỗi đồng bộ thủ công:', err)
      showToast('Đồng bộ thất bại. Vui lòng kiểm tra lại đường truyền!', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Khi form submit thành công
  const handleSurveySubmitted = async (newRecord, online) => {
    await reloadData()
    if (online) {
      showToast('Báo cáo khảo sát đã được gửi trực tuyến thành công!', 'success')
    } else {
      showToast('Đã lưu ngoại tuyến vào bộ nhớ thiết bị. Sẽ tự đồng bộ khi có mạng!', 'warning')
    }
    // Mở modal chúc mừng & tóm tắt đầy đủ kết quả
    setSubmittedModalData(newRecord)
  }

  // Xóa 1 phiếu từ lịch sử
  const handleDeleteSurvey = async (id) => {
    await deleteSurveyFromHistory(id)
    showToast('Đã xóa phiếu khảo sát khỏi hệ thống!', 'info')
    await reloadData()
  }

  return (
    <div className="app app--light" id="app-root">
      {/* Header with VKU brand & Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        historyCount={historySurveys.length}
        isOnline={isOnline}
      />

      {/* Online / Offline Status Banner */}
      <StatusBanner isOnline={isOnline} pendingCount={pendingCount} />

      {/* Main Content Area */}
      <main className="main-content-layout" role="main" id="main-content">
        <div className="content-container">

          {/* TAB 1: FORM KHẢO SÁT MỚI */}
          {currentTab === 'form' && (
            <div className="tab-view-pane animate-fade-in">
              {/* Info Banner */}
              <section className="form-hero-banner">
                <div className="hero-banner__text">
                  <span className="hero-banner__tag">HỆ THỐNG HIỆN TRƯỜNG VKU</span>
                  <h2 className="hero-banner__title">Phiếu Khảo Sát Cơ Sở Vật Chất</h2>
                  <p className="hero-banner__desc">
                    Ghi nhận hiện trạng phòng học, phòng thực hành và thiết bị tại các cơ sở VKU.
                    Hoạt động thông suốt ngay cả khi mất mạng.
                  </p>
                </div>
                <div className="hero-banner__stats">
                  <div className="hero-stat-box">
                    <span className="hero-stat__num">{historySurveys.length}</span>
                    <span className="hero-stat__label">Phiếu Đã Lập</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="hero-stat-box hero-stat-box--warning">
                      <span className="hero-stat__num">{pendingCount}</span>
                      <span className="hero-stat__label">Chờ Đồng Bộ</span>
                    </div>
                  )}
                </div>
              </section>

              {/* The Survey Form */}
              <SurveyForm
                isOnline={isOnline}
                onSyncSuccess={() => {
                  showToast('Đồng bộ dữ liệu thành công! 🎉', 'sync')
                  reloadData()
                }}
                onSurveySubmitted={handleSurveySubmitted}
              />
            </div>
          )}

          {/* TAB 2: LỊCH SỬ KHẢO SÁT & BÁO CÁO */}
          {currentTab === 'history' && (
            <div className="tab-view-pane animate-fade-in">
              <SurveyHistory
                surveys={historySurveys}
                onViewDetail={(item) => setDetailModalData(item)}
                onPrint={(item) => setPrintModalData(item)}
                onDelete={handleDeleteSurvey}
                onSyncAll={handleManualSyncAll}
                isSyncing={isSyncing}
                isOnline={isOnline}
                onGoToForm={() => setCurrentTab('form')}
              />
            </div>
          )}

          {/* TAB 3: THỐNG KÊ TỔNG QUAN */}
          {currentTab === 'stats' && (
            <div className="tab-view-pane animate-fade-in">
              <SurveyStats
                surveys={historySurveys}
                onGoToForm={() => setCurrentTab('form')}
              />
            </div>
          )}

        </div>
      </main>

      {/* App Footer */}
      <footer className="app-footer" role="contentinfo">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo-badge" aria-label="Logo VKU">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="url(#vkuFooterGrad)" />
                <defs>
                  <linearGradient id="vkuFooterGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e40af" />
                    <stop offset="1" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="48%"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  fontWeight="900"
                  fontSize="16"
                  fill="#ffffff"
                  letterSpacing="-0.5"
                >
                  VKU
                </text>
                <rect x="13" y="32" width="22" height="3" rx="1.5" fill="#f97316" />
              </svg>
            </div>
            <div>
              <strong>VKU Field Survey</strong>
              <p>Trường Đại học CNTT & Truyền thông Việt - Hàn</p>
            </div>
          </div>
          <div className="footer-meta">
            <span className="footer-status-tag">
              <span className="network-dot" style={{ background: isOnline ? 'var(--color-success)' : 'var(--color-danger)' }} />
              <span>{isOnline ? 'Máy chủ trực tuyến' : 'Làm việc ngoại tuyến'}</span>
            </span>
            <span className="footer-copy">&copy; 2026 VKU Field Survey · Progressive Web App</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Kết quả sau khi submit form */}
      <SurveySubmittedModal
        isOpen={!!submittedModalData}
        surveyData={submittedModalData}
        onClose={() => setSubmittedModalData(null)}
        onViewHistory={() => {
          setSubmittedModalData(null)
          setCurrentTab('history')
        }}
        onPrintReport={(survey) => {
          setSubmittedModalData(null)
          setPrintModalData(survey)
        }}
        onNewSurvey={() => {
          setSubmittedModalData(null)
          setCurrentTab('form')
        }}
      />

      {/* MODAL 2: Chi tiết một phiếu khảo sát */}
      <SurveyDetailModal
        isOpen={!!detailModalData}
        survey={detailModalData}
        onClose={() => setDetailModalData(null)}
        onPrint={(survey) => {
          setDetailModalData(null)
          setPrintModalData(survey)
        }}
        onDelete={handleDeleteSurvey}
      />

      {/* MODAL 3: In biên bản khảo sát hiện trường chuẩn VKU */}
      <PrintReportModal
        isOpen={!!printModalData}
        survey={printModalData}
        onClose={() => setPrintModalData(null)}
      />

      {/* Mobile Bottom Navigation Bar (Docked to screen bottom on <= 860px) */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        historyCount={historySurveys.length}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
