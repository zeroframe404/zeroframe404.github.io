export type LeadFormType = 'cotizacion' | 'contacto'
export type LeadRoutingBranch = 'avellaneda' | 'lanus' | 'lejanos'
export type LeadRoutingStatus =
  | 'resolved'
  | 'fallback_invalid_cp'
  | 'fallback_geocode_failed'

export interface LeadPayload {
  tipo_formulario: LeadFormType
  nombre: string
  telefono: string
  email?: string
  tipo_vehiculo?: string
  marca_modelo?: string
  anio?: string
  localidad?: string
  codigo_postal?: string
  uso?: string
  cobertura_deseada?: string
  motivo_contacto?: string
  mensaje?: string
  consentimiento: boolean
  source_page: string
}

export interface LeadInsertResponse {
  ok: boolean
  id: string
  routing_branch?: LeadRoutingBranch
  routing_distance_km?: number | null
  routing_status?: LeadRoutingStatus
  redirect_url?: string
}

export interface LocationAddressRow {
  provider: string
  latitude: number
  longitude: number
  display_name: string | null
  street: string | null
  house_number: string | null
  line: string | null
  postal_code: string | null
  city: string | null
  neighborhood: string | null
  state: string | null
  country: string | null
}

export interface LocationAddressResponse {
  ok: boolean
  address: LocationAddressRow
}
