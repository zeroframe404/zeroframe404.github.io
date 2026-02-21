import type { RequestHandler } from 'express'
import { ADMIN_COOKIE_NAME, getActiveAdminSession } from '../modules/admin/admin.service.js'

export const authAdmin: RequestHandler = async (req, res, next) => {
  const token = typeof req.cookies?.[ADMIN_COOKIE_NAME] === 'string'
    ? req.cookies[ADMIN_COOKIE_NAME]
    : ''

  if (!token) {
    res.status(401).json({ error: 'No autorizado.' })
    return
  }

  const session = await getActiveAdminSession(token)
  if (!session) {
    res.status(401).json({ error: 'No autorizado.' })
    return
  }

  req.adminSession = session
  next()
}

