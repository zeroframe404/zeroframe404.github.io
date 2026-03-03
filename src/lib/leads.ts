import type {
  LeadInsertResponse,
  LeadPayload,
  LocationAddressResponse
} from '../types/lead'
import { apiRequest, readApiError } from './apiClient'

function resolveLeadEndpoint(payload: LeadPayload) {
  if (payload.tipo_formulario === 'cotizacion') {
    return '/api/forms/cotizaciones'
  }

  return '/api/forms/contacto'
}

export async function insertLead(payload: LeadPayload) {
  const response = await apiRequest(resolveLeadEndpoint(payload), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const message = await readApiError(
      response,
      'No pudimos enviar el formulario.'
    )
    throw new Error(message)
  }

  const data = (await response.json()) as unknown
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { ok?: unknown }).ok !== 'boolean' ||
    typeof (data as { id?: unknown }).id !== 'string'
  ) {
    throw new Error('La respuesta del formulario no es valida.')
  }

  return data as LeadInsertResponse
}

function isLocationAddressResponse(value: unknown): value is LocationAddressResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  if (record.ok !== true || typeof record.address !== 'object' || record.address === null) {
    return false
  }

  const address = record.address as Record<string, unknown>
  return (
    typeof address.provider === 'string' &&
    typeof address.latitude === 'number' &&
    typeof address.longitude === 'number' &&
    (address.display_name === null || typeof address.display_name === 'string') &&
    (address.street === null || typeof address.street === 'string') &&
    (address.house_number === null || typeof address.house_number === 'string') &&
    (address.line === null || typeof address.line === 'string') &&
    (address.postal_code === null || typeof address.postal_code === 'string') &&
    (address.city === null || typeof address.city === 'string') &&
    (address.neighborhood === null || typeof address.neighborhood === 'string') &&
    (address.state === null || typeof address.state === 'string') &&
    (address.country === null || typeof address.country === 'string')
  )
}

export async function getLocationAddress(input: {
  latitude: number
  longitude: number
}) {
  const query = new URLSearchParams({
    lat: input.latitude.toString(),
    lon: input.longitude.toString()
  })

  const response = await apiRequest(`/api/forms/location-address?${query.toString()}`, {
    method: 'GET'
  })

  if (!response.ok) {
    const message = await readApiError(
      response,
      'No pudimos completar la direccion con tu ubicacion.'
    )
    throw new Error(message)
  }

  const data = (await response.json()) as unknown
  if (!isLocationAddressResponse(data)) {
    throw new Error('La respuesta de ubicacion no es valida.')
  }

  return data.address
}
