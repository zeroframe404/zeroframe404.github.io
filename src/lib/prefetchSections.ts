import { sectionLoaders } from '../config/moduleLoaders'

const PREFETCH_SESSION_KEY = 'sd_sections_prefetched_v1'
let hasStartedPrefetch = false

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function runPrefetchQueue() {
  for (const loadSection of sectionLoaders) {
    await loadSection().catch(() => null)
    await delay(80)
  }
}

function queueOnIdle(callback: () => void) {
  if (typeof window === 'undefined') {
    return
  }

  const idleApi = (
    globalThis as typeof globalThis & {
      requestIdleCallback?: (
        cb: () => void,
        options?: { timeout: number }
      ) => number
    }
  ).requestIdleCallback

  if (typeof idleApi === 'function') {
    idleApi(callback, { timeout: 3200 })
    return
  }

  globalThis.setTimeout(callback, 1200)
}

export function prefetchAllSectionsInBackground() {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return
  }

  if (hasStartedPrefetch) {
    return
  }

  if (window.sessionStorage.getItem(PREFETCH_SESSION_KEY) === '1') {
    hasStartedPrefetch = true
    return
  }

  hasStartedPrefetch = true
  window.sessionStorage.setItem(PREFETCH_SESSION_KEY, '1')

  queueOnIdle(() => {
    void runPrefetchQueue()
  })
}
