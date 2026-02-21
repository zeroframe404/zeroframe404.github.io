import { Download, Eye, Image as ImageIcon, Loader2, LogOut, RefreshCcw, ShieldCheck, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  deleteAdminCotizacion,
  deleteAdminSiniestro,
  fetchAdminDashboard,
  fetchAdminSiniestroArchivoBlob,
  fetchAdminSiniestroArchivos,
  loginAdmin,
  logoutAdmin
} from '../lib/adminApi'
import type { AdminDashboardResponse, AdminLeadRow, AdminSiniestroArchivo } from '../types/admin'

type AdminSection = 'cotizaciones' | 'siniestros'

type ImagePreviewModal = {
  fileId: string
  title: string
}

type DeleteLeadModal = {
  section: AdminSection
  lead: AdminLeadRow
}

const LOGIN_ERROR_MESSAGE = 'Ingresa una contraseña para continuar.'

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short'
})

function formatDateTime(value: string) {
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return dateTimeFormatter.format(parsedDate)
}

function compactText(value: string | null, maxLength = 180) {
  if (!value) return '-'
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1)}...`
}

function formatFieldValue(value: string | null) {
  if (!value) return '-'
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '-'
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function buildLeadDetail(section: AdminSection, lead: AdminLeadRow) {
  if (section === 'cotizaciones') {
    const detailChunks = [
      lead.tipo_vehiculo ? `Tipo: ${lead.tipo_vehiculo}` : null,
      lead.marca_modelo ? `Marca/Modelo: ${lead.marca_modelo}` : null,
      lead.anio ? `Año: ${lead.anio}` : null,
      lead.localidad ? `Localidad: ${lead.localidad}` : null,
      lead.cobertura_deseada ? `Cobertura: ${lead.cobertura_deseada}` : null,
      lead.mensaje ? `Mensaje: ${compactText(lead.mensaje, 140)}` : null
    ].filter(Boolean)

    return detailChunks.length > 0 ? detailChunks.join(' | ') : '-'
  }

  const siniestroChunks = [
    lead.motivo_contacto ? `Motivo: ${lead.motivo_contacto}` : null,
    lead.mensaje ? `Detalle: ${compactText(lead.mensaje, 140)}` : null
  ].filter(Boolean)

  return siniestroChunks.length > 0 ? siniestroChunks.join(' | ') : '-'
}

function buildLeadFields(lead: AdminLeadRow) {
  return [
    { label: 'ID', value: lead.id },
    { label: 'Fecha', value: formatDateTime(lead.created_at) },
    { label: 'Tipo de formulario', value: lead.tipo_formulario },
    { label: 'Nombre', value: lead.nombre },
    { label: 'Teléfono', value: lead.telefono },
    { label: 'Email', value: formatFieldValue(lead.email) },
    { label: 'Tipo de vehículo', value: formatFieldValue(lead.tipo_vehiculo) },
    { label: 'Marca y modelo', value: formatFieldValue(lead.marca_modelo) },
    { label: 'Año', value: formatFieldValue(lead.anio) },
    { label: 'Localidad', value: formatFieldValue(lead.localidad) },
    { label: 'Uso', value: formatFieldValue(lead.uso) },
    { label: 'Cobertura deseada', value: formatFieldValue(lead.cobertura_deseada) },
    { label: 'Motivo de contacto', value: formatFieldValue(lead.motivo_contacto) },
    { label: 'Mensaje', value: formatFieldValue(lead.mensaje) },
    { label: 'Página de origen', value: lead.source_page || '-' }
  ]
}

function releaseObjectUrls(urlMap: Record<string, string>) {
  for (const url of Object.values(urlMap)) {
    URL.revokeObjectURL(url)
  }
}

export default function AdminHiddenPage() {
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
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<ImagePreviewModal | null>(null)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<DeleteLeadModal | null>(null)
  const [deleteCountdown, setDeleteCountdown] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const previewUrlsRef = useRef<Record<string, string>>({})

  const replacePreviewUrls = useCallback((nextUrls: Record<string, string>) => {
    releaseObjectUrls(previewUrlsRef.current)
    previewUrlsRef.current = nextUrls
    setPreviewUrls(nextUrls)
  }, [])

  const clearFilesState = useCallback(() => {
    setSiniestroFiles([])
    setFilesError(null)
    setIsLoadingFiles(false)
    setExpandedImage(null)
    setDownloadingFileId(null)
    replacePreviewUrls({})
  }, [replacePreviewUrls])

  const closeFilesModal = useCallback(() => {
    setSelectedSiniestroLead(null)
    clearFilesState()
  }, [clearFilesState])

  useEffect(() => {
    return () => {
      releaseObjectUrls(previewUrlsRef.current)
    }
  }, [])

  useEffect(() => {
    if (!deleteTarget || deleteCountdown <= 0) {
      return
    }

    const timerId = window.setTimeout(() => {
      setDeleteCountdown((previous) => (previous > 0 ? previous - 1 : 0))
    }, 1000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [deleteCountdown, deleteTarget])

  const activeRows = useMemo(() => {
    if (!dashboardData) return []
    return activeSection === 'cotizaciones'
      ? dashboardData.cotizaciones
      : dashboardData.siniestros
  }, [activeSection, dashboardData])

  const sectionCount = useMemo(() => {
    if (!dashboardData) return 0
    return activeSection === 'cotizaciones'
      ? dashboardData.totals.cotizaciones
      : dashboardData.totals.siniestros
  }, [activeSection, dashboardData])

  const expandedImageSrc = useMemo(
    () => (expandedImage ? previewUrls[expandedImage.fileId] ?? null : null),
    [expandedImage, previewUrls]
  )

  const deleteEntityLabel = deleteTarget?.section === 'siniestros'
    ? 'siniestro'
    : 'cotización'
  const deleteConfirmLabel = deleteCountdown > 0
    ? `Sí (espere ${deleteCountdown}s...)`
    : 'Sí'

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const sanitizedPassword = passwordInput.trim()
    if (!sanitizedPassword) {
      setError(LOGIN_ERROR_MESSAGE)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await loginAdmin(sanitizedPassword)
      const data = await fetchAdminDashboard()
      setIsAuthenticated(true)
      setDashboardData(data)
      setActiveSection('cotizaciones')
      setPasswordInput('')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo verificar la contraseña.'

      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRefresh = async () => {
    if (!isAuthenticated) return

    setIsRefreshing(true)
    setError(null)

    try {
      const refreshedData = await fetchAdminDashboard()
      setDashboardData(refreshedData)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudieron actualizar los datos.'

      setError(message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        await logoutAdmin()
      }
    } catch {
      // Ignore logout network errors and clear local state anyway.
    } finally {
      setIsAuthenticated(false)
      setDashboardData(null)
      setPasswordInput('')
      setError(null)
      setIsSubmitting(false)
      setIsRefreshing(false)
      setActiveSection('cotizaciones')
      setSelectedLead(null)
      closeFilesModal()
      setDeleteTarget(null)
      setDeleteCountdown(0)
      setIsDeleting(false)
    }
  }

  const handleOpenLeadDetail = (lead: AdminLeadRow) => {
    setSelectedLead(lead)
  }

  const openDeleteLeadModal = (section: AdminSection, lead: AdminLeadRow) => {
    setDeleteTarget({
      section,
      lead
    })
    setDeleteCountdown(3)
  }

  const closeDeleteLeadModal = () => {
    if (isDeleting) {
      return
    }

    setDeleteTarget(null)
    setDeleteCountdown(0)
  }

  const handleConfirmDeleteLead = async () => {
    if (!deleteTarget || deleteCountdown > 0 || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      if (deleteTarget.section === 'cotizaciones') {
        await deleteAdminCotizacion(deleteTarget.lead.id)
      } else {
        await deleteAdminSiniestro(deleteTarget.lead.id)
      }

      setDashboardData((previous) => {
        if (!previous) {
          return previous
        }

        if (deleteTarget.section === 'cotizaciones') {
          const nextRows = previous.cotizaciones.filter((row) => row.id !== deleteTarget.lead.id)
          return {
            ...previous,
            cotizaciones: nextRows,
            totals: {
              ...previous.totals,
              cotizaciones: nextRows.length
            }
          }
        }

        const nextRows = previous.siniestros.filter((row) => row.id !== deleteTarget.lead.id)
        return {
          ...previous,
          siniestros: nextRows,
          totals: {
            ...previous.totals,
            siniestros: nextRows.length
          }
        }
      })

      if (selectedLead?.id === deleteTarget.lead.id) {
        setSelectedLead(null)
      }

      if (selectedSiniestroLead?.id === deleteTarget.lead.id) {
        closeFilesModal()
      }

      setDeleteTarget(null)
      setDeleteCountdown(0)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No pudimos eliminar el registro.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenSiniestroFiles = async (lead: AdminLeadRow) => {
    setSelectedSiniestroLead(lead)
    setIsLoadingFiles(true)
    setFilesError(null)
    setSiniestroFiles([])
    setExpandedImage(null)
    replacePreviewUrls({})

    try {
      const files = await fetchAdminSiniestroArchivos(lead.id)
      setSiniestroFiles(files)

      const generatedPreviewUrls: Record<string, string> = {}
      for (const file of files) {
        if (!file.is_image) continue

        try {
          const blob = await fetchAdminSiniestroArchivoBlob({
            siniestroId: lead.id,
            fileId: file.id
          })
          generatedPreviewUrls[file.id] = URL.createObjectURL(blob)
        } catch {
          // Keep rendering the list even if one preview fails.
        }
      }

      replacePreviewUrls(generatedPreviewUrls)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No pudimos obtener los archivos del siniestro.'
      setFilesError(message)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleExpandImage = async (file: AdminSiniestroArchivo) => {
    if (!selectedSiniestroLead || !file.is_image) {
      return
    }

    const existingUrl = previewUrls[file.id]
    if (existingUrl) {
      setExpandedImage({
        fileId: file.id,
        title: file.label
      })
      return
    }

    try {
      const blob = await fetchAdminSiniestroArchivoBlob({
        siniestroId: selectedSiniestroLead.id,
        fileId: file.id
      })

      const nextUrl = URL.createObjectURL(blob)
      replacePreviewUrls({
        ...previewUrlsRef.current,
        [file.id]: nextUrl
      })

      setExpandedImage({
        fileId: file.id,
        title: file.label
      })
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No pudimos abrir la imagen.'
      setFilesError(message)
    }
  }

  const handleDownloadFile = async (file: AdminSiniestroArchivo) => {
    if (!selectedSiniestroLead) {
      return
    }

    setDownloadingFileId(file.id)

    try {
      const blob = await fetchAdminSiniestroArchivoBlob({
        siniestroId: selectedSiniestroLead.id,
        fileId: file.id,
        download: true
      })

      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = file.original_name || 'archivo'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No pudimos descargar el archivo.'
      setFilesError(message)
    } finally {
      setDownloadingFileId(null)
    }
  }

  if (!isAuthenticated || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-6 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </span>
            <h1 className="text-2xl font-bold text-white">Acceso administrador</h1>
            <p className="mt-2 text-sm text-slate-300">
              Ingresa la contraseña para ver cotizaciones y siniestros.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-semibold text-slate-200">
              Contraseña
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                className="input-base mt-2 border-white/25 bg-white/95 text-slate-900 placeholder:text-slate-500"
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard de envíos</h1>
              <p className="mt-1 text-sm text-slate-600">
                Consulta envíos de formularios de cotización y denuncias de siniestros.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-outline w-full justify-center sm:w-auto"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Actualizar
                  </>
                )}
              </button>

              <button type="button" className="btn-outline w-full justify-center sm:w-auto" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Cotizaciones
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {dashboardData.totals.cotizaciones}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Siniestros
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {dashboardData.totals.siniestros}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveSection('cotizaciones')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeSection === 'cotizaciones'
                    ? 'bg-brand-900 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Cotizaciones
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('siniestros')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeSection === 'siniestros'
                    ? 'bg-brand-900 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Siniestros
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Mostrando {sectionCount} registro{sectionCount === 1 ? '' : 's'} de{' '}
              {activeSection}.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Nombre</th>
                  <th className="px-3 py-2 font-semibold">Contacto</th>
                  <th className="px-3 py-2 font-semibold">Detalle</th>
                  <th className="px-3 py-2 font-semibold">Origen</th>
                  <th className="px-3 py-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                      No hay envíos para esta sección.
                    </td>
                  </tr>
                ) : (
                  activeRows.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3 text-slate-700">{formatDateTime(lead.created_at)}</td>
                      <td className="px-3 py-3 text-slate-900">{lead.nombre || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">
                        <div>{lead.telefono || '-'}</div>
                        <div className="text-xs text-slate-500">{lead.email || '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {buildLeadDetail(activeSection, lead)}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{lead.source_page || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => handleOpenLeadDetail(lead)}
                          >
                            Ver
                          </button>
                          {activeSection === 'siniestros' && (
                            <button
                              type="button"
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                void handleOpenSiniestroFiles(lead)
                              }}
                            >
                              Ver imágenes
                            </button>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteLeadModal(activeSection, lead)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Confirmar eliminación</h2>
            <p className="mt-2 text-sm text-slate-700">
              ¿Seguro que desea eliminar la {deleteEntityLabel}?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ID: {deleteTarget.lead.id}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={closeDeleteLeadModal}
                disabled={isDeleting}
              >
                No
              </button>
              <button
                type="button"
                className="rounded-md border border-red-400 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void handleConfirmDeleteLead()
                }}
                disabled={isDeleting || deleteCountdown > 0}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  deleteConfirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Detalle del envío</h2>
                <p className="text-sm text-slate-500">
                  Datos completos del registro seleccionado.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                onClick={() => setSelectedLead(null)}
                aria-label="Cerrar detalle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {buildLeadFields(selectedLead).map((field) => (
                <div key={field.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {field.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {selectedSiniestroLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Imágenes del siniestro</h2>
                <p className="text-sm text-slate-500">
                  {selectedSiniestroLead.nombre} - {formatDateTime(selectedSiniestroLead.created_at)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                onClick={closeFilesModal}
                aria-label="Cerrar archivos"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {filesError && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {filesError}
              </p>
            )}

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-10 text-slate-600">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Cargando archivos...
              </div>
            ) : siniestroFiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Este siniestro no tiene archivos adjuntos.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {siniestroFiles.map((file) => (
                  <article key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tipo de imagen
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{file.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.original_name} - {file.mime_type} - {formatBytes(file.size_bytes)}
                    </p>

                    <div className="mt-3 flex min-h-[132px] items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                      {file.is_image && previewUrls[file.id] ? (
                        <img
                          src={previewUrls[file.id]}
                          alt={file.label}
                          className="h-28 w-auto rounded object-cover"
                          loading="lazy"
                        />
                      ) : file.is_image ? (
                        <p className="text-xs text-slate-500">Sin vista previa</p>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500">
                          <ImageIcon className="h-8 w-8" />
                          <span className="mt-1 text-xs">Archivo no imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          void handleExpandImage(file)
                        }}
                        disabled={!file.is_image}
                        aria-label={`Ver más grande ${file.label}`}
                        title="Ver más grande"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          void handleDownloadFile(file)
                        }}
                        disabled={downloadingFileId === file.id}
                      >
                        {downloadingFileId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span className="ml-1">Descargar</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {expandedImage && expandedImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-slate-200">{expandedImage.title}</p>
              <button
                type="button"
                className="rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-800"
                onClick={() => setExpandedImage(null)}
                aria-label="Cerrar vista previa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex max-h-[80vh] items-center justify-center">
              <img
                src={expandedImageSrc}
                alt={expandedImage.title}
                className="max-h-[78vh] w-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
