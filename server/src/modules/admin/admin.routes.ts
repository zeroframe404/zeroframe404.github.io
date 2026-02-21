import { Router } from 'express'
import { env, isProduction } from '../../config/env.js'
import { authAdmin } from '../../middleware/authAdmin.js'
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js'
import { asString } from '../../utils/validation/common.js'
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminDashboard,
  revokeAdminSession,
  validateAdminPassword
} from './admin.service.js'

export const adminRouter = Router()

const loginRateLimit = createRateLimitMiddleware({
  limit: 8,
  windowMs: 60_000
})

function getSessionCookieOptions(maxAgeMs: number) {
  const secureCookie = isProduction() || env.ADMIN_COOKIE_SAME_SITE === 'none'

  return {
    httpOnly: true,
    secure: secureCookie,
    sameSite: env.ADMIN_COOKIE_SAME_SITE,
    path: '/',
    maxAge: maxAgeMs
  }
}

adminRouter.post('/login', loginRateLimit, async (req, res) => {
  const password = asString(req.body?.password)
  if (!password) {
    res.status(400).json({ error: 'La contrasena es obligatoria.' })
    return
  }

  if (!validateAdminPassword(password)) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const session = await createAdminSession({
    ip: req.ip,
    userAgent:
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined
  })

  const maxAgeMs = env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000
  res.cookie(ADMIN_COOKIE_NAME, session.token, getSessionCookieOptions(maxAgeMs))
  res.status(200).json({ ok: true })
})

adminRouter.post('/logout', authAdmin, async (req, res) => {
  const token = asString(req.cookies?.[ADMIN_COOKIE_NAME])
  if (token) {
    await revokeAdminSession(token)
  }

  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction() || env.ADMIN_COOKIE_SAME_SITE === 'none',
    sameSite: env.ADMIN_COOKIE_SAME_SITE,
    path: '/'
  })
  res.status(200).json({ ok: true })
})

adminRouter.get('/dashboard', authAdmin, async (req, res) => {
  const payload = await getAdminDashboard(req.query.limit)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})
