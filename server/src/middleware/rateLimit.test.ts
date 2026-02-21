// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createRateLimitMiddleware } from './rateLimit.js'

function createResMock() {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.payload = payload
      return this
    }
  }

  return response
}

describe('createRateLimitMiddleware', () => {
  it('blocks requests after limit is reached', () => {
    const middleware = createRateLimitMiddleware({
      limit: 2,
      windowMs: 60_000
    })

    const req = { ip: '127.0.0.1', path: '/api/admin/login' } as never
    const next = vi.fn()

    const res1 = createResMock()
    middleware(req, res1 as never, next)

    const res2 = createResMock()
    middleware(req, res2 as never, next)

    const res3 = createResMock()
    middleware(req, res3 as never, next)

    expect(next).toHaveBeenCalledTimes(2)
    expect(res3.statusCode).toBe(429)
    expect(res3.payload).toEqual({
      error: 'Demasiados intentos. Intenta nuevamente.'
    })
  })
})
