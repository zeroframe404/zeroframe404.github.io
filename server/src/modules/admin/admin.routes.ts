import { Router } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'
import { env, isProduction } from '../../config/env.js'
import { authAdmin } from '../../middleware/authAdmin.js'
import { createRateLimitMiddleware } from '../../middleware/rateLimit.js'
import { asString } from '../../utils/validation/common.js'
import {
  ADMIN_COOKIE_NAME,
  assignAdminUserRole,
  canAdminPerform,
  clearAdminActivities,
  createAdminRole,
  createAdminSession,
  createAdminUser,
  deleteAdminRole,
  deleteAdminUser,
  deleteCotizacionById,
  deleteSiniestroById,
  getAccessControlSnapshot,
  getAdminActivities,
  getAdminLogSettings,
  getAdminDashboard,
  getSiniestroArchivoContent,
  getSiniestroArchivos,
  overrideCotizacionRouting,
  registerAdminActivity,
  revokeAdminSession,
  updateAdminLogSettings,
  updateAdminRole,
  updateAdminUser,
  updateSuperAdminCredentials,
  validateAdminCredentials
} from './admin.service.js'
import {
  createAdminTask,
  createAdminTaskMessage,
  deleteAdminTask,
  getAdminTaskAssignees,
  getAdminTaskAttachmentContent,
  getAdminTaskDetail,
  getAdminTaskMessageAttachmentContent,
  listAdminTasks,
  setAdminTaskStatus
} from '../tasks/tasks.service.js'
import type {
  AdminLogAutoClearUnit,
  AdminPermissionMap,
  CotizacionRoutingBranch,
  AdminUserBranch,
  AdminSessionContext
} from './admin.types.js'

export const adminRouter = Router()

const loginRateLimit = createRateLimitMiddleware({
  limit: 8,
  windowMs: 60_000
})

const taskUpload = multer({
  storage: multer.memoryStorage()
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

function isAutoClearUnit(value: unknown): value is AdminLogAutoClearUnit {
  return value === 'day' || value === 'week' || value === 'month'
}

function isUserBranch(value: unknown): value is AdminUserBranch {
  return value === 'lanus' || value === 'avellaneda' || value === 'online'
}

function isCotizacionRoutingBranch(value: unknown): value is CotizacionRoutingBranch {
  return value === 'avellaneda' || value === 'lanus' || value === 'lejanos'
}

function parseOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true
    }

    if (value.toLowerCase() === 'false') {
      return false
    }
  }

  return undefined
}

function parseStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item) => item.length > 0)
  }

  const asSingleString = asString(value)
  if (!asSingleString) {
    return []
  }

  if (asSingleString.startsWith('[') && asSingleString.endsWith(']')) {
    try {
      const parsedJson = JSON.parse(asSingleString)
      if (Array.isArray(parsedJson)) {
        return parsedJson
          .map((item) => asString(item))
          .filter((item) => item.length > 0)
      }
    } catch {
      // ignore malformed json and fallback to comma-separated parsing
    }
  }

  return asSingleString
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function parseTaskStatusFilter(rawStatus: unknown) {
  const status = asString(rawStatus).toLowerCase()
  if (status === 'pending' || status === 'completed') {
    return status
  }

  return undefined
}

function parseUploadedFiles(files: unknown) {
  if (!Array.isArray(files)) {
    return []
  }

  return files.filter((file): file is Express.Multer.File => {
    if (typeof file !== 'object' || file === null) {
      return false
    }

    const record = file as Record<string, unknown>
    return (
      typeof record.originalname === 'string' &&
      typeof record.mimetype === 'string' &&
      typeof record.size === 'number' &&
      Buffer.isBuffer(record.buffer)
    )
  })
}

function parseDateFilter(input: unknown, endOfDay = false) {
  const rawValue = asString(input)
  if (!rawValue) {
    return {
      value: null,
      valid: true
    }
  }

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
  const normalizedRaw = dateOnlyPattern.test(rawValue)
    ? `${rawValue}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
    : rawValue

  const parsed = new Date(normalizedRaw)
  if (Number.isNaN(parsed.getTime())) {
    return {
      value: null,
      valid: false
    }
  }

  return {
    value: parsed,
    valid: true
  }
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
    res.status(400).json({ error: 'El usuario y la contrasena son obligatorios.' })
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

adminRouter.get('/task-assignees', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  try {
    const assignees = await getAdminTaskAssignees(currentSession)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ assignees })
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.get('/tasks', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const status = parseTaskStatusFilter(req.query.status)
  const payload = await listAdminTasks({
    session: currentSession,
    rawStatus: status,
    rawLimit: req.query.limit
  })

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})

adminRouter.post('/tasks', authAdmin, taskUpload.array('files'), async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const descriptionMarkdown = asString(req.body?.description_markdown)
  const assigneeUserIds = parseStringList(req.body?.assignee_user_ids)
  const uploadedFiles = parseUploadedFiles(req.files)

  try {
    const task = await createAdminTask({
      session: currentSession,
      descriptionMarkdown,
      assigneeUserIds,
      files: uploadedFiles
    })

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'create_task',
      section: 'tasks',
      targetId: task.id,
      description: 'Creo una nueva tarea para empleados.',
      metadata: {
        assignee_count: task.assignees.length,
        attachment_count: task.attachments.length
      }
    })

    res.status(201).json({ task })
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = currentSession.user.is_super_admin ? 400 : 403
      res.status(statusCode).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.get('/tasks/:taskId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const taskId = asString(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: 'Tarea invalida.' })
    return
  }

  const payload = await getAdminTaskDetail({
    session: currentSession,
    taskId,
    rawMessageLimit: req.query.message_limit
  })

  if (!payload) {
    res.status(404).json({ error: 'Tarea no encontrada.' })
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})

adminRouter.patch('/tasks/:taskId/status', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const taskId = asString(req.params.taskId)
  const isCompleted = parseOptionalBoolean(req.body?.is_completed)

  if (!taskId) {
    res.status(400).json({ error: 'Tarea invalida.' })
    return
  }

  if (typeof isCompleted !== 'boolean') {
    res.status(400).json({ error: 'is_completed debe ser true o false.' })
    return
  }

  try {
    const task = await setAdminTaskStatus({
      session: currentSession,
      taskId,
      isCompleted
    })

    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: isCompleted ? 'complete_task' : 'reopen_task',
      section: 'tasks',
      targetId: taskId,
      description: isCompleted
        ? 'Marco una tarea como completada.'
        : 'Volvio una tarea a pendiente.'
    })

    res.status(200).json({ task })
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.delete('/tasks/:taskId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const taskId = asString(req.params.taskId)
  if (!taskId) {
    res.status(400).json({ error: 'Tarea invalida.' })
    return
  }

  try {
    const deleted = await deleteAdminTask({
      session: currentSession,
      taskId
    })

    if (!deleted) {
      res.status(404).json({ error: 'Tarea no encontrada.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'delete_task',
      section: 'tasks',
      targetId: taskId,
      description: 'Elimino una tarea.'
    })

    res.status(200).json({ ok: true })
  } catch (error) {
    if (error instanceof Error) {
      res.status(403).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.post(
  '/tasks/:taskId/messages',
  authAdmin,
  taskUpload.array('files'),
  async (req, res) => {
    const currentSession = getSessionOrFail(req, res)
    if (!currentSession) {
      return
    }

    const taskId = asString(req.params.taskId)
    if (!taskId) {
      res.status(400).json({ error: 'Tarea invalida.' })
      return
    }

    const bodyMarkdown = asString(req.body?.body_markdown)
    const uploadedFiles = parseUploadedFiles(req.files)

    try {
      const message = await createAdminTaskMessage({
        session: currentSession,
        taskId,
        bodyMarkdown,
        files: uploadedFiles
      })

      if (!message) {
        res.status(404).json({ error: 'Tarea no encontrada.' })
        return
      }

      await registerAdminActivity({
        actorUserId: currentSession.user.id,
        action: 'task_chat_message',
        section: 'tasks',
        targetId: taskId,
        description: 'Envio un mensaje en el chat de tareas.',
        metadata: {
          attachment_count: message.attachments.length
        }
      })

      res.status(201).json({ message })
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
        return
      }

      throw error
    }
  }
)

adminRouter.get('/tasks/:taskId/attachments/:fileId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  const taskId = asString(req.params.taskId)
  const fileId = asString(req.params.fileId)
  if (!taskId || !fileId) {
    res.status(400).json({ error: 'Archivo invalido.' })
    return
  }

  const file = await getAdminTaskAttachmentContent({
    session: currentSession,
    taskId,
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

adminRouter.get(
  '/tasks/:taskId/messages/:messageId/attachments/:fileId',
  authAdmin,
  async (req, res) => {
    const currentSession = getSessionOrFail(req, res)
    if (!currentSession) {
      return
    }

    const taskId = asString(req.params.taskId)
    const messageId = asString(req.params.messageId)
    const fileId = asString(req.params.fileId)

    if (!taskId || !messageId || !fileId) {
      res.status(400).json({ error: 'Archivo invalido.' })
      return
    }

    const file = await getAdminTaskMessageAttachmentContent({
      session: currentSession,
      taskId,
      messageId,
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
  }
)

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

adminRouter.patch('/cotizaciones/:cotizacionId/routing', authAdmin, async (req, res) => {
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

  const routingBranchRaw = asString(req.body?.routing_branch).toLowerCase()
  if (!isCotizacionRoutingBranch(routingBranchRaw)) {
    res.status(400).json({ error: 'La sucursal debe ser avellaneda, lanus o lejanos.' })
    return
  }

  const reason = asString(req.body?.reason) || null
  const updated = await overrideCotizacionRouting({
    cotizacionId,
    routingBranch: routingBranchRaw,
    reason,
    actorUserId: currentSession.user.id
  })

  if (!updated) {
    res.status(404).json({ error: 'Cotizacion no encontrada.' })
    return
  }

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'override_cotizacion_routing',
    section: 'cotizaciones',
    targetId: cotizacionId,
    description: 'Actualizo manualmente la sucursal derivada de una cotizacion.',
    metadata: {
      previous_branch: updated.previous.routing_branch,
      next_branch: updated.current.routing_branch,
      previous_distance_km: updated.previous.routing_distance_km,
      next_distance_km: updated.current.routing_distance_km,
      reason: reason || null
    }
  })

  res.status(200).json({ cotizacion: updated.current })
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

    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.patch('/roles/:roleId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const roleId = asString(req.params.roleId)
  const roleName = asString(req.body?.name)
  const permissionsPayload = req.body?.permissions

  if (!roleId) {
    res.status(400).json({ error: 'Rol invalido.' })
    return
  }

  if (!roleName) {
    res.status(400).json({ error: 'El nombre del rol es obligatorio.' })
    return
  }

  if (!isPermissionMap(permissionsPayload)) {
    res.status(400).json({ error: 'Los permisos del rol son invalidos.' })
    return
  }

  try {
    const role = await updateAdminRole({
      roleId,
      name: roleName,
      permissions: permissionsPayload
    })

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'update_role',
      section: 'access_control',
      targetId: role.id,
      description: `Edito el rol "${role.name}".`
    })

    res.status(200).json({ role })
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: 'Ya existe un rol con ese nombre.' })
      return
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      res.status(404).json({ error: 'Rol no encontrado.' })
      return
    }

    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.delete('/roles/:roleId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const roleId = asString(req.params.roleId)
  if (!roleId) {
    res.status(400).json({ error: 'Rol invalido.' })
    return
  }

  const deleted = await deleteAdminRole(roleId)
  if (!deleted) {
    res.status(404).json({ error: 'Rol no encontrado.' })
    return
  }

  await registerAdminActivity({
    actorUserId: currentSession.user.id,
    action: 'delete_role',
    section: 'access_control',
    targetId: roleId,
    description: 'Elimino un rol.'
  })

  res.status(200).json({ ok: true })
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
  const branchRaw = asString(req.body?.branch)
  const roleId = roleIdRaw === null ? null : asString(roleIdRaw) || null

  if (!isUserBranch(branchRaw)) {
    res.status(400).json({ error: 'La sucursal debe ser lanus, avellaneda u online.' })
    return
  }

  if (!username || !password) {
    res.status(400).json({ error: 'El usuario y la contrasena son obligatorios.' })
    return
  }

  try {
    const user = await createAdminUser({
      username,
      password,
      roleId,
      branch: branchRaw
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

adminRouter.patch('/users/:userId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const userId = asString(req.params.userId)
  if (!userId) {
    res.status(400).json({ error: 'Usuario invalido.' })
    return
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const hasUsername = Object.prototype.hasOwnProperty.call(body, 'username')
  const hasPassword = Object.prototype.hasOwnProperty.call(body, 'password')
  const hasRoleId = Object.prototype.hasOwnProperty.call(body, 'role_id')
  const hasIsActive = Object.prototype.hasOwnProperty.call(body, 'is_active')
  const hasBranch = Object.prototype.hasOwnProperty.call(body, 'branch')

  const username = hasUsername ? asString(body.username) : undefined
  const password = hasPassword ? asString(body.password) : undefined
  const roleId = hasRoleId
    ? body.role_id === null
      ? null
      : asString(body.role_id) || null
    : undefined
  const parsedIsActive = hasIsActive ? parseOptionalBoolean(body.is_active) : undefined
  const branch = hasBranch ? asString(body.branch) : undefined
  const parsedBranch = hasBranch && isUserBranch(branch) ? branch : undefined

  if (hasIsActive && typeof parsedIsActive !== 'boolean') {
    res.status(400).json({ error: 'is_active debe ser true o false.' })
    return
  }

  if (hasBranch && !isUserBranch(branch)) {
    res.status(400).json({ error: 'La sucursal debe ser lanus, avellaneda u online.' })
    return
  }

  if (!hasUsername && !hasPassword && !hasRoleId && !hasIsActive && !hasBranch) {
    res.status(400).json({ error: 'No se enviaron cambios para actualizar.' })
    return
  }

  try {
    const updated = await updateAdminUser({
      userId,
      username: hasUsername ? username : undefined,
      password: hasPassword ? password : undefined,
      roleId,
      isActive: parsedIsActive,
      branch: parsedBranch
    })

    if (!updated) {
      res.status(404).json({ error: 'Usuario no encontrado.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'update_user',
      section: 'access_control',
      targetId: updated.id,
      description: `Edito el usuario "${updated.username}".`
    })

    res.status(200).json({ user: updated })
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

adminRouter.delete('/users/:userId', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const userId = asString(req.params.userId)
  if (!userId) {
    res.status(400).json({ error: 'Usuario invalido.' })
    return
  }

  try {
    const deleted = await deleteAdminUser(userId)
    if (!deleted) {
      res.status(404).json({ error: 'Usuario no encontrado.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'delete_user',
      section: 'access_control',
      targetId: userId,
      description: 'Elimino un usuario.'
    })

    res.status(200).json({ ok: true })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

adminRouter.patch('/super-admin/credentials', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const username = asString(req.body?.username) || undefined
  const password = asString(req.body?.password) || undefined

  if (!username && !password) {
    res.status(400).json({ error: 'Debes enviar un nuevo usuario o una nueva contrasena.' })
    return
  }

  try {
    const updatedUser = await updateSuperAdminCredentials({
      userId: currentSession.user.id,
      username,
      password
    })

    if (!updatedUser) {
      res.status(404).json({ error: 'Admin principal no encontrado.' })
      return
    }

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'update_super_admin_credentials',
      section: 'access_control',
      targetId: updatedUser.id,
      description: 'Actualizo las credenciales del admin principal.'
    })

    res.status(200).json({ user: updatedUser })
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

adminRouter.get('/activities', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const actorUserId = asString(req.query.actor_user_id)
  const actorUsername = asString(req.query.actor_username)
  const action = asString(req.query.action)
  const section = asString(req.query.section)
  const search = asString(req.query.search)

  const dateFrom = parseDateFilter(req.query.date_from)
  if (!dateFrom.valid) {
    res.status(400).json({ error: 'date_from invalido.' })
    return
  }

  const dateTo = parseDateFilter(req.query.date_to, true)
  if (!dateTo.valid) {
    res.status(400).json({ error: 'date_to invalido.' })
    return
  }

  const payload = await getAdminActivities({
    rawLimit: req.query.limit,
    actorUserId: actorUserId || undefined,
    actorUsername: actorUsername || undefined,
    action: action || undefined,
    section: section || undefined,
    search: search || undefined,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value
  })

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(payload)
})

adminRouter.delete('/activities', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const settings = await clearAdminActivities()
  res.status(200).json({ ok: true, settings })
})

adminRouter.get('/activities/settings', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const settings = await getAdminLogSettings()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ settings })
})

adminRouter.patch('/activities/settings', authAdmin, async (req, res) => {
  const currentSession = getSessionOrFail(req, res)
  if (!currentSession) {
    return
  }

  if (!requireSuperAdmin(currentSession, res)) {
    return
  }

  const autoClearValueRaw = req.body?.auto_clear_value
  const autoClearUnitRaw = req.body?.auto_clear_unit
  const autoClearValue = Number(autoClearValueRaw)

  if (!Number.isInteger(autoClearValue) || autoClearValue <= 0) {
    res.status(400).json({ error: 'auto_clear_value debe ser un numero entero mayor a 0.' })
    return
  }

  if (!isAutoClearUnit(autoClearUnitRaw)) {
    res.status(400).json({ error: 'auto_clear_unit debe ser day, week o month.' })
    return
  }

  try {
    const settings = await updateAdminLogSettings({
      autoClearValue,
      autoClearUnit: autoClearUnitRaw
    })

    await registerAdminActivity({
      actorUserId: currentSession.user.id,
      action: 'update_activity_log_settings',
      section: 'activities',
      description: `Actualizo autolimpieza del log a ${autoClearValue} ${autoClearUnitRaw}.`
    })

    res.status(200).json({ settings })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }

    throw error
  }
})

