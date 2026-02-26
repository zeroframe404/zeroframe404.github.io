import type { LeadInsertResponse, LeadPayload } from '../types/lead'
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
