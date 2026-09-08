// ============================================================
// SERVICE WORKER - VKU Field Survey PWA
// Chiến lược: Cache-First cho App Shell
// 3 vòng đời rõ ràng: install → activate → fetch
// + Background Sync cho offline queue
// ============================================================

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// Tuyên bố skipWaiting để SW mới chiếm quyền ngay lập tức
self.skipWaiting()
clientsClaim()

// ─────────────────────────────────────────────────────────────
// PRE-CACHE: Inject manifest từ vite-plugin-pwa (App Shell)
// ─────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ─────────────────────────────────────────────────────────────
// VÒNG ĐỜI 1: INSTALL
// Pre-cache App Shell thủ công (HTML, CSS, JS tĩnh)
// ─────────────────────────────────────────────────────────────
const CACHE_NAME = 'vku-survey-v2'
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
]

self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Install event - caching App Shell...')
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 📦 Caching App Shell URLs:', APP_SHELL_URLS)
      return cache.addAll(APP_SHELL_URLS)
    }).then(() => {
      console.log('[SW] ✅ App Shell cached successfully')
    }).catch((err) => {
      console.warn('[SW] ⚠️ Failed to cache some App Shell URLs:', err)
    })
  )
})

// ─────────────────────────────────────────────────────────────
// VÒNG ĐỜI 2: ACTIVATE
// Xóa cache cũ, giành quyền kiểm soát tất cả clients
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] ⚡ Activate event - cleaning up old caches...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] 🗑️ Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      console.log('[SW] ✅ Old caches cleaned, claiming clients...')
      return self.clients.claim()
    })
  )
})

// ─────────────────────────────────────────────────────────────
// VÒNG ĐỜI 3: FETCH
// 1. Cho Navigation (HTML document): Network-First (luôn lấy trang mới nhất, fallback offline)
// 2. Cho static assets: Cache-First, fallback network
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = event.request.url
  if (url.includes('/api/') || url.includes('/@vite/') || url.includes('hot-update') || url.includes('@fs')) return

  // 1. Cho HTML Navigation: Network-First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline.html')
          })
        })
    )
    return
  }

  // 2. Cho static assets: Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request.clone()).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse
        }

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return networkResponse
      })
    })
  )
})

// ─────────────────────────────────────────────────────────────
// BACKGROUND SYNC: Đồng bộ offline surveys khi có mạng trở lại
// Tag: 'sync-surveys'
// ─────────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background Sync event - tag:', event.tag)

  if (event.tag === 'sync-surveys') {
    event.waitUntil(syncPendingSurveys())
  }
})

async function syncPendingSurveys() {
  console.log('[SW] 📤 Starting sync of pending surveys...')

  try {
    // Mở IndexedDB và lấy tất cả surveys đang chờ
    const db = await openSurveyDB()
    const tx = db.transaction('pending-surveys', 'readonly')
    const store = tx.objectStore('pending-surveys')
    const pendingSurveys = await getAllFromStore(store)
    await tx.done

    if (pendingSurveys.length === 0) {
      console.log('[SW] ℹ️ No pending surveys to sync')
      return
    }

    console.log('[SW] 📋 Found', pendingSurveys.length, 'pending surveys to sync')

    // Xử lý từng survey trong hàng đợi
    for (const survey of pendingSurveys) {
      try {
        // Giả lập API call (setTimeout 2 giây)
        await simulateApiCall(survey)

        // Xóa khỏi IndexedDB sau khi sync thành công
        const deleteTx = db.transaction('pending-surveys', 'readwrite')
        await deleteTx.objectStore('pending-surveys').delete(survey.id)
        await deleteTx.done

        console.log('[SW] ✅ Survey synced and removed from queue:', survey.id)
      } catch (err) {
        console.error('[SW] ❌ Failed to sync survey:', survey.id, err)
        throw err // Re-throw để Background Sync retry sau
      }
    }

    // Thông báo thành công về tất cả clients
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_SUCCESS',
        message: `Đã đồng bộ ${pendingSurveys.length} phiếu khảo sát thành công! 🎉`,
        count: pendingSurveys.length,
      })
    })

    console.log('[SW] 🎉 All surveys synced successfully!')
  } catch (err) {
    console.error('[SW] ❌ Sync failed:', err)
    throw err // Background Sync API sẽ tự retry
  }
}

// Giả lập API call với delay 2 giây
function simulateApiCall(surveyData) {
  return new Promise((resolve, reject) => {
    console.log('[SW] 🌐 Simulating API call for survey:', surveyData.maPhong)
    setTimeout(() => {
      // Giả lập 95% success rate
      if (Math.random() > 0.05) {
        console.log('[SW] ✅ API call simulated successfully for:', surveyData.maPhong)
        resolve({ success: true, id: surveyData.id })
      } else {
        reject(new Error('Simulated API failure'))
      }
    }, 2000)
  })
}

// ─────────────────────────────────────────────────────────────
// HELPER: IndexedDB thuần (không dùng idb library trong SW)
// ─────────────────────────────────────────────────────────────
function openSurveyDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vku-survey-db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(wrapDB(request.result))

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-surveys')) {
        const store = db.createObjectStore('pending-surveys', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

function wrapDB(db) {
  return {
    transaction: (storeName, mode) => {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      return {
        objectStore: () => ({
          getAll: () => new Promise((res, rej) => {
            const req = store.getAll()
            req.onsuccess = () => res(req.result)
            req.onerror = () => rej(req.error)
          }),
          delete: (id) => new Promise((res, rej) => {
            const req = store.delete(id)
            req.onsuccess = () => res()
            req.onerror = () => rej(req.error)
          }),
        }),
        done: new Promise((res, rej) => {
          tx.oncomplete = res
          tx.onerror = () => rej(tx.error)
        }),
      }
    },
  }
}

async function getAllFromStore(store) {
  return store.getAll()
}
