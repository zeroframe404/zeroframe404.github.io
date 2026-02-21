export interface AdminLeadRow {
  id: string
  created_at: string
  tipo_formulario: string
  nombre: string
  telefono: string
  email: string | null
  tipo_vehiculo: string | null
  marca_modelo: string | null
  anio: string | null
  localidad: string | null
  uso: string | null
  cobertura_deseada: string | null
  motivo_contacto: string | null
  mensaje: string | null
  source_page: string
}

export interface AdminDashboardResponse {
  cotizaciones: AdminLeadRow[]
  siniestros: AdminLeadRow[]
  totals: {
    cotizaciones: number
    siniestros: number
  }
}

