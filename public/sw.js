const CACHE_VERSION = 'sd-static-v3'
const CACHE_NAME = `${CACHE_VERSION}`
const PRECACHE_URLS = ['/', '/index.html']
const CACHEABLE_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font'])

function isCacheableResponse(request, response) {
  if (!response || !response.ok) {
    return false
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase()

  if (request.destination === 'style') {
    return contentType.includes('text/css')
  }

  if (request.destination === 'script') {
    return contentType.includes('javascript')
  }

  if (request.destination === 'document') {
    return contentType.includes('text/html')
  }

  return true
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  )
  self.clients.claim()
})

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(request, response)) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    return cached
  }

  const networkResponse = await networkPromise
  return networkResponse || new Response('', { status: 504 })
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (isCacheableResponse(request, response)) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    return cached || new Response('', { status: 504 })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) {
    return
  }

  const isAssetRequest =
    requestUrl.pathname.startsWith('/assets/') ||
    requestUrl.pathname.startsWith('/optimized/')

  if (request.destination === 'document') {
    event.respondWith(networkFirst(request))
    return
  }

  if (CACHEABLE_DESTINATIONS.has(request.destination) || isAssetRequest) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
