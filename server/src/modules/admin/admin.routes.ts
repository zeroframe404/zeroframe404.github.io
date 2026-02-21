import { Router } from 'express'
import { env, isProduction } from '../../config/env.js'
import { authAdmin } from '../../middleware/authAdmin.js'
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js'
import { asString } from '../../utils/validation/common.js'
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  deleteCotizacionById,
  deleteSiniestroById,
  getSiniestroArchivoContent,
  getSiniestroArchivos,
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
    res.status(400).json({ error: 'La contraseña es obligatoria.' })
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

adminRouter.get('/siniestros/:siniestroId/archivos', authAdmin, async (req, res) => {
  const siniestroId = asString(req.params.siniestroId)
  if (!siniestroId) {
    res.status(400).json({ error: 'Siniestro inválido.' })
    return
  }

  const files = await getSiniestroArchivos(siniestroId)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ archivos: files })
})

adminRouter.get('/siniestros/:siniestroId/archivos/:fileId', authAdmin, async (req, res) => {
  const siniestroId = asString(req.params.siniestroId)
  const fileId = asString(req.params.fileId)
  if (!siniestroId || !fileId) {
    res.status(400).json({ error: 'Archivo inválido.' })
    return
  }

  const file = await getSiniestroArchivoContent({
    siniestroId,
    fileId
  })

  if (!file) {
    res.status(404).json({ error: 'Archivo no encontrado.' })
    return
  }

  const isDownload = String(req.query.download ?? '') === '1'
  const disposition = isDownload ? 'attachment' : 'inline'
  const encodedName = encodeURIComponent(file.originalName)

  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', file.mimeType)
  res.setHeader('Content-Length', String(file.content.length))
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename*=UTF-8''${encodedName}`
  )

  res.status(200).send(file.content)
})

adminRouter.delete('/cotizaciones/:cotizacionId', authAdmin, async (req, res) => {
  const cotizacionId = asString(req.params.cotizacionId)
  if (!cotizacionId) {
    res.status(400).json({ error: 'Cotización inválida.' })
    return
  }

  const deleted = await deleteCotizacionById(cotizacionId)
  if (!deleted) {
    res.status(404).json({ error: 'Cotización no encontrada.' })
    return
  }

  res.status(200).json({ ok: true })
})

adminRouter.delete('/siniestros/:siniestroId', authAdmin, async (req, res) => {
  const siniestroId = asString(req.params.siniestroId)
  if (!siniestroId) {
    res.status(400).json({ error: 'Siniestro inválido.' })
    return
  }

  const deleted = await deleteSiniestroById(siniestroId)
  if (!deleted) {
    res.status(404).json({ error: 'Siniestro no encontrado.' })
    return
  }

  res.status(200).json({ ok: true })
})
