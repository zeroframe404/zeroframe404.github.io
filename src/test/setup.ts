import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach, vi } from 'vitest'

beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo = vi.fn()
  }
})

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }

  if (typeof document !== 'undefined') {
    document.cookie = 'sd_page_cache_meta=; Path=/; Max-Age=0; SameSite=Lax'
  }
})
