import type {
  AdminAccessControlResponse,
  AdminActivitiesResponse,
  AdminDashboardResponse,
  AdminLogAutoClearUnit,
  AdminLogSettingsRow,
  AdminPermissionMap,
  AdminRoleRow,
  AdminSiniestroArchivo,
  AdminUserRow
} from '../types/admin'
import { apiRequest, readApiError } from './apiClient'

const DEFAULT_LIMIT = 500
const DEFAULT_ACTIVITY_LIMIT = 200
const MAX_LIMIT = 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function isAdminPermissionMap(value: unknown): value is AdminPermissionMap {
  if (!isRecord(value)) return false

  return (
    typeof value.can_view_cotizaciones === 'boolean' &&
    typeof value.can_delete_cotizaciones === 'boolean' &&
    typeof value.can_view_siniestros === 'boolean' &&
    typeof value.can_delete_siniestros === 'boolean'
  )
}

function isAdminLeadRow(value: unknown) {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.tipo_formulario === 'string' &&
    typeof value.nombre === 'string' &&
    typeof value.telefono === 'string' &&
    isNullableString(value.email) &&
    isNullableString(value.tipo_vehiculo) &&
    isNullableString(value.marca_modelo) &&
    isNullableString(value.anio) &&
    isNullableString(value.localidad) &&
    isNullableString(value.uso) &&
    isNullableString(value.cobertura_deseada) &&
    isNullableString(value.motivo_contacto) &&
    isNullableString(value.mensaje) &&
    typeof value.source_page === 'string'
  )
}

function isAdminSessionUser(value: unknown) {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.is_super_admin === 'boolean' &&
    isNullableString(value.role_id) &&
    isNullableString(value.role_name)
  )
}

function isAdminDashboardResponse(value: unknown): value is AdminDashboardResponse {
  if (!isRecord(value) || !isRecord(value.totals)) {
    return false
  }

  if (!Array.isArray(value.cotizaciones) || !Array.isArray(value.siniestros)) {
    return false
  }

  return (
    value.cotizaciones.every(isAdminLeadRow) &&
    value.siniestros.every(isAdminLeadRow) &&
    typeof value.totals.cotizaciones === 'number' &&
    typeof value.totals.siniestros === 'number' &&
    isAdminSessionUser(value.current_user) &&
    isAdminPermissionMap(value.permissions) &&
    typeof value.can_manage_access === 'boolean' &&
    typeof value.can_view_activities === 'boolean'
  )
}

function isAdminSiniestroArchivo(value: unknown): value is AdminSiniestroArchivo {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.label === 'string' &&
    typeof value.original_name === 'string' &&
    typeof value.mime_type === 'string' &&
    typeof value.size_bytes === 'number' &&
    typeof value.is_image === 'boolean'
  )
}

function isAdminSiniestroArchivosPayload(value: unknown): value is { archivos: AdminSiniestroArchivo[] } {
  if (!isRecord(value) || !Array.isArray(value.archivos)) {
    return false
  }

  return value.archivos.every(isAdminSiniestroArchivo)
}

function isAdminRoleRow(value: unknown): value is AdminRoleRow {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string' &&
    isAdminPermissionMap(value.permissions)
  )
}

function isAdminUserRow(value: unknown): value is AdminUserRow {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.is_super_admin === 'boolean' &&
    typeof value.is_active === 'boolean' &&
    isNullableString(value.role_id) &&
    isNullableString(value.role_name) &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

function isAdminAccessControlResponse(value: unknown): value is AdminAccessControlResponse {
  if (!isRecord(value) || !Array.isArray(value.roles) || !Array.isArray(value.users)) {
    return false
  }

  return value.roles.every(isAdminRoleRow) && value.users.every(isAdminUserRow)
}

function isAdminLogAutoClearUnit(value: unknown): value is AdminLogAutoClearUnit {
  return value === 'day' || value === 'week' || value === 'month'
}

function isAdminLogSettingsRow(value: unknown): value is AdminLogSettingsRow {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.auto_clear_value === 'number' &&
    isAdminLogAutoClearUnit(value.auto_clear_unit) &&
    typeof value.last_cleared_at === 'string'
  )
}

function isAdminActivitiesResponse(value: unknown): value is AdminActivitiesResponse {
  if (!isRecord(value) || !Array.isArray(value.activities)) {
    return false
  }

  if (!isAdminLogSettingsRow(value.settings)) {
    return false
  }

  return value.activities.every((activity) => {
    if (!isRecord(activity)) return false

    const actorUser = activity.actor_user
    const validActor =
      actorUser === null ||
      (isRecord(actorUser) &&
        typeof actorUser.id === 'string' &&
        typeof actorUser.username === 'string' &&
        typeof actorUser.is_super_admin === 'boolean' &&
        isNullableString(actorUser.role_name))

    return (
      typeof activity.id === 'string' &&
      typeof activity.created_at === 'string' &&
      typeof activity.action === 'string' &&
      isNullableString(activity.section) &&
      isNullableString(activity.target_id) &&
      typeof activity.description === 'string' &&
      validActor
    )
  })
}

function isAdminRolePayload(value: unknown): value is { role: AdminRoleRow } {
  return isRecord(value) && isAdminRoleRow(value.role)
}

function isAdminUserPayload(value: unknown): value is { user: AdminUserRow } {
  return isRecord(value) && isAdminUserRow(value.user)
}

function isAdminSettingsPayload(value: unknown): value is { settings: AdminLogSettingsRow } {
  return isRecord(value) && isAdminLogSettingsRow(value.settings)
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.trunc(limit), MAX_LIMIT)
}

function normalizeActivityLimit(limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_ACTIVITY_LIMIT
  }

  return Math.min(Math.trunc(limit), MAX_LIMIT)
}

export async function loginAdmin(username: string, password: string) {
  const response = await apiRequest('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })

  if (!response.ok) {
    const message = await readApiError(response, 'No se pudo iniciar sesion.')
    throw new Error(message)
  }
}

export async function logoutAdmin() {
  const response = await apiRequest('/api/admin/logout', {
    method: 'POST'
  })

  if (!response.ok) {
    const message = await readApiError(response, 'No se pudo cerrar sesion.')
    throw new Error(message)
  }
}

export async function fetchAdminDashboard(limit = DEFAULT_LIMIT) {
  const normalizedLimit = normalizeLimit(limit)
  const response = await apiRequest(`/api/admin/dashboard?limit=${normalizedLimit}`, {
    method: 'GET'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos acceder al dashboard.'
    )
    throw new Error(message)
  }

  const data = (await response.json()) as unknown
  if (!isAdminDashboardResponse(data)) {
    throw new Error('La respuesta del backend no es valida.')
  }

  return data
}

export async function trackAdminView(input: {
  section: 'cotizaciones' | 'siniestros'
  targetId?: string
}) {
  const response = await apiRequest('/api/admin/track-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      section: input.section,
      target_id: input.targetId || null
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos registrar la actividad.'
    )
    throw new Error(message)
  }
}

export async function fetchAdminSiniestroArchivos(siniestroId: string) {
  const encodedSiniestroId = encodeURIComponent(siniestroId)
  const response = await apiRequest(`/api/admin/siniestros/${encodedSiniestroId}/archivos`, {
    method: 'GET'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos obtener los archivos del siniestro.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminSiniestroArchivosPayload(payload)) {
    throw new Error('La respuesta de archivos no es valida.')
  }

  return payload.archivos
}

export async function fetchAdminSiniestroArchivoBlob(input: {
  siniestroId: string
  fileId: string
  download?: boolean
}) {
  const encodedSiniestroId = encodeURIComponent(input.siniestroId)
  const encodedFileId = encodeURIComponent(input.fileId)
  const downloadSuffix = input.download ? '?download=1' : ''
  const response = await apiRequest(
    `/api/admin/siniestros/${encodedSiniestroId}/archivos/${encodedFileId}${downloadSuffix}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos leer el archivo solicitado.'
    )
    throw new Error(message)
  }

  return response.blob()
}

export async function deleteAdminCotizacion(cotizacionId: string) {
  const encodedCotizacionId = encodeURIComponent(cotizacionId)
  const response = await apiRequest(`/api/admin/cotizaciones/${encodedCotizacionId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos eliminar la cotizacion.'
    )
    throw new Error(message)
  }
}

export async function deleteAdminSiniestro(siniestroId: string) {
  const encodedSiniestroId = encodeURIComponent(siniestroId)
  const response = await apiRequest(`/api/admin/siniestros/${encodedSiniestroId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos eliminar el siniestro.'
    )
    throw new Error(message)
  }
}

export async function fetchAdminAccessControl() {
  const response = await apiRequest('/api/admin/access-control', {
    method: 'GET'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos obtener usuarios y roles.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminAccessControlResponse(payload)) {
    throw new Error('La respuesta de access-control no es valida.')
  }

  return payload
}

export async function createAdminRole(input: {
  name: string
  permissions: AdminPermissionMap
}) {
  const response = await apiRequest('/api/admin/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: input.name,
      permissions: input.permissions
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos crear el rol.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminRolePayload(payload)) {
    throw new Error('La respuesta de creacion de rol no es valida.')
  }

  return payload.role
}

export async function updateAdminRole(input: {
  roleId: string
  name: string
  permissions: AdminPermissionMap
}) {
  const encodedRoleId = encodeURIComponent(input.roleId)
  const response = await apiRequest(`/api/admin/roles/${encodedRoleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: input.name,
      permissions: input.permissions
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos editar el rol.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminRolePayload(payload)) {
    throw new Error('La respuesta de edicion de rol no es valida.')
  }

  return payload.role
}

export async function deleteAdminRole(roleId: string) {
  const encodedRoleId = encodeURIComponent(roleId)
  const response = await apiRequest(`/api/admin/roles/${encodedRoleId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos eliminar el rol.')
    throw new Error(message)
  }
}

export async function createAdminUser(input: {
  username: string
  password: string
  roleId: string | null
}) {
  const response = await apiRequest('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      role_id: input.roleId
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos crear el usuario.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminUserPayload(payload)) {
    throw new Error('La respuesta de creacion de usuario no es valida.')
  }

  return payload.user
}

export async function updateAdminUser(input: {
  userId: string
  username?: string
  password?: string
  roleId?: string | null
  isActive?: boolean
}) {
  const encodedUserId = encodeURIComponent(input.userId)
  const body: Record<string, unknown> = {}

  if (input.username !== undefined) {
    body.username = input.username
  }

  if (input.password !== undefined) {
    body.password = input.password
  }

  if (input.roleId !== undefined) {
    body.role_id = input.roleId
  }

  if (input.isActive !== undefined) {
    body.is_active = input.isActive
  }

  const response = await apiRequest(`/api/admin/users/${encodedUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos editar el usuario.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminUserPayload(payload)) {
    throw new Error('La respuesta de edicion de usuario no es valida.')
  }

  return payload.user
}

export async function deleteAdminUser(userId: string) {
  const encodedUserId = encodeURIComponent(userId)
  const response = await apiRequest(`/api/admin/users/${encodedUserId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos eliminar el usuario.')
    throw new Error(message)
  }
}

export async function assignAdminUserRole(input: {
  userId: string
  roleId: string | null
}) {
  const encodedUserId = encodeURIComponent(input.userId)
  const response = await apiRequest(`/api/admin/users/${encodedUserId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role_id: input.roleId
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos actualizar el rol del usuario.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminUserPayload(payload)) {
    throw new Error('La respuesta de asignacion de rol no es valida.')
  }

  return payload.user
}

export async function updateSuperAdminCredentials(input: {
  username?: string
  password?: string
}) {
  const response = await apiRequest('/api/admin/super-admin/credentials', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos actualizar las credenciales del admin principal.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminUserPayload(payload)) {
    throw new Error('La respuesta de actualizacion de credenciales no es valida.')
  }

  return payload.user
}

export async function fetchAdminActivities(input?: {
  limit?: number
  actorUserId?: string
  actorUsername?: string
  action?: string
  section?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) {
  const normalizedLimit = normalizeActivityLimit(input?.limit ?? DEFAULT_ACTIVITY_LIMIT)
  const query = new URLSearchParams()
  query.set('limit', String(normalizedLimit))

  if (input?.actorUserId) {
    query.set('actor_user_id', input.actorUserId)
  }

  if (input?.actorUsername) {
    query.set('actor_username', input.actorUsername)
  }

  if (input?.action) {
    query.set('action', input.action)
  }

  if (input?.section) {
    query.set('section', input.section)
  }

  if (input?.search) {
    query.set('search', input.search)
  }

  if (input?.dateFrom) {
    query.set('date_from', input.dateFrom)
  }

  if (input?.dateTo) {
    query.set('date_to', input.dateTo)
  }

  const response = await apiRequest(`/api/admin/activities?${query.toString()}`, {
    method: 'GET'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos obtener actividades.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminActivitiesResponse(payload)) {
    throw new Error('La respuesta de actividades no es valida.')
  }

  return payload
}

export async function fetchAdminLogSettings() {
  const response = await apiRequest('/api/admin/activities/settings', {
    method: 'GET'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos obtener configuracion del log.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminSettingsPayload(payload)) {
    throw new Error('La respuesta de configuracion del log no es valida.')
  }

  return payload.settings
}

export async function updateAdminLogSettings(input: {
  autoClearValue: number
  autoClearUnit: AdminLogAutoClearUnit
}) {
  const response = await apiRequest('/api/admin/activities/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      auto_clear_value: input.autoClearValue,
      auto_clear_unit: input.autoClearUnit
    })
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(
      response,
      'No pudimos actualizar la configuracion del log.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isAdminSettingsPayload(payload)) {
    throw new Error('La respuesta de configuracion del log no es valida.')
  }

  return payload.settings
}

export async function clearAdminActivities() {
  const response = await apiRequest('/api/admin/activities', {
    method: 'DELETE'
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado.')
    }

    const message = await readApiError(response, 'No pudimos borrar el log.')
    throw new Error(message)
  }

  const payload = (await response.json()) as unknown
  if (!isRecord(payload) || typeof payload.ok !== 'boolean' || !isAdminLogSettingsRow(payload.settings)) {
    throw new Error('La respuesta de borrado de log no es valida.')
  }

  return payload.settings
}
