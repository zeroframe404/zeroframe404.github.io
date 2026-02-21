import { Loader2, LogOut, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchAdminDashboard, loginAdmin, logoutAdmin } from '../lib/adminApi'
import type { AdminDashboardResponse, AdminLeadRow } from '../types/admin'

type AdminSection = 'cotizaciones' | 'siniestros'

const LOGIN_ERROR_MESSAGE = 'Ingresa una contrasena para continuar.'

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

function buildLeadDetail(section: AdminSection, lead: AdminLeadRow) {
  if (section === 'cotizaciones') {
    const detailChunks = [
      lead.tipo_vehiculo ? `Tipo: ${lead.tipo_vehiculo}` : null,
      lead.marca_modelo ? `Marca/Modelo: ${lead.marca_modelo}` : null,
      lead.anio ? `Anio: ${lead.anio}` : null,
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

export default function AdminHiddenPage() {
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>('cotizaciones')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
          : 'No se pudo verificar la contrasena.'

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
              Ingresa la contrasena para ver cotizaciones y siniestros.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-semibold text-slate-200">
              Contrasena
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                className="input-base mt-2 border-white/25 bg-white/95 text-slate-900 placeholder:text-slate-500"
                placeholder="Ingresa tu contrasena"
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
              <h1 className="text-2xl font-bold text-slate-900">Dashboard de envios</h1>
              <p className="mt-1 text-sm text-slate-600">
                Consulta envios de formularios de cotizacion y denuncias de siniestros.
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
                Cerrar sesion
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
                </tr>
              </thead>
              <tbody>
                {activeRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                      No hay envios para esta seccion.
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
