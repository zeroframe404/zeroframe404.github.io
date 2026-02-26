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
  codigo_postal: string | null
  uso: string | null
  cobertura_deseada: string | null
  motivo_contacto: string | null
  mensaje: string | null
  routing_branch: CotizacionRoutingBranch | null
  routing_distance_km: number | null
  routing_status: CotizacionRoutingStatus | null
  routing_overridden: boolean
  source_page: string
}

export interface AdminPermissionMap {
  can_view_cotizaciones: boolean
  can_delete_cotizaciones: boolean
  can_view_siniestros: boolean
  can_delete_siniestros: boolean
}

export type AdminLogAutoClearUnit = 'day' | 'week' | 'month'
export type CotizacionRoutingBranch = 'avellaneda' | 'lanus' | 'lejanos'
export type CotizacionRoutingStatus =
  | 'resolved'
  | 'fallback_invalid_cp'
  | 'fallback_geocode_failed'

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
  updated_at: string
}

export type AdminUserBranch = 'lanus' | 'avellaneda' | 'online'

export interface AdminUserRow {
  id: string
  username: string
  is_super_admin: boolean
  is_active: boolean
  branch: AdminUserBranch
  role_id: string | null
  role_name: string | null
  created_at: string
  updated_at: string
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

export interface AdminLogSettingsRow {
  auto_clear_value: number
  auto_clear_unit: AdminLogAutoClearUnit
  last_cleared_at: string
}

export interface AdminActivitiesResponse {
  activities: AdminActivityRow[]
  settings: AdminLogSettingsRow
}

export type AdminTaskStatus = 'pending' | 'completed'

export interface AdminTaskUserSummary {
  id: string
  username: string
  role_name: string | null
}

export interface AdminTaskAttachmentRow {
  id: string
  created_at: string
  original_name: string
  mime_type: string
  size_bytes: number
  is_previewable: boolean
  uploader_user: AdminTaskUserSummary | null
}

export interface AdminTaskMessageAttachmentRow {
  id: string
  created_at: string
  original_name: string
  mime_type: string
  size_bytes: number
  is_previewable: boolean
  uploader_user: AdminTaskUserSummary | null
}

export interface AdminTaskMessageRow {
  id: string
  created_at: string
  body_markdown: string
  sender_user: AdminTaskUserSummary | null
  attachments: AdminTaskMessageAttachmentRow[]
}

export interface AdminTaskRow {
  id: string
  created_at: string
  updated_at: string
  description_markdown: string
  status: AdminTaskStatus
  completed_at: string | null
  created_by_user: AdminTaskUserSummary | null
  completed_by_user: AdminTaskUserSummary | null
  assignees: AdminTaskUserSummary[]
  attachments: AdminTaskAttachmentRow[]
  message_count: number
  last_message_at: string | null
}

export interface AdminTaskListResponse {
  tasks: AdminTaskRow[]
}

export interface AdminTaskDetailResponse {
  task: AdminTaskRow
  messages: AdminTaskMessageRow[]
}

export interface AdminTaskAssigneeRow {
  id: string
  username: string
  role_name: string | null
}
