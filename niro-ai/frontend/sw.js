// Service Worker NIRO — gestion hors ligne
const CACHE = 'niro-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/offline.html', '/manifest.json']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // WebSocket → pas de cache
  if (e.request.url.includes('/ws')) return

  // Page principale → toujours réseau, fallback hors ligne
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // Autres ressources → réseau d'abord
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
