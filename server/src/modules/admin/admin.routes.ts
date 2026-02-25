import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { env, isProduction } from '../../config/env.js'
import { authAdmin } from '../../middleware/authAdmin.js'
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js'
import { asString } from '../../utils/validation/common.js'
import {
  ADMIN_COOKIE_NAME,
  assignAdminUserRole,
  canAdminPerform,
  createAdminRole,
  createAdminSession,
  createAdminUser,
  deleteCotizacionById,
  deleteSiniestroById,
  getAccessControlSnapshot,
  getAdminActivities,
  getAdminDashboard,
  getSiniestroArchivoContent,
  getSiniestroArchivos,
  registerAdminActivity,
  revokeAdminSession,
  validateAdminCredentials
} from './admin.service.js'
import type { AdminPermissionMap, AdminSessionContext } from './admin.types.js'

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

function getSessionOrFail(
  req: { adminSession?: AdminSessionContext },
  res: {
    status: (code: number) => { json: (payload: unknown) => unknown }
  }
) {
  if (!req.adminSession) {
    res.status(401).json({ error: 'No autorizado.' })
    return null
  }

  return req.adminSession
}

function isPermissionMap(value: unknown): value is AdminPermissionMap {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.can_view_cotizaciones === 'boolean' &&
    typeof record.can_delete_cotizaciones === 'boolean' &&
    typeof record.can_view_siniestros === 'boolean' &&
    typeof record.can_delete_siniestros === 'boolean'
  )
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

function requirePermission(
  session: AdminSessionContext,
  permission: keyof AdminPermissionMap,
  res: {
    status: (code: number) => { json: (payload: unknown) => unknown }
  }
) {
  if (canAdminPerform(session, permission)) {
    return true
  }

  res.status(403).json({ error: 'No tenes permisos para realizar esta accion.' })
  return false
}

function requireSuperAdmin(
  session: AdminSessionContext,
  res: {
    status: (code: number) => { json: (payload: unknown) => unknown }
  }
) {
  if (session.user.is_super_admin) {
    return true
  }

  res.status(403).json({ error: 'Solo el admin principal puede realizar esta accion.' })
  return false
}

adminRouter.post('/login', loginRateLimit, async (req, res) => {
  const username = asString(req.body?.username)
  const password = asString(req.body?.password)
  if (!username || !password) {
    res.status(400).json({ error: 'El usuario y la contraseña son obligatorios.' })
    return
  }

  const authResult = await validateAdminCredentials({
    username,
    password
  })

  if (!authResult) {
    res.status(401).json({ error: 'Credenciales invalidas' })
    return
  }

  const session = await createAdminSession({
    userId: authResult.user.id,
    ip: req.ip,
    userAgent:
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined
  })

  const maxAgeMs = env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000
  res.cookie(ADMIN_COOKIE_NAME, session.token, getSessionCookieOptions(maxAgeMs))

  await registerAdminActivity({
    actorUserId: authResult.user.id,
    action: 'login',
    section: 'auth',
    description: 'Inicio sesion en el panel admin.'
  })

  res.status(200).json({ ok: true })
})

adminRouter.post('/logout', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const token = asString(req.cookies?.[ADMIN_COOKIE_NAME])
  if (token) {
    await revokeAdminSession(token)
  }

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'logout',
    section: 'auth',
    description: 'Cerro sesion en el panel admin.'
  })

  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction() || env.ADMIN_COOKIE_SAME_SITE === 'none',
    sameSite: env.ADMIN_COOKIE_SAME_SITE,
    path: '/'
  })
  res.status(200).json({ ok: true })
})

adminRouter.get('/dashboard', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const payload = await getAdminDashboard({
    rawLimit: req.query.limit,
    session: currentSession
  })

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})

adminRouter.post('/track-view', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const section = asString(req.body?.section)
  const targetId = asString(req.body?.target_id) || null

  if (section === 'cotizaciones') {
    if (!requirePermission(currentSession, 'can_view_cotizaciones', res)) {
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'view_cotizacion',
      section,
      targetId,
      description: 'Abrio el detalle de una cotizacion.'
    })

    res.status(200).json({ ok: true })
    return
  }

  if (section === 'siniestros') {
    if (!requirePermission(currentSession, 'can_view_siniestros', res)) {
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'view_siniestro',
      section,
      targetId,
      description: 'Abrio el detalle de un siniestro.'
    })

    res.status(200).json({ ok: true })
    return
  }

  res.status(400).json({ error: 'Seccion de actividad invalida.' })
})

adminRouter.get('/siniestros/:siniestroId/archivos', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requirePermission(currentSession, 'can_view_siniestros', res)) {
    return
  }

  const siniestroId = asString(req.params.siniestroId)
  if (!siniestroId) {
    res.status(400).json({ error: 'Siniestro invalido.' })
    return
  }

  const files = await getSiniestroArchivos(siniestroId)

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'view_siniestro_archivos',
    section: 'siniestros',
    targetId: siniestroId,
    description: 'Abrio la lista de imagenes de un siniestro.'
  })

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ archivos: files })
})

adminRouter.get('/siniestros/:siniestroId/archivos/:fileId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requirePermission(currentSession, 'can_view_siniestros', res)) {
    return
  }

  const siniestroId = asString(req.params.siniestroId)
  const fileId = asString(req.params.fileId)
  if (!siniestroId || !fileId) {
    res.status(400).json({ error: 'Archivo invalido.' })
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

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: isDownload ? 'download_siniestro_archivo' : 'preview_siniestro_archivo',
    section: 'siniestros',
    targetId: siniestroId,
    description: isDownload
      ? 'Descargo un archivo de siniestro.'
      : 'Abrio una imagen de siniestro en vista grande.',
    metadata: {
      file_id: fileId
    }
  })

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
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requirePermission(currentSession, 'can_delete_cotizaciones', res)) {
    return
  }

  const cotizacionId = asString(req.params.cotizacionId)
  if (!cotizacionId) {
    res.status(400).json({ error: 'Cotizacion invalida.' })
    return
  }

  const deleted = await deleteCotizacionById(cotizacionId)
  if (!deleted) {
    res.status(404).json({ error: 'Cotizacion no encontrada.' })
    return
  }

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'delete_cotizacion',
    section: 'cotizaciones',
    targetId: cotizacionId,
    description: 'Elimino una cotizacion.'
  })

  res.status(200).json({ ok: true })
})

adminRouter.delete('/siniestros/:siniestroId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requirePermission(currentSession, 'can_delete_siniestros', res)) {
    return
  }

  const siniestroId = asString(req.params.siniestroId)
  if (!siniestroId) {
    res.status(400).json({ error: 'Siniestro invalido.' })
    return
  }

  const deleted = await deleteSiniestroById(siniestroId)
  if (!deleted) {
    res.status(404).json({ error: 'Siniestro no encontrado.' })
    return
  }

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'delete_siniestro',
    section: 'siniestros',
    targetId: siniestroId,
    description: 'Elimino un siniestro.'
  })

  res.status(200).json({ ok: true })
})

adminRouter.get('/access-control', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const payload = await getAccessControlSnapshot()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})

adminRouter.post('/roles', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const roleName = asString(req.body?.name)
  const permissionsPayload = req.body?.permissions

  if (!roleName) {
    res.status(400).json({ error: 'El nombre del rol es obligatorio.' })
    return
  }

  if (!isPermissionMap(permissionsPayload)) {
    res.status(400).json({ error: 'Los permisos del rol son invalidos.' })
    return
  }

  try {
    const role = await createAdminRole({
      name: roleName,
      permissions: permissionsPayload
    })

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'create_role',
      section: 'access_control',
      targetId: role.id,
      description: `Creo el rol "${role.name}".`
    })

    res.status(201).json({ role })
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: 'Ya existe un rol con ese nombre.' })
      return
    }

    throw error
  }
})

adminRouter.post('/users', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const username = asString(req.body?.username)
  const password = asString(req.body?.password)
  const roleIdRaw = req.body?.role_id
  const roleId = roleIdRaw === null ? null : asString(roleIdRaw) || null

  if (!username || !password) {
    res.status(400).json({ error: 'El usuario y la contraseña son obligatorios.' })
    return
  }

  try {
    const user = await createAdminUser({
      username,
      password,
      roleId
    })

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'create_user',
      section: 'access_control',
      targetId: user.id,
      description: `Creo el usuario "${user.username}".`
    })

    res.status(201).json({ user })
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: 'Ya existe un usuario con ese nombre.' })
      return
    }

    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.patch('/users/:userId/role', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const userId = asString(req.params.userId)
  const roleIdRaw = req.body?.role_id
  const roleId = roleIdRaw === null ? null : asString(roleIdRaw) || null

  if (!userId) {
    res.status(400).json({ error: 'Usuario invalido.' })
    return
  }

  try {
    const updated = await assignAdminUserRole({
      userId,
      roleId
    })

    if (!updated) {
      res.status(404).json({ error: 'Usuario no encontrado.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'assign_role',
      section: 'access_control',
      targetId: updated.id,
      description: `Actualizo el rol del usuario "${updated.username}".`,
      metadata: {
        role_id: updated.role_id
      }
    })

    res.status(200).json({ user: updated })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.get('/activities', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const payload = await getAdminActivities(req.query.limit)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})
