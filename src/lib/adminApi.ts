import type { AdminDashboardResponse, AdminLeadRow } from '../types/admin'
import { apiRequest, readApiError } from './apiClient'

const DEFAULT_LIMIT = 500
const MAX_LIMIT = 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function isAdminLeadRow(value: unknown): value is AdminLeadRow {
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
    typeof value.totals.siniestros === 'number'
  )
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.trunc(limit), MAX_LIMIT)
}

export async function loginAdmin(password: string) {
  const response = await apiRequest('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
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

