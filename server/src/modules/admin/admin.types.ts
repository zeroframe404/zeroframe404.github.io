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

export interface AdminPermissionMap {
  can_view_cotizaciones: boolean
  can_delete_cotizaciones: boolean
  can_view_siniestros: boolean
  can_delete_siniestros: boolean
}

export interface AdminSessionUser {
  id: string
  username: string
  is_super_admin: boolean
  role_id: string | null
  role_name: string | null
}

export interface AdminDashboardResponse {
  cotizaciones: AdminLeadRow[]
  siniestros: AdminLeadRow[]
  totals: {
    cotizaciones: number
    siniestros: number
  }
  current_user: AdminSessionUser
  permissions: AdminPermissionMap
  can_manage_access: boolean
  can_view_activities: boolean
}

export interface AdminSiniestroArchivo {
  id: string
  created_at: string
  label: string
  original_name: string
  mime_type: string
  size_bytes: number
  is_image: boolean
}

export interface AdminRoleRow {
  id: string
  name: string
  permissions: AdminPermissionMap
  created_at: string
}

export interface AdminUserRow {
  id: string
  username: string
  is_super_admin: boolean
  is_active: boolean
  role_id: string | null
  role_name: string | null
  created_at: string
}

export interface AdminAccessControlResponse {
  roles: AdminRoleRow[]
  users: AdminUserRow[]
}

export interface AdminActivityActor {
  id: string
  username: string
  is_super_admin: boolean
  role_name: string | null
}

export interface AdminActivityRow {
  id: string
  created_at: string
  action: string
  section: string | null
  target_id: string | null
  description: string
  actor_user: AdminActivityActor | null
}

export interface AdminActivitiesResponse {
  activities: AdminActivityRow[]
}

export interface AdminSessionContext {
  session_id: string
  user: AdminSessionUser
  permissions: AdminPermissionMap
}
