import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from 'node:crypto'
import { Prisma } from '@prisma/client'
import { env } from '../../config/env.js'
import { normalizeLimit } from '../../utils/validation/common.js'
import { prisma } from '../db/prisma.js'
import { downloadSiniestroFileByKey } from '../storage/s3Client.js'
import type {
  AdminAccessControlResponse,
  AdminActivitiesResponse,
  AdminActivityRow,
  AdminDashboardResponse,
  AdminLeadRow,
  AdminPermissionMap,
  AdminRoleRow,
  AdminSessionContext,
  AdminSessionUser,
  AdminSiniestroArchivo,
  AdminUserRow
} from './admin.types.js'

export const ADMIN_COOKIE_NAME = 'admin_session'

const DEFAULT_ROOT_USERNAME = 'Daniel'
const DEFAULT_ROOT_PASSWORD = 'DockSud1945!#!'
const PASSWORD_SCRYPT_KEYLEN = 64
const PASSWORD_SEPARATOR = ':'

const ROOT_USERNAME = env.ADMIN_ROOT_USERNAME || DEFAULT_ROOT_USERNAME
const ROOT_PASSWORD =
  env.ADMIN_ROOT_PASSWORD ||
  env.ADMIN_DASHBOARD_PASSWORD ||
  DEFAULT_ROOT_PASSWORD

const FULL_PERMISSIONS: AdminPermissionMap = {
  can_view_cotizaciones: true,
  can_delete_cotizaciones: true,
  can_view_siniestros: true,
  can_delete_siniestros: true
}

const EMPTY_PERMISSIONS: AdminPermissionMap = {
  can_view_cotizaciones: false,
  can_delete_cotizaciones: false,
  can_view_siniestros: false,
  can_delete_siniestros: false
}

type AdminUserWithRole = Prisma.AdminUserGetPayload<{
  include: { role: true }
}>

type AdminActivityWithActor = Prisma.AdminActivityGetPayload<{
  include: {
    actorUser: {
      include: { role: true }
    }
  }
}>

let ensureRootAdminPromise: Promise<void> | null = null

function hashToken(rawToken: string) {
  return createHash('sha256')
    .update(`${rawToken}:${env.COOKIE_SECRET}`)
    .digest('hex')
}

function normalizeUsername(input: string) {
  return input.trim().toLowerCase()
}

function normalizeRoleName(input: string) {
  return input.trim().toLowerCase()
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, PASSWORD_SCRYPT_KEYLEN)
  return `${salt}${PASSWORD_SEPARATOR}${derived.toString('hex')}`
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(PASSWORD_SEPARATOR)
  if (!salt || !expectedHash) {
    return false
  }

  let expected: Buffer
  try {
    expected = Buffer.from(expectedHash, 'hex')
  } catch {
    return false
  }

  const actual = scryptSync(password, salt, expected.length)
  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}

function mapRolePermissions(
  role: Pick<
    Prisma.AdminRoleUncheckedCreateInput,
    | 'canViewCotizaciones'
    | 'canDeleteCotizaciones'
    | 'canViewSiniestros'
    | 'canDeleteSiniestros'
  > | null
) {
  if (!role) {
    return { ...EMPTY_PERMISSIONS }
  }

  return {
    can_view_cotizaciones: Boolean(role.canViewCotizaciones),
    can_delete_cotizaciones: Boolean(role.canDeleteCotizaciones),
    can_view_siniestros: Boolean(role.canViewSiniestros),
    can_delete_siniestros: Boolean(role.canDeleteSiniestros)
  }
}

function resolvePermissions(user: AdminUserWithRole): AdminPermissionMap {
  if (user.isSuperAdmin) {
    return { ...FULL_PERMISSIONS }
  }

  return mapRolePermissions(user.role)
}

function mapAdminUserToSessionUser(user: AdminUserWithRole): AdminSessionUser {
  return {
    id: user.id,
    username: user.username,
    is_super_admin: user.isSuperAdmin,
    role_id: user.roleId,
    role_name: user.role?.name ?? null
  }
}

function mapAdminRoleToRow(role: {
  id: string
  name: string
  createdAt: Date
  canViewCotizaciones: boolean
  canDeleteCotizaciones: boolean
  canViewSiniestros: boolean
  canDeleteSiniestros: boolean
}): AdminRoleRow {
  return {
    id: role.id,
    name: role.name,
    created_at: role.createdAt.toISOString(),
    permissions: {
      can_view_cotizaciones: role.canViewCotizaciones,
      can_delete_cotizaciones: role.canDeleteCotizaciones,
      can_view_siniestros: role.canViewSiniestros,
      can_delete_siniestros: role.canDeleteSiniestros
    }
  }
}

function mapAdminUserToRow(user: AdminUserWithRole): AdminUserRow {
  return {
    id: user.id,
    username: user.username,
    is_super_admin: user.isSuperAdmin,
    is_active: user.isActive,
    role_id: user.roleId,
    role_name: user.role?.name ?? null,
    created_at: user.createdAt.toISOString()
  }
}

function mapAdminActivityToRow(activity: AdminActivityWithActor): AdminActivityRow {
  return {
    id: activity.id,
    created_at: activity.createdAt.toISOString(),
    action: activity.action,
    section: activity.section,
    target_id: activity.targetId,
    description: activity.description,
    actor_user: activity.actorUser
      ? {
          id: activity.actorUser.id,
          username: activity.actorUser.username,
          is_super_admin: activity.actorUser.isSuperAdmin,
          role_name: activity.actorUser.role?.name ?? null
        }
      : null
  }
}

function mapCotizacionToAdminRow(cotizacion: {
  id: string
  createdAt: Date
  nombre: string
  telefono: string
  email: string | null
  tipoVehiculo: string | null
  marcaModelo: string | null
  anio: string | null
  localidad: string | null
  uso: string | null
  coberturaDeseada: string | null
  mensaje: string | null
  sourcePage: string
}): AdminLeadRow {
  return {
    id: cotizacion.id,
    created_at: cotizacion.createdAt.toISOString(),
    tipo_formulario: 'cotizacion',
    nombre: cotizacion.nombre,
    telefono: cotizacion.telefono,
    email: cotizacion.email,
    tipo_vehiculo: cotizacion.tipoVehiculo,
    marca_modelo: cotizacion.marcaModelo,
    anio: cotizacion.anio,
    localidad: cotizacion.localidad,
    uso: cotizacion.uso,
    cobertura_deseada: cotizacion.coberturaDeseada,
    motivo_contacto: 'cotizacion',
    mensaje: cotizacion.mensaje,
    source_page: cotizacion.sourcePage
  }
}

function mapSiniestroToAdminRow(siniestro: {
  id: string
  createdAt: Date
  nombreReporte: string
  telefono: string
  detalleTexto: string | null
  sourcePage: string
  payloadJson: unknown
}): AdminLeadRow {
  return {
    id: siniestro.id,
    created_at: siniestro.createdAt.toISOString(),
    tipo_formulario: 'contacto',
    nombre: siniestro.nombreReporte,
    telefono: siniestro.telefono,
    email: null,
    tipo_vehiculo: null,
    marca_modelo: null,
    anio: null,
    localidad: null,
    uso: null,
    cobertura_deseada: null,
    motivo_contacto: 'siniestro',
    mensaje:
      siniestro.detalleTexto ??
      (siniestro.payloadJson ? JSON.stringify(siniestro.payloadJson) : null),
    source_page: siniestro.sourcePage
  }
}

async function ensureRootAdminUserInternal() {
  const normalizedUsername = normalizeUsername(ROOT_USERNAME)
  const existingUser = await prisma.adminUser.findUnique({
    where: { usernameNormalized: normalizedUsername }
  })

  if (!existingUser) {
    await prisma.adminUser.create({
      data: {
        username: ROOT_USERNAME,
        usernameNormalized: normalizedUsername,
        passwordHash: hashPassword(ROOT_PASSWORD),
        isSuperAdmin: true,
        isActive: true
      }
    })
    return
  }

  const needsPasswordUpdate = !verifyPassword(ROOT_PASSWORD, existingUser.passwordHash)

  const updateData: Prisma.AdminUserUpdateInput = {}
  if (!existingUser.isSuperAdmin) {
    updateData.isSuperAdmin = true
  }

  if (!existingUser.isActive) {
    updateData.isActive = true
  }

  if (existingUser.roleId) {
    updateData.role = { disconnect: true }
  }

  if (needsPasswordUpdate) {
    updateData.passwordHash = hashPassword(ROOT_PASSWORD)
  }

  if (Object.keys(updateData).length === 0) {
    return
  }

  await prisma.adminUser.update({
    where: { id: existingUser.id },
    data: updateData
  })
}

export async function ensureRootAdminUser() {
  if (!ensureRootAdminPromise) {
    ensureRootAdminPromise = ensureRootAdminUserInternal().catch((error) => {
      ensureRootAdminPromise = null
      throw error
    })
  }

  await ensureRootAdminPromise
}

export function canAdminPerform(
  session: AdminSessionContext,
  permission: keyof AdminPermissionMap
) {
  return Boolean(session.permissions[permission])
}

export async function validateAdminCredentials(input: {
  username: string
  password: string
}) {
  await ensureRootAdminUser()

  const normalizedUsername = normalizeUsername(input.username)
  if (!normalizedUsername) {
    return null
  }

  const user = await prisma.adminUser.findUnique({
    where: { usernameNormalized: normalizedUsername },
    include: { role: true }
  })

  if (!user || !user.isActive) {
    return null
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    return null
  }

  const permissions = resolvePermissions(user)
  return {
    user: mapAdminUserToSessionUser(user),
    permissions
  }
}

export async function createAdminSession(input: {
  userId: string
  ip?: string
  userAgent?: string
}) {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(
    Date.now() + env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000
  )

  await prisma.adminSession.create({
    data: {
      userId: input.userId,
      tokenHash,
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent
    }
  })

  return {
    token: rawToken,
    expiresAt
  }
}

export async function revokeAdminSession(rawToken: string) {
  const tokenHash = hashToken(rawToken)
  await prisma.adminSession.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function getActiveAdminSession(rawToken: string): Promise<AdminSessionContext | null> {
  const tokenHash = hashToken(rawToken)
  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        include: {
          role: true
        }
      }
    }
  })

  if (!session || !session.user.isActive) {
    return null
  }

  return {
    session_id: session.id,
    user: mapAdminUserToSessionUser(session.user),
    permissions: resolvePermissions(session.user)
  }
}

export async function registerAdminActivity(input: {
  actorUserId: string | null
  action: string
  section?: string | null
  targetId?: string | null
  description: string
  metadata?: unknown
}) {
  await prisma.adminActivity.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      section: input.section ?? null,
      targetId: input.targetId ?? null,
      description: input.description,
      metadata:
        input.metadata === undefined
          ? undefined
          : input.metadata === null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue)
    }
  })
}

export async function getAdminDashboard(input: {
  rawLimit: unknown
  session: AdminSessionContext
}): Promise<AdminDashboardResponse> {
  const limit = normalizeLimit(input.rawLimit, 500, 1000)
  const canViewCotizaciones = canAdminPerform(input.session, 'can_view_cotizaciones')
  const canViewSiniestros = canAdminPerform(input.session, 'can_view_siniestros')

  const [cotizaciones, siniestros] = await Promise.all([
    canViewCotizaciones
      ? prisma.cotizacion.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        })
      : Promise.resolve([]),
    canViewSiniestros
      ? prisma.siniestro.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        })
      : Promise.resolve([])
  ])

  const cotizacionesRows = cotizaciones.map(mapCotizacionToAdminRow)
  const siniestrosRows = siniestros.map(mapSiniestroToAdminRow)

  return {
    cotizaciones: cotizacionesRows,
    siniestros: siniestrosRows,
    totals: {
      cotizaciones: cotizacionesRows.length,
      siniestros: siniestrosRows.length
    },
    current_user: input.session.user,
    permissions: input.session.permissions,
    can_manage_access: input.session.user.is_super_admin,
    can_view_activities: input.session.user.is_super_admin
  }
}

export async function getSiniestroArchivos(
  siniestroId: string
): Promise<AdminSiniestroArchivo[]> {
  const files = await prisma.siniestroArchivo.findMany({
    where: { siniestroId },
    orderBy: { createdAt: 'desc' }
  })

  return files.map((file) => ({
    id: file.id,
    created_at: file.createdAt.toISOString(),
    label: file.label,
    original_name: file.originalName,
    mime_type: file.mimeType,
    size_bytes: file.sizeBytes,
    is_image: file.mimeType.toLowerCase().startsWith('image/')
  }))
}

export async function getSiniestroArchivoContent(input: {
  siniestroId: string
  fileId: string
}) {
  const file = await prisma.siniestroArchivo.findFirst({
    where: {
      id: input.fileId,
      siniestroId: input.siniestroId
    }
  })

  if (!file) {
    return null
  }

  let content: Buffer | null = null

  if (file.fileData && file.fileData.length > 0) {
    content = Buffer.from(file.fileData)
  } else if (file.publicUrl) {
    const response = await fetch(file.publicUrl)
    if (!response.ok) {
      throw new Error(`No pudimos leer el archivo remoto (${response.status}).`)
    }

    const fileBuffer = await response.arrayBuffer()
    content = Buffer.from(fileBuffer)
  } else if (file.s3Key) {
    content = await downloadSiniestroFileByKey(file.s3Key)
  }

  if (!content) {
    throw new Error('No encontramos datos para el archivo solicitado.')
  }

  return {
    id: file.id,
    originalName: file.originalName || 'archivo',
    mimeType: file.mimeType || 'application/octet-stream',
    content
  }
}

export async function deleteCotizacionById(cotizacionId: string) {
  const result = await prisma.cotizacion.deleteMany({
    where: { id: cotizacionId }
  })

  return result.count > 0
}

export async function deleteSiniestroById(siniestroId: string) {
  const result = await prisma.siniestro.deleteMany({
    where: { id: siniestroId }
  })

  return result.count > 0
}

export async function getAccessControlSnapshot(): Promise<AdminAccessControlResponse> {
  await ensureRootAdminUser()

  const [roles, users] = await Promise.all([
    prisma.adminRole.findMany({
      orderBy: [{ name: 'asc' }]
    }),
    prisma.adminUser.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: { role: true }
    })
  ])

  return {
    roles: roles.map(mapAdminRoleToRow),
    users: users.map(mapAdminUserToRow)
  }
}

export async function createAdminRole(input: {
  name: string
  permissions: AdminPermissionMap
}): Promise<AdminRoleRow> {
  const roleName = input.name.trim()
  if (!roleName) {
    throw new Error('El nombre del rol es obligatorio.')
  }

  const role = await prisma.adminRole.create({
    data: {
      name: roleName,
      nameNormalized: normalizeRoleName(roleName),
      canViewCotizaciones: input.permissions.can_view_cotizaciones,
      canDeleteCotizaciones: input.permissions.can_delete_cotizaciones,
      canViewSiniestros: input.permissions.can_view_siniestros,
      canDeleteSiniestros: input.permissions.can_delete_siniestros
    }
  })

  return mapAdminRoleToRow(role)
}

export async function createAdminUser(input: {
  username: string
  password: string
  roleId: string | null
}): Promise<AdminUserRow> {
  await ensureRootAdminUser()

  const username = input.username.trim()
  const normalizedUsername = normalizeUsername(username)
  if (!username || !normalizedUsername) {
    throw new Error('El usuario es obligatorio.')
  }

  const password = input.password.trim()
  if (!password) {
    throw new Error('La contraseña es obligatoria.')
  }

  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }

  if (input.roleId) {
    const existingRole = await prisma.adminRole.findUnique({
      where: { id: input.roleId }
    })

    if (!existingRole) {
      throw new Error('El rol seleccionado no existe.')
    }
  }

  const user = await prisma.adminUser.create({
    data: {
      username,
      usernameNormalized: normalizedUsername,
      passwordHash: hashPassword(password),
      isSuperAdmin: false,
      isActive: true,
      roleId: input.roleId
    },
    include: {
      role: true
    }
  })

  return mapAdminUserToRow(user)
}

export async function assignAdminUserRole(input: {
  userId: string
  roleId: string | null
}) {
  const user = await prisma.adminUser.findUnique({
    where: { id: input.userId }
  })

  if (!user) {
    return null
  }

  if (user.isSuperAdmin) {
    throw new Error('No se puede cambiar el rol del admin principal.')
  }

  if (input.roleId) {
    const role = await prisma.adminRole.findUnique({
      where: { id: input.roleId }
    })

    if (!role) {
      throw new Error('El rol seleccionado no existe.')
    }
  }

  const updatedUser = await prisma.adminUser.update({
    where: { id: input.userId },
    data: {
      roleId: input.roleId
    },
    include: {
      role: true
    }
  })

  return mapAdminUserToRow(updatedUser)
}

export async function getAdminActivities(rawLimit: unknown): Promise<AdminActivitiesResponse> {
  const limit = normalizeLimit(rawLimit, 200, 1000)
  const activities = await prisma.adminActivity.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: limit,
    include: {
      actorUser: {
        include: { role: true }
      }
    }
  })

  return {
    activities: activities.map(mapAdminActivityToRow)
  }
}
