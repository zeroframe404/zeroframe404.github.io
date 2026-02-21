import type {
  AdminDashboardResponse,
  AdminLeadRow,
  AdminSiniestroArchivo
} from '../types/admin'
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
    const message = await readApiError(response, 'No se pudo iniciar sesión.')
    throw new Error(message)
  }
}

export async function logoutAdmin() {
  const response = await apiRequest('/api/admin/logout', {
    method: 'POST'
  })

  if (!response.ok) {
    const message = await readApiError(response, 'No se pudo cerrar sesión.')
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
    throw new Error('La respuesta del backend no es válida.')
  }

  return data
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
    throw new Error('La respuesta de archivos no es válida.')
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
      'No pudimos eliminar la cotización.'
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
