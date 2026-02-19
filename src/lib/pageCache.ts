const COOKIE_NAME = 'sd_page_cache_meta'
const CACHE_VERSION = '1'
const STORAGE_PREFIX = `sd:page-cache:${CACHE_VERSION}:`
const EXCLUDED_ROUTES = new Set(['/'])
const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24 * 14
const MAX_ROUTE_SNAPSHOTS = 24
const MAX_HTML_CHARS = 120000

type CacheCookieMeta = {
  v: string
  routes: string[]
  updatedAt: number
}

type CachedSnapshot = {
  html: string
  savedAt: number
}

function getStorageKey(pathname: string) {
  return `${STORAGE_PREFIX}${pathname}`
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getCookieValue(name: string) {
  if (!canUseBrowserStorage()) {
    return null
  }

  const pattern = new RegExp(`(?:^|; )${name}=([^;]*)`)
  const match = document.cookie.match(pattern)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function readCookieMeta(): CacheCookieMeta {
  const fallback: CacheCookieMeta = { v: CACHE_VERSION, routes: [], updatedAt: 0 }
  const raw = getCookieValue(COOKIE_NAME)

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CacheCookieMeta>
    if (parsed.v !== CACHE_VERSION || !Array.isArray(parsed.routes)) {
      return fallback
    }

    return {
      v: CACHE_VERSION,
      routes: parsed.routes.filter((route): route is string => typeof route === 'string'),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0
    }
  } catch {
    return fallback
  }
}

function writeCookieMeta(meta: CacheCookieMeta) {
  if (!canUseBrowserStorage()) {
    return
  }

  const encoded = encodeURIComponent(JSON.stringify(meta))
  const maxAgeSeconds = 60 * 60 * 24 * 14
  document.cookie = `${COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

function keepRecentRoutes(routes: string[]) {
  const unique = Array.from(new Set(routes))
  return unique.slice(Math.max(0, unique.length - MAX_ROUTE_SNAPSHOTS))
}

function purgeOutdatedSnapshots(routesToKeep: string[]) {
  if (!canUseBrowserStorage()) {
    return
  }

  const keepKeys = new Set(routesToKeep.map((route) => getStorageKey(route)))
  const keysToDelete: string[] = []

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(STORAGE_PREFIX)) {
      continue
    }

    if (!keepKeys.has(key)) {
      keysToDelete.push(key)
    }
  }

  for (const key of keysToDelete) {
    localStorage.removeItem(key)
  }
}

export function isCacheableRoute(pathname: string) {
  if (!pathname || !pathname.startsWith('/')) {
    return false
  }

  return !EXCLUDED_ROUTES.has(pathname)
}

export function captureSanitizedMarkup(container: HTMLElement) {
  const clone = container.cloneNode(true) as HTMLElement
  clone.querySelectorAll('script').forEach((node) => node.remove())

  clone.querySelectorAll('input, textarea, select').forEach((node) => {
    node.setAttribute('disabled', 'true')
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      node.value = ''
    }

    if (node instanceof HTMLSelectElement) {
      node.selectedIndex = 0
    }
  })

  clone.querySelectorAll('a, button').forEach((node) => {
    node.setAttribute('tabindex', '-1')
    node.setAttribute('aria-hidden', 'true')
  })

  const html = clone.innerHTML.trim()
  if (!html) {
    return null
  }

  return html.slice(0, MAX_HTML_CHARS)
}

export function savePageSnapshot(pathname: string, html: string) {
  if (!canUseBrowserStorage() || !isCacheableRoute(pathname)) {
    return
  }

  const normalized = html.trim()
  if (normalized.length < 64) {
    return
  }

  const snapshot: CachedSnapshot = {
    html: normalized,
    savedAt: Date.now()
  }

  try {
    localStorage.setItem(getStorageKey(pathname), JSON.stringify(snapshot))
  } catch {
    return
  }

  const currentMeta = readCookieMeta()
  const nextRoutes = keepRecentRoutes([...currentMeta.routes, pathname])
  writeCookieMeta({
    v: CACHE_VERSION,
    routes: nextRoutes,
    updatedAt: Date.now()
  })
  purgeOutdatedSnapshots(nextRoutes)
}

export function readPageSnapshot(pathname: string) {
  if (!canUseBrowserStorage() || !isCacheableRoute(pathname)) {
    return null
  }

  const raw = localStorage.getItem(getStorageKey(pathname))
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CachedSnapshot>
    if (typeof parsed.savedAt !== 'number' || typeof parsed.html !== 'string') {
      localStorage.removeItem(getStorageKey(pathname))
      return null
    }

    if (Date.now() - parsed.savedAt > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(getStorageKey(pathname))
      return null
    }

    return parsed.html
  } catch {
    localStorage.removeItem(getStorageKey(pathname))
    return null
  }
}
