// Service Worker for Dristi AI - Offline functionality and caching

const CACHE_NAME = 'dristi-ai-v1.0.0'
const STATIC_CACHE = 'dristi-static-v1.0.0'
const DYNAMIC_CACHE = 'dristi-dynamic-v1.0.0'
const IMAGE_CACHE = 'dristi-images-v1.0.0'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  // Add other critical static files
]

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/ai/diseases',
  '/api/location/doctors',
  '/api/prescription/analytics',
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests with appropriate caching strategies
  if (request.destination === 'image') {
    // Images: Cache first, then network
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
  } else if (url.pathname.startsWith('/api/')) {
    // API requests: Network first, then cache
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE))
  } else if (STATIC_FILES.includes(url.pathname)) {
    // Static files: Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
  } else {
    // Other requests: Stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE))
  }
})

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache', request.url)
      return cachedResponse
    }
    
    console.log('Service Worker: Fetching from network', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Cache first strategy failed', error)
    return getOfflineFallback(request)
  }
}

// Network first strategy - good for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('Service Worker: Trying network first', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
      console.log('Service Worker: Network response cached', request.url)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url)
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Service Worker: Serving stale data from cache', request.url)
      return cachedResponse
    }
    
    return getOfflineFallback(request)
  }
}

// Stale while revalidate strategy - good for frequently updated content
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
        console.log('Service Worker: Background cache update', request.url)
      }
      return networkResponse
    })
    .catch((error) => {
      console.error('Service Worker: Background fetch failed', error)
    })
  
  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('Service Worker: Serving stale content', request.url)
    return cachedResponse
  }
  
  // If no cache, wait for network
  try {
    return await networkResponsePromise
  } catch (error) {
    return getOfflineFallback(request)
  }
}

// Get offline fallback response
function getOfflineFallback(request) {
  const url = new URL(request.url)
  
  if (request.destination === 'image') {
    // Return a placeholder image for failed image requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Image Unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
  
  if (url.pathname.startsWith('/api/')) {
    // Return offline message for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
  
  // Return offline page for navigation requests
  return caches.match('/offline.html') || new Response(
    '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    }
  )
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync-prescriptions') {
    event.waitUntil(syncPrescriptions())
  } else if (event.tag === 'background-sync-appointments') {
    event.waitUntil(syncAppointments())
  }
})

// Sync prescriptions when back online
async function syncPrescriptions() {
  try {
    console.log('Service Worker: Syncing prescriptions...')
    
    // Get pending prescriptions from IndexedDB
    const pendingPrescriptions = await getPendingData('prescriptions')
    
    for (const prescription of pendingPrescriptions) {
      try {
        const response = await fetch('/api/prescription/prescriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${prescription.token}`
          },
          body: JSON.stringify(prescription.data)
        })
        
        if (response.ok) {
          await removePendingData('prescriptions', prescription.id)
          console.log('Service Worker: Prescription synced successfully')
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync prescription', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Prescription sync failed', error)
  }
}

// Sync appointments when back online
async function syncAppointments() {
  try {
    console.log('Service Worker: Syncing appointments...')
    
    // Get pending appointments from IndexedDB
    const pendingAppointments = await getPendingData('appointments')
    
    for (const appointment of pendingAppointments) {
      try {
        const response = await fetch('/api/consultation/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${appointment.token}`
          },
          body: JSON.stringify(appointment.data)
        })
        
        if (response.ok) {
          await removePendingData('appointments', appointment.id)
          console.log('Service Worker: Appointment synced successfully')
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync appointment', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Appointment sync failed', error)
  }
}

// IndexedDB helpers for offline data storage
async function getPendingData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DristiOfflineDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function removePendingData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DristiOfflineDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const deleteRequest = store.delete(id)
      
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'You have a new notification from Dristi AI',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  }
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.data = { ...options.data, ...data }
  }
  
  event.waitUntil(
    self.registration.showNotification('Dristi AI', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(urls))
        .then(() => {
          event.ports[0].postMessage({ success: true })
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
    )
  }
})
