import type { RequestHandler } from 'express'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function createRateLimitMiddleware(config: {
  limit: number
  windowMs: number
}): RequestHandler {
  return (req, res, next) => {
    const now = Date.now()
    const key = `${req.ip}:${req.path}`
    const existing = buckets.get(key)

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      })
      next()
      return
    }

    if (existing.count >= config.limit) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000)
      res.setHeader('Retry-After', retryAfterSeconds.toString())
      res.status(429).json({ error: 'Demasiados intentos. Intenta nuevamente.' })
      return
    }

    existing.count += 1
    next()
  }
}

