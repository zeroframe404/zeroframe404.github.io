export type LeadFormType = 'cotizacion' | 'contacto'

export interface LeadPayload {
  tipo_formulario: LeadFormType
  nombre: string
  telefono: string
  email?: string
  tipo_vehiculo?: string
  marca_modelo?: string
  anio?: string
  localidad?: string
  uso?: string
  cobertura_deseada?: string
  motivo_contacto?: string
  mensaje?: string
  consentimiento: boolean
  source_page: string
}
