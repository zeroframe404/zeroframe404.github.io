import { apiRequest, readApiError } from './apiClient'

export type SiniestroTipo = 'choque' | 'rotura' | 'robo' | 'incendio'

export type SiniestroFileGroup = {
  label: string
  files: File[]
}

export async function submitSiniestroReport(input: {
  tipo: SiniestroTipo
  sourcePage: string
  nombreReporte: string
  telefono: string
  detalleTexto?: string
  payloadJson?: Record<string, unknown>
  fileGroups: SiniestroFileGroup[]
}) {
  const formData = new FormData()
  formData.append('source_page', input.sourcePage)
  formData.append('nombre_reporte', input.nombreReporte)
  formData.append('telefono', input.telefono)
  formData.append('detalle_texto', input.detalleTexto ?? '')
  formData.append('payload_json', JSON.stringify(input.payloadJson ?? {}))

  for (const group of input.fileGroups) {
    for (const file of group.files) {
      formData.append('files', file)
      formData.append('file_labels', group.label)
    }
  }

  const response = await apiRequest(`/api/forms/siniestros/${input.tipo}`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const message = await readApiError(
      response,
      'No pudimos enviar el reporte.'
    )
    throw new Error(message)
  }
}
