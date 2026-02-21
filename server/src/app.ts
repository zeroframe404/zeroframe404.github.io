import cookieParser from 'cookie-parser'
import express from 'express'
import { env } from './config/env.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { formsRouter } from './modules/forms/forms.routes.js'

const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

function isOriginAllowed(origin: string) {
  if (env.CORS_ALLOWED_ORIGINS.length > 0) {
    return env.CORS_ALLOWED_ORIGINS.includes(origin)
  }

  // Dev fallback to avoid extra env setup in local.
  return env.NODE_ENV !== 'production' && localOriginPattern.test(origin)
}

function setCorsHeaders(response: express.Response, origin: string) {
  response.setHeader('Vary', 'Origin')
  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use((req, res, next) => {
    const originHeader = req.headers.origin
    const origin = typeof originHeader === 'string' ? originHeader : null
    const allowed = origin ? isOriginAllowed(origin) : false

    if (origin && allowed) {
      setCorsHeaders(res, origin)
    }

    if (req.method === 'OPTIONS') {
      if (origin && !allowed) {
        res.status(403).json({ error: 'Origin no permitido.' })
        return
      }

      res.status(204).end()
      return
    }

    next()
  })

  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(env.COOKIE_SECRET))

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  app.use('/api/admin', adminRouter)
  app.use('/api/forms', formsRouter)

  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    void next

    if (error instanceof Error && error.name === 'MulterError') {
      res.status(400).json({ error: 'No pudimos procesar los archivos adjuntos.' })
      return
    }

    if (error instanceof Error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(500).json({ error: 'Unexpected server error.' })
  })

  return app
}
