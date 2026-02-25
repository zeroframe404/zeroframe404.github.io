import { Download, Eye, Loader2, LogOut, RefreshCcw, ShieldCheck, Trash2, UserCog, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  assignAdminUserRole,
  createAdminRole,
  createAdminUser,
  deleteAdminCotizacion,
  deleteAdminSiniestro,
  fetchAdminAccessControl,
  fetchAdminActivities,
  fetchAdminDashboard,
  fetchAdminSiniestroArchivoBlob,
  fetchAdminSiniestroArchivos,
  loginAdmin,
  logoutAdmin,
  trackAdminView
} from '../lib/adminApi'
import type {
  AdminAccessControlResponse,
  AdminActivityRow,
  AdminDashboardResponse,
  AdminLeadRow,
  AdminPermissionMap,
  AdminSiniestroArchivo
} from '../types/admin'

type AdminSection = 'cotizaciones' | 'siniestros'

const EMPTY_PERMISSIONS: AdminPermissionMap = {
  can_view_cotizaciones: false,
  can_delete_cotizaciones: false,
  can_view_siniestros: false,
  can_delete_siniestros: false
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short'
})

function formatDateTime(value: string) {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? value : dateTimeFormatter.format(parsedDate)
}

function permissionLabel(permission: keyof AdminPermissionMap) {
  if (permission === 'can_view_cotizaciones') return 'Ver cotizaciones'
  if (permission === 'can_delete_cotizaciones') return 'Borrar cotizaciones'
  if (permission === 'can_view_siniestros') return 'Ver siniestros'
  return 'Borrar siniestros'
}

export default function AdminHiddenPage() {
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>('cotizaciones')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [selectedLead, setSelectedLead] = useState<AdminLeadRow | null>(null)
  const [selectedSiniestroLead, setSelectedSiniestroLead] = useState<AdminLeadRow | null>(null)
  const [siniestroFiles, setSiniestroFiles] = useState<AdminSiniestroArchivo[]>([])
  const [filesError, setFilesError] = useState<string | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImageTitle, setPreviewImageTitle] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [accessData, setAccessData] = useState<AdminAccessControlResponse | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [isLoadingAccess, setIsLoadingAccess] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRolePermissions, setNewRolePermissions] = useState<AdminPermissionMap>({ ...EMPTY_PERMISSIONS })
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRoleId, setNewUserRoleId] = useState<string | null>(null)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false)
  const [activities, setActivities] = useState<AdminActivityRow[]>([])
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  const permissions = dashboardData?.permissions ?? EMPTY_PERMISSIONS
  const availableSections = useMemo(() => {
    const sections: AdminSection[] = []
    if (permissions.can_view_cotizaciones) sections.push('cotizaciones')
    if (permissions.can_view_siniestros) sections.push('siniestros')
    return sections
  }, [permissions])

  useEffect(() => {
    if (previewImageUrl) {
      return () => {
        URL.revokeObjectURL(previewImageUrl)
      }
    }

    return undefined
  }, [previewImageUrl])

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(activeSection)) {
      setActiveSection(availableSections[0])
    }
  }, [activeSection, availableSections])

  const activeRows = useMemo(() => {
    if (!dashboardData) return []
    return activeSection === 'cotizaciones' ? dashboardData.cotizaciones : dashboardData.siniestros
  }, [activeSection, dashboardData])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const username = usernameInput.trim()
    const password = passwordInput.trim()

    if (!username || !password) {
      setError('Ingresa USER y PASSWORD para continuar.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await loginAdmin(username, password)
      const data = await fetchAdminDashboard()
      setIsAuthenticated(true)
      setDashboardData(data)
      setActiveSection(
        data.permissions.can_view_cotizaciones
          ? 'cotizaciones'
          : data.permissions.can_view_siniestros
            ? 'siniestros'
            : 'cotizaciones'
      )
      setPasswordInput('')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo iniciar sesion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const refreshed = await fetchAdminDashboard()
      setDashboardData(refreshed)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo actualizar.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (isAuthenticated) await logoutAdmin()
    } catch {
      // ignore
    }

    setIsAuthenticated(false)
    setDashboardData(null)
    setError(null)
    setSelectedLead(null)
    setSelectedSiniestroLead(null)
    setSiniestroFiles([])
    setFilesError(null)
    setPreviewImageUrl(null)
    setIsAccessModalOpen(false)
    setAccessData(null)
    setIsActivitiesModalOpen(false)
    setActivities([])
  }

  const openLeadDetail = (section: AdminSection, lead: AdminLeadRow) => {
    setSelectedLead(lead)
    void trackAdminView({ section, targetId: lead.id }).catch(() => {
      // Ignore tracking errors in UI.
    })
  }

  const loginView = (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-6 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
            <ShieldCheck className="h-4 w-4" /> Admin
          </span>
          <h1 className="text-2xl font-bold text-white">Acceso administrador</h1>
          <p className="mt-2 text-sm text-slate-300">Ingresa USER y PASSWORD para acceder al panel.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm font-semibold text-slate-200">
            USER
            <input
              type="text"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              className="input-base mt-2 border-white/25 bg-white/95 text-slate-900"
              autoComplete="username"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-200">
            PASSWORD
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              className="input-base mt-2 border-white/25 bg-white/95 text-slate-900"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )

  const openSiniestroFiles = async (lead: AdminLeadRow) => {
    setSelectedSiniestroLead(lead)
    setFilesError(null)
    setIsLoadingFiles(true)
    setSiniestroFiles([])

    try {
      const files = await fetchAdminSiniestroArchivos(lead.id)
      setSiniestroFiles(files)
    } catch (caughtError) {
      setFilesError(caughtError instanceof Error ? caughtError.message : 'No se pudieron cargar los archivos.')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const openImagePreview = async (lead: AdminLeadRow, file: AdminSiniestroArchivo) => {
    if (!file.is_image) {
      return
    }

    try {
      const blob = await fetchAdminSiniestroArchivoBlob({
        siniestroId: lead.id,
        fileId: file.id
      })
      setPreviewImageUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(blob)
      })
      setPreviewImageTitle(file.label)
    } catch (caughtError) {
      setFilesError(caughtError instanceof Error ? caughtError.message : 'No se pudo abrir la imagen.')
    }
  }

  const downloadFile = async (lead: AdminLeadRow, file: AdminSiniestroArchivo) => {
    setDownloadingId(file.id)
    try {
      const blob = await fetchAdminSiniestroArchivoBlob({
        siniestroId: lead.id,
        fileId: file.id,
        download: true
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.original_name || 'archivo'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      setFilesError(caughtError instanceof Error ? caughtError.message : 'No se pudo descargar el archivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const removeLead = async (section: AdminSection, lead: AdminLeadRow) => {
    const confirmed = window.confirm(`Seguro que deseas eliminar este ${section === 'cotizaciones' ? 'registro de cotizacion' : 'siniestro'}?`)
    if (!confirmed) {
      return
    }

    try {
      if (section === 'cotizaciones') {
        await deleteAdminCotizacion(lead.id)
      } else {
        await deleteAdminSiniestro(lead.id)
      }

      setDashboardData((previous) => {
        if (!previous) return previous

        if (section === 'cotizaciones') {
          const rows = previous.cotizaciones.filter((row) => row.id !== lead.id)
          return {
            ...previous,
            cotizaciones: rows,
            totals: { ...previous.totals, cotizaciones: rows.length }
          }
        }

        const rows = previous.siniestros.filter((row) => row.id !== lead.id)
        return {
          ...previous,
          siniestros: rows,
          totals: { ...previous.totals, siniestros: rows.length }
        }
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo eliminar el registro.')
    }
  }

  const loadAccessData = useCallback(async () => {
    if (!dashboardData?.can_manage_access) return

    setIsLoadingAccess(true)
    setAccessError(null)

    try {
      const payload = await fetchAdminAccessControl()
      setAccessData(payload)
      if (!newUserRoleId && payload.roles.length > 0) {
        setNewUserRoleId(payload.roles[0].id)
      }
    } catch (caughtError) {
      setAccessError(caughtError instanceof Error ? caughtError.message : 'No se pudo cargar la gestion de accesos.')
    } finally {
      setIsLoadingAccess(false)
    }
  }, [dashboardData?.can_manage_access, newUserRoleId])

  const openAccessModal = () => {
    setIsAccessModalOpen(true)
    void loadAccessData()
  }

  const saveRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const roleName = newRoleName.trim()
    if (!roleName) {
      setAccessError('El nombre del rol es obligatorio.')
      return
    }

    setIsSavingRole(true)
    setAccessError(null)

    try {
      await createAdminRole({ name: roleName, permissions: newRolePermissions })
      setNewRoleName('')
      setNewRolePermissions({ ...EMPTY_PERMISSIONS })
      await loadAccessData()
    } catch (caughtError) {
      setAccessError(caughtError instanceof Error ? caughtError.message : 'No se pudo crear el rol.')
    } finally {
      setIsSavingRole(false)
    }
  }

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = newUserName.trim()
    const password = newUserPassword.trim()

    if (!username || !password) {
      setAccessError('Usuario y contrasena son obligatorios.')
      return
    }

    setIsSavingUser(true)
    setAccessError(null)

    try {
      await createAdminUser({
        username,
        password,
        roleId: newUserRoleId
      })
      setNewUserName('')
      setNewUserPassword('')
      await loadAccessData()
    } catch (caughtError) {
      setAccessError(caughtError instanceof Error ? caughtError.message : 'No se pudo crear el usuario.')
    } finally {
      setIsSavingUser(false)
    }
  }

  const changeUserRole = async (userId: string, roleId: string | null) => {
    setUpdatingUserId(userId)
    setAccessError(null)

    try {
      await assignAdminUserRole({ userId, roleId })
      await loadAccessData()
    } catch (caughtError) {
      setAccessError(caughtError instanceof Error ? caughtError.message : 'No se pudo actualizar el rol.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const loadActivities = useCallback(async () => {
    if (!dashboardData?.can_view_activities) return

    setIsLoadingActivities(true)
    setActivitiesError(null)

    try {
      const rows = await fetchAdminActivities(300)
      setActivities(rows)
    } catch (caughtError) {
      setActivitiesError(caughtError instanceof Error ? caughtError.message : 'No se pudieron cargar actividades.')
    } finally {
      setIsLoadingActivities(false)
    }
  }, [dashboardData?.can_view_activities])

  const openActivitiesModal = () => {
    setIsActivitiesModalOpen(true)
    void loadActivities()
  }

  if (!isAuthenticated || !dashboardData) {
    return loginView
  }

  const canDeleteCurrentSection = activeSection === 'cotizaciones'
    ? permissions.can_delete_cotizaciones
    : permissions.can_delete_siniestros

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard de envios</h1>
              <p className="mt-1 text-sm text-slate-600">
                Usuario activo: <strong>{dashboardData.current_user.username}</strong>
                {dashboardData.current_user.role_name ? ` (${dashboardData.current_user.role_name})` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" className="btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Actualizando...</> : <><RefreshCcw className="mr-2 h-4 w-4" />Actualizar</>}
              </button>
              {dashboardData.can_manage_access && (
                <button type="button" className="btn-outline" onClick={openAccessModal}>
                  <UserCog className="mr-2 h-4 w-4" />Gestionar accesos
                </button>
              )}
              {dashboardData.can_view_activities && (
                <button type="button" className="btn-outline" onClick={openActivitiesModal}>
                  <Eye className="mr-2 h-4 w-4" />Ver Actividades
                </button>
              )}
              <button type="button" className="btn-outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />Cerrar sesion
              </button>
            </div>
          </div>
        </header>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {availableSections.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Tu usuario no tiene permisos para ver cotizaciones ni siniestros.
          </p>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {permissions.can_view_cotizaciones && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('cotizaciones')}
                    className={`rounded-md px-4 py-2 text-sm font-semibold ${activeSection === 'cotizaciones' ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-white'}`}
                  >
                    Cotizaciones
                  </button>
                )}
                {permissions.can_view_siniestros && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('siniestros')}
                    className={`rounded-md px-4 py-2 text-sm font-semibold ${activeSection === 'siniestros' ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-white'}`}
                  >
                    Siniestros
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-600">Mostrando {activeRows.length} registro(s) de {activeSection}.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Contacto</th>
                    <th className="px-3 py-2 font-semibold">Origen</th>
                    <th className="px-3 py-2 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3 text-slate-700">{formatDateTime(lead.created_at)}</td>
                      <td className="px-3 py-3 text-slate-900">{lead.nombre || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">{lead.telefono || '-'}<div className="text-xs text-slate-500">{lead.email || '-'}</div></td>
                      <td className="px-3 py-3 text-slate-700">{lead.source_page || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => openLeadDetail(activeSection, lead)}>Ver</button>
                          {activeSection === 'siniestros' && (
                            <button type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { void openSiniestroFiles(lead) }}>Ver imagenes</button>
                          )}
                          {canDeleteCurrentSection && (
                            <button type="button" className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => { void removeLead(activeSection, lead) }}>
                              <Trash2 className="mr-1 h-3.5 w-3.5" />Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Detalle del envio</h2>
              <button type="button" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" onClick={() => setSelectedLead(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID</dt><dd className="mt-1 text-sm text-slate-800">{selectedLead.id}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</dt><dd className="mt-1 text-sm text-slate-800">{formatDateTime(selectedLead.created_at)}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</dt><dd className="mt-1 text-sm text-slate-800">{selectedLead.nombre || '-'}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefono</dt><dd className="mt-1 text-sm text-slate-800">{selectedLead.telefono || '-'}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensaje</dt><dd className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{selectedLead.mensaje || '-'}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {selectedSiniestroLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Imagenes del siniestro</h2>
              <button type="button" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" onClick={() => { setSelectedSiniestroLead(null); setSiniestroFiles([]); setFilesError(null) }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {filesError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{filesError}</p>}

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-10 text-slate-600"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cargando archivos...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {siniestroFiles.map((file) => (
                  <article key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{file.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{file.original_name} - {Math.max(1, Math.round(file.size_bytes / 1024))}KB</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50" onClick={() => { void openImagePreview(selectedSiniestroLead, file) }} disabled={!file.is_image}><Eye className="h-4 w-4" /><span className="ml-1">Ver</span></button>
                      <button type="button" className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50" onClick={() => { void downloadFile(selectedSiniestroLead, file) }} disabled={downloadingId === file.id}>{downloadingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<span className="ml-1">Descargar</span></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-slate-200">{previewImageTitle}</p>
              <button type="button" className="rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-800" onClick={() => setPreviewImageUrl(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex max-h-[80vh] items-center justify-center"><img src={previewImageUrl} alt={previewImageTitle} className="max-h-[78vh] w-auto rounded" /></div>
          </div>
        </div>
      )}

      {isAccessModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/75 p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Gestion de accesos</h2>
              <button type="button" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" onClick={() => setIsAccessModalOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            {accessError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{accessError}</p>}
            <div className="mb-4 flex justify-end"><button type="button" className="btn-outline" onClick={() => { void loadAccessData() }} disabled={isLoadingAccess}>{isLoadingAccess ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</> : <><RefreshCcw className="mr-2 h-4 w-4" />Actualizar</>}</button></div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Crear rol</h3>
                <form className="mt-3 space-y-3" onSubmit={saveRole}>
                  <input type="text" value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} placeholder="Nombre del rol" className="input-base w-full border-slate-300 bg-white text-slate-900" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(newRolePermissions) as Array<keyof AdminPermissionMap>).map((permissionKey) => (
                      <label key={permissionKey} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={newRolePermissions[permissionKey]} onChange={(event) => setNewRolePermissions((previous) => ({ ...previous, [permissionKey]: event.target.checked }))} />{permissionLabel(permissionKey)}</label>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary" disabled={isSavingRole}>{isSavingRole ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando rol...</> : 'Crear rol'}</button>
                </form>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-2 py-2">Rol</th><th className="px-2 py-2">Permisos</th></tr></thead>
                    <tbody>
                      {accessData?.roles.map((role) => (
                        <tr key={role.id} className="border-b border-slate-100 align-top"><td className="px-2 py-2 font-semibold text-slate-900">{role.name}</td><td className="px-2 py-2 text-xs text-slate-600">{(Object.entries(role.permissions) as Array<[keyof AdminPermissionMap, boolean]>).map(([key, enabled]) => (<div key={key}>{enabled ? 'Si' : 'No'} - {permissionLabel(key)}</div>))}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Crear usuario</h3>
                <form className="mt-3 space-y-3" onSubmit={saveUser}>
                  <input type="text" value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="Nombre de usuario" className="input-base w-full border-slate-300 bg-white text-slate-900" />
                  <input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} placeholder="Contrasena" className="input-base w-full border-slate-300 bg-white text-slate-900" />
                  <select value={newUserRoleId ?? ''} onChange={(event) => setNewUserRoleId(event.target.value || null)} className="input-base w-full border-slate-300 bg-white text-slate-900">
                    <option value="">Sin rol</option>
                    {accessData?.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <button type="submit" className="btn-primary" disabled={isSavingUser}>{isSavingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando usuario...</> : 'Crear usuario'}</button>
                </form>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-2 py-2">Usuario</th><th className="px-2 py-2">Rol</th></tr></thead>
                    <tbody>
                      {accessData?.users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 align-top">
                          <td className="px-2 py-2 text-slate-900"><div className="font-semibold">{user.username}</div>{user.is_super_admin && <div className="text-xs text-indigo-700">Admin principal</div>}</td>
                          <td className="px-2 py-2 text-slate-700">
                            {user.is_super_admin ? (
                              <span>{user.role_name || 'Sin rol'}</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select value={user.role_id ?? ''} className="input-base border-slate-300 bg-white text-slate-900" onChange={(event) => { void changeUserRole(user.id, event.target.value || null) }} disabled={updatingUserId === user.id}>
                                  <option value="">Sin rol</option>
                                  {accessData?.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                                </select>
                                {updatingUserId === user.id && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {isActivitiesModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/75 p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Ver Actividades</h2>
              <button type="button" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" onClick={() => setIsActivitiesModalOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            {activitiesError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{activitiesError}</p>}
            <div className="mb-4 flex justify-end"><button type="button" className="btn-outline" onClick={() => { void loadActivities() }} disabled={isLoadingActivities}>{isLoadingActivities ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</> : <><RefreshCcw className="mr-2 h-4 w-4" />Actualizar</>}</button></div>
            <div className="max-h-[65vh] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-2 font-semibold">Fecha</th><th className="px-3 py-2 font-semibold">Usuario</th><th className="px-3 py-2 font-semibold">Accion</th><th className="px-3 py-2 font-semibold">Descripcion</th><th className="px-3 py-2 font-semibold">Target</th></tr></thead>
                <tbody>
                  {isLoadingActivities ? (
                    <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={5}>Cargando actividades...</td></tr>
                  ) : activities.length === 0 ? (
                    <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={5}>No hay actividades registradas.</td></tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id} className="border-b border-slate-100 align-top"><td className="px-3 py-2 text-slate-700">{formatDateTime(activity.created_at)}</td><td className="px-3 py-2 text-slate-900">{activity.actor_user?.username || 'Sistema'}</td><td className="px-3 py-2 text-slate-700">{activity.action}</td><td className="px-3 py-2 text-slate-700">{activity.description}</td><td className="px-3 py-2 text-xs text-slate-600">{activity.target_id || '-'}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
