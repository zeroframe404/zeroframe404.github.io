import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach, vi } from 'vitest'

beforeAll(() => {
  window.scrollTo = vi.fn()
})

beforeEach(() => {
  window.localStorage.clear()
  document.cookie = 'sd_page_cache_meta=; Path=/; Max-Age=0; SameSite=Lax'
})
